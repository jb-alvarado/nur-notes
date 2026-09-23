import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './style.css'

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')

registerSW({ immediate: true })
