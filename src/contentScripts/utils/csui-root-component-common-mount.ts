/* eslint-disable no-console */
import { onMessage } from 'webext-bridge/content-script'
import type { Component } from 'vue'
import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'

const defaultMountConfig = {
  mounter: (containerEl: Element) => {
    document.documentElement.appendChild(containerEl)
  },
  reuseOldElOnAnchorChange: true,
  use: [] as any[],
}

async function commonMount<T extends Component>(RootComponent: T, mountConfig = defaultMountConfig) {
  // Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
  console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  // mount component to context window
  const container = document.createElement('gogoend-ui')
  container.id = __NAME__
  container.style.display = 'block'
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)

  const { mounter, use } = mountConfig
  mounter(container)
  const styleElLoadWaitee = Promise.withResolvers()
  styleEl.addEventListener('load', () => styleElLoadWaitee.resolve(undefined), { once: true })
  await styleElLoadWaitee.promise
  const app = createApp(RootComponent)

  use?.forEach((it) => {
    app.use(it)
  })

  setupApp(app)
  app.mount(root)
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

  const dispose = () => {
    window.clearTimeout(periodCheckTimer)
    mountResult?.dispose()
  }
  async function periodCheckIfNodeOnScreen() {
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
      console.error('挂载过程发生错误', err)
      encounterErrorWhenMount = true
    }
    periodCheckTimer = window.setTimeout(periodCheckIfNodeOnScreen, 1000)
  }
  return {
    dispose,
  }
}
