import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Tabs } from 'webextension-polyfill'
import uaParser from 'ua-parser-js'
import { requestForHandleContentScript } from './utils/request'
import { BackgroundRelayOffscreenMessageToSender, ContentScriptAliveDetectMessage, EnsureOffscreen, WorkerAliveDetectMessage, WorkerGetLocalStorage, WorkerLocalStorageChanged, WorkerRequestAiSessionId, WorkerRequestMessage, WorkerRequestStreamAi, WorkerResponseStreamAi, WorkerUpdateLocalStorage } from '~/type/worker-message'
import { isForbiddenUrl } from '~/env'
import { handleMessageFactory, sendToSidepanel, sendToTabById } from '~/utils/messaging'

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

handleMessageFactory('background')(
  WorkerRequestMessage.tag,
  async ({ message }, _sender) => {
    const { axiosConf = {} } = message
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
    await browser.storage.local.set(message.data.payload)
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

const OFFSCREEN_DOCUMENT_PATH = 'dist/offscreen/index.html'
const OFFSCREEN_DOCUMENT_URL = browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
async function hasOffscreenDocument() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const contexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [OFFSCREEN_DOCUMENT_URL],
  })
  return Boolean(contexts.length)
}

let offscreenCreating: Promise<unknown> | null = null // A global promise to avoid concurrency issues
async function setupOffscreenDocument() {
  const path = 'dist/offscreen/index.html'

  if (await hasOffscreenDocument())
    return

  // create offscreen document
  if (offscreenCreating) {
    await offscreenCreating
  }
  else {
    offscreenCreating = browser.offscreen.createDocument({
      url: path,
      reasons: ['WORKERS'],
      justification: 'AI worker',
    })
    await offscreenCreating
    offscreenCreating = null
  }
}

handleMessageFactory('background')(EnsureOffscreen.tag, async () => {
  return await setupOffscreenDocument()
})

handleMessageFactory('background')(BackgroundRelayOffscreenMessageToSender.tag, ({ message }) => {
  if (message.payload.sender.tab) {
    sendToTabById(
      message.payload.sender.tab.id,
      message.payload.message,
    )
  }
  else {
    sendToSidepanel(message.payload.message)
  }
})
