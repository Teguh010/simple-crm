
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';
import aahGlobal from '@/utils/aahGlobal';
import { GenericValueLabelType } from '@/types/types';
import mtUtils from '@/utils/mtUtils';
import selectOptions from '@/utils/selectOptions';

export const useCageConditionStore = defineStore('cage_condition', () => {
  const cage_conditions = ref([]);
  const all_cage_conditions = ref<GenericValueLabelType[]>([]);
  const cage_condition = ref(null);
  const recentCageCondition = ref(null);

  const getCageConditions = computed(() => cage_conditions.value);
  const getAllCageConditions = computed(() => all_cage_conditions.value);
  const getCageCondition = computed(() => cage_condition.value);
  const getRecentCageCondition = computed(() => recentCageCondition.value);

  function selectCageCondition(id: string | number | null = null) {
    cage_condition.value = id ? cage_conditions.value?.data?.find((v: any) => v.id_cage_condition === id) : null;
  }

  function fetchCageConditions(data: any = null) {
    if (!data) {
      data = {
        start: aahGlobal.start_pages,
        length: aahGlobal.length_pages,
      };
    }
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/cage_conditions`, { params: data })
        .then((response) => {
          const modifiedData = response.data.data.map((v: any) => ({
            value: v.id_cage_condition,
            label: v.memo_cage_condition,
            memo_cage_condition: v.memo_cage_condition,
          }));
          all_cage_conditions.value = modifiedData;
          cage_conditions.value = response.data;
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  const fetchCageConditionById = async (id_cage_condition: number) => {
    let res = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/cage_conditions/${id_cage_condition}`
    )
    if (res) {
      cage_condition.value = res
    }
  }

  function submitCageCondition(data: object) {
    return new Promise((resolve, reject) => {
      api
        .post('/mst/cage_conditions', data)
        .then((response) => {
          recentCageCondition.value = response.data;
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function updateCageCondition(id: number | string, data: object) {
    return new Promise((resolve, reject) => {
      api
        .put(`/mst/cage_conditions/${id}`, data)
        .then((response) => {
          recentCageCondition.value = response.data;
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function destroyCageCondition(id: number | string) {
    return new Promise((resolve, reject) => {
      api
        .delete(`/mst/cage_conditions/${id}`)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  return {
    cage_conditions,
    all_cage_conditions,
    cage_condition,
    recentCageCondition,
    getCageConditions,
    getAllCageConditions,
    getCageCondition,
    getRecentCageCondition,
    selectCageCondition,
    fetchCageConditions,
    fetchCageConditionById,
    submitCageCondition,
    updateCageCondition,
    destroyCageCondition,
  };
});

export default useCageConditionStore;
