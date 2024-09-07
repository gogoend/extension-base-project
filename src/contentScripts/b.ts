import App from './views/App2.vue'
import mountSingletonCsui, { mountWithLifeCycle, vue2Mount } from './utils/csui-root-component-common-mount'

async function mount() {
  const { disposeCsui } = await mountSingletonCsui(vue2Mount, App, {
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
