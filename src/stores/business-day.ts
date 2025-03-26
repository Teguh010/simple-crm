
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import mtUtils from '@/utils/mtUtils';
import selectOptions from '@/utils/selectOptions';

export const useBusinessDayStore = defineStore('business_day', () => {
  const businessDays = ref<any[]>([]);
  const businessDay = ref(null);
  const recentBusinessDay = ref(null);

  const getBusinessDays = computed(() => businessDays.value);
  const getBusinessDay = computed(() => businessDay.value);
  const getRecentBusinessDay = computed(() => recentBusinessDay.value);

  const selectBusinessDay = (id: string | number |null  = null) => {
    businessDay.value = id
      ? businessDays.value.find((v: any) => v.id_business_day === id)
      : null;
  };

  const fetchBusinessDays = async (data: any | null = null) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/business_days', data);
    if (res && res) {
      businessDays.value = res;
    }
  };

  const submitBusinessDay = async (data: object) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/business_days', data);
    if (res) {
      recentBusinessDay.value = res;
    }
  };

  const updateBusinessDay = async (id_business_day: number | string, data: object) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/business_days/${id_business_day}`, data);
    if (res) {
      recentBusinessDay.value = res;
    }
  };

  const destroyBusinessDay = async (id_business_day: number | string) => {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/business_days/${id_business_day}`);
    return res ? true : false;
  };

  return {
    businessDays,
    businessDay,
    recentBusinessDay,
    getBusinessDays,
    getBusinessDay,
    getRecentBusinessDay,
    selectBusinessDay,
    fetchBusinessDays,
    submitBusinessDay,
    updateBusinessDay,
    destroyBusinessDay
  };
});

export default useBusinessDayStore;
