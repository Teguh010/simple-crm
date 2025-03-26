import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { api } from '@/boot/axios'

export const useItemServiceUnitStore = defineStore('item_service_unit', {
  state: () => ({
    item_service_units: [],
    item_service_unit: null,
    recentItemServiceUnit: null,
    itemServiceUnitOptions: <any>[],
    itemServiceWithOptionList: [],
    itemServiceMedicineTop30s: [],
    selectedIdexx: <Array<number>>[],
    selectedLab: <number | null>null,
    item_service_unit_list: [],
    exportServiceUnitItems: '',
    calendarServiceUnits: []
  }),

  getters: {
    getItemServiceUnits: (state) => state.item_service_units,
    getItemServiceUnit: (state) => state.item_service_unit,
    getRecentItemServiceUnit: (state) => state.recentItemServiceUnit,
    getItemServiceUnitOptions: (state) => state.itemServiceUnitOptions,
    getItemServiceWithOptionList: (state) => state.itemServiceWithOptionList,
    getItemServiceMedicineTop30s: (state) => state.itemServiceMedicineTop30s,
    getSelectedIdexx: (state) => state.selectedIdexx,
    getSelectedLab: (state) => state.selectedLab,
    getItemServiceUnitList: (state) => state.item_service_unit_list,
    getExportServiceUnitItems: (state) => state.exportServiceUnitItems,
    getCalendarServiceUnits: (state) => state.calendarServiceUnits
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    setItemServiceUnitList(value: any) {
      this.item_service_unit_list = value
    },
    resetItemServiceUnits() {
      this.item_service_units = []
    },
    setSelectedIdexx(value: Array<number>) {
      this.selectedIdexx = value;
    },
    resetSelectedIdexx() {
      this.selectedIdexx = [];
    },
    setSelectedLab(value: number | null) {
      this.selectedLab = value;
    },
    resetSelectedLab() {
      this.selectedLab = null;
    },
    selectItemServiceUnit(id: string | number | null = null) {
      this.item_service_unit = id
        ? this.item_service_units.find(
            (v: any) => v.id_item_service_unit === id
          )
        : null
    },

    // refactored all fetch api function to follow code rules of calling api via mtUtils.callApi() function
    async fetchItemServiceUnits(data: any = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/item_service_units', data)
        this.item_service_units = response
        this.itemServiceUnitOptions = []
        if (response.length) {
          response.forEach((item: any) => {
            this.itemServiceUnitOptions.push({
              ...item,
              label: item.name_service_item_unit,
              value: item.id_item_service_unit
            })
          })
        }
      } catch (error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async fetchItemServiceUnitCalendar(data: any = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/item_service_units_calendar', data)
        this.calendarServiceUnits = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async fetchItemServiceUnitByItemService(params) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/item_service_units`,
        params
      )
      if (response) return response
      return null
    },

    async fetchItemServiceUnit(id_item_service_unit: string) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/item_service_units/${id_item_service_unit}`)
        this.item_service_unit = response
        return response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async SearchItemServiceWithOptions(params: any = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/SearchItemServiceWithOptions`, params)
        this.itemServiceWithOptionList = response
      } catch (error) {
        mtUtils.alert(error.message, 'Error!')
      }
    },

    async SearchInjectServiceWithOption(params: any = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/SearchInjectServiceWithOption`, params)
        this.itemServiceWithOptionList = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async fetchItemServiceMedicineTop30(data: any = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/item_service_medicine_top30`, data)
        this.itemServiceMedicineTop30s = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async submitItemServiceUnit(data: object) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.POST, `/mst/item_service_units`, data)
        this.recentItemServiceUnit = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async updateItemServiceUnit(id: number | string, data: object) {
      
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/item_service_units/${id}`, data)
        this.recentItemServiceUnit = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async destroyItemServiceUnit(id: number | string) {
      try {
        await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/item_service_units/${id}`)
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async exportItems(params:any | null = null) {
      return new Promise((resolve, reject) => {
        api
          .get('/mst/item_service_units/export', {
            params: params
          })
          .then((response) => {
            resolve(response)
            this.exportServiceUnitItems = response.data
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async importItems(formData:any | null = null) {
      const response = await api.post('/mst/item_service_units/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('ファイルをアップロードしました:', response.data);
    },
  }
})

export default useItemServiceUnitStore
