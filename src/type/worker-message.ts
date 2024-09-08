import type { AxiosRequestConfig } from 'axios'
import type Browser from 'webextension-polyfill'

export abstract class WorkerBaseMessage {
  public abstract messageType: string
}

/**
 * Worker探活
 */
export class WorkerAliveDetectMessage extends WorkerBaseMessage {
  static tag = 'WorkerAliveDetectMessage' as const
  public messageType: string = 'WorkerAliveDetectMessage'
}

/**
 * ContentScript探活
 */
export class ContentScriptAliveDetectMessage extends WorkerBaseMessage {
  static tag = 'ContentScriptAliveDetectMessage' as const
  public messageType: string = 'ContentScriptAliveDetectMessage'
}

/**
 * 请求发送request
 */
export class WorkerRequestMessage extends WorkerBaseMessage {
  static tag = 'WorkerRequestMessage' as const
  public messageType: string = 'WorkerRequestMessage'
  public constructor(public axiosConf: AxiosRequestConfig) {
    super()
  }
}

export class WorkerGetLocalStorage extends WorkerBaseMessage {
  static tag = 'WorkerGetLocalStorage' as const
  public messageType: string = 'WorkerGetLocalStorage'
  public constructor() {
    super()
  }
}

export class WorkerUpdateLocalStorage extends WorkerBaseMessage {
  static tag = 'WorkerUpdateLocalStorage' as const
  public messageType: string = 'WorkerUpdateLocalStorage'
  public constructor(public payload: any) {
    super()
  }
}

export class WorkerLocalStorageChanged extends WorkerBaseMessage {
  static tag = 'WorkerLocalStorageChanged' as const
  public messageType: string = 'WorkerLocalStorageChanged'
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
  connectId: string
  sessionId: string
  prompt: string
  __internal__sender?: Browser.Runtime.MessageSender
}
export class WorkerRequestStreamAi extends WorkerBaseMessage {
  static tag = 'WorkerRequestStreamAi' as const
  public messageType: string = 'WorkerRequestStreamAi'
  public constructor(public payload: WorkerRequestStreamAiRequestPayload) {
    super()
  }
}

export interface WorkerRequestStreamAiResponsePayload {
  connectId: string
  text: string
  index: number
  errorCode: WorkerRequestStreamAiResponseErrorCode
  errorContent?: any
  __internal__sender?: Browser.Runtime.MessageSender
}
export class WorkerResponseStreamAi extends WorkerBaseMessage {
  static tag = 'WorkerResponseStreamAi' as const
  public messageType: string = 'WorkerResponseStreamAi'
  public constructor(public payload: WorkerRequestStreamAiResponsePayload) {
    super()
  }
}

export class WorkerRequestAiSessionId extends WorkerBaseMessage {
  static tag = 'WorkerRequestAiSessionId' as const
  public messageType: string = 'WorkerRequestAiSessionId'
  public constructor() {
    super()
  }
}
