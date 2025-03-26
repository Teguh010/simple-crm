import { RouteRecordRaw } from 'vue-router'
import ClinicalDoc from '@/pages/nonLogin/clinicalDoc.vue'
import ErrorNotFound from '@/pages/ErrorNotFound.vue'

const nlroutes: RouteRecordRaw[] = [
  {
    name: 'non-login-upload',
    path: '/nl/documents',
    component: ClinicalDoc,
    meta: {
      public: true
    }
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]

export default nlroutes
