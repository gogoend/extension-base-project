import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Tabs } from 'webextension-polyfill'
import uaParser from 'ua-parser-js'
import type { AxiosPromise } from 'axios'
import { ContentScriptAliveDetectMessage, WorkerAliveDetectMessage, WorkerRequestMessage } from '~/type/worker-message'
import { isForbiddenUrl } from '~/env'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// remove or turn this off if you don't use side panel
const USE_SIDE_PANEL = (() => {
  const ua = uaParser(navigator.userAgent)
  if (
    ua.browser.name === 'Chrome' && ua.browser.version?.split('.')[0] && Number(ua.browser.version?.split('.')[0]) >= 116
  )
    return true

  return false
})()

// to toggle the sidepanel with the action button in chromium:
if (USE_SIDE_PANEL) {
  // @ts-expect-error missing types
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error))
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
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

  // eslint-disable-next-line no-console
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
    const { axiosConf } = message.data
    let {
      url,
      method,
      headers,
      data,
    } = axiosConf

    url = url || ''
    method = method || 'GET'
    data = ['GET', 'DELETE'].includes(method) ? null : data

    const request = new Request(url, {
      method,
      headers: headers as any as HeadersInit,
      body: data,
    })

    return fetch(request).then(async (res) => {
      const responseBody = await res.text()
      // console.log(res)
      return {
        data: responseBody,
        headers: Object.fromEntries(res.headers.entries()),
        status: res.status,
        statusText: res.statusText,
        config: axiosConf,
        request,
      }
    }) as any as AxiosPromise
  },
)

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
