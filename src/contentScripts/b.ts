import App from './views/App.vue'
import csuiRootComponentCommonMount from './utils/csui-root-component-common-mount'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  csuiRootComponentCommonMount(App)
})()
