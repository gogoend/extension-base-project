/* eslint-disable no-console */
import { onMessage } from 'webext-bridge/content-script'
import type { Component } from 'vue'
import { createApp } from 'vue'
import { mittBus } from './mittBus'
import { setupApp } from '~/logic/common-setup'

const defaultMountConfig = {
  mounter: (containerEl: Element) => {
    document.documentElement.appendChild(containerEl)
  },
  reuseOldElOnAnchorChange: true,
  use: [] as any[],
}

export async function getShadow(mounter = defaultMountConfig.mounter) {
  // mount component to context window
  const container = document.createElement('gogoend-ui')
  container.id = __NAME__
  container.style.display = 'block'
  const root = document.createElement('div')
  root.classList.add('csui-root')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)

  mounter(container)
  const styleElLoadWaitee = {}
  styleElLoadWaitee.promise = new Promise((resolve, reject) => {
    styleElLoadWaitee.resolve = resolve
    styleElLoadWaitee.reject = reject
  })
  styleEl.addEventListener('load', () => styleElLoadWaitee.resolve(undefined), { once: true })
  await styleElLoadWaitee.promise

  return {
    root,
    container,
  }
}

async function commonMount<T extends Component>(RootComponent: T, mountConfig = defaultMountConfig) {
  // Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
  console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  const { root, container } = await getShadow(mountConfig.mounter)

  const app = createApp(RootComponent)

  const { use } = mountConfig
  use?.forEach((it) => {
    if (Array.isArray(it)) {
      const [plugin, options] = it
      app.use(plugin, options)
    }
    else {
      app.use(it)
    }
  })

  setupApp(app)
  try {
    app.mount(root)
  }
  catch (err) {
    console.error('根组件挂载发生错误', err)
    mittBus.emit('root-mount-error', {
      component: RootComponent,
    })
    return
  }
  const dispose = () => {
    app.unmount()
    container.remove()
  }

  return {
    container,
    dispose,
  }
}

export default async function mountSingletonCsui<T extends Component>(RootComponent: T, specifiedMountConfig: Partial<typeof defaultMountConfig> = defaultMountConfig) {
  const mountConfig = {
    ...defaultMountConfig,
    ...specifiedMountConfig,
  }
  const { reuseOldElOnAnchorChange } = mountConfig
  let mountResult: Awaited<ReturnType<typeof commonMount>> | undefined

  let encounterErrorWhenMount = false

  let periodCheckTimer: number
  periodCheckIfNodeOnScreen()

  function dispose() {
    window.clearTimeout(periodCheckTimer)
    mountResult?.dispose()
    mittBus.off('root-mount-error', rootMountErrorHandler)
  }

  function rootMountErrorHandler({ component }: { component: Component }) {
    if (RootComponent !== component)
      return

    dispose()
  }
  mittBus.on('root-mount-error', rootMountErrorHandler)
  async function periodCheckIfNodeOnScreen() {
    periodCheckTimer = window.setTimeout(periodCheckIfNodeOnScreen, 1000)
    try {
      if (
        !mountResult || !mountResult.container.ownerDocument.contains(mountResult.container)
      ) {
        if (!reuseOldElOnAnchorChange || encounterErrorWhenMount || !mountResult) {
          mountResult?.dispose()
          mountResult = await commonMount(RootComponent, mountConfig)
          encounterErrorWhenMount = false
        }
        else {
          mountConfig.mounter(mountResult!.container)
        }
      }
    }
    catch (err) {
      if (![
        'CANNOT_FIND_INSERT_ANCHOR',
      ].includes(err.message))
        console.error('挂载过程发生错误', err)

      encounterErrorWhenMount = true
    }
  }
  return {
    dispose,
  }
}
