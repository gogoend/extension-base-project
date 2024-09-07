import Vue from 'vue'
import ElementUI from 'element-ui'
import App from './Popup.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'
import 'element-ui/lib/theme-chalk/index.css'

setupApp(Vue)
Vue.use(ElementUI)
const AppCtor = Vue.extend(App)
new Vue(AppCtor).$mount('#app')
