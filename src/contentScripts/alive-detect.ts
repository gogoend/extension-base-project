import { throttle } from 'lodash-es'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { mittBus } from './utils/mittBus'
import { ContentScriptAliveDetectMessage, WorkerAliveDetectMessage } from '~/type/worker-message'

const aliveDetect = throttle(async (ev?: FocusEvent | Event) => {
  if (ev && ev.type === 'visibilitychange' && document.visibilityState !== 'visible')
    return

  // 页面变为可见状态时执行的操作
  try {
    await sendMessage(WorkerAliveDetectMessage.tag, new WorkerAliveDetectMessage())
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
function setTimer() {
  let timer: number = 0
  const fn = () => {
    aliveDetect()
    timer = window.setTimeout(fn, 3000)
  }
  fn()
  return {
    dispose() {
      window.clearTimeout(timer)
    },
  }
}

document.addEventListener('visibilitychange', aliveDetect)
window.addEventListener('focus', aliveDetect)
const { dispose: disposeTimer } = setTimer()

mittBus.on('extension-background-destroyed', () => {
  document.removeEventListener('visibilitychange', aliveDetect)
  window.removeEventListener('focus', aliveDetect)
  disposeTimer()
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.messageType === ContentScriptAliveDetectMessage.tag)
    sendResponse()
})
