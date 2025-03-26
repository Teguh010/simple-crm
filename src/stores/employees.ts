import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { EmployeeType, GenericValueLabelType } from '@/types/types'

const doctorColors = [
  '#1e88e5',
  '#1ec500',
  '#ff8c39',
  '#3965ff',
  '#ed39ff',
  '#7039ff',
  '#ff3939',
  '#00cc94',
  '#bd7700',
  '#84bd00'
]

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    allEmployees: [] as GenericValueLabelType[],
    employees: [] as EmployeeType[],
    employee: null,
    recentEmployee: null,
    employeeListOptions: [],
    doctors: [],
    nonDoctors: [],
    cartApprovers: [],
    employeeListWOF: []
  }),

  getters: {
    getAllEmployees: (state) => state.allEmployees,
    getDoctors: (state) => state.doctors,
    getNonDoctors: (state) => state.nonDoctors,
    getCartApprovers: (state) => state.cartApprovers,
    getEmployees: (state) => state.employees,
    getEmployee: (state) => state.employee,
    getRecentEmployee: (state) => state.recentEmployee,
    getEmployeeListOptions: (state) => state.employeeListOptions,
    getEmployeeListWOF: (state) => state.employeeListWOF
  },

  //
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    fetchEmployees(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/employees`, { params: data })
          .then((response) => {
            const filteredData = response.data.data.filter((emp) => {
              return !emp.flg_delete && !emp.flg_resignation
            })

            this.employees = filteredData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    fetchPreparationEmployees() {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/employees`)
          .then((response) => {
            const filteredData = response.data.data.filter((emp) => {
              return !emp.flg_delete && !emp.flg_resignation
            })

            this.employeeListWOF = response.data.data.map((v) => ({
              value: v.id_employee,
              label: v.name_display,
              nameDisplay: v.name_display,
              nameFamily: v.name_family,
              nameFirst: v.name_first
            }))

            const modifiedData = filteredData.map((v) => {
              return {
                value: v.id_employee,
                label: v.name_display,
                nameDisplay: v.name_display,
                nameFamily: v.name_family,
                nameFirst: v.name_first
              }
            })

            this.employees = [...filteredData]

            this.employees = this.employees.map((v, index) => {
              return {
                ...v,
                color: doctorColors[index % doctorColors.length]
              }
            })

            this.allEmployees = [...modifiedData]
            this.doctors = this.employees?.filter(
              (v) => v.type_occupation === 1
            ).map((v, index) => {
              return {
                ...v,
                color: doctorColors[index % doctorColors.length]
              }
            })
            this.nonDoctors = this.employees?.filter(
              (v) => ![1107, 1000].includes(v.type_occupation)
            )
            this.cartApprovers = this.employees?.filter(
              (v) => v.flg_cart_approver === 1
            )
            this.employeeListOptions = [...this.allEmployees]
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    
    fetchAvailableDoctorForQT(filter: { date: string, id_clinic: string, id_clinic_common: string[] }) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/available-doctors`, {
            params: filter
          })
          .then((response) => {
            this.employees = response.data.data.available_employees
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitEmployee(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/employees', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentEmployee = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateEmployee(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/employees/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentEmployee = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyEmployee(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/employees/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default useEmployeeStore
