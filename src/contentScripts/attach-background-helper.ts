import { mittBus } from './utils/mittBus'
import request from './utils/request'

const iframeEl = document.createElement('iframe')
iframeEl.src = browser.runtime.getURL('/dist/backgroundHelper/index.html')

iframeEl.style.position = 'fixed'
iframeEl.style.width = '0'
iframeEl.style.height = '0'
iframeEl.style.left = '0'
iframeEl.style.top = '0'
iframeEl.style.border = 'none'
iframeEl.style.visibility = 'hidden'

document.documentElement.appendChild(iframeEl)
mittBus.on('extension-background-destroyed', () => {
  iframeEl.remove()
})

request.get('https://youku.com')
