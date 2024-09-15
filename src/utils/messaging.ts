import browser from 'webextension-polyfill'
import { v4 as uuid } from 'uuid'
import { EnsureOffscreen } from '~/type/worker-message'

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

export async function sendToOffscreen(message) {
  await sendToBackground(new EnsureOffscreen())
  return browser.runtime.sendMessage({
    target: 'offscreen',
    message,
  })
}

export function sendToTabById(tabId: number, message) {
  return browser.tabs.sendMessage(tabId, { message, target: 'tab' })
}

export function broadcastToTabs(tabIdList: number[], message) {
  return Promise.allSettled(tabIdList.map(tabId => sendToTabById(tabId, message)))
}

export async function broadcastToAllTabs(message) {
  const tabIdList = await browser.tabs.query({}) ?? []
  return broadcastToTabs(tabIdList.map(it => it.id).filter(it => typeof it === 'number'), message)
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

export function getConnectName(tag, id) {
  return [tag, id].join('@') as `${string}@${string}`
}
export function parseConnectName(name: string) {
  return name.split('@')
}
export function sendToStreamResponsePort(message, { resolvePredict, rejectPredict, streamHandler } = {}) {
  const port = browser.runtime.connect({ name: getConnectName(message.messageType, uuid()) })
  port.postMessage(
    message,
  )
  const responseDefer = Promise.withResolvers()
  responseDefer.promise.finally(() => port.disconnect())
  port.onMessage.addListener((message) => {
    if (rejectPredict?.(message)) {
      rejectPredict.reject(message)
      return
    }
    if (resolvePredict?.(message)) {
      responseDefer.resolve(message)
      return
    }
    streamHandler?.(message)
  })

  return responseDefer.promise
}
export function handleStreamResponsePort(tag, handler) {
  browser.runtime.onConnect.addListener((port) => {
    const [portName, connectId] = parseConnectName(port.name)
    if (portName !== tag || !connectId)
      return

    port.onMessage.addListener(handler)
  })
}
