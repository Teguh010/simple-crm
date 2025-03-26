import { api } from '@/boot/axios'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
// import action from '@/stores/action'
// import useAuthStore from '@/stores/auth'

export const useDashboardStore = defineStore('dashboardStore', () => {
  const state = reactive({
    dashboard: {},
    business_plan_today: {
      normal: null,
      special: null
    },
    selectedDepartment: ''
  })
  const taskList = ref([]);

  const fetchDashBoard = async (data: any = null) => {
    const response = await api.get(`/mst/dashboard`, { params: data })
    state.dashboard = response.data.data
    // achieve a form of isolation
    taskList.value = JSON.parse(JSON.stringify(response.data.data?.task_list));
    state.business_plan_today.normal = response.data.data?.business_plan_today?.normal_business_day
    return response
  }

  const setSelectedDepartment = (dept: string) => {
    state.selectedDepartment = dept
  }

  return {
    fetchDashBoard,
    setSelectedDepartment,
    state,
    taskList
  }
})


export default useDashboardStore
