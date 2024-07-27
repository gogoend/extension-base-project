import App from './views/App.vue'
import csuiRootComponentCommonMount from './utils/csui-root-component-common-mount'
import { mittBus } from './utils/mittBus'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  const { dispose } = await csuiRootComponentCommonMount(App)
  mittBus.on('extension-background-destroyed', dispose)
})()
