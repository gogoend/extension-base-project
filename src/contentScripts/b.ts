import ElementPlus from 'element-plus'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import { sendMessage } from 'webext-bridge/content-script'
import { throttle } from 'lodash-es'
import type Browser from 'webextension-polyfill'
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
;(async () => {
  let lastDisableStatus = false

  const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())
  lastDisableStatus = !!localStorage.searchEngineEnhanceDisabled

  let disposeCsui: undefined | (() => void)
  if (!localStorage.searchEngineEnhanceDisabled)
    disposeCsui = await mount()

  mittBus.on('extension-background-destroyed', () => {
    disposeCsui?.()
    disposeCsui = undefined
  })
  mittBus.on('local-storage-change', throttle(async (changes: Browser.Storage.StorageAreaOnChangedChangesType) => {
    // 本地存储发生变化，如果包含了searchEngineEnhanceDisabled的变化，则重新从本地存储取最新值 - 不使用changes，是因为这个状态可能不是最新的
    if (!Object.hasOwn(changes.data.payload, 'searchEngineEnhanceDisabled'))
      return

    const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())
    if (localStorage.searchEngineEnhanceDisabled === true) {
      disposeCsui?.()
      disposeCsui = undefined
      lastDisableStatus = true
    }
    else if (lastDisableStatus !== !!localStorage.searchEngineEnhanceDisabled) {
      lastDisableStatus = !!localStorage.searchEngineEnhanceDisabled
      disposeCsui = await mount()
    }
  }, 1000))
})()
