import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { orderBy, sortBy } from 'lodash'
import { Category } from '@/types/types'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    all_categories: [] as Category[],
    categories: [] as Category[],
    categoriesLB1: [] as Category[],
    categoriesLB2: [] as Category[],
    category: {} as Category,
    recentCategory: {} as Category,
    all_subcategories: [],
    subCategories: [],
    all_specific_categories: [] as Category[],
  }),
  getters: {
    getAllCategories: (state) => state.all_categories,
    getCategories: (state) => state.categories,
    getCategoriesLB1: (state) => state.categoriesLB1,
    getCategoriesLB2: (state) => state.categoriesLB2,
    getCategory: (state) => state.category,
    getRecentCategory: (state) => state.recentCategory,
    getAllSubCategories: (state) => state.all_subcategories,
    getSubCategories: (state) => orderBy(state.subCategories, 'display_order'),
    getSpecificCategories: (state) => state.all_specific_categories,
  },

  persist: true,
  actions: {
    selectCategory(id: string | number | null = null) {
      this.category = id
        ? this.categories.find((v: any) => v.id_category === id)
        : null
    },

    async fetchCategories(data: any | null = null, stored: string | null = null){
      let res: Category[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/categories',
        data
      )
      if (res) {
        if (stored == 'LB1') this.categoriesLB1 = sortBy(res, 'display_order')
        else if (stored == 'LB2') this.categoriesLB2 = sortBy(res, 'display_order')
        else this.categories = sortBy(res, 'display_order')
      }
    },

    async fetchSpecificCategories(data: any | null = null, stored: string | null = null){
      let res: Category[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/categories',
        data
      )
      if (res) {
        this.all_specific_categories = sortBy(res, 'display_order')
      }
    },

    async fetchSubCategories(id: any, data = null) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `mst/subCategories/${id}`,
        data
      )
      if (res) {
        //@ts-ignore
        this.all_subcategories = res.map((v: any) => ({
          ...v,
          value: v.id_category,
          label: v.name_category
        }))
        this.subCategories = res
      }
    },

    async fetchPreparationCategories() {
      const res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/categories'
      )
      if (res) {
        const modifiedData = res.map((v: any) => ({
          value: v.id_category,
          label: v.name_category,
          parentCategory: v.type_category_layer,
          ...v
        }))
        this.all_categories = modifiedData
      }
    },

    async fetchPreparationSubCategories(id_customer: any) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `mst/subCategories/${id_customer}`
      )
      if (res) {
        //@ts-ignore
        this.all_subcategories = res.map((v: any) => ({
          value: v.id_category,
          label: v.name_category,
          parentCategory: v.type_category_layer,
          ...v
        }))
      }
    },

    async submitCategory(data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/categories',
        data
      )
      if (res) {
        this.recentCategory = res
      }
    },

    async getCategoryById(id_customer: any, data = null) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/categories/${id_customer}`
      )
      if (res) {
        this.categories = res
      }
    },

    async updateCategory(id_category: number | string, data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/mst/categories/${id_category}`,
        data
      )
      if (res) {
        this.recentCategory = res
      }
    },

    async destroyCategory(id_category: number | string) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/mst/categories/${id_category}`
      )
      return res ? true : false
    },

    async getCategoryCDCode() {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/get_available_lab_cat_code');
        return res;
      } catch (err) {
        console.error('Error fetching category:', err);
        throw err;
      }
    }
  }
})

export default useCategoryStore
