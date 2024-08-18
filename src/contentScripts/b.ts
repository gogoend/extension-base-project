import ElementPlus from 'element-plus'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import { sendMessage } from 'webext-bridge/content-script'
import App from './views/App2.vue'
import mountSingletonCsui from './utils/csui-root-component-common-mount'
import { mittBus } from './utils/mittBus'
import { WorkerGetLocalStorage } from '~/type/worker-message'

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

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())

  let disposeCsui: undefined | (() => void)
  if (!localStorage.searchEngineEnhanceDisabled)
    disposeCsui = await mount()

  mittBus.on('extension-background-destroyed', () => {
    disposeCsui?.()
    disposeCsui = undefined
  })
  mittBus.on('local-storage-change', async () => {
    const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())
    if (localStorage.searchEngineEnhanceDisabled === true) {
      disposeCsui?.()
      disposeCsui = undefined
    }
    else {
      disposeCsui = await mount()
    }
  })
})()
