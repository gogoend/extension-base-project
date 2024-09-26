import Vue from 'vue'
import App from './views/SideChatEntry/index.vue'

import mountSingletonCsui, { mountWithLifeCycle, vue2Mount } from './utils/csui-root-component-common-mount'
import { pinia } from './store'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
mountWithLifeCycle({
  mount: async () => (await mountSingletonCsui(vue2Mount, () => {
    const Ctor = Vue.extend(App)
    const app = new Vue({
      render: h => h(Ctor),
      pinia,
    })
    return app
  })).disposeCsui,
})
