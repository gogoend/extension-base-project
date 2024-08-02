import type { AxiosRequestConfig } from 'axios'

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
  public messageType: string = 'WorkerRequestMessage'
  public static tag = 'WorkerRequestMessage'
  public axiosConf: AxiosRequestConfig

  public constructor(axiosConf: AxiosRequestConfig) {
    super()
    this.axiosConf = axiosConf
  }
}
