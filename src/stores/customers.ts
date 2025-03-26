import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { concatenate } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { groupBy } from 'lodash'
import { CustomerType, PetType } from '@/types/types'
import useCliCommonStore from './cli-common'

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    all_customers: [] as CustomerType[],
    all_customer_preps: [] as CustomerType[],
    searchParam: null,
    searchCount: 0,
    customers: [] as CustomerType[],
    customer: {} as CustomerType,
    pet: {} as PetType,
    address: null,
    recentCustomer: null,
    customerListOptions: [] as CustomerType[],
    customerListWithPetsOptions: [] as CustomerType[],
    petListByCustomer: <any>[],
    rawCustomerList: [] as CustomerType[],
    customerOption: <any>{},
    openUpdateModal: false
  }),
  getters: {
    getAllCustomers: (state) => state.all_customers,
    getAllCustomerPreps: (state) => state.all_customer_preps,
    getCustomerPetSearchParams: (state) => state.searchParam,
    getCustomerPetSearchCount: (state) => state.searchCount,
    getCustomers: (state) => state.customers,
    getCustomer: (state) => state.customer,
    getPet: (state) => state.pet,
    getAddress: (state) => state.address,
    getRecentCustomer: (state) => state.recentCustomer,
    getCustomerListOptions: (state) => state.customerListOptions,
    getCustomerListWithPetsOptions: (state) => state.customerListWithPetsOptions,
    getCustomerOption: (state) => state.customerOption,
    getPetListByCustomer: (state) => state.petListByCustomer,
    getRawCustomerList: (state) => state.rawCustomerList
  },

  // Temporary turn off the presist before stable
  persist: true,
  actions: {
    setCustomerPetSearchParams(value: any, count: number) {
      this.searchParam = value
      this.searchCount = count
    },
    setCustomer(value: any) {
      if (value) {
        // TODO : Should find better way to do this, because sometimes need whole pets data
        value.pets.forEach((petObj: any) => {
          petObj['label'] = petObj.code_pet + petObj.name_pet
          petObj['value'] = petObj.id_pet
        })
        this.customer = value
        return this.customer
      }
    },
    resetCustomerList() {
      this.customers.length = 0
    },
    resetSelectedCustomer() {
      this.customer = {} as CustomerType
    },
    async selectCustomer(
      id: any,
      forceFetch = false,
      params: Record<string, any> = {}
    ) {
      if (this.customer && this.customer.id_customer === id && !forceFetch) {
        return
      }
      this.customer = {} as CustomerType
      if (id) {
        const response = (await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `mst/customers/${id}`,
          params
        )) as CustomerType
        if (response) {
          // TODO : Should find better way to do this, because sometimes need whole pets data
          response.pets.forEach((petObj: any) => {
            ;(petObj['label'] = petObj.code_pet + petObj.name_pet),
              (petObj['value'] = petObj.id_pet),
              (petObj['code_pet'] = petObj.code_pet)
          })
          this.customer = response
          return this.customer
        }
      }
    },
    async SearchCustomerByCode(code: any, forceFetch = false) {
      this.customer = {} as CustomerType
      if (code) {
        const response = (await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `mst/SearchCustomerByCode`,
          { code_customer: code }
        )) as CustomerType
        if (response) {
          // TODO : Should find better way to do this, because sometimes need whole pets data
          response.pets.forEach((petObj: any) => {
            ;(petObj['label'] = petObj.code_pet + petObj.name_pet),
              (petObj['value'] = petObj.id_pet),
              (petObj['code_pet'] = petObj.code_pet)
          })
          this.customer = response
          return this.customer
        }
      }
    },

    // Select specific customer and get pet data (Purposes for search customer / pets)
    async selectCustomerOptions(id: any) {
      this.customerOption = null
      if (id) {
        const response: any = await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `mst/customers/${id}`
        )
        if (response) {
          response.pets.forEach((petObj: any) => {
            petObj['label'] = petObj.code_pet + petObj.name_pet
            petObj['value'] = petObj.id_pet
            petObj['code_pet'] = petObj.code_pet
          })
          this.customerOption = response
          return this.customerOption
        }
      }
    },
    selectPet(id: string | number) {
      this.pet = this.customer?.pets?.find((v: any) => v.id_pet == id)
    },
    selectAddress(id: string | number) {
      this.address = this.customer?.address?.find(
        (v: any) => v.id_address === id
      )
    },

    async fetchCustomerById(id) {
      try {
        const response = (await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `mst/customers/${id}`
        )) as CustomerType
        return response
      } catch (error) {
        console.error('Error fetching customer:', error)
        return {} as CustomerType
      }
    },

    async retrieveCustomer(id, forceFetch = false) {
      if (!id) {
        this.resetSelectedCustomer()
        return
      }

      // Check if the current customer matches the provided id and forceFetch is false
      if (this.customer && this.customer.id_customer === id && !forceFetch) {
        return this.customer
      }
      // Check if the customer exists in the state
      const existingCustomer = this.customers.find(
        (customer) => customer.id_customer === id
      )

      if (existingCustomer && !forceFetch) {
        // Return the existing customer if found and forceFetch is false
        this.customer = existingCustomer
        return existingCustomer
      } else {
        // Fetch the customer from the API if not found or forceFetch is true
        const customer = await this.fetchCustomerById(id)
        if (customer) {
          // Optionally update the state with the fetched customer
          const index = this.customers.findIndex(
            (customer) => customer.id_customer === id
          )
          if (index > -1) {
            this.customers.splice(index, 1, customer) // Update the existing customer
          } else {
            this.customers.push(customer) // Add the new customer
          }
        }
        this.customer = customer
        return customer
      }
    },

    async fetchCustomers(data = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/customers',
        { paginated: true, ...data }
      )
      if (response) {
        this.customers = response
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationCustomers(data = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/customers',
        {}
      )
      if (response) {
        this.setPreparation(response)
      }
    },
    
    async fetchCustomersWithPets(data = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/customers-pets',
        data,
        true,
        {},
        true,
        true
      )
      if (response) {
        const resp = response.data.results.map(v => {
          return {
            value: v.id_customer,
            label: concatenate(
              v.code_customer,
              v.name_customer_display,
              v.name_kana_family,
              v.name_kana_first,
              v.pets
            ),
          }
        })

        this.customerListWithPetsOptions = [...resp]
        
        return response
      }
    },

    async fetchCustomersWithAdressesAndTel(data = {}) {
      // mtUtils.callApi()
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/customers-list',
        data,
        true,
        {},
        true,
        true
      )
      if (response) {
        return response
      }
    },

    async fetchCustomerPets(data: any = null) {
      const response: any = await Promise.all([this.fetchCustomerList(data)])
      if (response) {
        this.processList()
      }
    },
    processList() {
      this.customers = []
      this.rawCustomerList.map((customerObj: any) => {
        let tempCustomer = { ...customerObj }
        const pets = customerObj.pets ?? []
        if (pets && pets.length > 0) {
          pets.forEach((petObj: any) => {
            this.customers.push({
              ...customerObj,
              ...petObj,
              isPet: true,
              code_customer_ex: customerObj.code_customer_ex
            })
          })
        } else {
          this.customers.push(tempCustomer)
        }
      })
    },
    async fetchPetList() {
      let response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/pets'
      )
      if (response && response.length && response.length > 0) {
        response.forEach((petObj: any) => {
          petObj['label'] = petObj.name_pet
          petObj['value'] = petObj.id_pet
        })
        this.petListByCustomer = groupBy(response, 'id_customer')
        return response
      }
    },
    // Don't make change in this function, This function will return original customerList according to DB.
    async fetchCustomerList(data: any = {}) {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/search-customer-list',
        { ...data }
      )
      const modifiedData = response.map((data) => {
        return {
          ...data,
          pets: data.pets
        }
      })

      if (modifiedData) {
        this.rawCustomerList = modifiedData
      }
    },

    submitCustomer(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('mst/customers', data)
          .then((response) => {
            this.recentCustomer = response.data.data
            this.customer = response.data.data
            this.all_customer_preps.push(this.customer)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateCustomer(id: number | string, data: object) {
      delete data.datetime_email_verified
      delete data.datetime_pps_initial_password_update
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/customers/${id}`, data)
          .then((response) => {
            this.recentCustomer = response.data.data

            this.changePrepCustomer(this.recentCustomer)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyCustomer(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/customers/${id}`)
          .then((response) => {
            const index = this.all_customer_preps.findIndex(
              (v) => v.id_customer == id
            )
            this.all_customer_preps.splice(index, 1)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    changePrepCustomer(customer: CustomerType) {
      const customerUpdateIndex = this.all_customer_preps.findIndex(
        (v) => v.id_customer == customer.id_customer
      )
      if (customerUpdateIndex)
        this.all_customer_preps[customerUpdateIndex] = customer
    },
    addPrepPet(id_customer: number, pet: PetType) {
      const customerUpdateIndex = this.all_customer_preps.findIndex(
        (v) => v.id_customer == id_customer
      )
      if (customerUpdateIndex >= 0) {
        if (!this.all_customer_preps[customerUpdateIndex].pets) {
          this.all_customer_preps[customerUpdateIndex].pets = []
        }
        this.all_customer_preps[customerUpdateIndex].pets.push(pet)
      }
    },
    changePrepPet(id_customer: number, pet: PetType) {
      const customerUpdateIndex = this.all_customer_preps.findIndex(
        (v) => v.id_customer == id_customer
      )
      if (customerUpdateIndex) {
        const petUpdateIndex = this.all_customer_preps[
          customerUpdateIndex
        ]?.pets?.findIndex((v) => v.id_pet == pet.id_pet)
        if (petUpdateIndex)
          this.all_customer_preps[customerUpdateIndex].pets[petUpdateIndex] =
            pet
      }
    },
    deletePrepPet(id_customer: number, pet: PetType) {
      const customerUpdateIndex = this.all_customer_preps.findIndex(
        (v) => v.id_customer == id_customer
      )
      if (customerUpdateIndex) {
        const petUpdateIndex = this.all_customer_preps[
          customerUpdateIndex
        ]?.pets?.findIndex((v) => v.id_pet == pet.id_pet)
        if (petUpdateIndex)
          this.all_customer_preps[customerUpdateIndex].pets.splice(
            petUpdateIndex,
            1
          )
      }
    },

    setPreparation(response: CustomerType[]) {
      const cliCommonStore = useCliCommonStore()
      this.all_customer_preps = response
      this.all_customers = response
        .sort((a, b) => {
          return parseInt(a.code_customer) - parseInt(b.code_customer)
        })
        .map((v) => {
          return {
            value: v.id_customer,
            // TODO: Restore name_family from name_customer_display
            name_family: v.name_customer_display,
            name_family_original: v.name_family,
            label: concatenate(
              v.code_customer,
              v.name_family,
              v.name_first,
              v.name_kana_family,
              v.name_kana_first
            ),
            code_customer: v.code_customer,
            name_first: v.name_first,
            name_customer_display: v.name_customer_display,
            name_kana_family: v.name_kana_family,
            name_kana_first: v.name_kana_first,
            type_customer_color: v.type_customer_color,
            flg_supplier: 1,
            line_user_id: v.line_user_id,
            icon:
              cliCommonStore.getCliCommonCustomerColorList.find((cli) => {
                return parseInt(cli.code_func1) === v.type_customer_color
              })?.text1 ?? '',
            address: v.address,
            customer_tel: v.customer_tel
          }
        })
      this.customerListOptions = [...this.all_customers]
    },
    submitQuickCustomer(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/quick_customer_pets', data)
          .then((response) => {
            //this.quickCustomer = response.data;
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    submitQuickCustomerWithQT(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/quick_customer_with_qt', data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async fetchCustomerCardRawHtml(id_customer: string) {
      let response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/customers/${id_customer}/card`
      )
      return response
    },

    async fetchCustomerCertificatePdf(data: object) {
      let response: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        '/mst/customers_certificate',
        data
      )
      return response
    },

    async fetchCustomerFirstLoginPdf(id_customer: string, data: object) {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `/mst/customers/${id_customer}/first-login-pdf`,
        data,
        false,
        { 'Content-Type': 'multipart/form-data' }
      )

      if (response) {
        return response
      }
      return null
      // return new Promise((resolve, reject) => {
      //   api
      //     .post(`/mst/customers/${id_customer}/first-login-pdf`, data,{
      //       headers: { 'Content-Type': 'multipart/form-data' }
      //     })
      //     .then((response) => {
      //       resolve(response)
      //     })
      //     .catch((error) => {
      //       reject(error)
      //     })
      // })
    },

    UnapprovedCustomerlist() {
      return new Promise((resolve, reject) => {
        api
          .get('mst/unapproved_customer_list')
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    UpdateCustomerStatus(id: any, status: any) {
      const payload = {
        id_customer: id,
        status_customer: status
      }
      return new Promise((resolve, reject) => {
        api
          .put('mst/update_customer_status', payload)
          .then((response) => {
            resolve(response)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    deleteCustomer(id: any) {
      return new Promise((resolve, reject) => {
        api
          .delete(`mst/customers/${id}`)
          .then((response) => {
            const index = this.all_customer_preps.findIndex(
              (v) => v.id_customer == id
            )
            this.all_customer_preps.splice(index, 1)
            resolve(response)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    async checkAvailablePaymentMethods(id: any) {
      let response: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `/mst/customer/check-available-payment-methods/${id}`
      )
      return response
    },

    async sendEmail(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`mst/send-email`, data)
          .then((response) => {
            resolve(response)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
  }
})

export default useCustomerStore
