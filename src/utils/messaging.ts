import browser from 'webextension-polyfill'

export function sendToBackground(message) {
  return browser.runtime.sendMessage({
    target: 'background',
    message,
  })
}

export function sendToPopup(message) {
  return browser.runtime.sendMessage({
    target: 'popup',
    message,
  })
}

export function sendToSidepanel(message) {
  return browser.runtime.sendMessage({
    target: 'sidepanel',
    message,
  })
}

export function sendToOffscreen(message) {
  return browser.runtime.sendMessage({
    target: 'offscreen',
    message,
  })
}

export function sendToTabById(tabId: number, message) {
  return browser.tabs.sendMessage(tabId, message)
}

export function broadcastToTabs(tabIdList: number[], message) {
  return Promise.allSettled(tabIdList.map(tabId => sendToTabById(tabId, message)))
}

export async function broadcastToAllTab(message) {
  const tabIdList = await browser.tabs.query({})
  return broadcastToTabs(tabIdList, message)
}

export function handleMessageFactory(
  targetContext:
    | 'background'
    | 'popup'
    | 'sidepanel'
    | 'offscreen'
    | 'tab',
) {
  return function handleMessage(tag, handler) {
    const innerHandler = (message, sender) => {
      if (
        message.target !== targetContext
        || message.message.messageType !== tag
      )
        return void 0

      return handler(message, sender)
    }
    browser.runtime.onMessage.addListener(innerHandler)
    return () => browser.runtime.onMessage.removeListener(innerHandler)
  }
}
