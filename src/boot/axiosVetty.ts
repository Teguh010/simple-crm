import axios from 'axios'
import useVettyAuthStore from '@/stores/vettyAuth'

const apiVetty = axios.create({
    baseURL: import.meta.env.VITE_VETTY_API_URL,
    responseType: 'json',
    responseEncoding: 'utf8',
    withCredentials:false
})

apiVetty.interceptors.request.use((config) => {
  const vettyStore = useVettyAuthStore()
  config.headers['X-VETTY'] = true
    const accessToken = vettyStore.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    config.headers['Access-Control-Allow-Headers'] = '*';
    return config;
});

apiVetty.interceptors.response.use(
  (response) => response,
  async (error) => {
    const vettyStore = useVettyAuthStore()
    const originalRequest = error.config;
    // Check if the error is due to a 401 or 403 response, we haven't retried yet, and the request is not for token refresh
    if ((error.response.status === 403 || error.response.status === 401) 
      && !originalRequest._retry && originalRequest.url !== 'clinic/token/refresh') {
      originalRequest._retry = true;
      try {
        await vettyStore.refreshSession()
        originalRequest.headers.Authorization = `Bearer ${vettyStore.accessToken}`
        return apiVetty(originalRequest)
      } catch (refreshError) {
        console.error(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
export {apiVetty}