import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useMedicineUnitStore = defineStore("medicine_unit", {
  state: () => ({
    allMedicineUnits: <any>[],
    medicineUnits: <any>[],
    medicineUnit: null,
    recentMedicineUnit: null,
    subMedicineUnits: [],
  }),

  getters: {
    getAllMedicineUnits: (state) => state.allMedicineUnits,
    getMedicineUnits: (state) => state.medicineUnits,
    getMedicineUnit: (state) => state.medicineUnit,
    getRecentMedicineUnit: (state) => state.recentMedicineUnit,
    getSubMedicineUnits: (state) => state.subMedicineUnits,
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    resetMedicineUnitList() {
      this.medicineUnits.length = 0
    },
    
    selectMedicineUnit(id: string | number = null) {
      this.medicineUnit = id
        ? this.medicineUnits.find((v: any) => v.id_medicine_unit === id)
        : null;
    },

    async fetchMedicineUnits(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/medicine_units', data)
      if (res && res){
        this.medicineUnits = res;
      }
    },
    async fetchMedicineListWithUnit(data: any | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/SearchMedicineList', data)
      if (res && res) {
        let temp_array: any = []
        res.map((v: any) => {
          temp_array.push({ ...v, isParent: true })
          temp_array.push(...v.item_service_unit_list)
        })


        this.medicineUnits = temp_array
      }
    },
    
    async submitMedicineUnit(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/medicine_units', data )
      if (res){
        this.recentMedicineUnit = res;
      }
    },

    async updateMedicineUnit(id_medicine_unit: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/medicine_units/${id_medicine_unit}`, data);
      if (res){
        this.recentMedicineUnit = res;
      }
    },

    async destroyMedicineUnit(id_medicine_unit: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/medicine_units/${id_medicine_unit}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useMedicineUnitStore;
