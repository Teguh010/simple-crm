import {defineStore} from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";
import { TaskType } from "@/types/types";

export const useTask = defineStore("task", {
  state: () => ({
    searchParam: null,
    searchCount: 0,
    tasks: [] as TaskType[],
    task: null,
    recentTask: null,
    taskRequests: [],
  }),

  getters: {
    getTasks: (state) => state.tasks,
    getTask: (state) => state.task,
    getRecentTask: (state) => state.recentTask,
    getTaskRequests: (state) => state.taskRequests,
    getTaskSearchParams: (state) => state.searchParam,
    getTaskSearchCount: (state) => state.searchCount,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setTaskSearchParams(value: any, count: number) {
      this.searchParam = value;
      this.searchCount = count;
    },
    selectTask(id: string | number | null = null) {
      if (this.taskRequests.length > 0) {
        this.task = id && this.taskRequests ? this.taskRequests.find((v: any) => v.id_task === id) : null;
      } else {
        this.task = id && this.tasks ? this.tasks.find((v: any) => v.id_task === id) : null;
      }
    },
    async fetchTask(data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'tasks', data)
      if (res){
        this.tasks = res;
      }
    },
    async fetchTaskByRequest(id_request: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/requests/${id_request}/tasks`)
      if (res){
        this.taskRequests = res;
      }
    },
    async submitTask(data: object, url: string = '/tasks') {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, url, data)
      if (res){
        this.recentTask = res;
      }
    },
    async updateTask(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/tasks/${id}`, data )
      if (res){
        this.recentTask = res;
      }
    },
   async destroyTask(id: number | string) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/tasks/${id}` )
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useTask;
