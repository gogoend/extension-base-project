import Vue from 'vue'
import App from './Options.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'

setupApp(Vue)
const AppCtor = Vue.extend(App)
new Vue(AppCtor).$mount('#app')
