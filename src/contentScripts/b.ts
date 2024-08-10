import ElementPlus from 'element-plus'
import App from './views/App2.vue'
import mountSingletonCsui from './utils/csui-root-component-common-mount'
import { mittBus } from './utils/mittBus'

/**
 * element-ui的按需引入需要引入base.css文件
 */
import 'element-plus/dist/index.css'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  const { dispose } = await mountSingletonCsui(App, {
    mounter: (containerEl) => {
      const mountAtEl = document.querySelector('.result-op')
      if (!mountAtEl)
        throw new ReferenceError('找不到对应元素')

      mountAtEl?.parentElement?.prepend(containerEl)
    },
    reuseOldElOnAnchorChange: false,
    use: [
      ElementPlus,
    ],
  })
  mittBus.on('extension-background-destroyed', dispose)
})()
