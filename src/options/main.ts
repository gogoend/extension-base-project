import Vue from 'vue'
import App from './Options.vue'
import { setupApp } from '~/logic/common-setup'
import '../styles'

const AppCtor = Vue.extend(App)
setupApp(AppCtor)
new Vue(AppCtor).$mount('#app')
