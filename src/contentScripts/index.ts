import 'uno.css'
import './styles/common.css'

/**
 * element-plus
 */
import 'element-plus/dist/index.css'
import { onMessage } from 'webext-bridge/content-script'
import { mittBus } from './utils/mittBus'
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
  import('./attach-background-helper')
  import('./alive-detect')
  import('./a')
  import('./b')
}
