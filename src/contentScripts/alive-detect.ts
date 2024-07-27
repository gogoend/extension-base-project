import { mittBus } from './utils/mittBus'
import { WorkerAliveDetectMessage } from '~/type/worker-message'

window.addEventListener('focus', async function handler() {
  try {
    await browser.runtime.sendMessage(new WorkerAliveDetectMessage())
  }
  catch (err) {
    if (err.message?.includes('Extension context invalidated')) {
      console.error('后台被销毁', err)
      mittBus.emit('extension-background-destroyed')
      window.removeEventListener('focus', handler)
      return
    }
    throw err
  }
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.messageType === 'ContentScriptAliveDetectMessage')
    sendResponse()
})
