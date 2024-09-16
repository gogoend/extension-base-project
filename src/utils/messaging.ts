import browser from 'webextension-polyfill'
import { v4 as uuid } from 'uuid'
import type Browser from 'webextension-polyfill'
import * as WorkerMessage from '~/type/worker-message'

type ResponseForMessage<T extends WorkerMessage.WorkerBaseMessage> =
  T['messageType'] extends keyof MessagingResponseTypeMap
    ? MessagingResponseTypeMap[T['messageType']]
    : any

export function sendToBackground<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<ResponseForMessage<T>> {
  return browser.runtime.sendMessage({
    target: 'background',
    message,
  })
}

export function sendToPopup<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<ResponseForMessage<T>> {
  return browser.runtime.sendMessage({
    target: 'popup',
    message,
  })
}

export function sendToSidepanel<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<ResponseForMessage<T>> {
  return browser.runtime.sendMessage({
    target: 'sidepanel',
    message,
  })
}

export async function sendToOffscreen<T extends (WorkerMessage.WorkerBaseMessage)>(message: T): Promise<ResponseForMessage<T>> {
  await sendToBackground(new WorkerMessage.EnsureOffscreen())
  return browser.runtime.sendMessage({
    target: 'offscreen',
    message,
  })
}

export function sendToTabById<T extends (WorkerMessage.WorkerBaseMessage)>(tabId: number, message: T): Promise<ResponseForMessage<T>> {
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
type WorkerMessageNamespaceImportUnion = typeof WorkerMessage[keyof typeof WorkerMessage]
// 2. 引入的类型比较混杂，且引入的是按值推断的类型（引入的类型构造函数，而不是接口），因此按照能否构造过滤出所有构造函数
type WorkerMessageNamespaceImportOnlyConstructorUnion = Extract<WorkerMessageNamespaceImportUnion, (new (...args: any[]) => any)>
// 3. 取一下构造函数实例的类型
type WorkerMessageNamespaceImportInstanceTypeUnion = InstanceType<WorkerMessageNamespaceImportOnlyConstructorUnion>
// 4. 过滤出基于WorkerBaseMessage的类型，并把这些类型组合为联合类型
type WorkerMessageTypeUnion = Extract<WorkerMessageNamespaceImportInstanceTypeUnion, WorkerMessage.WorkerBaseMessage>
// 5. 创建映射类型 - key为messageType属性为key，value为各自对应的消息
type MessageTypeMap = {
  [M in WorkerMessageTypeUnion as M['messageType']]: M
}
// #endregion

export function handleMessageFactory(
  targetContext: TargetContext,
) {
  return function handleMessage<T extends string>(
    tag: T,
    handler: (
      message: {
        message: T extends keyof MessagingResponseTypeMap ? MessageTypeMap[T] : any
        target: TargetContext
      },
      sender: Browser.Runtime.MessageSender
    ) => T extends keyof MessagingResponseTypeMap ? (MessagingResponseTypeMap[T] | Promise<MessagingResponseTypeMap[T]>) : any,
  ) {
    const innerHandler = (message: {
      message: T extends keyof MessagingResponseTypeMap ? MessageTypeMap[T] : any
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
interface StreamMessageHandler<T> {
  (message: T): void
}

export class WorkerStopStreamPort extends WorkerMessage.WorkerBaseMessage {
  static tag = 'WorkerStopStreamPort' as const
  public readonly messageType = 'WorkerStopStreamPort'
}
export function sendToStreamResponsePort<
  T extends WorkerMessage.WorkerBaseMessage,
  U = ResponseForMessage<T>,
>(
  message: T,
  {
    resolvePredict,
    rejectPredict,
    streamHandler,
  }: {
    rejectPredict?: StreamMessageHandler<U>
    resolvePredict?: StreamMessageHandler<U>
    streamHandler?: StreamMessageHandler<U>
  } = {},
) {
  const connectId = uuid()
  const port = browser.runtime.connect({ name: getConnectName(message.messageType, connectId) })
  port.postMessage(
    message,
  )
  const responseDefer = Promise.withResolvers()
  responseDefer.promise.finally(() => port.disconnect())
  port.onMessage.addListener((message) => {
    if (rejectPredict?.(message)) {
      responseDefer.reject(message)
      return
    }
    if (resolvePredict?.(message)) {
      responseDefer.resolve(message)
      return
    }
    streamHandler?.(message)
  })

  return {
    promise: responseDefer.promise,
    cancel: async () => {
      port.postMessage(new WorkerStopStreamPort())
      responseDefer.reject('CANCELLED')
    },
  }
}
export function handleStreamResponsePort<T extends keyof MessagingResponseTypeMap>(
  tag: T,
  handler: (message: MessageTypeMap[T] | WorkerStopStreamPort, port: Browser.Runtime.Port) => void,
) {
  browser.runtime.onConnect.addListener((port) => {
    const [portName, connectId] = parseConnectName(port.name)
    if (portName !== tag || !connectId)
      return

    port.onMessage.addListener(handler)
  })
}
