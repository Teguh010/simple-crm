import { defineStore } from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";
import { TextTemplateType } from "@/types/types";

export const useTextTemplateStore = defineStore("text_template", {
  state: () => ({
    templates: [] as TextTemplateType[],
    template: null,
    recentTemplate: null,
    templateContent: '',
  }),

  getters: {
    getTemplates: (state) => state.templates,
    getTemplate: (state) => state.template,
    getRecentTemplate: (state) => state.recentTemplate,
    getTemplateContent: (state) => state.templateContent,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectTemplate(id: string | number | null = null) {
      this.template = id && this.templates ? this.templates.find((v: any) => v.id_text_template === id) : null;
    },
    setTemplateContent(value: string = '') {
      this.templateContent = value
    },
    resetTemplateContent() {
      this.templateContent = ''
    },
    async fetchTemplates(data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/text-template', data)
      if (res){
        this.templates = res;
      }
    },
    async submitTemplate(data: object) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/text-template', data)
      if (res){
        this.recentTemplate = res;
      }
    },
    async updateTemplate(id: number | string, data: object) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`mst/text-template/${id}`, data )
      if (res){
        this.recentTemplate = res;
      }
    },
   async destroyTemplate(id: number | string) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`mst/text-template/${id}` )
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useTextTemplateStore;
