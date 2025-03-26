import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export type fetchBookingByPetResponse = {
  datetime_booking_confirmed: string;
  days_repeat: number | null;
  id_booking: number;
  id_pet: number;
  id_request: number;
  inject_detail: null | {
    id_inject_detail: string;
    date_start: string;
    name_category1: string;
    name_category2: string;
    name_inject_display: string;
  };
  service_detail: null | {
    id_service_detail: string;
    date_service_start: string;
    name_category1: string;
    name_category2: string;
    name_item_service: string;
  };
  prescription_detail: null | {
    id_prescription_detail: string;
    date_start: string;
    name_category1: string;
    name_category2: string;
    name_prescription_display: string;
  }
  type_booking_source: number;
  type_preventions: number | null;   
}

export const useBookingStore = defineStore('bookings', {
  state: () => ({
    allBookingsByPet: [] as fetchBookingByPetResponse[],
    pagination: {
      currentPage: 1,
      pageSize: 10,
      nextPage: '',
      previousPage: '',
      itemCount: 0
    }
  }),
  getters: {
    getAllBookingsByPet: (state) => state.allBookingsByPet,
    getPageCount: (state) => Math.ceil(state.pagination.itemCount / state.pagination.pageSize)
  },
  actions: {
    async fetchBookingsByPet(data: { id_pet: string, id_customer?: string, page: number, pageSize: number}) {
      try {
        const response = await mtUtils.callApi(selectOptions.reqMethod.GET, '/booking_by_pet', data, true)
        
        if (!('count' in response) || !('next' in response) || !('previous' in response)) {
          mtUtils.autoCloseAlert('Pagination data from API response is missing or changed. Please contact support.');
          return;
        }
        this.pagination = {
          ...this.pagination,
          itemCount: response.count,
          nextPage: response.next ?? '',
          previousPage: response.previous ?? ''
        }
        this.allBookingsByPet = response.data
      } catch (error) {
        mtUtils.autoCloseAlert('Failed to fetch pet bookings. Please try again later.')
      }
    }
  }
})

export default useBookingStore