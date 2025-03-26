import { RouteRecordRaw } from 'vue-router'
import ErrorNotFound from '@/pages/ErrorNotFound.vue'

const checkinInroutes: RouteRecordRaw[] = [
  {
    name: 'CheckIn',
    path: '/CheckIn',
    component: () => import('@/pages/queueTicket/CheckIn.vue')
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]

export default checkinInroutes
