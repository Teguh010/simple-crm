import { useRecording } from '../useRecording'
import { useConversationStore } from '@/stores/Conversation'
import mtUtils from '@/utils/mtUtils'
import SelectServiceTypeRecordingModal from '../SelectServiceTypeRecordingModal.vue'
import UpdateRecordingServiceModal from '../UpdateRecordingServiceModal.vue'
import UpdateRecordingHeaderModal from '../UpdateRecordingHeaderModal.vue'

interface RecordingData {
  id_employee: string
  datetime_memo_carte: string
  id_customer: string
  id_pet: string
  id_request: string
  number_request: string
  petSelected: any
}

interface PopupConfig {
  isMedicalRecord: boolean
  recordingStarted: boolean
  selected: boolean
  source: string
}

export function useRecordingModal(): {
  openRecordingSettingsModal: (
    source: string,
    data: RecordingData,
    createMemoCarteData: any,
    currentData: any
  ) => Promise<boolean>
} {
  const conversationStore = useConversationStore()
  const { pauseRecording, resumeRecording, isPaused } = useRecording()

  const openRecordingSettingsModal = async (
    source: string,
    data: RecordingData,
    createMemoCarteData: any,
    currentData: any
  ): Promise<boolean> => {
    let confirmationUtils = false

    if (
      conversationStore.flgRecording &&
      data.id_request === conversationStore.requestId
    ) {
      if (!isPaused.value) await pauseRecording()
      const confirmation = await mtUtils.confirm(
        'There is an ongoing record, you sure want to create another one?',
        'Recording Confirmation',
        '生成',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function
        },
        true
      )

      if (!confirmation) {
        confirmationUtils = false
        await resumeRecording()
      } else {
        console.log('confirm')

        confirmationUtils = true
      }
    } else {
      confirmationUtils = true
    }

    if (!confirmationUtils) return false

    if (conversationStore.flgRecording && !isPaused.value) {
      await pauseRecording()
    }

    const recordingData: RecordingData = {
      id_employee: data.id_employee,
      datetime_memo_carte: data.datetime_memo_carte,
      id_customer: data.id_customer,
      id_pet: data.id_pet,
      id_request: data.id_request,
      number_request: data.number_request,
      petSelected: data.petSelected
    }

    const popup: PopupConfig = {
      isMedicalRecord: false,
      recordingStarted: false,
      selected: false,
      source: 'create_memo_carte'
    }

    conversationStore.setMemoCarte({
      ...data
    })

    try {
      // await mtUtils.smallPopup(SelectServiceTypeRecordingModal, { popup })

      // if (popup.isMedicalRecord && popup.selected) {
      await mtUtils.smallPopup(UpdateRecordingServiceModal, {
        ...recordingData,
        popup
      })
      if (popup.recordingStarted) {
        conversationStore.typeMedical = true
        conversationStore.setSource('create_memo_carte')
        conversationStore.setCreateMemoCarteData(createMemoCarteData)
        conversationStore.setCurrentMemoCarteData(currentData)
        return true
      }
      // }
      // else if (popup.selected) {
      //   await mtUtils.smallPopup(UpdateRecordingHeaderModal, {
      //     ...recordingData,
      //     popup
      //   })
      //   if (popup.recordingStarted) {
      //     conversationStore.typeMedical = false
      //     return true
      //   }
      // }
    } catch (error) {
      console.error('Recording modal error:', error)
      return false
    }

    return false
  }

  return {
    openRecordingSettingsModal
  }
}
