import 'uno.css'

/**
 * element-ui
 */
import 'element-ui/lib/theme-chalk/index.css'
// import { onMessage } from 'webext-bridge/content-script'
import { mittBus } from './utils/mittBus'
// import { WorkerLocalStorageChanged } from '~/type/worker-message'

const csHaveRunFlag = document.body.hasAttribute('data-gogoend-injected')

if (!csHaveRunFlag) {
  document.body.setAttribute('data-gogoend-injected', '')
  mittBus.on('extension-background-destroyed', () => {
    document.body.removeAttribute('data-gogoend-injected')
  })
}
