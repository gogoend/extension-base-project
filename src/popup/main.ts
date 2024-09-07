import Vue from 'vue'
import App from './Popup.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'

setupApp(Vue)
const AppCtor = Vue.extend(App)
new Vue(AppCtor).$mount('#app')
