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

async function attachInterceptor(tab) {
  if (tab.url.startsWith('http')) {
    const tabId = tab.id
    await chrome.debugger.attach({ tabId }, '1.3')
    // auto attach to iframe
    await chrome.debugger.sendCommand(
      { tabId },
      'Target.setAutoAttach',
      {
        autoAttach: true,
        // fix the first level nest iframe cannot be intercepted
        waitForDebuggerOnStart: true,
        flatten: true,
        filter: [{ type: 'iframe', exclude: false }],
      },
    )
    await chrome.debugger.sendCommand(
      { tabId },
      'Fetch.enable',
      {},
    )
    await chrome.debugger.sendCommand(
      { tabId },
      'Runtime.enable',
    )
  }
  else {
    console.log('Debugger can only be attached to HTTP/HTTPS pages.')
  }
}
chrome.action.onClicked.addListener(attachInterceptor)

/**
 * fix string encoding error when call btoa
 *
 * `The string to be encoded contains characters outside of the Latin1 range`
 */
function utf8ToBase64(str: string) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  let binaryStr = ''
  for (const byte of bytes) {
    binaryStr += String.fromCharCode(byte)
  }
  return btoa(binaryStr)
}

enum MatchStrategy {
  urlText,
  urlRegExp,
  asserterFunction,
}

enum ModifyWith {
  notModify,
  plainText,
  anotherUrl,
  contentGeneratorFunction,
  rawResponseModifierFunction,
}

interface BaseModifyOption {
  modifyWith: ModifyWith
  latency?: number
}

interface HeaderOption {
  name: string
  value: string
}

interface NotModifyModifyOption extends BaseModifyOption {
  modifyWith: ModifyWith.notModify
}

interface PlainTextModifyOption extends BaseModifyOption {
  modifyWith: ModifyWith.plainText
  responseHeaders: HeaderOption[]
  content: string
}

interface AnotherUrlModifyOption extends BaseModifyOption {
  modifyWith: ModifyWith.anotherUrl
  url: string
}

interface ContentGeneratorFunctionModifyOption extends BaseModifyOption {
  modifyWith: ModifyWith.contentGeneratorFunction
  contentGeneratorFunctionAsString: string
}

interface RawResponseModifierFunctionModifyOption extends BaseModifyOption {
  modifyWith: ModifyWith.rawResponseModifierFunction
  rawResponseModifierFunctionAsString: string
}

interface BaseMatchOption {
  matchStrategy: MatchStrategy
  modifyOption:
    | NotModifyModifyOption
    | PlainTextModifyOption
    | AnotherUrlModifyOption
    | ContentGeneratorFunctionModifyOption
    | RawResponseModifierFunctionModifyOption
  disabled?: boolean
}

interface UrlTextMatchOption extends BaseMatchOption {
  matchStrategy: MatchStrategy.urlText
  url: string
}
interface UrlRegExpMatchOption extends BaseMatchOption {
  matchStrategy: MatchStrategy.urlRegExp
  urlRegExpAsString: string
}
interface AsserterFunctionMatchOption extends BaseMatchOption {
  matchStrategy: MatchStrategy.asserterFunction
  assertFunctionAsString: string
}

const rules: Array<UrlTextMatchOption | UrlRegExpMatchOption | AsserterFunctionMatchOption> = [
  {
    matchStrategy: MatchStrategy.urlText,
    url: 'https://www.qq.com',
    modifyOption: {
      modifyWith: ModifyWith.anotherUrl,
      url: 'https://www.sohu.com',
    },
  },
]

function getMatchedRule(request) {
  let targetRule
  try {
    targetRule = rules.find((rule) => {
      switch (rule.matchStrategy) {
        case MatchStrategy.urlText: {
          return request.url.includes(rule.url)
        }
        case MatchStrategy.urlRegExp: {
          const regExp = new RegExp(rule.urlRegExpAsString)
          return regExp.test(request.url)
        }
        case MatchStrategy.asserterFunction: {
          // const f = new Function(rule.assertFunctionAsString)
          // return f(request)
          break
        }
      }
      return false
    })
    if (targetRule?.disabled) {
      targetRule = null
    }
  }
  catch (err) {
    console.warn(`error encountered: getMatchedRule`, err)
    throw err
  }
  return targetRule ?? null
}

async function fetchResponse(
  request,
  matchedRule: NonNullable<ReturnType<typeof getMatchedRule>>,
) {
  const responsePayload = {
    responseCode: 200,
    responseHeaders: [] as HeaderOption[],
    body: '',
  }

  switch (matchedRule.modifyOption?.modifyWith) {
    case ModifyWith.notModify:
    default: {
      const response = await fetch(request.url)
      const headers = [
        ...response.headers,
      ].map(it => ({
        name: it[0],
        value: it[1],
      }))
      responsePayload.body = utf8ToBase64(await response.text())
      responsePayload.responseHeaders = headers
      responsePayload.responseCode = response.status

      break
    }
  }
  return responsePayload
}

chrome.debugger.onEvent.addListener(async (source, method, params) => {
  switch (method) {
    case 'Fetch.requestPaused': {
      const { request, requestId } = params
      const session = {
        tabId: source.tabId,
        sessionId: params.sessionId,
      }
      const matchedRule = getMatchedRule(request)
      if (matchedRule) {
        console.log(request.url)
        const response = await fetchResponse(request, matchedRule)
        // modify response
        await chrome.debugger.sendCommand(
          session,
          'Fetch.fulfillRequest',
          {
            requestId,
            ...response,
          },
        )
      }
      else {
        await chrome.debugger.sendCommand(
          session,
          'Fetch.continueRequest',
          { requestId },
        )
      }
      break
    }
    // handle nest iframe
    case 'Target.attachedToTarget': {
      const childSession = {
        tabId: source.tabId,
        sessionId: params.sessionId,
      }
      await chrome.debugger.sendCommand(
        childSession,
        'Fetch.enable',
        {},
      )
      await chrome.debugger.sendCommand(
        childSession,
        'Runtime.enable',
      )
      // fix the first level nest iframe cannot be intercepted
      await chrome.debugger.sendCommand(
        childSession,
        'Runtime.runIfWaitingForDebugger',
      )
      break
    }
  }
})
