import { throttle } from 'lodash-es'
import { mittBus } from './utils/mittBus'
import { WorkerAliveDetectMessage } from '~/type/worker-message'

const aliveDetect = throttle(async (ev: FocusEvent | Event) => {
  if (ev.type === 'visibilitychange' && document.visibilityState !== 'visible')
    return

  // 页面变为可见状态时执行的操作
  try {
    await browser.runtime.sendMessage(new WorkerAliveDetectMessage())
  }
  catch (err) {
    if (err.message?.includes('Extension context invalidated')) {
      console.error('后台被销毁', err)
      mittBus.emit('extension-background-destroyed')
      return
    }
    throw err
  }
}, 1000)

document.addEventListener('visibilitychange', aliveDetect)
window.addEventListener('focus', aliveDetect)
mittBus.on('extension-background-destroyed', () => {
  document.removeEventListener('visibilitychange', aliveDetect)
  window.removeEventListener('focus', aliveDetect)
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.messageType === 'ContentScriptAliveDetectMessage')
    sendResponse()
})
