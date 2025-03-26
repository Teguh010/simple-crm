import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import router from '@/router'
import selectOptions from '@/utils/selectOptions'
import useClinicStore from './clinics'
import useVettyAuthStore from './vettyAuth'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const authUser = ref({})
    const isAuthenticated = ref(false)
    const token = ref('')
    const redirectedFrom = ref(null)
    const email = ref(null)
    const vettyStore = useVettyAuthStore()

    // Getters
    const getAuthUser = computed(() => authUser.value)
    const getToken = computed(() => token.value)
    const getRedirectedFrom = computed(() => redirectedFrom.value)

    // Actions
    const setRedirectedFrom = (page) => {
      redirectedFrom.value = page
    }

    const clearRedirectedFrom = () => {
      redirectedFrom.value = null
    }

    const register = (user: object) => {
      return new Promise((resolve, reject) => {
        api
          .post(`/auth/register`, user)
          .then((response) => {
            let data = response.data
            authUser.value = data.user
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const login = (data: object) => {
      const clinicStore = useClinicStore()
      return new Promise((resolve, reject) => {
        api
          .post('/mst/login', data)
          .then(async (response) => {
            authUser.value = response.data.user
            token.value = response.data.token
            localStorage.setItem(
              'id_employee',
              JSON.stringify(response.data.data.id_employee)
            )
            localStorage.setItem(
              'userTypeDepartment',
              JSON.stringify(response.data.user.type_department)
            )
            localStorage.setItem(
              'userTypeOccupation',
              JSON.stringify(response.data.user.type_occupation)
            )
            localStorage.setItem('requestOpenCloseCondition', '31')
            localStorage.setItem('token', token.value)
            localStorage.setItem('tokenExpiry', response.data.data.exp)
            localStorage.setItem('refreshToken', response.data.refresh_token)
            isAuthenticated.value = true
            // try {
            //   await vettyStore.login({
            //     token: token.value,
            //     email: response.data.user.email1
            //   })
            // } catch (error) {
            //   console.error('Vetty login failed', error)
            // }

            clinicStore.fetchPreparatioClinic().then(() => {
              if (
                !clinicStore.getClinic ||
                !Object.keys(clinicStore.getClinic).length
              ) {
                if (
                  clinicStore.getClinics &&
                  clinicStore.getClinics.length > 0
                ) {
                  let firstClinic: any = clinicStore.getClinics[0]
                  clinicStore.selectClinic(firstClinic?.id_clinic)
                  localStorage.setItem('id_clinic', JSON.stringify(firstClinic.id_clinic))
                  localStorage.setItem('clinic', JSON.stringify(firstClinic))
                }
              }
            })

            mtUtils.autoCloseAlert('ログインしました') // Login Succeeded
            resolve(response)
          })
          .catch((error) => {
            mtUtils.autoCloseAlert('認証失敗：ID/PWを正しく入力してください。') // Login Failed
            reject(error)
          })
      })
    }

    const forgotPassword = async (params) => {
      return new Promise((resolve, reject) => {
        api
          .post('mst/forgot-password', params)
          .then((response) => {
            email.value = params.email
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const checkPasswordResetToken = (data: any = null) => {
      return new Promise((resolve, reject) => {
        api
          .get(`mst/forgot-password`, { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const setMyMenu = (data) => {
      authUser.value.my_menu = data
    }

    const resetPassword = async (data: any) => {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/reset-password', data, {})
          .then((response) => {
            // this.recentEmployee = response.data;
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const updatePasswordReminder = async (data: any) => {
      return new Promise((resolve, reject) => {
        api
          .put('/mst/update-password-reminder', data, {})
          .then((response) => {
            // this.recentEmployee = response.data;
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const confirmEmail = (user, confirmation) => {
      return new Promise((resolve, reject) => {
        api
          .post('/auth/confirm', { user, confirmation })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const authenticateUser = (user) => {
      return new Promise((resolve, reject) => {
        api
          .post('/auth/authenticate', { user })
          .then((response) => {
            authUser.value = response.data.user
            token.value = response.data.token
            api.defaults.headers.common['Authorization'] =
              'Bearer ' + token.value
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const clearAuth = () => {
      authUser.value = null
      token.value = ''
      isAuthenticated.value = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      const rememberAuth = localStorage.getItem('rememberAuth')
      localStorage.clear()
      if (rememberAuth) {
        localStorage.setItem('rememberAuth', rememberAuth)
      }
      if (router.getRoutes().some((router) => router.name === 'Login'))
        router.push({ name: 'Login' })
    }
    const checkTokenIsExpired = () => {
      const token_expiry: any = localStorage.getItem('tokenExpiry')
      const currentTimestamp = Math.floor(Date.now() / 1000)
      return token_expiry < currentTimestamp
    }
    const getNewAuthToken = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          const refreshToken: string | null =
            localStorage.getItem('refreshToken')
          if (!refreshToken) {
            throw new Error('No refresh token found')
          }

          const res: any = await mtUtils.callApi(
            selectOptions.reqMethod.GET,
            '/mst/refresh-token',
            {},
            true
          )
          if (res && res.token) {
            localStorage.setItem(
              'id_employee',
              JSON.stringify(res.data.id_employee)
            )
            localStorage.setItem('token', res.token)
            localStorage.setItem('tokenExpiry', res.data.exp)
            resolve(res.token)
          } else {
            throw new Error('Token refresh failed')
          }
        } catch (error) {
          reject(error)
        }
      })
    }
    const logout = () => {
      // this.clearAuth()
      return new Promise((resolve, reject) => {
        api
          .post('mst/logout')
          .then((response) => {
            if (response.status == 204) {
              resolve(response)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
    const getVettyRefreshToken = () => {
      const refreshToken: string | null = localStorage.getItem('token') ?? ''
      return refreshToken
    }

    return {
      authUser,
      isAuthenticated,
      token,
      redirectedFrom,
      email,
      getAuthUser,
      getToken,
      getRedirectedFrom,
      setRedirectedFrom,
      clearRedirectedFrom,
      register,
      login,
      forgotPassword,
      checkPasswordResetToken,
      setMyMenu,
      resetPassword,
      confirmEmail,
      authenticateUser,
      clearAuth,
      checkTokenIsExpired,
      getNewAuthToken,
      logout,
      getVettyRefreshToken,
      updatePasswordReminder
    }
  },
  {
    persist: true
  }
)

export default useAuthStore
