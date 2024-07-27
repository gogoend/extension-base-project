/* eslint-disable no-console */
import { onMessage } from 'webext-bridge/content-script'
import type { Component } from 'vue'
import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'

export default async function csuiRootComponentCommonMount<T extends Component>(RootComponent: T) {
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
  document.body.appendChild(container)

  const styleElLoadWaitee = Promise.withResolvers()
  styleEl.addEventListener('load', () => styleElLoadWaitee.resolve(undefined), { once: true })
  await styleElLoadWaitee.promise
  const app = createApp(RootComponent)
  setupApp(app)
  app.mount(root)
}
