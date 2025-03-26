import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import useAuthStore from '@/stores/auth'
import { convertAllDateTimeFields, convertToISO, isDateTimeField } from '@/utils/aahUtils'
import useClinicStore from '@/stores/clinics'
import router from '@/router'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  responseType: 'json',
  responseEncoding: 'utf8',
  withCredentials: true
})


export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})
api.interceptors.response.use(async response => {
  return response
},
  async error => {
    // If there's an error and the status code is 401 (Unauthorized), log "I'm out"
    if (error.response && error.response.status === 401) {

      const authStore = useAuthStore()
      authStore.clearAuth()
    }
    // Always reject the promise in case of an error
    return Promise.reject(error)
  })
let isRefreshing = false
let failedQueue: any = []

const processSelectedClinic = () => {
  const clinicStore = useClinicStore()
  return JSON.stringify(useClinicStore().getAllClinics.filter((clinic) => clinic.flgSelected).map((clinic) => clinic.value))
}

const getDefaultClinic = () => {
  const idClinic = localStorage.getItem('id_clinic')
  if(idClinic) return JSON.parse(idClinic)
  return useClinicStore().getClinics.length > 0 ? useClinicStore().getClinics[0]?.id_clinic : ''
}

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom: any) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.request.use(
  async (config: any) => {
    config.headers!.Accept = 'application/json'
    switch (config.method.toLowerCase()) {
      case 'get':
        config.params = config.params || {}
        if (config.params) {
          for (const key in config.params) {
            if (isDateTimeField(key) && typeof config.params[key] === 'string') {
              config.params[key] = convertToISO(config.params[key])
            }
          }
        }
        if (!config.params?.id_clinic) Object.assign(config.params, { id_clinic: getDefaultClinic() })

        if (config.params?.id_clinic == 'all') delete config.params.id_clinic
        else config.params['clinic_list'] = processSelectedClinic() 
        break
      case 'post':
      case 'put':
        const idClinic = getDefaultClinic()

        if (config.data instanceof FormData) {
          if (!config.data.get('id_clinic'))
          config.data.set('id_clinic', idClinic)

          if (config.data.has('id_employee_update')) {
            config.data.delete('id_employee_update')
          }
        } else if (Array.isArray(config.data)) {

        } else {
          if (config.data && !config.data.id_clinic)
            config.data = {
              ...config.data,
              id_clinic: idClinic
            }
        }


        if (config.data && typeof config.data === 'object') {
          delete config.data.datetime_insert
          delete config.data.datetime_update
          // TODO Removed this config.data
          delete config.data?.id_employee_insert
          delete config.data?.id_employee_update
          delete config.data?.auto_gen_kw1
          delete config.data?.auto_gen_kw
          convertAllDateTimeFields(config.data)
        }

        break
    }
    const excludeLink = [
      'https://integration.vetconnectplus.com/api/v1/ref/breeds',
      '/mst/login',
      'mst/forgot-password',
      '/mst/refresh-token',
      'https://api.line.me/v2/bot/message/push',
      'https://api.line.me/v2/bot/message/broadcast',
      'https://api.line.me/v2/bot/message/multicast',
    ]
    if (
      !excludeLink.includes(config.url) &&
      !config.url.startsWith('nl/clinical_files')
    ) {
      const authStore = useAuthStore()

      if (authStore.checkTokenIsExpired()) {
        if (!isRefreshing) {
          isRefreshing = true
          authStore.getNewAuthToken()
            .then((newToken: any) => {
              isRefreshing = false
              config.headers!.Authorization = `Bearer ${newToken}` // Update the header of the original request
              processQueue(null, newToken)
            })
            .catch(error => {
              authStore.clearAuth()
              if(router.getRoutes().some((router) => router.name === 'Login')) router.replace({ name: 'Login' })
              isRefreshing = false // Set isRefreshing to false in case of error too
              processQueue(error, null)
            })
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          config.headers!.Authorization = `Bearer ${token}` // Ensure the original request config is updated with new token
          return config // Return the updated config to retry the original request
        })
      }
      const authToken = localStorage.getItem('token')
      if (authToken) {
        config.headers!.Authorization = `Bearer ${authToken}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export { api, apiVetty }
