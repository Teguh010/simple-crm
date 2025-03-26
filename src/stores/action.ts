
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useActionStore = defineStore('action', () => {
  const action = ref('212121')
  const params = ref(null)

  // const getAction = computed(() => action.value)
  // const getParams = computed(() => params.value)

  const setAction = (value: string, newParams = null) => {
    action.value = value
    params.value = newParams
  }

  const resetAction = () => {
    action.value = ''
    params.value = null
  }

  return {
    action,
    params,
    // getAction,
    // getParams,
    setAction,
    resetAction
  }
})

export default useActionStore
