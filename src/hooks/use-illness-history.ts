import { computed, type ComputedRef } from 'vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import type { IllnessHistoryType } from '@/types/types'

interface IllnessHistoryHookType {
  getIllnessHistoryName: ComputedRef<(values: number[]) => string>
}

export function useIllnessHistoryName (): IllnessHistoryHookType {
  const illnessHistoryStore = useIllnessHistoryStore()

  const getIllnessHistoryName = computed(() => (values: number[]) => {
    const illnessHistories =
      illnessHistoryStore.getIllnessHistorys as IllnessHistoryType[]
    const resultArray: string[] = []

    for (const v of values) {
      for (const illness of illnessHistories) {
        if (illness.id_pet_illness_history === v) {
          if (illness.name_disease !== '') resultArray.push(illness.name_disease)
          if (illness.name_disease_free !== '') resultArray.push(illness.name_disease_free)
        }
      }
    }

    return resultArray.join(', ')
  })

  return {
    getIllnessHistoryName
  }
}
