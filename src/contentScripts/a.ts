import App2 from './views/App2.vue'
import csuiRootComponentCommonMount from './utils/csui-root-component-common-mount'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  csuiRootComponentCommonMount(App2)
})()
