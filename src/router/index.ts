import useAuthStore from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

import routes from './routes'
import nlroutes from './nlRoutes'
import checkinInroutes from './checkInRoutes'

import {
  isSysAdmin
} from '@/utils/aahUtils'
import { SYS_ADMIN_ID } from '@/utils/constent'
import { useMovableModalStore } from '@/stores/movable-modal'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */
const domain = window.location.host
const url = window.location.href

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: url.includes('/nl/documents') ? nlroutes : url.includes('/CheckIn') ? checkinInroutes : routes
});
// export default route(function (/* { store, ssrContext } */) {
//   const createHistory = process.env.SERVER
//     ? createMemoryHistory
//     : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)
//
//   const Router = createRouter({
//     scrollBehavior: () => ({ left: 0, top: 0 }),
//     routes,
//
//     // Leave this as is and make changes in quasar.conf.js instead!
//     // quasar.conf.js -> build -> vueRouterMode
//     // quasar.conf.js -> build -> publicPath
//     history: createHistory(process.env.VUE_ROUTER_BASE)
//   })
//
//   return Router
// })

// Auth guard
router.beforeEach((to, from, next) => {
  const authRequired = !to.matched.some((record) => record.meta.guest);
  const authStore = useAuthStore();
  // const loggedIn = authStore.isAuthenticated
  const loggedIn = localStorage.getItem("token");
  
  const movableModalStore = useMovableModalStore();
  
  if (!from.name) {
    movableModalStore.closeMovableModal();
  }

  if (to.matched.some((record) => record.meta.public) || domain.startsWith('files.stg-cs') || domain.startsWith('checkin.stg-cs')) {
    next();
    return;
  }
  if (authRequired && !loggedIn) {
    next({
      path: "/auth/login",
    });
    return;
  } else if (!authRequired && loggedIn) {
    next("/");
    return;
  }
  // Guard for SearchCommonList for type_occupation != 1107
  if(!isSysAdmin(SYS_ADMIN_ID) && to.name === 'SearchCommonList') {
    next("/");
    return;
  }
  if (
    !isSysAdmin(SYS_ADMIN_ID) &&
    to.name === 'SearchCategoryList' &&
    (to.query.type === 'lab' || to.query.type === 'disease' || to.query.type === 'other')
  ) {
    next({ name: 'SearchCategoryList', query: { type: 'medicine' } });
    return;
  }
  next();
});

export default router;
