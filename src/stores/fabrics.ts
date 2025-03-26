import mtUtils from '@/utils/mtUtils';
import selectOptions from '@/utils/selectOptions';
import { defineStore } from 'pinia'

export const useFabricStore = defineStore('fabrics', {
  state: () => ({
    fabric: '',
    additionalMemoCarte: [],
    fabricOption: [],
  }),
  getters: {
    getFabric: (state) => state.fabric,
    getAdditionalMemoCarte: (state) => state.additionalMemoCarte,
    getFabricOption: (state) => state.fabricOption,
  },
  actions: {
    setFabric(value: string) {
      this.fabric = value
    },
    setFabricOption(value: object) {
      this.fabricOption.push(value)
    },
    setAdditionalMemoCarte(value: any) {
      this.additionalMemoCarte = value
    },
    async createFabric(data: any) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.POST,'mst/files', data)
      if (res && res){
        this.fabric = res;
      }
    },
    resetFabric() {
      this.fabric = ''
    },
    resetFabricOption() {
      this.fabricOption = []
    },
    resetAdditionalMemoCarte() {
      this.additionalMemoCarte = []
    },
  }
})

export default useFabricStore
