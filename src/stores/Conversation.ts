import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
// import { apiVetty } from '@/boot/axiosVetty'
import koekaruApi from '@/boot/axiosKoekaru'

export enum ConversationStatus {
  NOT_STARTED = '0',
  STARTED = '1',
  ENDED = '2',
  PAUSED = '3',
  SUMMARY_REQUEST = '4',
  EXPIRED = '99'
}

export enum TaskStatus {
  NOT_STARTED = '0',
  ENQUEUED = '1',
  COMPLETED = '2',
  ERROR = '99'
}

export const useConversationStore = defineStore('conversation', () => {
  // State
  const transcriptChats = ref(
    localStorage.hasOwnProperty('ai_transcript_chats')
      ? //@ts-ignore
        JSON.parse(localStorage.getItem('ai_transcript_chats'))
      : []
  )
  const conversations = ref([])
  const conversationId = ref('')
  const questionId = ref('')
  const questionTemplate = ref()
  const createMemoCarteData = ref()
  const currentMemoCarteData = ref()
  const requestId = ref()
  const typeMedical = ref(false)
  const nextPage = ref(true)
  const summary = ref<any>(
    localStorage.hasOwnProperty('ai_summary')
      ? //@ts-ignore
        JSON.parse(localStorage.getItem('ai_summary'))
      : []
  )
  const koekaruResult = ref<any>(
    localStorage.hasOwnProperty('koekaru_result')
      ? JSON.parse(localStorage.getItem('koekaru_result') as string)
      : ''
  )
  const koekaruSummary = ref<any>(
    localStorage.hasOwnProperty('koekaru_summary')
      ? JSON.parse(localStorage.getItem('koekaru_summary') as string)
      : ''
  )
  const currentConversation = ref(null)
  const flgRecording = ref(
    localStorage.hasOwnProperty('ai_flg_recording')
      ? //@ts-ignore
        JSON.parse(localStorage.getItem('ai_summary_generated'))
      : false
  )
  const currentMic = ref<any>(null)
  const flgSummaryGenerating = ref(false)
  const flgSummaryGenerated = ref(
    localStorage.hasOwnProperty('ai_summary_generated')
      ? //@ts-ignore
        JSON.parse(localStorage.getItem('ai_summary_generated'))
      : false
  )
  const flgSummaryError = ref(false)
  const recentMemoCarte = ref(null)
  const recentMemoCarteList = ref<any[]>([])
  const veterinaries = ref([])
  const autoReflectMemoCarte = ref(false)
  const source = ref('')

  const createMemoCarteModal = ref(false)

  // Getters
  const getTranscriptChats = computed(() => transcriptChats.value)
  const getCurrentConversation = computed(() => currentConversation.value)
  const getConversations = computed(() => conversations.value)
  const getSummary = computed(() => summary.value)
  const getKoekaruResult = computed(() => koekaruResult.value)
  const getFlgRecording = computed(() => flgRecording.value)
  const getCurrentMic = computed(() => currentMic.value)
  const getSummaryGenerating = computed(() => flgSummaryGenerating.value)
  const getSummaryGenerated = computed(() => flgSummaryGenerated.value)
  const getSummaryError = computed(() => flgSummaryError.value)
  const getMemoCarte = computed(() => recentMemoCarte.value)
  const getRecentMemoCarteList = computed(() => recentMemoCarteList.value)
  const getVeterinaries = computed(() => veterinaries.value)
  const getNextPage = computed(() => nextPage.value)
  const getAutoReflectMemoCarte = computed(() => autoReflectMemoCarte.value)
  const getQuestionTemplate = computed(() => questionTemplate.value)
  const getRequestId = computed(() => requestId.value)
  const getSource = computed(() => source.value)
  const getCreateMemoCarteData = computed(() => createMemoCarteData.value)
  const getCurrentMemoCarteData = computed(() => currentMemoCarteData.value)
  const getCreateMemoCarteModal = computed(() => createMemoCarteModal.value)

  // Actions

  const setConversationId = (id: string) => {
    conversationId.value = id
  }
  const setQuestionTemplate = (value: any) => {
    questionTemplate.value = value
  }
  const setQuestionId = (id: string) => {
    questionId.value = id
  }
  // const createConversation = (data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .post('/conversation/create', data)
  //       .then((res) => {
  //         currentConversation.value = res.data.data
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const editConversation = (conversationId: string | number, data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .patch(`/conversation/${conversationId}/edit`, data)
  //       .then((res) => {
  //         currentConversation.value = res.data.data
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const deleteConversation = (conversationId: string | number) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .delete(`/conversation/${conversationId}/delete`)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const fetchConversations = (data: object) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/conversation/conversations`, { params: data })
  //       .then((res) => {
  //         //@ts-ignore
  //         //Todo to check Page type???
  //         conversations.value = data.page
  //           ? [...conversations.value, ...res.data.results]
  //           : res.data.results
  //         nextPage.value = res.data.next ? true : false
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const createSpeech = (data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .post('/speech/create', data, {
  //         //todo to check content-type error
  //         //@ts-ignore
  //         'Content-type': 'multipart/form-data'
  //       })
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const editSpeech = (speechId: string | number, data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .patch(`/speech/${speechId}/edit`, data)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const createVeterinary = (data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .post('/veterinarian/register', data)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const uploadFullAudio = (conversationId: string, data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .put(`/conversation/${conversationId}/audio`, data, {
  //         //todo to check content-type error
  //         //@ts-ignore
  //         'Content-type': 'multipart/form-data'
  //       })
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const updateRecordingTime = (conversationId: string, data: any) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .patch(`/conversation/${conversationId}/edit`, data)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const fetchConverstion = (conversationUuid: number | string) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/conversation/uid/${conversationUuid}`)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const generateSummary = (uuidConversation: number | string, params: {}) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/summary/generate/${uuidConversation}`, {
  //         params: { ...params }
  //       })
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const reGenerateSummary = (idConversation: number | string) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/summary/generate/${idConversation}`)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const fetchTask = (id: number | string) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/task/${id}`)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const deleteSpeech = (speechId: string | number) => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .delete(`/speech/${speechId}/delete`)
  //       .then((res) => {
  //         resolve(res)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }

  // const fetchVeterinaries = () => {
  //   return new Promise((resolve, reject) => {
  //     apiVetty
  //       .get(`/veterinarian/veterinaries`)
  //       .then((res: any) => {
  //         veterinaries.value = res.data
  //         resolve(res.data)
  //       })
  //       .catch((error) => {
  //         reject(error)
  //       })
  //   })
  // }
  // change parameterr summery into newSummery
  const setSummary = (newSummary: any = []) => {
    summary.value = newSummary
  }

  const setKoekaruResult = (newKoekaruResult: any = []) => {
    koekaruResult.value = newKoekaruResult
  }

  const addTranscriptChat = (transcriptChat: any) => {
    transcriptChats.value.push(transcriptChat)
  }

  const setCurrentConversation = (conversation: any) => {
    currentConversation.value = conversation
  }
  //Todo check change parameter
  const setFlgRecording = (newFlgRecording: boolean) => {
    flgRecording.value = newFlgRecording
  }
  //Todo to check  parameter currentMic in newcurrentMic
  const setCurrentMic = (newCurrentMic: string) => {
    currentMic.value = newCurrentMic
  }
  //Todo to check  parameter flgSummaryGenerating in newFlgSummaryGenerating
  const setSummaryGenerating = (newFlgSummaryGenerating: boolean) => {
    flgSummaryGenerating.value = newFlgSummaryGenerating
  }
  // same above
  const setSummaryGenerated = (newFlgSummaryGenerated: boolean) => {
    flgSummaryGenerated.value = newFlgSummaryGenerated
  }
  // same above
  const setSummaryError = (newFlgSummaryError: boolean) => {
    flgSummaryError.value = newFlgSummaryError
  }
  // same above
  const setTranscriptChats = (newTranscriptChats: any = []) => {
    transcriptChats.value = newTranscriptChats
  }
  // here no change parameter.......
  const setMemoCarte = (memoCarte: any) => {
    recentMemoCarte.value = memoCarte
  }
  const setRecentMemoCarteList = (memoCarte: any) => {
    recentMemoCarteList.value.push(memoCarte)
  }
  // same above
  const setConversations = (newConversations: any = []) => {
    conversations.value = newConversations
  }
  // same above
  const setAutoReflectMemoCarte = (newAutoReflectMemoCarte: boolean) => {
    autoReflectMemoCarte.value = newAutoReflectMemoCarte
  }
  const setSource = (newSource: string) => {
    source.value = newSource
  }

  const setCreateMemoCarteData = (newCreateMemoCarteData: any) => {
    createMemoCarteData.value = newCreateMemoCarteData
  }
  const setCurrentMemoCarteData = (newCurrentMemoCarteData: any) => {
    currentMemoCarteData.value = newCurrentMemoCarteData
  }
  const setCreateMemoCarteModal = (newCreateMemoCarteModal: any) => {
    createMemoCarteModal.value = newCreateMemoCarteModal
  }

  return {
    // State
    transcriptChats,
    conversations,
    nextPage,
    summary,
    koekaruSummary,
    currentConversation,
    flgRecording,
    currentMic,
    flgSummaryGenerating,
    flgSummaryGenerated,
    flgSummaryError,
    recentMemoCarte,
    recentMemoCarteList,
    veterinaries,
    autoReflectMemoCarte,
    conversationId,
    questionId,
    requestId,
    typeMedical,
    source,
    createMemoCarteData,
    currentMemoCarteData,
    createMemoCarteModal,

    // Getters
    getTranscriptChats,
    getCurrentConversation,
    getConversations,
    getSummary,
    getKoekaruResult,
    getFlgRecording,
    getCurrentMic,
    getSummaryGenerating,
    getSummaryGenerated,
    getSummaryError,
    getMemoCarte,
    getRecentMemoCarteList,
    getVeterinaries,
    getNextPage,
    getAutoReflectMemoCarte,
    getCreateMemoCarteData,
    getCurrentMemoCarteData,
    getCreateMemoCarteModal,

    // Actions
    // createConversation,
    // editConversation,
    // deleteConversation,
    // fetchConversations,
    // createSpeech,
    // editSpeech,
    // createVeterinary,
    // uploadFullAudio,
    // updateRecordingTime,
    // fetchConverstion,
    // generateSummary,
    // reGenerateSummary,
    // fetchTask,
    // deleteSpeech,
    // fetchVeterinaries,
    setSummary,
    setKoekaruResult,
    addTranscriptChat,
    setCurrentConversation,
    setFlgRecording,
    setCurrentMic,
    setSummaryGenerating,
    setSummaryGenerated,
    setSummaryError,
    setTranscriptChats,
    setMemoCarte,
    setRecentMemoCarteList,
    setConversations,
    setAutoReflectMemoCarte,
    setConversationId,
    setQuestionId,
    questionTemplate,
    setQuestionTemplate,
    getQuestionTemplate,
    getRequestId,
    setSource,
    getSource,
    setCreateMemoCarteData,
    setCurrentMemoCarteData,
    setCreateMemoCarteModal
  }
})

export default useConversationStore
