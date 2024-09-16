import browser from 'webextension-polyfill'
import { v4 as uuid } from 'uuid'
import type Browser from 'webextension-polyfill'
import * as WorkerMessage from '~/type/worker-message'

export function sendToBackground<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<MessagingResponseTypeMap[T['messageType']]> {
  return browser.runtime.sendMessage({
    target: 'background',
    message,
  })
}

export function sendToPopup<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<MessagingResponseTypeMap[T['messageType']]> {
  return browser.runtime.sendMessage({
    target: 'popup',
    message,
  })
}

export function sendToSidepanel<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<MessagingResponseTypeMap[T['messageType']]> {
  return browser.runtime.sendMessage({
    target: 'sidepanel',
    message,
  })
}

export async function sendToOffscreen<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<MessagingResponseTypeMap[T['messageType']]> {
  await sendToBackground(new WorkerMessage.EnsureOffscreen())
  return browser.runtime.sendMessage({
    target: 'offscreen',
    message,
  })
}

export function sendToTabById<T extends (WorkerMessage.WorkerBaseMessage)>(tabId: number, message: T): Promise<MessagingResponseTypeMap[T['messageType']]> {
  return browser.tabs.sendMessage(tabId, { message, target: 'tab' })
}

export function broadcastToTabs<T extends (WorkerMessage.WorkerBaseMessage)>(tabIdList: number[], message: T) {
  return Promise.allSettled(tabIdList.map(tabId => sendToTabById(tabId, message)))
}

export async function broadcastToAllTabs<T extends (WorkerMessage.WorkerBaseMessage)>(message: T) {
  const tabIdList = await browser.tabs.query({}) ?? []
  return broadcastToTabs(tabIdList.map(it => it.id).filter(it => typeof it === 'number'), message)
}

type TargetContext =
  | 'background'
  | 'popup'
  | 'sidepanel'
  | 'offscreen'
  | 'tab'

// #region 以各消息messageType属性为key，映射各消息
// 1. 提取 WorkerMessage 命名空间下所有类的类型并组合成联合类型
type WorkerMessageUnion = typeof WorkerMessage[keyof typeof WorkerMessage]
// 2. 引入的类型比较混杂，且引入的是按值推断的类型（引入的类型构造函数，而不是接口），因此按照能否构造过滤出所有构造函数
type OnlyWithConstructors<T> = T extends new (...args: any[]) => any ? T : never
type MessagesWithConstructors = OnlyWithConstructors<WorkerMessageUnion>
// 3. 取一下构造函数实例的类型
type MessagesInstanceType = InstanceType<MessagesWithConstructors>
// 4. 过滤出基于WorkerBaseMessage的类型，并把这些类型组合为联合类型
type FilteredMessages<T> = T extends WorkerMessage.WorkerBaseMessage ? T : never
type WorkMessageTypeUnion = FilteredMessages<MessagesInstanceType>
// 5. 创建出映射类型，key为messageType属性为key，value为各自对应的消息
type MessageTypeMap = {
  [M in WorkMessageTypeUnion as M['messageType']]: M
}
// #endregion

export function handleMessageFactory(
  targetContext: TargetContext,
) {
  return function handleMessage<T extends keyof MessagingResponseTypeMap>(
    tag: T,
    handler: (
      message: {
        message: MessageTypeMap[T]
        target: TargetContext
      },
      sender: Browser.Runtime.MessageSender
    ) => any,
  ) {
    const innerHandler = (message: {
      message: MessageTypeMap[T]
      target: TargetContext
    }, sender: Browser.Runtime.MessageSender) => {
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

export function getConnectName(tag: string, id: string) {
  return [tag, id].join('@') as `${string}@${string}`
}
export function parseConnectName(name: string) {
  return name.split('@') as [string, string]
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
