import type { VueConstructor } from 'vue'

export function setupApp(Ctor: VueConstructor) {
  // Inject a globally available `$app` object in template
  // TODO: 全局配置
  Object.assign(
    Ctor.prototype,
    {
      context: '',
    },
  )

  // TODO: 全局 provide
  // Provide access to `app` in script setup with `const app = inject('app')`
  // app.provide('app', app.config.globalProperties.$app)

  // Here you can install additional plugins for all contexts: popup, options page and content-script.
  // example: app.use(i18n)
  // example excluding content-script context: if (context !== 'content-script') app.use(i18n)
}
