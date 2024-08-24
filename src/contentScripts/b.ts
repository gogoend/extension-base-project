import ElementPlus from 'element-plus'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import App from './views/App2.vue'
import mountSingletonCsui, { mountWithLifeCycle } from './utils/csui-root-component-common-mount'

async function mount() {
  const { disposeCsui } = await mountSingletonCsui(App, {
    mounter: (containerEl) => {
      const mountAtEl = document.querySelector('.result-op')
      if (!mountAtEl)
        throw new ReferenceError('CANNOT_FIND_INSERT_ANCHOR')

      mountAtEl?.parentElement?.prepend(containerEl)
    },
    reuseOldElOnAnchorChange: false,
    use: [
      ElementPlus,
      [
        VueDOMPurifyHTML,
        {
          FORBID_TAGS: ['style', 'head', 'title', 'body', 'script'],
          FORBID_ATTR: ['style'],
        },
      ],
    ],
  })
  return disposeCsui
}

mountWithLifeCycle({
  mount,
  disableKeyInLocalStorage: 'searchEngineEnhanceDisabled',
})
