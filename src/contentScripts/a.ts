import App from './views/App.vue'
import mountSingletonCsui, { mountWithLifeCycle } from './utils/csui-root-component-common-mount'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
mountWithLifeCycle({
  mount: async () => (await mountSingletonCsui(App)).disposeCsui,
})
