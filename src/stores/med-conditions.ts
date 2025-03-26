import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useMedConditionStore = defineStore('med_condition', {
  state: () => ({
    all_med_conditions: <any>[],
    med_conditions: <any>[],
    med_condition: null,
    recentMedCondition: null,
  }),
  getters: {
    getAllMedConditions: (state) => state.all_med_conditions,
    getMedConditions: (state) => state.med_conditions,
    getMedCondition: (state) => state.med_condition,
    getRecentMedCondition: (state) => state.recentMedCondition,
  },

  actions: {
    selectMedCondition(id: string | number | null = null) {
      this.med_condition = id
        ? this.med_conditions.find((v: any) => v.id_med_condition === id)
        : null
    },

    async fetchMedConditions(data: any | null = null) {
      let res = await mtUtils.callApiEx({
        method: selectOptions.reqMethod.GET,
        url: 'medical_condition',
        params: data
      })
      if (res) {
        this.med_conditions = res
      }
    },

    async submitMedCondition(data: object) {
      let res = await mtUtils.callApiEx({
        method: selectOptions.reqMethod.POST,
        url: 'medical_condition',
        params: data
      })
      if (res) {
        this.recentMedCondition = res
      }
    },

    async updateMedCondition(id_med_condition: number | string, data: object) {
      let res = await mtUtils.callApiEx({
        method: selectOptions.reqMethod.PUT,
        url: `/medical_condition/${id_med_condition}`,
        params: data
      })
      if (res) {
        this.recentMedCondition = res
      }
    },

    async destroyMedCondition(id_med_condition: number | string, data: any) {
      const queryParams = new URLSearchParams({ id_employee: String(data) }).toString();
      let res = await mtUtils.callApiEx({
        method: selectOptions.reqMethod.DELETE,
        url: `/medical_condition/${id_med_condition}?${queryParams}`,
      })
      return res ? true : false
    },
  }
})

export default useMedConditionStore
