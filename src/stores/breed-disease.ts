
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'

export const useBreedDiseaseStore = defineStore('breed_disease', () => {
  const all_breed_diseases = ref([])
  const breed_diseases = ref([])
  const breed_disease = ref(null)
  const recentBreedDisease = ref(null)

  // const getAllBreedDiseases = computed(() => all_breed_diseases.value)
  // const getBreedDiseases = computed(() => breed_diseases.value)
  // const getBreedDisease = computed(() => breed_disease.value)
  // const getRecentBreedDisease = computed(() => recentBreedDisease.value)

  const selectBreedDisease = (id: string | number | null = null) => {
    //@ts-ignore  Todo check it breed_disease!!!
    breed_disease.value = id
      ? breed_diseases.value.find((v:any) => v.id_breed_disease_rel === id)
      : null
  }

  const fetchBreedDiseases = (data: any = null) => {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/breed_disease_rel`, { params: data })
        .then((response) => {
          breed_diseases.value = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchPreparationBreedDiseases = () => {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/breed_disease_rel`)
        .then((response) => {
          //@ts-ignore todo chek v
          const modifiedData = response.data.data.map((v) => ({
            value: v.id_breed_disease_rel,
            label: v.id_breed_disease_rel
          }))

          breed_diseases.value = modifiedData
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const submitBreedDisease = (data: object) => {
    return new Promise((resolve, reject) => {
      api
        .post('/mst/breed_disease_rel', data)
        .then((response) => {
          recentBreedDisease.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateBreedDisease = (id: number | string, data: object) => {
    return new Promise((resolve, reject) => {
      api
        .put(`/mst/breed_disease_rel/${id}`, data)
        .then((response) => {
          recentBreedDisease.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyBreedDisease = (id: number | string) => {
    return new Promise((resolve, reject) => {
      api
        .delete(`/mst/breed_disease_rel/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    all_breed_diseases,
    breed_diseases,
    breed_disease,
    recentBreedDisease,
    // getAllBreedDiseases,
    // getBreedDiseases,
    // getBreedDisease,
    // getRecentBreedDisease,
    selectBreedDisease,
    fetchBreedDiseases,
    fetchPreparationBreedDiseases,
    submitBreedDisease,
    updateBreedDisease,
    destroyBreedDisease
  }
})

export default useBreedDiseaseStore
