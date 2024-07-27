import { WorkerAliveDetectMessage } from '~/type/worker-message'

export const messageHandlerMap: Record<string, Parameters<typeof browser.runtime.onMessage.addListener>[0]> = {
  [WorkerAliveDetectMessage.tag](message, sender, sendResponse) {
    sendResponse()
    return true
  },
}
