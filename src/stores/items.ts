import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { api } from '@/boot/axios'

interface ItemService {
  auto_gen_kw: string
  auto_gen_kw1: string
  code_category2: string | null
  code_item_service: string
  code_item_supplier: string
  date_discontinued: string | null
  date_stop_purchase: string | null
  datetime_insert: string
  datetime_update: string
  display_order: number | null
  flg_anesthesia: boolean
  flg_calendar: boolean
  flg_delete: boolean
  flg_discontinued: boolean
  flg_discount: boolean
  flg_not_available: boolean
  flg_options_available: boolean
  flg_pet_custody_control: boolean
  flg_prevention: boolean
  flg_service: boolean
  flg_stop_purchase: boolean
  flg_surgery: boolean
  flg_temp_cash: boolean
  flg_unsellable: boolean
  id_category1: number
  id_category2: number
  id_clinic: number
  id_cm_type_service: number
  id_customer_supplier: number | null
  id_employee_insert: number | null
  id_employee_update: number
  id_item_service: number
  id_manufacturer: number | null
  image_path1: string | null
  memo_alert: string
  memo_item_description: string
  memo_rule: string
  memo_unit: string
  name_category1: string
  name_category2: string
  name_item_service: string
  name_item_service2: string
  name_kana_item_service: string
  name_short: string
  option_list: ItemService[]
  rate_discount_max: number | null
  search_key1: string | null
  search_key2: string
  search_key3: string
  type_animal: number
  type_insurer: number
  type_item: number | null
  type_prevention: number
  type_service: number
  type_tax: number
  val_top30: number | null
}

interface ItemStoreState {
  all_items: []
  items: []
  item: null
  recentItem: null
  serviceItem: []
  all_service_items: []
  exportServiceItems: null
  calendarServiceItems: ItemService[]
}

export const useItemStore = defineStore('item', {
  state: (): ItemStoreState => ({
    all_items: [],
    items: [],
    item: null,
    recentItem: null,
    serviceItem: [],
    all_service_items: [],
    calendarServiceItems: [],
    exportServiceItems: null
  }),

  getters: {
    getAllItems: (state) => state.all_items,
    getItems: (state) => state.items,
    getItem: (state) => state.item,
    getRecentItem: (state) => state.recentItem,
    getServiceItem: (state) => state.serviceItem,
    getAllServiceItems: (state) => state.all_service_items,
    getExportServiceItems: (state) => state.exportServiceItems,
    getCalendarServiceItems: (state) => state.calendarServiceItems
  },

  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {

    setItemServiceList(value: any) {
      this.all_service_items = value
    },
    
    
    selectItem (id: string | number | null) {
      this.item = id ? this.all_items.find((v: any) => v.id_item_service === id) : null
    },

    // TODO need to use MtUtils.CallAPI method instead of Promise (Bai-Rinkesh)
    async fetchItems(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/item_services', data)
      if (res && res){
        this.items = res;
        const modifiedData = res.map(v => {
          return {
            ...v,
            value: v.id_item_service,
            label: v.name_item_service
          }
        })
        this.all_items = modifiedData
      }
      return res
    },

    async fetchFilterItems(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/SearchItemServiceList', data)
      if (res && res){
        this.items = res;
        const modifiedData = res.map(v => {
          return {
            ...v,
            value: v.id_item_service,
            label: v.name_item_service
          }
        })
        this.all_items = modifiedData
      }
      return res
    },
    
    async exportItems(params:any | null = null) {
      return new Promise((resolve, reject) => {
        api
          .get('/mst/item_services/export', {
            params: params
          })
          .then((response) => {
            resolve(response)
            this.exportServiceItems = response.data
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async importItems(formData:any | null = null) {
      const response = await api.post('/mst/item_services/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('ファイルをアップロードしました:', response.data);
    },
    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    async fetchPreparationItems() {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/item_services')
      if (res && res){
        const modifiedData = res.map(v => {
          return {
            ...v,
            value: v.id_item_service,
            label: v.name_item_service
          }
        })
        this.all_items = modifiedData
      }
    },

    async fetchItemServiceForCalendar() {
      const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/item_services', {
        no_pagination: true
      }) as ItemService[]

      if (response.length !== 0) {
        this.$state.calendarServiceItems = response.filter(item => item.flg_calendar)
      }
    },

    async fetchPreparationItemService() {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/item_services')
      if (res && res){
        const modifiedData = res.map(v => {
          return {
            ...v,
            value: v.id_item_service,
            label: v.name_item_service
          }
        })
        this.all_service_items = modifiedData
      }
    },
    async fetchServiceItem(id: any = null, data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/item_services/${id}`,  { params: data })
      if (res && res){
        this.serviceItem = res;        
      }
    },
    async submitItem(data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, '/mst/item_services', data,
        false, {'Content-Type': 'multipart/form-data'})
      if (res && res) {    
        this.recentItem = res;
      }
      return res
    },
    async updateItem(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/item_services/${id}`, data,
        false, {'Content-Type': 'multipart/form-data'})
      if (res && res){
        this.recentItem = res;
      }
    },
    async destroyItem(id: number | string) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/mst/item_services/${id}` )
      if (res && res){
        return true;
      }
      return false;
    },
  }
})

export default useItemStore
