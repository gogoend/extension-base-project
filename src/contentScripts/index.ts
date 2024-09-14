import 'uno.css'
import './styles/common.css'

/**
 * element-ui
 */
import 'element-ui/lib/theme-chalk/index.css'
import ElementUI from 'element-ui'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import Vue from 'vue'

import { onMessage } from 'webext-bridge/content-script'
import { bodyLevelElement, initBodyLevelElement } from './body-level-element'
import { mittBus } from './utils/mittBus'
import { WorkerLocalStorageChanged } from '~/type/worker-message'
import { setupApp } from '~/logic/common-setup'

Vue.use(ElementUI, {
  bodyLevelElement,
})
Vue.use(VueDOMPurifyHTML, {
  FORBID_TAGS: ['style', 'head', 'title', 'body', 'script'],
  FORBID_ATTR: ['style'],
})
setupApp(Vue)

const csHaveRunFlag = document.body.hasAttribute('data-gogoend-injected')

if (!csHaveRunFlag) {
  document.body.setAttribute('data-gogoend-injected', '')
  mittBus.on('extension-background-destroyed', () => {
    document.body.removeAttribute('data-gogoend-injected')
  })

  onMessage(WorkerLocalStorageChanged.tag, (changes) => {
    mittBus.emit('local-storage-change', changes)
  })

  ;(async () => {
    await initBodyLevelElement()
    await import('./alive-detect')
    await import('./sidepanel-bridge')
    await import('./a')
    await import('./b')
  })()
}
