import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useQuasar } from "quasar";

const request = axios.create({
  baseURL: "/",
  responseType: "json",
  responseEncoding: "utf8",
  // auth: {  // HTTP Basic Auth
  //     username: '',
  //     password: ''
  // },
  withCredentials: false,
  timeout: 60000,
});

request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    config.headers!.Accept = "application/json";

    // const authToken = useQuasar().sessionStorage.getItem('authToken');
    // if (authToken) {
    //     config.headers!.Authorization = 'Bearer ' + authToken;
    // }

    return config;
  },
  function (error: any) {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // ...
          break;

        case 401:
          // ...
          break;

        case 403:
          // ...
          break;

        case 404:
          // ...
          break;

        case 408:
          // ...
          break;

        case 500:
          // ...
          break;

        case 501:
          // ...
          break;

        case 502:
          // ...
          break;

        case 503:
          // ...
          break;

        case 504:
          // ...
          break;

        case 505:
          // ...
          break;

        default:
      }
      return Promise.reject(error);
    }
  }
);
request.defaults.headers.post["Authorization"] =
  "Basic Q2l4VGVzdDoxSDd4ekVmdERmazE5dFc0blM2YVpmS2p4UA==";
export default request;
