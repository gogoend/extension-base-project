import App from './views/App.vue'
import mountSingletonCsui from './utils/csui-root-component-common-mount'
import { mittBus } from './utils/mittBus'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  const { dispose } = await mountSingletonCsui(App)
  mittBus.on('extension-background-destroyed', dispose)
})()
