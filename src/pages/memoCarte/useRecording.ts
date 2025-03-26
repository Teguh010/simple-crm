import { computed, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import DeleteRecording from '@/pages/memoCarte/confirmation/DeleteRecording.vue'
import { debounce } from 'lodash'
import useConversationStore, { TaskStatus } from '@/stores/Conversation'
import useMemoCarteStore from '@/stores/memo-cartes'
import aahMessages from '@/utils/aahMessages'
import { event_bus } from '@/utils/eventBus'
import { clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async'
import koekaruApi from '@/boot/axiosKoekaru'
import router from '@/router'
import { formatDateWithTime, getDateTimeNow } from '@/utils/aahUtils'
import useCliCommonStore from '@/stores/cli-common'
import RecordingLimitConfirmation from '@/pages/memoCarte/confirmation/RecordingLimitConfirmation.vue'
import usePetBioStore from '@/stores/pet-bios'


let conversationStore: any, memoCarteStore: any

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

let recognition: any
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new Recognition()
  recognition.continuous = true
  recognition.lang = 'ja-JP'
  recognition.interimResults = true
} else {
  recognition = null
  console.warn('SpeechRecognition is not supported in this browser.')
}
const isRecording = ref(false)
const isPaused = ref(false)
const seconds = ref(0)
const fullAudioSource = ref('')
const flgMemoCarteSubmitted = ref(false)
const flgVerified = ref('0')
const flg_auto_memocarte_ai = ref(false)
let timer: any = null,
  stream: MediaStream
const sampleRate = 16000

// arrays to store audio chunks and recorders
let audioChunks: any = [],
  sessionAudioChunks: any = []
let mediaRecorder: any, sessionMediaRecorder: MediaRecorder

const tempTranscript = ref('')
const fullTranscript = ref('')
const tempFullTranscript = ref('')
const currentTranscript = ref('')
const showNotification = ref(false)
const selectedServiceType = ref(2)

type ChangeDataType = {
  old_word: string
  new_word: string
}

interface FormattedDataType {
  start_time: string
  end_time: string
  corrected_sentence: string
  old_sentence: string
  corrected_words: ChangeDataType[]
}

const feedbackData = ref<FormattedDataType[]>([])
const recordingLimit = ref(25 * 60) 
// const recordingLimit = ref(20) 


interface TranscriptData {
  text: string
  start_time: string
  end_time: string
}

const transcriptWithTimestamp = ref<TranscriptData[]>([])

const setTranscriptData = (transcriptResponse: any) => {
  if (transcriptResponse?.transcript) {
    transcriptWithTimestamp.value = transcriptResponse.transcript
  }
}

const updateFeedbackData = async (
  conversationId: string,
  oldSentence: string,
  correctedSentence: string,
  oldWord: string,
  newWord: string
) => {
  try {
    const feedbackItem: FormattedDataType = {
      start_time: '00:00',
      end_time: '00:00',
      corrected_sentence: correctedSentence,
      old_sentence: oldSentence,
      corrected_words: [
        {
          old_word: oldWord,
          new_word: newWord
        }
      ]
    }

    const payload = {
      feedback: [feedbackItem],
      id_conversation: conversationId
    }

    const response = await koekaruApi.post(`/submit-feedback`, payload)
    feedbackData.value.push(feedbackItem)
    return response.data
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    throw error
  }
}

const recordingTime = computed(() => {
  const date = new Date(seconds.value * 1000)
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `${m}:${s}`
})

const recordingButtonIcon = computed(() => {
  if (isPaused.value) {
    return 'play_arrow'
  }
  return 'pause'
})

const toggleTranscribing = async () => {
  if (!isRecording.value) {
    isPaused.value = false
    startRecording()
  } else if (isPaused.value) {
    if (seconds.value >= recordingLimit.value) {
      await mtUtils.alert('録音の制限に達しました。現在、1録音につき20分までの利用可能です。') 
      return
    }
    resumeRecording()
  } else {
    pauseRecording()
  }
}


const checkRecordingLimit = () => {
  if (seconds.value >= recordingLimit.value) {
    if (!isPaused.value) {
      pauseRecording()
    }
    event_bus.emit('recording-limit-reached')
    return true
  }
  return false
}

let voiceCommandStartTime: number | null = null
const VOICE_COMMAND_BUFFER_BEFORE = 1500
const VOICE_COMMAND_BUFFER_AFTER = 1000

const isVoiceCommand = ref(false)
let audioFeedback: HTMLAudioElement | null = null

if (typeof window !== 'undefined') {
  audioFeedback = new Audio()
  
  // Get base URL and normalize it
  const baseUrl = window.location.origin.replace(/\/$/, '')
  console.log('🔍 Base URL:', baseUrl)
  
  // Define possible audio file locations
  const audioFormats = [
    // Production paths
    `${baseUrl}/assets/sounds/japan-feedback-voice.mp3`,
    `${baseUrl}/sounds/japan-feedback-voice.mp3`,
    // Development paths
    '/assets/sounds/japan-feedback-voice.mp3',
    '/sounds/japan-feedback-voice.mp3',
    'sounds/japan-feedback-voice.mp3',
    // Fallback paths
    '/assets/sounds/japan-feedback-voice.mp3',
    'assets/sounds/japan-feedback-voice.mp3'
  ]
  
  console.log('📝 Trying audio formats:', audioFormats)

  let isAudioLoaded = false
  let retryCount = 0
  const MAX_RETRIES = 3
  const triedSources: string[] = []

  const handleAudioError = (err: any) => {
    console.error('Audio loading error for source:', audioFeedback?.src)
    console.error('Error details:', err)
    
    if (audioFormats.length > 0 && audioFeedback) {
      const nextSource = audioFormats.shift()!
      triedSources.push(nextSource)
      console.log('🔄 Retrying with next source:', nextSource)
      
      // Ensure the source is properly formatted
      const formattedSource = nextSource.startsWith('http') ? 
        nextSource : 
        nextSource.startsWith('/') ? 
          `${baseUrl}${nextSource}` : 
          `${baseUrl}/${nextSource}`
      
      audioFeedback.src = formattedSource
      audioFeedback.load()
      retryCount++
      
      if (retryCount >= MAX_RETRIES) {
        console.warn('⚠️ Max retries reached, attempts made with sources:', {
          baseUrl,
          triedSources,
          finalAttempt: formattedSource
        })
        // Try one last time with absolute path
        audioFeedback.src = `${baseUrl}/assets/sounds/japan-feedback-voice.mp3`
        audioFeedback.load()
      }
    } else {
      console.error('❌ No more audio formats to try. All attempts failed')
      console.error('Failed sources:', triedSources)
    }
  }

  const handleAudioSuccess = () => {
    if (!audioFeedback) return
    console.log('✅ Audio loaded successfully from:', audioFeedback.src)
    isAudioLoaded = true
    audioFeedback.removeEventListener('error', handleAudioError)
    audioFeedback.removeEventListener('loadeddata', handleAudioSuccess)
  }

  const handleAudioPlayError = (err: any) => {
    console.error('Audio play error:', err)
    // Try to play again with a slight delay
    setTimeout(() => {
      if (audioFeedback && isAudioLoaded) {
        audioFeedback.play().catch(console.error)
      }
    }, 100)
  }

  audioFeedback.addEventListener('error', handleAudioError)
  audioFeedback.addEventListener('loadeddata', handleAudioSuccess)
  audioFeedback.addEventListener('play', () => {
    console.log('🎵 Audio started playing')
  })
  audioFeedback.addEventListener('playing', () => {
    console.log('🎵 Audio is playing')
  })
  
  // Set initial source with absolute path
  audioFeedback.src = `${baseUrl}/assets/sounds/japan-feedback-voice.mp3`
  audioFeedback.preload = 'auto'
  
  // Force load for Windows compatibility
  audioFeedback.load()

  // Override the play method to add error handling
  const originalPlay = audioFeedback.play
  audioFeedback.play = function() {
    if (!isAudioLoaded) {
      console.warn('Audio not loaded yet, waiting...')
      return new Promise((resolve, reject) => {
        const checkLoaded = setInterval(() => {
          if (isAudioLoaded) {
            clearInterval(checkLoaded)
            originalPlay.call(this)
              .then(resolve)
              .catch(handleAudioPlayError)
          }
        }, 100)
      })
    }
    return originalPlay.call(this)
      .catch(handleAudioPlayError)
  }
}

const startRecording = async () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    seconds.value++
    checkRecordingLimit()
  }, 1000)

  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: conversationStore.getCurrentMic,
      sampleRate: sampleRate,
      sampleSize: 16,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: false
  })

  recognition.start()

  isRecording.value = true

  if (recognition) {
    startFullSessionRecording(stream)

    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.start()
    mediaRecorder.ondataavailable = (event: any) => {
      audioChunks.push(event.data)
    }

    recognition.onspeechstart = () => {
      if (isPaused.value) return
      // debouncedSave.cancel()
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = '',
        intermTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase()
        
        const numberPattern = /(3|三|さん|san|three|３).*(2|二|に|ni|two|２).*(1|一|いち|ichi|one|１).*(?:終了|しゅうりょう)/i
                
        if (numberPattern.test(transcript)) {
          isVoiceCommand.value = true
          voiceCommandStartTime = Date.now()
          
          try {
            if (audioFeedback) {
              audioFeedback.play().catch(console.error)
            }
            
            mtUtils.autoCloseAlert('要約リクエストを送信しました！')
            event_bus.emit('voice-command-stop')
            return
          } catch (error) {
            console.error('Error in voice command handling:', error)
          }
        }

        if (event.results[i].isFinal) {
          var speech = event.results[i][0].transcript.trim()
          finalTranscript += speech
        } else {
          intermTranscript += event.results[i][0].transcript
        }
      }
      tempTranscript.value = intermTranscript
      if (intermTranscript !== '') fullTranscript.value = intermTranscript

      if (finalTranscript) {
        tempTranscript.value = ''
        if (!conversationStore.typeMedical) {
          conversationStore.addTranscriptChat({
            speech: finalTranscript,
            speech_audio_url: ''
          })
        }
        tempFullTranscript.value += tempFullTranscript.value
          ? `。${fullTranscript.value}`
          : fullTranscript.value

        event_bus.emit(
          'speech_created',
          conversationStore.getTranscriptChats.length - 1
        )
      }
    }

    recognition.onend = () => {
      if (isRecording.value && !isPaused.value) {
        recognition.start()
      } else {
        setTimeout(() => recognition.stop(), 300)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error) // Debug log
      // Additional error handling logic can be added here
    }
  }
}

const resumeRecording = () => {
  recognition.start()
  sessionMediaRecorder?.start()
  isPaused.value = false
  timer = setInterval(() => {
    seconds.value++
    checkRecordingLimit()
  }, 1000)
}

const pauseRecording = async () => {
  recognition.stop()
  sessionMediaRecorder?.stop()
  isPaused.value = true
  const formData = await stopRecorderAndRecordingKoekaru()
  formData.append('id_conversation', conversationStore.conversationId)
  formData.append('id_vetty_request', conversationStore.requestId)
  if (!currentTranscript.value) {
    currentTranscript.value = tempFullTranscript.value
  } else {
    currentTranscript.value = tempFullTranscript.value.replace(
      currentTranscript.value,
      ''
    )
  }

  formData.append('realtime_transcription', currentTranscript.value)

  clearInterval(timer)
  await uploadAudioKoekaru(formData)
}

let interval: SetIntervalAsyncTimer<any[]>

let stopPromise: Promise<FormData>

const uploadAudio = async (formData: FormData) => {
  await conversationStore.uploadFullAudio(
    conversationStore.getCurrentConversation.id_conversation,
    formData
  )
  sessionAudioChunks.length = 0
}

const uploadAudioKoekaru = async (formData: FormData) => {
  await koekaruApi.post(`/uploadfile`, formData)
  sessionAudioChunks.length = 0
}

const stopRecording = async (
  questionTemplateId: any = null,
  order_type: number = 2,
  conversation_id: string,
  question_id: string
) => {
  recognition.stop()
  if (mediaRecorder?.state != 'inactive') mediaRecorder?.stop()
  if (sessionMediaRecorder?.state != 'inactive') sessionMediaRecorder?.stop()

  isRecording.value = false
  stream?.getTracks().forEach((track) => track.stop())
  // conversationStore.setSummaryGenerating(true)

  if (!isPaused.value) {
    const formData = await stopRecorderAndRecordingKoekaru()
    formData.append('id_conversation', conversation_id)
    formData.append('id_vetty_request', conversationStore.requestId)
    if (!currentTranscript.value) {
      currentTranscript.value = tempFullTranscript.value
    } else {
      currentTranscript.value = tempFullTranscript.value.replace(
        currentTranscript.value,
        ''
      )
    }
    formData.append('realtime_transcription', currentTranscript.value)
    await uploadAudioKoekaru(formData)
  }

  await generateSummary(
    conversation_id,
    question_id.toString(),
    order_type,
    conversationStore.requestId,
    conversationStore.typeMedical
  )

  // Filter audio chunks if voice command was used
  if (voiceCommandStartTime) {
    audioChunks = audioChunks.filter(chunk => {
      const timeDiff = chunk.timestamp - voiceCommandStartTime!
      return timeDiff < -VOICE_COMMAND_BUFFER_BEFORE || timeDiff > VOICE_COMMAND_BUFFER_AFTER
    })
  }

  // Reset voice command state
  voiceCommandStartTime = null
  isVoiceCommand.value = false
}

const stopRecordingKoekaru = async (data: {
  orderType: number
  question_id: string
  conversation_id: string
}) => {
  recognition.stop()
  if (mediaRecorder?.state != 'inactive') mediaRecorder?.stop()
  if (sessionMediaRecorder?.state != 'inactive') sessionMediaRecorder?.stop()

  isRecording.value = false
  stream?.getTracks().forEach((track) => track.stop())

  // conversationStore.setSummaryGenerating(true)

  // const conversation_id = data.conversation_id ?? nanoid()

  const formData = await stopRecorderAndRecordingKoekaru()
  formData.append('id_conversation', conversationStore.conversationId)
  formData.append('id_vetty_request', conversationStore.requestId)
  if (!currentTranscript.value) {
    currentTranscript.value = tempFullTranscript.value
  } else {
    currentTranscript.value = tempFullTranscript.value.replace(
      currentTranscript.value,
      ''
    )
  }
  formData.append('realtime_transcription', currentTranscript.value)
  await uploadAudioKoekaru(formData)

  await generateSummaryKoekaru(
    conversationStore.conversationId,
    data.orderType,
    data.question_id
  )
}

const generateSummary = async (
  id_conversation: string,
  question_id: string,
  order_type: number,
  requestId: string,
  isMedical: boolean
) => {
  conversationStore.setFlgRecording(false)
  const payload: {
    id_conversation: string
    question_id: string
    order_type: number
  } = {
    id_conversation: `${id_conversation}`,
    question_id: question_id,
    order_type: order_type
  }

  try {
    await koekaruApi.post('/combine-audio', payload)
  } catch (error) {
    updateNotification(3, id_conversation)
    // conversationStore.setSummaryGenerating(false)
    useConversationStore().setTranscriptChats([])
    useConversationStore().setSummary([])
    seconds.value = 0
    mtUtils.autoCloseAlert(aahMessages.failed)
    return
  }

  let status: string = ''

  while (status !== 'COMPLETED' && status !== 'ERROR') {
    const res = await koekaruApi.get(
      `/task-status?id_conversation=${id_conversation}`
    )
    status = res.data.status
    // Wait for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  if (status === 'ERROR') {
    updateNotification(3, id_conversation)
    // conversationStore.setSummaryGenerating(false)
    useConversationStore().setTranscriptChats([])
    useConversationStore().setSummary([])
    seconds.value = 0
    mtUtils.autoCloseAlert(aahMessages.failed)
    // closeDraggableModal(500)
    return
  } else {
    updateNotification(1, id_conversation)
  }
  const res = await koekaruApi.get(
    `/output-data?id_conversation=${id_conversation}`
  )

  const summaryResponse = res.data.data
  let summaryContent = ''

  conversationStore.setCurrentConversation(summaryResponse)
  if (summaryResponse.summary?.answers) {
    if (isMedical && flg_auto_memocarte_ai.value) {
      // 【要確認 AI 自動生成】
      summaryContent += `<b>【要確認 AI 自動生成】</b><br/>`
    }
    const sortedAnswers = summaryResponse.summary.answers.sort(
      (a, b) => a.display_order - b.display_order
    )

    sortedAnswers.forEach((answer) => {
      const sectionKey = Object.keys(answer).find(
        (key) => key !== 'display_order'
      )

      if (sectionKey && sectionKey !== 'pet_owner_name') {
        // Add section title
        summaryContent += `<b>## ${sectionKey}</b><br/>`
        const contentArray = answer[sectionKey]
        const content = contentArray.filter(item => typeof item === 'string').join('<br/>')
        summaryContent += content
        summaryContent += '<br/><br/>'
      }
    })
  }

  // if (summaryResponse.transcript) {
  // conversationStore.setTranscriptChats(summaryResponse.transcript)
  // localStorage.setItem(
  //   'ai_transcript_chats',
  //   JSON.stringify(summaryResponse.transcript)
  // )
  // }

  const setSummaryTranscriptData = {
    id_conversation: id_conversation,
    summary: summaryContent,
    transcript: summaryResponse.transcript
  }

  event_bus.emit(
    'set-generated-summary-and-transcript',
    setSummaryTranscriptData
  )
  console.log('submitting memo carte', isMedical, flg_auto_memocarte_ai.value)
  if (isMedical && flg_auto_memocarte_ai.value) {
    submitMemoCarte(requestId, summaryContent)
  } else if (isMedical && order_type === 2) {
    mtUtils.autoCloseAlert(aahMessages.success)
  } else {
    submitMemoCarte(requestId, summaryContent)
  }

  if (!conversationStore.flgRecording) {
    clearInterval(timer)
  }
}

const generateSummaryKoekaru = async (
  id_conversation: string,
  order_type: number = 1,
  question_id: string
) => {
  try {
    const payload: {
      id_conversation: string
      order_type: number
      question_id?: string
    } = {
      id_conversation: `${id_conversation}`,
      order_type
    }

    if (order_type === 2) {
      payload['question_id'] = question_id
    }
    await koekaruApi.post('/combine-audio', payload)

    // After this keep calling the status api, every 3 second until the status is "COMPLETED" or "ERROR"
    let status: string = ''

    while (status !== 'COMPLETED' && status !== 'ERROR') {
      const res = await koekaruApi.get(
        `/task-status?id_conversation=${id_conversation}`
      )
      status = res.data.status
      // Wait for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    const res = await koekaruApi.get(
      `/output-data?id_conversation=${id_conversation}`
    )

    const result = res.data.data
    conversationStore.setKoekaruResult(result)
  } catch (error) {
    console.error(error)
  }
}

const fetchTask = async (summaryResponse: any) => {
  const taskResponse = await conversationStore.fetchTask(
    summaryResponse.data.task_id
  )

  if (
    taskResponse.data &&
    taskResponse.data.type_prep_status === TaskStatus.COMPLETED
  ) {
    // update conversation and set summary
    await fetchConversation(taskResponse)
    // stop interval
    await clearIntervalAsync(interval)
  } else if (
    taskResponse.data &&
    taskResponse.data.type_prep_status == TaskStatus.ERROR
  ) {
    // conversationStore.setSummaryGenerating(false)
    conversationStore.setSummaryError(true) // show draggable modal in error state
    await clearIntervalAsync(interval)
  }
}

const fetchConversation = async (taskResponse: any) => {
  // const conversationResponse = await conversationStore.fetchConverstion(
  //   taskResponse.data.uuid_conversation
  // )

  conversationStore.setCurrentConversation(conversationResponse.data)
  conversationStore.setSummary(conversationResponse.data.summary)
  localStorage.setItem(
    'ai_summary',
    JSON.stringify(conversationResponse.data.summary)
  )
  conversationStore.setTranscriptChats(conversationResponse.data?.speeches)
  localStorage.setItem(
    'ai_transcript_chats',
    JSON.stringify(conversationResponse.data?.speeches)
  )
  // conversationStore.setSummaryGenerating(false)
  conversationStore.setSummaryGenerated(true)
  localStorage.setItem('ai_summary_generated', JSON.stringify(true))
  localStorage.setItem('ai_flg_recording', JSON.stringify(true))
  if (conversationStore.getAutoReflectMemoCarte) {
    submitMemoCarte()
  }
}

const updateRecordingTime = (additionalPayload: object = {}) => {
  let payload = {
    recording_time: recordingTime.value,
    ...additionalPayload
  }
  conversationStore.updateRecordingTime(
    conversationStore.getCurrentConversation.id_conversation,
    payload
  )
}

const debouncedSave = debounce((formData) => {
  try {
    const speaker = 'Vet'
    formData.append(
      'id_conversation',
      conversationStore.getCurrentConversation.id_conversation
    )
    formData.append('speaker', speaker)
    conversationStore.createSpeech(formData).then((response: any) => {
      conversationStore.addTranscriptChat(response.data)
      event_bus.emit(
        'speech_created',
        conversationStore.getTranscriptChats.length - 1
      )
    })
  } catch (e) {
    return console.error(e)
  }
}, 0)

const startFullSessionRecording = (stream: MediaStream) => {
  sessionMediaRecorder = new MediaRecorder(stream)
  sessionMediaRecorder.start()

  sessionMediaRecorder.ondataavailable = (event) => {
    sessionAudioChunks.push(event.data)
  }
}

const stopRecorderAndRecording = () => {
  stopPromise = new Promise((resolve, reject) => {
    sessionMediaRecorder.onstop = async () => {
      if (!conversationStore?.getCurrentConversation?.id_conversation)
        return false // for delete case
      const fullAudioBlob = new Blob(sessionAudioChunks, {
        type: 'audio/mpeg-3'
      })
      fullAudioSource.value = URL.createObjectURL(fullAudioBlob)

      const audioFormData = new FormData()
      audioFormData.append('audio_file', fullAudioBlob)
      sessionAudioChunks.length = 0

      resolve(audioFormData)
    }

    sessionMediaRecorder.onerror = (event) => {
      reject('Error: ' + event)
    }
  })

  return stopPromise
}
const downloadFullAudio = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

const stopRecorderAndRecordingKoekaru = () => {
  stopPromise = new Promise((resolve, reject) => {
    sessionMediaRecorder.onstop = async () => {
      const fullAudioBlob = new Blob(sessionAudioChunks, {
        type: 'audio/mpeg-3'
      })
      fullAudioSource.value = URL.createObjectURL(fullAudioBlob)

      const audioFormData = new FormData()
      audioFormData.append('file', fullAudioBlob)
      sessionAudioChunks.length = 0

      resolve(audioFormData)
    }
    sessionMediaRecorder.onpause = async () => {
      const fullAudioBlob = new Blob(sessionAudioChunks, {
        type: 'audio/mpeg-3'
      })

      fullAudioSource.value = URL.createObjectURL(fullAudioBlob)

      const audioFormData = new FormData()
      audioFormData.append('file', fullAudioBlob)
      sessionAudioChunks.length = 0

      resolve(audioFormData)
    }

    sessionMediaRecorder.onerror = (event) => {
      reject('Error: ' + event)
    }
  })

  return stopPromise
}

const updatedSummary = (summary: any) => {
  const newSummary = [] as {
    ai_summary: string
    question_display_title: string
  }[]

  if (summary && summary.length && summary.length > 0) {
    const sortedAnswers = summary.sort(
      (a, b) => a.display_order - b.display_order
    )

    sortedAnswers.forEach((answer) => {
      const sectionKey = Object.keys(answer).find(
        (key) => key !== 'display_order'
      )

      if (sectionKey && sectionKey !== 'pet_owner_name') {
        newSummary.push({
          ai_summary: answer[sectionKey],
          question_display_title: sectionKey
        })
      }
    })

    return newSummary
  }
  return []
}

const oldUpdatedSummary = (summary: any) => {
  if (summary && summary.length && summary.length > 0) {
    summary = summary.filter(
      (item: any) =>
        item.ai_summary?.trim()?.replace(/\n/g, '')?.toLowerCase() != 'n/a' &&
        item.ai_summary?.trim() != ''
    )
    if (summary && summary.length && summary.length > 0) {
      summary.forEach((item: any, idx: any) => {
        item.ai_summary = item.ai_summary.trim()
        if (item.ai_summary.endsWith('\n\n')) {
          item.ai_summary = item.ai_summary.substring(
            0,
            item.ai_summary.length - 2
          )
        } else if (item.ai_summary.endsWith('\n')) {
          item.ai_summary = item.ai_summary.substring(
            0,
            item.ai_summary.length - 1
          )
        }
        if (item.ai_summary.startsWith('\n')) {
          item.ai_summary = item.ai_summary.substring(
            2,
            item.ai_summary.length - 1
          )
        }
      })
    }
    return summary
  }
  return []
}

const deleteConversation = async () => {
  let popup = {
    isConfirmed: false
  }
  await mtUtils.smallPopup(DeleteRecording, { popup })
  if (popup.isConfirmed) {
    // const formData = {
    //   id_conversation: conversationStore.conversationId
    // }
    const resDelete = await koekaruApi.post('/delete-conversation', {
      id_conversation: conversationStore.conversationId
    })

    resetRecordingData()
    return true
  } else {
    return false
  }
}

const resetRecordingData = () => {
  seconds.value = 0
  isPaused.value = isRecording.value = false
  if (timer) clearInterval(timer)
  recognition?.stop()
  sessionMediaRecorder?.stop()
  conversationStore.setCurrentConversation(null)
  conversationStore.setFlgRecording(false)
  conversationStore.setSummaryGenerated(false)
  conversationStore.setTranscriptChats([])
  conversationStore.setSummary([])
  try {
    stream.getTracks().forEach((track) => track.stop())
  } catch (error) {}
}

const submitMemoCarte = async (requestId: string = '', content: string = '') => {  
  try {
    if (!conversationStore) conversationStore = useConversationStore()
    if (!memoCarteStore) memoCarteStore = useMemoCarteStore()

    let data = useConversationStore().getRecentMemoCarteList.find(
      (item) => item.id_request === requestId
    )

    if (!data) {
      console.error('🔴 No memo carte data found for requestId:', requestId)
      return
    }
    
    data.memo_other = content
    data.type_source = 1
    data.type_input = 2
    data.flg_verified = flgVerified.value

    // Check if we need to refresh
    let refresh = router.currentRoute.value.params.id == requestId ? true : false

    await useMemoCarteStore()
      .submitMemoCarte(data, refresh)
      .then(async (response) => {
        
        ;[
          'ai_summary',
          'ai_transcript_chats',
          'ai_summary_generated',
          'ai_flg_recording',
          'memo_cart_content'
        ].forEach((key) => {
          localStorage.removeItem(key)
        })

        flgMemoCarteSubmitted.value = true

        if (refresh) {
          let payload = { id_pet: data.id_pet, id_customer: data.id_customer }
          await Promise.all([useMemoCarteStore().fetchMemoCarteV1(payload)])
        }

        if (!conversationStore.flgRecording) {
          useConversationStore().setTranscriptChats([])
          useConversationStore().setSummary([])
          seconds.value = 0
        }

        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } catch (error) {
    console.error('🔴 submitMemoCarte error:', error)
    mtUtils.autoCloseAlert(aahMessages.error)
    throw error
  }
}

const closeDraggableModal = (timeout: number = 1000) => {
  //Hide after 10 seconds
  setTimeout(() => {
    // to close draggable recording modal instance
    // event_bus.emit('close-draggable-recording-modal')
    // event_bus.emit('close-notification-modal')
    // Hide draggable recording modal
    conversationStore.setFlgRecording(false)
    conversationStore.setSummaryGenerated(false)
  }, 10 * timeout)
}

event_bus.on('recording-start', () => {
  conversationStore = useConversationStore()
  memoCarteStore = useMemoCarteStore()
})

event_bus.on('close-notification', () => {
  showNotification.value = false
})

const createNotification = async (
  conversationId: string,
  isMedical: boolean,
  statusMessage: number = 0,
  seconds: number = 0,
  source: string = 'update_memo_carte'
) => {
  if (showNotification.value) {
    saveCurrentRecord({
      id_conversation: conversationId,
      is_medical_record: isMedical,
      status_message: statusMessage,
      seconds: seconds
    })
    return
  }
  showNotification.value = true
  mtUtils.draggableNotificationPopup()

  saveCurrentRecord({
    id_conversation: conversationId,
    is_medical_record: isMedical,
    status_message: statusMessage,
    seconds: seconds
  })
}

const updateNotification = (statusMessage: number, id_conversation: string) => {
  event_bus.emit('update-notification-status', {
    statusMessage: statusMessage,
    id_conversation
  })
}

const saveCurrentRecord = (data) => {
  if (!showNotification.value) {
    createNotification(
      data.id_conversation,
      data.is_medical_record,
      data.status_message,
      data.seconds
    )
    return
  }
  let newRecord = {
    idConversation: data.id_conversation,
    isMedicalRecord: data.is_medical_record,
    statusMessage: data.status_message,
    seconds: data.seconds
  }

  event_bus.emit('add-notification-list', newRecord)
}

event_bus.on('auto-submit-memo-carte', async (submitData) => {
  try {
    if (!conversationStore) conversationStore = useConversationStore()
    if (!memoCarteStore) memoCarteStore = useMemoCarteStore()
    const cliCommonStore = useCliCommonStore()

    const sections = parseSummary(submitData.summary)    
    const defaultCliCommon = cliCommonStore.cliCommonOptionList[0]?.id_cli_common || 25001
    const currentDateTime = formatDateWithTime(getDateTimeNow(), 'YYYY-MM-DD HH:mm:ss')
    
    const fixedMedConditionList = []
    if (memoCarteStore.tempFormData?.medConditionData?.[0]) {
      Object.values(memoCarteStore.tempFormData.medConditionData[0]).forEach(condition => {
        if (condition.code_cli_common) {
          fixedMedConditionList.push({
            memo_record: condition.memo_record || null,
            code_func1: condition.code_func1 || null,
            text1: condition.text1 || '',
            flg_func1: condition.flg_func1 || false,
            code_cli_common: condition.code_cli_common || defaultCliCommon.toString(),
            display_order: condition.display_order || 0,
            type_med_condition: condition.type_med_condition || null,
            datetime_record: currentDateTime,
            id_customer: submitData.createMemoCarteData.id_customer,
            id_pet: submitData.createMemoCarteData.id_pet,
            id_employee_record: submitData.currentMemoCarteData?.data?.id_employee || 1
          })
        }
      })
    }

    const payload = {
      id_clinic: submitData.currentMemoCarteData?.data?.id_clinic || 2,
      med_condition_list: fixedMedConditionList,
      memo_carte: {
        id_request: submitData.createMemoCarteData.id_request,
        number_request: submitData.createMemoCarteData.number_request,
        id_customer: submitData.createMemoCarteData.id_customer,
        id_pet: submitData.createMemoCarteData.id_pet,
        id_pet_illness_history: submitData.createMemoCarteData.id_pet_illness_history ? 
          [Number(submitData.createMemoCarteData.id_pet_illness_history)] : 
          submitData.currentMemoCarteData?.id_pet_illness_history || [],
        
        id_employee: submitData.currentMemoCarteData?.data?.id_employee || 1,
        id_clinic: submitData.currentMemoCarteData?.data?.id_clinic || 2,
        id_cli_common: submitData.currentMemoCarteData?.data?.id_cli_common || defaultCliCommon,
        
        datetime_memo_carte: currentDateTime,

        illnessHistoryOptions: null,

        memo_sbj: `${memoCarteStore.tempFormData?.memoCarteData?.memo_sbj || ''}${sections.memo_sbj ? `<p><strong>## 要確認</strong></p><p>${sections.memo_sbj}</p><p>---</p>` : ''}`,
        memo_obj: `${memoCarteStore.tempFormData?.memoCarteData?.memo_obj || ''}${sections.memo_obj ? `<p><strong>## 要確認</strong></p><p>${sections.memo_obj}</p><p>---</p>` : ''}`,
        memo_ass: `${memoCarteStore.tempFormData?.memoCarteData?.memo_ass || ''}${sections.memo_ass ? `<p><strong>## 要確認</strong></p><p>${sections.memo_ass}</p><p>---</p>` : ''}`,
        memo_other: `${memoCarteStore.tempFormData?.memoCarteData?.memo_other || ''}${sections.memo_other ? `<p><strong>## 要確認</strong></p><p>${sections.memo_other}</p><p>---</p>` : ''}`,

        type_input: 2
      }
    }

    if (memoCarteStore.tempFormData?.petBioInfo) {
      const petBioInfo = memoCarteStore.tempFormData.petBioInfo;
      
      const hasValue = Object.entries(petBioInfo).some(([key, value]) => {
        if (['id_clinic', 'id_pet', 'id_customer', 'type_body_weight'].includes(key)) {
          return false;
        }
        return value !== null && value !== '';
      });

      if (hasValue) {
        payload.pet_bio_info = {
          id_pet: submitData.createMemoCarteData.id_pet,
          id_customer: submitData.createMemoCarteData.id_customer,
          val_weight: petBioInfo.type_body_weight === 1 ? 
            (parseFloat(petBioInfo.val_weight) * 1000).toString() : 
            petBioInfo.val_weight,
          type_body_weight: petBioInfo.type_body_weight || 1,
          val_temperature: petBioInfo.val_temperature || null,
          val_respiration_rate: petBioInfo.val_respiration_rate || null,
          val_heartbeat_rate: petBioInfo.val_heartbeat_rate || null,
          val_pressure_systolic: petBioInfo.val_pressure_systolic || null,
          val_pressure_diastolic: petBioInfo.val_pressure_diastolic || null,
          val_pressure_mean_arterial: petBioInfo.val_pressure_mean_arterial || null,
          val_blood_oxygen_level: petBioInfo.val_blood_oxygen_level || null,
          val_blood_carbon_dioxide_level: petBioInfo.val_blood_carbon_dioxide_level || null,
          id_clinic: submitData.currentMemoCarteData?.data?.id_clinic || "2",
          datetime_measure: currentDateTime
        }
      }
    }

    const isUpdate = submitData.currentMemoCarteData?.data?.id_memo_carte;

    let response;
    if (isUpdate) {
      response = await memoCarteStore.updateMemoCarte(
        submitData.currentMemoCarteData.data.id_memo_carte,
        payload.memo_carte
      );
    } else {
      response = await memoCarteStore.submitMemoCarteV1(payload);
    }

    const newMemoCarteId = response.data?.memo_carte?.id_memo_carte;
    if (newMemoCarteId) {
      memoCarteStore.setCurrentMemoCarteData({
        ...memoCarteStore.currentMemoCarteData,
        data: {
          ...memoCarteStore.currentMemoCarteData?.data,
          id_memo_carte: newMemoCarteId
        }
      });
    }

    memoCarteStore.clearTempFormData()

    const { id_pet, id_customer } = memoCarteStore.currentPage;
    
    const promises = [
      memoCarteStore.fetchMemoCarteV1({
        id_pet,
        id_customer,
      })
    ];

    if (payload.pet_bio_info) {
      promises.push(
        usePetBioStore().fetchPetBio({
          id_pet,
          id_customer,
          fetch_weight: true
        })
      );
    }

    await Promise.all(promises);

    if (!conversationStore.flgRecording) {
      conversationStore.setTranscriptChats([])
      conversationStore.setSummary([])
      seconds.value = 0
    }

    mtUtils.autoCloseAlert(aahMessages.success)

  } catch (error) {
    console.error('🔴 Error in auto-submit handler:', error)
    mtUtils.autoCloseAlert(aahMessages.error)
  }
})

const parseSummary = (summary: string) => {
  const sections = {
    memo_sbj: '',
    memo_obj: '',
    memo_ass: '',
    memo_other: ''
  }

  const sectionTexts = summary.split('<br/>')

  let currentSection = ''
  sectionTexts.forEach((line) => {
    if (line.includes('## 主観')) {
      currentSection = 'memo_sbj'
    } else if (line.includes('## 客観')) {
      currentSection = 'memo_obj'
    } else if (line.includes('## 評価')) {
      currentSection = 'memo_ass'
    } else if (line.includes('## 計画他')) {
      currentSection = 'memo_other'
    } else if (currentSection && line.trim()) {
      sections[currentSection] += line + '<br/>'
    }
  })

  return sections
}

const handleLimitRecording = async () => {
  if (document.querySelector('.q-dialog')) {
    return false
  }

  if (conversationStore.getSource === 'create_memo_carte') {
    isPaused.value = true
    return false
  }

  let popup = {
    isConfirmed: false,
    id_template: '1',
    apiOptions: 'speech'
  }

  await mtUtils.smallPopup(RecordingLimitConfirmation, { popup })

  if (popup.isConfirmed) {
    const conversation_id = conversationStore.conversationId
    createNotification(conversation_id, false)
    await stopRecording(
      popup.id_template,
      2,
      conversation_id,
      popup.id_template
    )
    event_bus.emit('close-draggable-recording-modal')
    return true
  }

  isPaused.value = true
  return false
}

export function useRecording() {
  return {
    isPaused,
    isRecording,
    flgMemoCarteSubmitted,
    flgVerified,
    toggleTranscribing,
    startRecording,
    resumeRecording,
    pauseRecording,
    seconds,
    timer,
    recordingTime,
    recordingButtonIcon,
    stopRecording,
    stopRecordingKoekaru,
    tempTranscript,
    fullTranscript,
    fullAudioSource,
    resetRecordingData,
    updatedSummary,
    deleteConversation,
    closeDraggableModal,
    submitMemoCarte,
    createNotification,
    oldUpdatedSummary,
    tempFullTranscript,
    saveCurrentRecord,
    selectedServiceType,
    updateFeedbackData,
    feedbackData,
    transcriptWithTimestamp,
    setTranscriptData,
    flg_auto_memocarte_ai,
    recordingLimit,
    checkRecordingLimit,
    handleLimitRecording,
    isVoiceCommand,
    voiceCommandStartTime
  }
}
