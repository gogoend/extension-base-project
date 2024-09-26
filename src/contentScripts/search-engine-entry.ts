import Vue from 'vue'
import App from './views/SearchEngineInsertionEntry/index.vue'
import mountSingletonCsui, { mountWithLifeCycle, vue2Mount } from './utils/csui-root-component-common-mount'
import { pinia } from './store'

async function mount() {
  const { disposeCsui } = await mountSingletonCsui(vue2Mount, () => {
    const Ctor = Vue.extend(App)
    const app = new Vue({
      render: h => h(Ctor),
      pinia,
    })
    return app
  }, {
    mounter: (containerEl) => {
      const mountAtEl = document.querySelector('.result-op')
      if (!mountAtEl)
        throw new ReferenceError('CANNOT_FIND_INSERT_ANCHOR')

      mountAtEl?.parentElement?.prepend(containerEl)
    },
    reuseOldElOnAnchorChange: false,
  })
  return disposeCsui
}

mountWithLifeCycle({
  mount,
  disableKeyInLocalStorage: 'searchEngineEnhanceDisabled',
})
