import { defineStore } from 'pinia'
// import { apiVetty } from '@/boot/axiosVetty'

export const useQuestionTemplateStore = defineStore('questionTemplates', {
  state: () => ({
    questionTemplates: []
  }),

  getters: {
    getAllQuestionTemplates: (state) => state.questionTemplates
  },

  actions: {
    // fetchQuestionTemplates() {
    //   return new Promise((resolve, reject) => {
    //     apiVetty
    //       .get('/question/question-templates')
    //       .then((response) => {
    //         this.questionTemplates = response.data.map((v:any) => {
    //           return {
    //             label: v.name,
    //             value: v.id_question,
    //             ...v
    //           }
    //         })
    //         resolve(response)
    //       })
    //       .catch((error) => {
    //         reject(error)
    //       })
    //   })
    // },
  }
})

export default useQuestionTemplateStore
