import type { ProtocolWithReturn } from 'webext-bridge'
import type { AxiosPromise } from 'axios'
import type * as WorkerMessage from './src/type/worker-message'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'tab-prev': { title: string | undefined }
    'get-current-tab': ProtocolWithReturn<
      { tabId: number },
      { title?: string }
    >
    [WorkerMessage.WorkerAliveDetectMessage.tag]: ProtocolWithReturn<
      WorkerMessage.WorkerAliveDetectMessage,
      boolean
    >
    [WorkerMessage.WorkerRequestMessage.tag]: ProtocolWithReturn<
      WorkerMessage.WorkerRequestMessage,
      AxiosPromise
    >
    [WorkerMessage.WorkerUpdateLocalStorage.tag]: ProtocolWithReturn<
      WorkerMessage.WorkerUpdateLocalStorage,
      boolean
    >
    [WorkerMessage.WorkerLocalStorageChanged.tag]: ProtocolWithReturn<
      WorkerMessage.WorkerLocalStorageChanged,
      boolean
    >
    [WorkerMessage.WorkerGetLocalStorage.tag]: ProtocolWithReturn<
      WorkerMessage.WorkerGetLocalStorage,
      Record<string, any>
    >
  }
}
