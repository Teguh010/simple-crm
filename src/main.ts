import { createApp } from 'vue'
import router from '@/router'
import App from './App.vue'
import { Dialog, EventBus, Loading, LocalStorage, Notify, Quasar } from 'quasar'
import iconSet from 'quasar/icon-set/material-icons'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import '@quasar/extras/animate/slideInLeft.css'
import '@quasar/extras/animate/fadeIn.css'
import '@quasar/extras/animate/fadeOut.css'
import '@quasar/quasar-ui-qcalendar/dist/index.css'
import '@/styles/calendar-theme.css'
import 'quasar/src/css/index.sass'
import 'vue-draggable-resizable/style.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { KatakanaDirective } from '@/utils/toKana'
import clickOutside from '@/utils/clickOutside'
import permissionDirective from '@/utils/permission';

// Sorry to put this here, but we have too many warnings that are hindering debugging.
const originalWarn = console.warn
console.warn = (message, ...args) => {
  if (message.includes('[Vue warn]')) return
  originalWarn.call(console, message, ...args)
}

// instantiate EventBus
const bus = new EventBus()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App);

app.provide('bus', bus)
app.use(Quasar, {
    plugins: {
        Dialog,
        Loading,
        LocalStorage,
        Notify,
    },
    iconSet: iconSet,
  config: {
    lang: {
      noHtmlAttrs: true
    }
  }
});
app.use(pinia)
// 创建路由守卫
// createRouterGuards(router, whiteNameList)

app.use(router);

app.directive('katakana', KatakanaDirective(app))
app.directive('click-outside', clickOutside)
app.directive('permission', permissionDirective)

// 路由准备就绪后挂载APP实例
router.isReady().then(() => {
    app.mount('#app');
});