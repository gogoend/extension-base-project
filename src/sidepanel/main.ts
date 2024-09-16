import Vue from 'vue'
import ElementUI from 'element-ui'
import { PiniaVuePlugin, createPinia } from 'pinia'
import App from './Sidepanel.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'
import 'element-ui/lib/theme-chalk/index.css'

// eslint-disable-next-line import/order
import VueDOMPurifyHTML from 'vue-dompurify-html'

Vue.use(ElementUI)
Vue.use(VueDOMPurifyHTML, {
  FORBID_TAGS: ['style', 'head', 'title', 'body', 'script'],
  FORBID_ATTR: ['style'],
})
Vue.use(PiniaVuePlugin)
const pinia = createPinia()

setupApp(Vue)
new Vue({
  pinia,
  render(h) {
    return h(App)
  },
}).$mount('#app')
