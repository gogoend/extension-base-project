import type { Component } from 'vue'
import Vue from 'vue'
import { debounce } from 'lodash-es'
import type Browser from 'webextension-polyfill'
import { initCsuiStyle } from '../csui-style'
import { mittBus } from './mittBus'

import { WorkerGetLocalStorage } from '~/type/worker-message'
import { handleMessageFactory, sendToBackground } from '~/utils/messaging'

const defaultMountConfig = {
  mounter: (containerEl: Element) => {
    document.documentElement.appendChild(containerEl)
  },
  reuseOldElOnAnchorChange: true,
}

export async function getShadow(mounter = defaultMountConfig.mounter) {
  // mount component to context window
  const container = document.createElement('gogoend-ui')
  container.id = __NAME__
  container.style.display = 'block'
  const root = document.createElement('div')
  root.classList.add('csui-root')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  shadowDOM.appendChild(root)
  const cssText = await initCsuiStyle() as string

  // Create an empty "constructed" stylesheet
  const stylesheet = new CSSStyleSheet()
  // Apply a rule to the sheet
  stylesheet.replaceSync(cssText)
  shadowDOM.adoptedStyleSheets = [stylesheet]
  mounter(container)
  return {
    root,
    container,
  }
}

interface MountFuncReturnType {
  container: HTMLElement
  dispose: () => any
  app: any
}

export async function vue2Mount(RootComponent: any, mountConfig = defaultMountConfig): Promise<MountFuncReturnType> {
  const { root, container } = await getShadow(mountConfig.mounter)

  const Ctor = Vue.extend(RootComponent)
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

  app.$disposeCsui = mountConfig.disposeCsui
  return {
    container,
    dispose,
    app,
  }
}

export async function vanillaMount(el: HTMLElement, mountConfig = defaultMountConfig): Promise<MountFuncReturnType> {
  const { root, container } = await getShadow(mountConfig.mounter)

  try {
    root.appendChild(el)
  }
  catch (err) {
    console.error('根组件挂载发生错误', err)
    mittBus.emit('root-mount-error', {
      component: el,
    })
    throw err
  }
  const dispose = () => {
    el.remove()
    container.remove()
  }
  return {
    container,
    dispose,
    app: el,
  }
}

export default async function mountSingletonCsui(libraryRelatedMount: (...args: any[]) => Promise<MountFuncReturnType>, RootComponent: any, specifiedMountConfig: Partial<typeof defaultMountConfig> = defaultMountConfig) {
  const mountConfig = {
    ...defaultMountConfig,
    ...specifiedMountConfig,
  }
  const { reuseOldElOnAnchorChange } = mountConfig
  let mountResult: Awaited<ReturnType<typeof vue2Mount>> | undefined

  let encounterErrorWhenMount = false

  let periodCheckTimer: number

  function disposeCsui() {
    window.clearTimeout(periodCheckTimer)
    mountResult?.dispose()
    mittBus.off('root-mount-error', rootMountErrorHandler)
    return undefined
  }
  mountConfig.disposeCsui = disposeCsui

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
          mountResult = await libraryRelatedMount(RootComponent, mountConfig)
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
  periodCheckIfNodeOnScreen()
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

    const localStorage = await sendToBackground(new WorkerGetLocalStorage())
    lastDisableStatus = !!localStorage[disableKeyInLocalStorage]

    if (
      !localStorage[disableKeyInLocalStorage]
    )
      disposeCsui = await mount()
    // 处理同一时间内多次启用 / 禁用 切换的情况 - 以最后一次为准
    const handleEnableStateMayChange = debounce(async () => {
      const localStorage = await sendToBackground(new WorkerGetLocalStorage())
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
      if (!Object.hasOwn(changes, disableKeyInLocalStorage))
        return

      handleEnableStateMayChange()
    })
  }
}
