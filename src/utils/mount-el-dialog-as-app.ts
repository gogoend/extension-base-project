import type { Component } from 'vue'
import { createApp, h } from 'vue'
import { getShadow } from '~/contentScripts/utils/csui-root-component-common-mount'
import { mittBus } from '~/contentScripts/utils/mittBus'

type ElWithDisposer = HTMLElement & {
  __close__?: () => void
  __kill__?: () => void
  __waitee__?: {
    promise?: Promise<any>
    resolve?: (value?: any) => void
    reject?: (reason?: any) => void
  }
}

const pendingPromise: Record<string, Promise<any>> = {}

export default function mountElDialogAsApp<T extends Component>(Comp: T, props, uniqueElId: string) {
  // #region 对话框组件定义
  const show = () => {
    if (pendingPromise[uniqueElId] instanceof Promise)
      return pendingPromise[uniqueElId]

    const existEl = document.documentElement.querySelector(`#${uniqueElId}`) as ElWithDisposer | null
    if (existEl) {
      return Promise.resolve({
        close: existEl.__close__,
        promise: existEl.__waitee__?.promise,
        kill: existEl.__kill__,
      })
    }
    const p = getShadow().then((shadow) => {
      delete pendingPromise[uniqueElId]
      const root = shadow.root
      const container = shadow.container as ElWithDisposer
      container.id = uniqueElId

      let app: ReturnType<typeof createApp> | null = null
      const kill = () => {
        props.modelValue = false
        app?.unmount()
        container.remove()
        delete container.__close__
        container.__waitee__?.reject?.()
        delete container.__waitee__
        delete container.__kill__
        delete props.resolvers
        app = null
        mittBus.off('extension-background-destroyed', kill)
      }
      mittBus.on('extension-background-destroyed', kill)
      if (typeof props.onClosed === 'function') {
        const originOnClosed = props.onClosed
        props.onClosed = () => {
          originOnClosed()
          kill()
        }
      }
      else {
        props.onClosed = kill
      }

      const close = async () => {
        await nextTick() // 假设直接 show().close() ，即改变了对话框在挂载之前的状态，将导致对话框DOM在body上存在，但永远也打不开对话框
        props.modelValue = false // 设置false，而不是直接卸载组件、删掉元素，保证对话框过渡动画能够播放结束，然后再由onClosed卸载组件、删掉元素
      }

      container.__close__ = close
      container.__kill__ = kill
      container.__waitee__ = {}
      container.__waitee__.promise = new Promise((resolve, reject) => {
        container!.__waitee__!.resolve = resolve
        container!.__waitee__!.reject = reject

        props.resolvers = {
          resolve,
          reject,
        }
      })
      container.__waitee__.promise.finally(() => {
        close()
      })

      props.modelValue = false
      props['onUpdate:modelValue'] = (v: boolean) => {
        props.modelValue = v
      }
      app = createApp({
        render: () => h(Comp, props),
      })

      const el = document.createElement('div')
      app.mount(el)
      root.appendChild(el)

      props.modelValue = true

      return {
        close,
        kill,
        promise: container.__waitee__.promise,
      }
    }, (err) => {
      delete pendingPromise[uniqueElId]
      throw err
    })

    pendingPromise[uniqueElId] = p
    return p
  }
  // #endregion
  return {
    show,
  }
}
