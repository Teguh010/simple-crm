
import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'
import { BreedType } from '@/types/types'
import { ref, computed } from 'vue'

export const useBreedStore = defineStore(
  'breed',
  () => {
    const allBreeds = ref<BreedType[]>([])
    const breeds = ref<BreedType[]>([])
    const breed = ref<BreedType | null>(null)
    const recentBreed = ref<BreedType | null>(null)

    // const getAllBreeds = computed(() => allBreeds.value)
    // const getBreeds = computed(() => breeds.value)
    // const getBreed = computed(() => breed.value)
    // const getRecentBreed = computed(() => recentBreed.value)

    const selectBreed = (id: string | number | null = null) => {
      breed.value = id ? breeds.value.find((v: any) => v.id_breed === id) : null
    }

    const fetchBreeds = (data: any = null) => {
      if (!data) {
        data = {
          start: aahGlobal.start_pages,
          length: aahGlobal.length_pages
        }
      }
      return new Promise((resolve, reject) => {
        api
          .get('/mst/breeds', { params: data })
          .then((response) => {
            breeds.value = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    const fetchPreparationBreeds = () => {
      return new Promise((resolve, reject) => {
        api
          .get('/mst/breeds')
          .then((response) => {
            const modifiedData = response.data.data.map((v: BreedType) => ({
              ...v,
              value: v.id_breed,
              label: v.name_abbr
            }))
            allBreeds.value = modifiedData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const submitBreed = (data: object) => {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/breeds', data)
          .then((response) => {
            recentBreed.value = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const updateBreed = (id: number | string, data: object) => {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/breeds/${id}`, data)
          .then((response) => {
            recentBreed.value = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const destroyBreed = (id: number | string) => {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/breeds/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    return {
      allBreeds,
      breeds,
      breed,
      recentBreed,
      // getAllBreeds,
      // getBreeds,
      // getBreed,
      // getRecentBreed,
      selectBreed,
      fetchBreeds,
      fetchPreparationBreeds,
      submitBreed,
      updateBreed,
      destroyBreed
    }
  },
  {
    persist: true
  }
)

export default useBreedStore

