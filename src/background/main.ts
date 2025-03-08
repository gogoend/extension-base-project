/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/background'
import browser, { type Tabs } from 'webextension-polyfill'
import chrome from 'webextension-polyfill'
import { requestForHandleContentScript } from './utils/request'
import { ContentScriptAliveDetectMessage, WorkerAliveDetectMessage, WorkerGetLocalStorage, WorkerLocalStorageChanged, WorkerRequestMessage, WorkerUpdateLocalStorage } from '~/type/worker-message'
import { isForbiddenUrl } from '~/env'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  console.log('previous tab', tab)
  sendMessage(
    'tab-prev',
    { title: tab.title },
    { context: 'content-script', tabId },
  )
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})

onMessage(
  WorkerAliveDetectMessage.tag,
  async () => {
    return true
  },
)

onMessage(
  WorkerRequestMessage.tag,
  async (message) => {
    const { axiosConf = {} } = message.data
    const {
      transformRequest: _transformRequest,
      transformResponse: _transformResponse,
      ...restAxiosConf
    } = axiosConf

    return requestForHandleContentScript(restAxiosConf)
  },
)

onMessage(
  WorkerGetLocalStorage.tag,
  async () => {
    return browser.storage.local.get()
  },
)
onMessage(
  WorkerUpdateLocalStorage.tag,
  async (message) => {
    browser.storage.local.set(message.data.payload)
    return true
  },
)
browser.storage.local.onChanged.addListener(async (changes) => {
  const tabs = await browser.tabs.query({})

  tabs.forEach((tab) => {
    if (typeof tab.id !== 'number')
      return

    sendMessage(WorkerLocalStorageChanged.tag, new WorkerLocalStorageChanged(changes), {
      context: 'content-script',
      tabId: tab.id,
    })
  })
})

function installScript(tab: any) {
  let { content_scripts } = browser.runtime.getManifest()
  content_scripts = content_scripts ?? []
  for (const cs of content_scripts) {
    const jsArr = cs.js
    browser.scripting.executeScript({
      target: {
        tabId: tab.tabId,
      },
      files: jsArr,
    })
  }
}

const installedTabIdSet = new Set<number>()
browser.tabs.onActivated.addListener(async (tab) => {
  try {
    await browser.tabs.sendMessage(
      tab.tabId,
      new ContentScriptAliveDetectMessage(),
    )
  }
  catch (err) {
    console.error(err)
    if (
      err.message.includes(
        'Could not establish connection. Receiving end does not exist.',
      )
    ) {
      const targetTab = (await browser.tabs.query({})).find(it => it.id === tab.tabId)
      if (targetTab && targetTab.status === 'complete' && targetTab.url && !isForbiddenUrl(targetTab.url) && !installedTabIdSet.has(tab.tabId)) {
        installScript(tab)
        installedTabIdSet.add(tab.tabId)
      }
    }
  }
})

function attachInterceptor(tab) {
  if (tab.url.startsWith('http')) {
    const tabId = tab.id
    // 附加到目标标签页
    chrome.debugger.attach({ tabId }, '1.3', () => {
      // 启用网络拦截
      chrome.debugger.sendCommand(
        { tabId },
        'Network.enable',
        { maxTotalBufferSize: 10000000, maxResourceBufferSize: 5000000 },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
          }
        },
      )
      // 设置请求拦截规则（示例：拦截所有请求）
      chrome.debugger.sendCommand(
        { tabId },
        'Network.setRequestInterception',
        {
          patterns: [{ urlPattern: '*' }],
        },
      )
    })
  }
  else {
    console.log('Debugger can only be attached to HTTP/HTTPS pages.')
  }
}
chrome.action.onClicked.addListener(attachInterceptor)

function utf8ToBase64(str) {
  // 1. 将字符串转换为 UTF-8 字节数组
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  // 2. 将字节数组转换为二进制字符串
  let binaryStr = ''
  for (const byte of bytes) {
    binaryStr += String.fromCharCode(byte)
  }
  // 3. 编码为 Base64
  return btoa(binaryStr)
}

chrome.debugger.onEvent.addListener(async (source, method, params) => {
  switch (method) {
    case 'Network.responseReceived': {
      console.log('Response received:', params.response)
      // Perform your desired action with the response data
      break
    }
    case 'Network.requestIntercepted': {
      // 获取拦截的请求信息
      // 获取响应内容
      chrome.debugger.sendCommand(
        { tabId: source.tabId },
        'Network.getResponseBodyForInterception',
        { interceptionId: params.interceptionId },
        async () => {
          // 修改响应内容（例如替换文本）
          const res = await (await fetch('https://qq.com')).text()

          // 继续请求并返回修改后的响应
          chrome.debugger.sendCommand(
            { tabId: source.tabId },
            'Network.continueInterceptedRequest',
            {
              interceptionId: params.interceptionId,
              rawResponse: utf8ToBase64(
                `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n${res}`,
              ),
            },
          )
        },
      )
      break
    }
  }
})
