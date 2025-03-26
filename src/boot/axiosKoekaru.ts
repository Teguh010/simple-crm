import axios from 'axios'

export let secretKey: string | null = null

export const setSecretKey = (key: string) => {
  secretKey = key
}

const koekaruApi = axios.create({
  baseURL: import.meta.env.VITE_KOEKARU_API_URL,
  withCredentials: false
})

koekaruApi.interceptors.request.use((config) => {
  config.headers!['Access-Control-Allow-Headers'] = '*'
  config.headers!['secret-key'] =
    secretKey || import.meta.env.VITE_KOEKARU_SECRET_KEY
  config.headers!['code-clinic'] = import.meta.env.VITE_CLINIC_CODE
  return config
})

export const getInstance = async () => {
  let newSecretKey = await koekaruApi.post('/get-resource', {
    code_clinic: import.meta.env.VITE_CLINIC_CODE
  })
  setSecretKey(newSecretKey.data.data.secret_key)
}

export default koekaruApi
