import {ref, computed} from 'vue'
import { defineStore } from 'pinia'
import { MemoCustomerType } from '@/types/types'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export enum TypeMemoCustomer {
  MEMO = 1,
  TODO = 2
}

export const useMemoCustomerStore = defineStore('memo_customer', () => {
  const memoCustomers = ref<MemoCustomerType[]>([])
  const recentMemoCustomer = ref<MemoCustomerType>()
  const customerMemo = ref<string>('')

  // getters
  const getMemoCustomers = computed(() => memoCustomers.value)
  const getRecentMemoCustomer = computed(() => recentMemoCustomer.value)
  const getCustomerMemo = computed(() => customerMemo.value)

  const resetCustomerMemo = () => {
    customerMemo.value = ''
  }
  const resetMemoCustomers = () => {
    memoCustomers.value = []
  }

  const fetchMemoCustomers = async (data: any) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'memo-customer', data);
    if (res && res) {
      memoCustomers.value = res;
      const TODO:number = 2
      customerMemo.value = memoCustomers.value[0]?.memo_text ?? ''
    }
  }

  const submitMemoCustomer = async (data: object) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'memo-customer', data);
    if (res) {
      recentMemoCustomer.value = res;
    }
  };

  const updateMemoCustomer = async (id_memo_customer: number | string, data: object) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `memo-customer/${id_memo_customer}`, data);
    if (res) {
      recentMemoCustomer.value = res;
    }
  };

  const destroyMemoCustomer = async (id_memo_customer: number | string) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `memo-customer/${id_memo_customer}`);
    return res ? true : false;
  };

  return {
    memoCustomers,
    getMemoCustomers,
    recentMemoCustomer,
    getRecentMemoCustomer,
    customerMemo,
    getCustomerMemo,
    resetMemoCustomers,
    fetchMemoCustomers,
    submitMemoCustomer,
    updateMemoCustomer,
    destroyMemoCustomer,
    resetCustomerMemo
  }
})

export default useMemoCustomerStore