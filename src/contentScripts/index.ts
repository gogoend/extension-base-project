import 'uno.css'
import './styles/common.css'

/**
 * element-plus
 */
import 'element-plus/dist/index.css'
import { mittBus } from './utils/mittBus'

const csHaveRunFlag = document.body.hasAttribute('data-gogoend-injected')

if (!csHaveRunFlag) {
  document.body.setAttribute('data-gogoend-injected', '')
  mittBus.on('extension-background-destroyed', () => {
    document.body.removeAttribute('data-gogoend-injected')
  })
  import('./alive-detect')
  import('./a')
  import('./b')
}
