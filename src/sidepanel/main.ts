import Vue from 'vue'
import App from './Sidepanel.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'

setupApp(Vue)
const AppCtor = Vue.extend(App)
new Vue(AppCtor).$mount('#app')
