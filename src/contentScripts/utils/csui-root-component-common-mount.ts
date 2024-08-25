/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import type { Component } from 'vue'
import Vue from 'vue'
import { debounce } from 'lodash-es'
import type Browser from 'webextension-polyfill'
import { mittBus } from './mittBus'
import { setupApp } from '~/logic/common-setup'

import { WorkerGetLocalStorage } from '~/type/worker-message'

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
  const styleEl = document.createElement('style')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  await fetch(
    browser.runtime.getURL(`dist/contentScripts/style.css`),
  ).then(res => res.text()).then((cssText) => {
    styleEl.innerHTML = cssText
  })
  mounter(container)
  return {
    root,
    container,
  }
}

async function commonMount(RootComponent: any, mountConfig = defaultMountConfig) {
  // Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
  console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  const { root, container } = await getShadow(mountConfig.mounter)

  const Ctor = Vue.extend(RootComponent)

  const { use } = mountConfig
  use?.forEach((it) => {
    if (Array.isArray(it)) {
      const [plugin, options] = it
      Ctor.use(plugin, options)
    }
    else {
      Ctor.use(it)
    }
  })
  setupApp(Ctor)
  const app = new Vue({
    render: h => h(Ctor),
  })

  try {
    app.$mount(root)
  }
  catch (err) {
    console.error('根组件挂载发生错误', err)
    mittBus.emit('root-mount-error', {
      component: RootComponent,
    })
    throw err
  }
  const dispose = () => {
    app.$destroy()
    container.remove()
  }

  return {
    container,
    dispose,
    app,
    ComponentConstructor: Ctor,
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

  function disposeCsui() {
    window.clearTimeout(periodCheckTimer)
    mountResult?.dispose()
    mittBus.off('root-mount-error', rootMountErrorHandler)
  }

  function rootMountErrorHandler({ component }: { component: Component }) {
    if (RootComponent !== component)
      return

    disposeCsui()
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
          mountResult.ComponentConstructor.prototype.$disposeCsui = disposeCsui
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
    disposeCsui,
  }
}

export async function mountWithLifeCycle({ mount, disableKeyInLocalStorage }: {
  mount: () => Promise<(() => void)>
  disableKeyInLocalStorage?: string
}) {
  let disposeCsui: undefined | (() => void)
  mittBus.on('extension-background-destroyed', () => {
    disposeCsui?.()
    disposeCsui = undefined
  })

  if (disableKeyInLocalStorage === undefined) {
    disposeCsui = await mount()
  }
  else {
    // 记录一下上一次的禁用状态
    let lastDisableStatus = false

    const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())
    lastDisableStatus = !!localStorage[disableKeyInLocalStorage]

    if (
      !localStorage[disableKeyInLocalStorage]
    )
      disposeCsui = await mount()
    // 处理同一时间内多次启用 / 禁用 切换的情况 - 以最后一次为准
    const handleEnableStateMayChange = debounce(async () => {
      const localStorage = await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage())
      if (localStorage[disableKeyInLocalStorage] === true) {
        disposeCsui?.()
        disposeCsui = undefined
        lastDisableStatus = true
      }
      else if (lastDisableStatus !== !!localStorage[disableKeyInLocalStorage]) {
        lastDisableStatus = !!localStorage[disableKeyInLocalStorage]
        disposeCsui = await mount()
      }
    }, 1000)

    mittBus.on('local-storage-change', async (changes: Browser.Storage.StorageAreaOnChangedChangesType) => {
      // 本地存储发生变化，如果包含了disableKeyInLocalStorage的变化，则重新从本地存储取最新值
      // 不使用changes，是因为这个状态可能不是最新的
      if (!Object.hasOwn(changes.data.payload, disableKeyInLocalStorage))
        return

      handleEnableStateMayChange()
    })
  }
}
