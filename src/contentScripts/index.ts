import 'uno.css'
import './styles/common.css'

/**
 * element-ui
 */
import 'element-ui/lib/theme-chalk/index.css'
import { onMessage } from 'webext-bridge/content-script'
import { mittBus } from './utils/mittBus'
import { initBodyLevelElement } from './body-level-element'
import { WorkerLocalStorageChanged } from '~/type/worker-message'

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
    await import('./a')
    await import('./b')
  })()
}
