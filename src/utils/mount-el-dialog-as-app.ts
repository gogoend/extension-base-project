import type { Component } from 'vue'
import Vue from 'vue'
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

interface DialogData {
  data: any
  on: {
    [key: string]: Function | Function[]
  }
  uniqueElId: string
}

export default function mountElDialogAsApp(
  Comp: Component,
  option: Partial<DialogData>,
) {
  // #region 对话框组件定义
  option = reactive({ data: {}, on: {}, uniqueElId: 'close-confirm-dialog' })
  const { data = {}, on = {}, uniqueElId } = option

  if (uniqueElId !== undefined && pendingPromise[uniqueElId] instanceof Promise)
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
    uniqueElId !== undefined && delete pendingPromise[uniqueElId]
    const root = shadow.root
    const container = shadow.container as ElWithDisposer
    uniqueElId !== undefined && (container.id = uniqueElId)

    let app: Vue | null = null
    const kill = () => {
      data.visible = false
      app?.$destroy()
      container.remove()
      delete container.__close__
      container.__waitee__?.reject?.()
      delete container.__waitee__
      delete container.__kill__
      Vue.delete(data, 'resolvers')
      app = null
      mittBus.off('extension-background-destroyed', kill)
    }
    mittBus.on('extension-background-destroyed', kill)

    const close = async () => {
      await nextTick() // 假设直接 show().close() ，即改变了对话框在挂载之前的状态，将导致对话框DOM在body上存在，但永远也打不开对话框
      data.visible = false // 设置false，而不是直接卸载组件、删掉元素，保证对话框过渡动画能够播放结束，然后再由onClosed卸载组件、删掉元素
    }

    container.__close__ = close
    container.__kill__ = kill
    container.__waitee__ = {}
    container.__waitee__.promise = new Promise((resolve, reject) => {
      container!.__waitee__!.resolve = resolve
      container!.__waitee__!.reject = reject

      Vue.set(data, 'resolvers', {
        resolve,
        reject,
      })
    })
    container.__waitee__.promise.catch(() => void 0).finally(() => {
      close()
    })
    Vue.set(data, 'visible', false)

    const { closed: closedListener, ...restListener } = on
    const closedHandler: Function[] = closedListener ? Array.isArray(closedListener) ? [...closedListener] : [closedListener] : []
    closedHandler.push(kill)
    app = new Vue({
      render(h) {
        return h(Comp, {
          props: data,
          attrs: {
            ...data,
            modalAppendToBody: false,
          },
          on: {
            ...restListener,
            'update:visible': function (v: boolean) {
              data.visible = v
            },
            'closed': closedHandler,
          },
        })
      },
    })

    const el = document.createElement('div')
    root.appendChild(el)
    app!.$mount(el)
    data.visible = true
    return {
      close,
      kill,
      promise: container.__waitee__.promise,
    }
  }, () => {
    uniqueElId !== undefined && delete pendingPromise[uniqueElId]
  })

  uniqueElId !== undefined && (pendingPromise[uniqueElId] = p)
  return p
}
