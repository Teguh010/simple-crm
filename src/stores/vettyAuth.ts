// import { apiVetty } from '@/boot/axiosVetty'
import mtUtils from '@/utils/mtUtils'
import { defineStore } from 'pinia'
import { AxiosResponse } from 'axios'
import { api } from '@/boot/axios'

interface VettyAuthStoreState {
  accessToken: string
  is_admin: number
  refreshToken: string
}

interface VettyAuthLoginResponse extends AxiosResponse {
  access: string
  is_admin: number
  refresh: string
}

export const useVettyAuthStore = defineStore('vettyAuth', {
  state: (): VettyAuthStoreState => ({
    accessToken: '',
    is_admin: 0,
    refreshToken: ''
  }),

  persist: true,

  getters: {
    getAccessToken: (state) => state.accessToken,
    getIsAdmin: (state) => state.is_admin,
    getRefreshToken: (state) => state.refreshToken
  },

  actions: {
    //   login(data: { token: string, email: string }) {
    //     return new Promise((resolve, reject) => {
    //       apiVetty
    //         .post(`/clinic/authenticate`, data)
    //         .then((response) => {
    //           const resp = response.data as VettyAuthLoginResponse
    //           this.accessToken = resp.access
    //           this.is_admin = resp.is_admin
    //           this.refreshToken = resp.refresh
    //           resolve(resp)
    //         })
    //         .catch((error) => {
    //           mtUtils.autoCloseAlert('認証失敗：ID/PWを正しく入力してください。') // Login Failed
    //           reject(error)
    //         })
    //     })
    //   },
    //   refreshSession() {
    //     return new Promise((resolve, reject) => {
    //       apiVetty
    //         .post('clinic/token/refresh', {
    //           refresh_token: this.refreshToken
    //         })
    //         .then((response => {
    //           const resp = response.data as VettyAuthLoginResponse
    //           this.accessToken = resp.access
    //           this.is_admin = resp.is_admin
    //           this.refreshToken = resp.refresh
    //           resolve(resp)
    //         }))
    //         .catch((error) => {
    //           reject(error)
    //         })
    //     })
    //   }
  }
})

export default useVettyAuthStore
