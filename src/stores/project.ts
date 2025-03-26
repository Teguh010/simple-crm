import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { Project } from '@/types/types'

export type SearchFilterType = {
  name_project: string;
  flg_complete_required: boolean; 
}

type State = {
  allProjects: Project[];
  project: Project | null;
  recentProject: Project | null;
}
export const useProjectStore = defineStore('projects', {
  state: (): State => ({
    allProjects: [],
    project: null,
    recentProject: null
  }),
  getters: {
    getAllProjects: (state) => state.allProjects,
    getProject: (state) => state.project,
    getRecentProject: (state) => state.recentProject
  },
  actions: {
    async fetchProjects(data: SearchFilterType) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/projects/', data)
      if (res && res.results) {
        this.allProjects = res.results
      }
    },
    async fetchProject(idProject: number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `mst/projects/${idProject}`)
      if (res) {
        this.project = res
      }
    },
    async deleteProject(idProject: number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `mst/projects/${idProject}`)
    },
  }
})

export default useProjectStore