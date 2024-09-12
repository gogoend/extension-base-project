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

export function handleMessage(tag, handler) {
  return browser.runtime.onMessage.addListener((message, sender) => {
    if (message.message.messageType === tag)
      return handler(message, sender)
  })
}
