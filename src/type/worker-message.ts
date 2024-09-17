import type { AxiosPromise, AxiosRequestConfig } from 'axios'
import type Browser from 'webextension-polyfill'

export abstract class WorkerBaseMessage {
  public abstract messageType: string
}

/**
 * Worker探活
 */
export class WorkerAliveDetectMessage extends WorkerBaseMessage {
  static tag = 'WorkerAliveDetectMessage' as const
  public readonly messageType = 'WorkerAliveDetectMessage'
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerAliveDetectMessage.tag]: true
  }
}

/**
 * ContentScript探活
 */
export class ContentScriptAliveDetectMessage extends WorkerBaseMessage {
  static tag = 'ContentScriptAliveDetectMessage' as const
  public readonly messageType = 'ContentScriptAliveDetectMessage'
}

/**
 * 请求发送request
 */
export class WorkerRequestMessage extends WorkerBaseMessage {
  static tag = 'WorkerRequestMessage' as const
  public readonly messageType = 'WorkerRequestMessage'
  public constructor(public axiosConf: AxiosRequestConfig) {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerRequestMessage.tag]: AxiosPromise
  }
}

export class WorkerGetLocalStorage extends WorkerBaseMessage {
  static tag = 'WorkerGetLocalStorage' as const
  public readonly messageType = 'WorkerGetLocalStorage' as const
  public constructor() {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerGetLocalStorage.tag]: Record<string, any>
  }
}

export class WorkerUpdateLocalStorage extends WorkerBaseMessage {
  static tag = 'WorkerUpdateLocalStorage' as const
  public readonly messageType = 'WorkerUpdateLocalStorage'
  public constructor(public payload: Record<string, any>) {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerUpdateLocalStorage.tag]: boolean
  }
}

export class WorkerLocalStorageChanged extends WorkerBaseMessage {
  static tag = 'WorkerLocalStorageChanged' as const
  public readonly messageType = 'WorkerLocalStorageChanged'
  public constructor(public payload: Browser.Storage.StorageAreaOnChangedChangesType) {
    super()
  }
}

/**
 * 流式AI 发送
 */
export enum WorkerRequestStreamAiResponseErrorCode {
  NO_ERROR = 0,
  UNKNOWN_ERROR = 1,
}

export interface WorkerRequestStreamAiRequestPayload {
  sessionId: string
  prompt: string
}
export class WorkerRequestStreamAi extends WorkerBaseMessage {
  static tag = 'WorkerRequestStreamAi' as const
  public readonly messageType = 'WorkerRequestStreamAi'
  public constructor(public payload: WorkerRequestStreamAiRequestPayload) {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerRequestStreamAi.tag]: WorkerResponseStreamAi
  }
}

export interface WorkerRequestStreamAiResponsePayload {
  text: string
  index: number
  errorCode: WorkerRequestStreamAiResponseErrorCode
  errorContent?: any
}
export class WorkerResponseStreamAi extends WorkerBaseMessage {
  static tag = 'WorkerResponseStreamAi' as const
  public readonly messageType = 'WorkerResponseStreamAi'
  public constructor(public payload: WorkerRequestStreamAiResponsePayload) {
    super()
  }
}

export class WorkerRequestAiSessionId extends WorkerBaseMessage {
  static tag = 'WorkerRequestAiSessionId' as const
  public readonly messageType = 'WorkerRequestAiSessionId'
  public constructor(public payload: { oldSessionId?: string }) {
    super()
  }
}
export class WorkerActivateAiComponentForFirstUse extends WorkerBaseMessage {
  static tag = 'WorkerActivateAiComponentForFirstUse' as const
  public readonly messageType = 'WorkerActivateAiComponentForFirstUse'
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerRequestAiSessionId.tag]: string
  }
}

export interface SidepanelUpdateContextByPageContentPayload {
  title: string
  content: string
}

export class SidepanelUpdateContextByPageContent extends WorkerBaseMessage {
  static tag = 'SidepanelUpdateContextByPageContent' as const
  public readonly messageType = 'SidepanelUpdateContextByPageContent'
  public constructor(public payload: SidepanelUpdateContextByPageContentPayload) {
    super()
  }
}

export class EnsureOffscreen extends WorkerBaseMessage {
  static tag = 'EnsureOffscreen' as const
  public readonly messageType = 'EnsureOffscreen'
}
export interface BackgroundRelayOffscreenMessageToSenderPayload<T = WorkerResponseStreamAi> {
  sender: Browser.Runtime.MessageSender
  message: T
}
export class BackgroundRelayOffscreenMessageToSender extends WorkerBaseMessage {
  static tag = 'BackgroundRelayOffscreenMessageToSender' as const
  public readonly messageType = 'BackgroundRelayOffscreenMessageToSender'
  public constructor(public payload: BackgroundRelayOffscreenMessageToSenderPayload) {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [BackgroundRelayOffscreenMessageToSender.tag]: any
  }
}

export class WorkerGetCurrentTab extends WorkerBaseMessage {
  static tag = 'WorkerGetCurrentTab' as const
  public readonly messageType = 'WorkerGetCurrentTab'
  public constructor() {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [WorkerGetCurrentTab.tag]: any
  }
}

export interface ContentScriptTabPrevPayload {
  title?: string
}
export class ContentScriptTabPrev extends WorkerBaseMessage {
  static tag = 'ContentScriptTabPrev' as const
  public readonly messageType = 'ContentScriptTabPrev'
  public constructor(public payload: ContentScriptTabPrevPayload) {
    super()
  }
}
declare global {
  interface MessagingResponseTypeMap {
    [ContentScriptTabPrev.tag]: any
  }
}
