import ElementPlus from 'element-plus'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import App from './views/App2.vue'
import mountSingletonCsui from './utils/csui-root-component-common-mount'
import { mittBus } from './utils/mittBus'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  const { dispose } = await mountSingletonCsui(App, {
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
  mittBus.on('extension-background-destroyed', dispose)
})()
