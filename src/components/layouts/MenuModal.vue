<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from 'quasar'
import useHotkey from 'vue3-hotkey'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { daysShort, typeOccupation } from '@/utils/enum'
import { debounce } from 'lodash'
import dayjs from 'dayjs'
import { isSysAdmin } from '@/utils/aahUtils'
import { SYS_ADMIN_ID } from '@/utils/constent'

import useCategoryStore from '@/stores/categories'
import useDiseaseStore from '@/stores/diseases'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import useItemStore from '@/stores/items'
import useManufacturerStore from '@/stores/manufacturers'
import useRoomStore from '@/stores/rooms'
import useDoseStore from '@/stores/dose-frequencies'
import useActionStore from '@/stores/action'
import useRequestStore from '@/stores/requests'

import useClinicStore from '@/stores/clinics'
import useAuthStore from '@/stores/auth'
import useCommonStore from '@/stores/common'
import useQueueTicketStore from '@/stores/queue_ticket'
import useCartStore from '@/stores/carts'

import { useDashboardStore } from '@/stores/dashboard'
import useCliCommonStore from '@/stores/cli-common'
import useRequestStatus from '@/stores/request-statuses'
import useConversationStore from '@/stores/Conversation'
// components
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import SelectClinicModal from '@/pages/dashboard/SelectClinicModal.vue'
import MainMenu from './menu/MainMenu.vue'

// Ai summary common fns file
import { useRecording } from '@/pages/memoCarte/useRecording'
import QuickBookingModal from '@/pages/master/customerPet/QuickBookingModal.vue'
import { useMovableModalStore } from '@/stores/movable-modal'
import aahMessages from '@/utils/aahMessages'
import BasicModal from '@/components/modals/BasicModal.vue'

const { resumeCheckingEnqueuedTask } = useRecording()

type DragResizeEmitType = {
  left: number
  top: number
  width: number
  height: number
}

// lazy loaded components
const IsAdminUser = defineAsyncComponent(
  () => import('@/pages/cart/IsAdminUser.vue')
)
const MasterMenu = defineAsyncComponent(() => import('./menu/MasterMenu.vue'))
const SetupMenu = defineAsyncComponent(() => import('./menu/SetupMenu.vue'))

const UpdateAutoPasswordModal = defineAsyncComponent(
  () => import('@/pages/auth/UpdateAutoPasswordModal.vue')
)

const ExcludedMenu = defineAsyncComponent(
  () => import('./menu/ExcludedMenu.vue')
)

const ChangePasswordModal = defineAsyncComponent(
  () => import('./menu/ChangePasswordModal.vue')
)

const MovableModal = defineAsyncComponent(
  () => import('@/components/MovableModal.vue')
)

const UpdateMovableMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMovableMemoCarteModal.vue')
)

const ChangePasswordAfter210DaysModal = defineAsyncComponent(
  () => import('@/pages/auth/ChangePasswordAfter210DaysModal.vue')
)

const SearchMedicineList = defineAsyncComponent(
  () => import('@/pages/master/itemService/SearchMedicineList.vue')
)

const SearchStatusBoardListModal = defineAsyncComponent(
  () => import('@/pages/statusBoard/SearchStatusBoardListModal.vue')
)
const QuickRequestModal = defineAsyncComponent(
  () => import('@/pages/request/QuickRequestModal.vue')
)
const SalesReportVer1Modal = defineAsyncComponent(
  () => import('@/pages/cart/salesReportVer1Modal.vue')
)
const QuickCustomerPetModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/QuickCustomerPetModal.vue')
)
const UpdateTackSealModal = defineAsyncComponent(
  () => import('@/pages/master/cliCommon/tackSeal/UpdateTackSealModal.vue')
)

const SelectDmPrintTemplates = defineAsyncComponent(
  () => import('@/pages/master/customerPet/SelectDmPrintTemplates.vue')
)

const authUser = {
  typeDepartment: JSON.parse(localStorage.getItem('userTypeDepartment')),
  typeOccupation: JSON.parse(localStorage.getItem('userTypeOccupation')),
  idEmployee: JSON.parse(localStorage.getItem('id_employee'))
}
const selectedHeader = ref('main-menu')

const authStore = useAuthStore()
const actionStore = useActionStore()
const employeeStore = useEmployeeStore()
const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()
const itemStore = useItemStore()
const manufacturerStore = useManufacturerStore()
const categoryStore = useCategoryStore()
const diseaseStore = useDiseaseStore()
const roomStore = useRoomStore()
const doseStore = useDoseStore()
const clinicStore = useClinicStore()
const itemServiceStore = useItemStore()
const commonStore = useCommonStore()
const requestStore = useRequestStore()
const queueTicketStore = useQueueTicketStore()
const cartStore = useCartStore()
const cliCommonStore = useCliCommonStore()
const conversationStore = useConversationStore()
const dashboardStore = useDashboardStore()

const { getEmployees } = storeToRefs(employeeStore)
const { getSelectedDepartment } = storeToRefs(dashboardStore)

const idEmployee = JSON.parse(localStorage.getItem('id_employee')!) as string
const movableModalStore = useMovableModalStore()
const { getMovableModalComponent, getMovableModalShowStatus } =
  storeToRefs(movableModalStore)

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    movableModalStore.closeMovableModal()
  })

  if (getAuthUser.value.flg_show_call) {
    // Initialize SSE connection
    const token = getToken.value

    const apiUrl = `${
      import.meta.env.VITE_API_URL
    }mst/cti/income-phone-notify/?token=${token}`
    const eventSource = new EventSource(apiUrl)
    // Handle connection open
    eventSource.onopen = () => {
      connectionStatus.value = 'Connected'
    }

    // // Handle incoming messages
    eventSource.addEventListener('income-phone', async (e) => {
      const data = JSON.parse(e.data)
      const currentId = e.lastEventId

      console.log('income-currentId', currentId)
      console.log('income-connectionId', connectionId.value)

      if (currentId === connectionId.value) return

      localStorage.setItem('sseId', e.lastEventId)
      connectionId.value = e.lastEventId
      await mtUtils.draggableCustomerPetByPhoneNumberPopup(data)
    })

    // Handle errors
    eventSource.onerror = (e) => {
      connectionStatus.value = 'Disconnected'
      console.error('SSE connection error', e)
    }

    // Cleanup on page unload
    window.onbeforeunload = () => {
      eventSource.close()
    }
  }
})
const connectionStatus = ref('Disconnected')
const connectionId = ref(localStorage.getItem('sseId') ?? '')
const showForceChangePwModal = ref(false)
const modalVisible = ref(false)
const page_search = ref(''),
  clinic_selected = ref('')
const { getAllClinics } = storeToRefs(clinicStore)
const { getAuthUser, getToken } = storeToRefs(authStore)

const isSelectClinicDisabled = ref<string | null>(
  localStorage.getItem('selectedClinic' ?? '{}')
)
const clinicsList = ref([])
const clinicsListDefault = reactive([])
const selectedMenuList = ref()
const unselectedMenuList = ref()
const tmp = ref([]),
  memoCarteProps = reactive({ attr: { showHeader: false } })
const selectedMenu = ref([
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
])
const menu_new_tab = ref(
  localStorage.getItem('menu_new_tab')
    ? JSON.parse(localStorage.getItem('menu_new_tab')!)
    : false
)
const modalKey = ref(0)
const modalConfig = ref({
  width: window.innerWidth / 2,
  height: window.innerHeight / 2 + 110,
  x: window.innerWidth * 0.25,
  y: -window.innerHeight * 0.75,
  class: ''
})
const editorHeight = ref(window.innerHeight / 3.2)
const menuList = ref([
  {
    label: 'リクエスト',
    icon: 'queue',
    bg_color: '#F4D6DB',
    children: [
      {
        label: '新規リクエスト',
        path: '/SearchRequestList',
        action: 'createRequest',
        number: 11
      },
      {
        label: 'リクエスト一覧',
        path: '/SearchRequestList',
        number: 12
      },
      {
        label: '治療サービス一覧',
        path: '/itemService/SearchServiceDetailList',
        number: 13
      },
      {
        label: '処方箋一覧',
        path: '/SearchPrescriptionList',
        number: 14
      },
      {
        label: '注射・点滴一覧',
        path: '/SearchInjectList',
        number: 15
      },
      {
        label: '要約一覧',
        path: '/SearchConversationList',
        number: 16
      }
    ]
  },
  {
    label: '受付',
    icon: 'people',
    bg_color: '#F4DDD6',
    children: [
      {
        label: '受付・整理券',
        path: '/SearchQueueTicketList',
        number: 21
      },
      {
        label: '新規',
        path: '/SearchQueueTicketList',
        action: 'createQueueTicket',
        number: 22
      },
      // {
      //   label: 'separator'
      // },
      {
        label: '受付画面',
        path: '/CheckIn',
        number: 23
      },
      {
        label: 'separator'
      },
      {
        label: 'Popup: ステータスボード',
        name: 'status-board-list',
        openModal: true,
        number: 24
      },
      {
        label: 'Page: ステータスボード',
        path: '/SearchStatusBoardList',
        number: 25
      }
    ]
  },
  {
    label: 'オーナー・ペット',
    icon: 'pets',
    bg_color: '#F4E8D6',
    children: [
      {
        label: '検索 🔍',
        path: '/SearchCustomerList',
        number: 31
      },
      {
        label: '新規',
        path: '/SearchCustomerList',
        action: 'createCustomer',
        number: 32
      },
      {
        label: '急患新規',
        path: '/SearchCustomerList',
        number: 33
      }
      // {
      //   label: 'separator'
      // },
      // {
      //   label: '預かり品一覧',
      //   path: '/SearchCustodyChecklistList',
      //   number: 34
      // },
      //{
      //  label: '次回来院一覧',
      //  path: '/SearchNextVisitList',
      //  number: 35
      //}
    ]
  },
  {
    label: '会計',
    icon: 'shopping_cart',
    bg_color: '#F8F6D4',
    children: [
      {
        label: '会計一覧',
        path: '/SearchCartList',
        number: 41
      },
      {
        label: '新規',
        path: '/SearchCartList',
        action: 'createCart',
        number: 42
      },
      // {
      //   label: 'separator'
      // },
      {
        label: '入金一覧',
        path: '/SearchPaymentList',
        number: 43
      },
      {
        label: '領収証一覧',
        path: '/SearchPaymentReceiptList',
        number: 44
      },
      {
        label: '繰越金一覧',
        path: '/SearchCartBalanceList',
        number: 45
      },
      {
        label: '日報',
        name: 'sales-daily-report-modal',
        openModal: true,
        number: 46
      }
    ]
  },
  {
    label: 'スレッド',
    icon: 'chat',
    bg_color: '#E4FCD2',
    children: [
      {
        label: '院内メッセージ',
        path: '/MessageClinic',
        number: 51
      },
      {
        label: '院内連絡',
        path: '/SearchEmpInfoList',
        number: 52
      }
    ]
  },
  {
    label: 'タスク',
    icon: 'task',
    bg_color: '#D6F4DD',
    children: [
      {
        label: 'ToDOリスト',
        path: '/SearchTodoTaskList',
        number: 61
      },
      {
        label: '新規',
        path: '/SearchTaskList',
        action: 'createTask',
        number: 62
      },
      // {
      //   label: 'separator'
      // },
      {
        label: 'タスク一覧',
        path: '/SearchTaskList',
        number: 63
      }
    ]
  },
  {
    label: '院内',
    icon: 'monitor_heart',
    bg_color: '#D6F4F3',
    children: [
      {
        label: '預り・入院管理',
        path: '/SearchTaskPetCustodyList',
        number: 71
      },
      {
        label: 'separator'
      },
      {
        label: '預り品一覧',
        path: '/SearchCustodyChecklistList',
        number: 72
      },
      {
        label: 'separator'
      },
      {
        label: '院内検査結果',
        path: '/SearchLabDataPrepList',
        number: 73
      }
    ]
  },
  {
    label: 'スケジュール管理',
    icon: 'calendar_today',
    bg_color: '#D6E4F4',
    children: [
      {
        label: '診療カレンダー（月間）',
        path: '/Calendar?view=monthly',
        number: 81
      },
      {
        label: '診療カレンダー（3日間）',
        path: '/Calendar?view=per3days',
        number: 82
      },
      {
        label: '診療カレンダー（1日）',
        path: '/Calendar?view=per1day',
        number: 83
      },
      {
        label: '診療カレンダー（先生ごと）',
        path: '/Calendar?view=doctor',
        number: 84
      },
      {
        label: '予約受付スレッド',
        path: '/MessageCustomer',
        number: 85
      },
      {
        label: '院内予定',
        path: '/SearchClinicPlanList',
        number: 86
      },
      {
        label: '診療カレンダー設定',
        path: '/UpdateAllDoctorAvailability',
        number: 87
      }
    ]
  },
  {
    label: '分析・集客',
    icon: 'volume_up',
    bg_color: '#E1D6F4',
    children: [
      {
        label: '日次分析',
        path: '/',
        number: 91
      },
      {
        label: '月次分析',
        path: '/',
        number: 92
      },
      {
        label: '次回来院',
        name: 'create-booking',
        number: 93,
        openModal: true
      },
      {
        label: '予防DMリスト',
        path: '/SearchDmCustomerPetList',
        number: 94
      },
      {
        label: 'お知らせ配信',
        path: '/SearchInfoList',
        number: 95
      }
    ]
  },
  {
    label: '全体検索',
    icon: 'troubleshoot',
    bg_color: '#f1dede',
    children: [
      {
        label: 'メモカルテ',
        path: '/SearchMemoCarteList'
      },
      {
        label: '既往歴',
        path: '/SearchIllnessHistoryList'
      }
    ]
  }
])
const masterMenuList = ref([
  {
    label: 'M1: 商品・サービス',
    icon: 'vaccines',
    children: [
      { label: '商品・サービス', path: '/SearchItemServiceList' },
      { label: '-- 子 商品・サービス', path: '/SearchItemServiceUnitList' },
      { label: '服用頻度', path: '/SearchDosageFrequencyList' },
      { label: '製造販売業者', path: '/SearchManufacturerList' }
      // {
      //   label: 'Vetty医薬品マスタの取込',
      //   path: '',
      //   name: 'import-medicine',
      //   openModal: true
      // }
    ]
    // ,
    // secondMenu: {
    //   label: 'グループ・テンプレート',
    //   icon: 'create_new_folder',
    //   children: [
    //     {
    //       label: 'サービスグループ（テンプレート）',
    //       path: '/SearchServiceGroupList'
    //     },
    //     // {
    //     //   label: 'タスクグループ（テンプレート）',
    //     //   path: '/SearchTaskGroupList'
    //     // },
    //     {
    //       label: 'テキストテンプレート',
    //       path: '/SearchTextTemplateList'
    //     },
    //     {
    //       label: 'シェーマ図',
    //       path: '/SearchShemeImageTemplateList'
    //     },
    //     { label: '印刷テンプレート', path: '/SearchPrintList' },
    //     { label: 'BK', path: '/SearchBookingList' }
    //   ]
    // }
  },
  // I : 検査基準値
  // J : 処方箋設定マスタ
  {
    label: 'M2: 診療カレンダー',
    icon: 'calendar_month',
    children: [
      { label: '診療カレンダー', path: '/DoctorAvailability' },
      { label: '通常スケジュール', path: '/SearchBusinessDayList' },
      { label: '特別スケジュール', path: '/SearchSpecialBusinessDayList' },
      { label: '診療時間枠', path: '/SearchBusinessHourSlotList' }
    ]
    // ,
    // secondMenu: {
    //   label: '傷病',
    //   icon: 'emergency',
    //   children: [
    //     { label: '病患・診断', path: '/SearchDiseaseList' },
    //     { label: '品種別疾患相関', path: '/SearchBreedDiseaseList' }
    //     // { label: '保険傷病', path: '/SearchDiseaseinsurerList' }
    //   ]
    // }
  },
  {
    label: 'M3: 病院',
    icon: 'health_and_safety',
    children: [
      { label: '従業員', path: '/SearchEmployeeList' },
      { label: '病院部門', path: '/SearchDepartmentTypeList' },
      { label: '病院・施設', path: '/SearchClinicList' },
      { label: '部屋・区画', path: '/SearchRoomList' },
      { label: 'ケージ', path: '/SearchCageList' }
    ]
  },
  {
    label: 'M4: 受付・会計',
    icon: 'shopping_cart',
    children: [
      { label: '受付', path: '/SearchClinicList?tab=受付' },
      { label: '会計', path: '/SearchClinicList?tab=会計' },
      { label: '受付区分', path: '/SearchQueueTicketPurposeList' },
      // { label: '来院理由', path: '/SearchTypeFirstRecognizedList' },
      { label: '割引率', path: '/SearchDiscountRateList' },
      { label: '支払方法', path: '/SearchPaymentMethodList' },
      { label: '院内ステータス', path: '/SearchStatusList' }
    ]
  },
  {
    label: 'M5: 診療',
    icon: 'medical_services',
    children: [
      { label: 'メモカルテ区分', path: '/SearchMemoCarteSourceList' },
      { label: '診療評価 項目', path: '/SearchMedEvaluationList' },
      { label: '診療評価 選択肢', path: '/SearchMedConditionList' },
      { label: '投与経路', path: '/SearchMedRouteList' },
      { label: '関連処理ボタン', path: '/SearchModalbuttonList' },
      {
        label: '処方料の初期数量設定',
        path: '/SearchAutoPriceCalculationList'
      },
      { label: '資料区分', path: '/SearchDiagnosticInfoList' }
    ]
  },
  {
    label: 'M6: 検査',
    icon: 'science',
    children: [
      { label: '院内検査機器', path: '/SearchLabDeviceList' },
      { label: 'IDEXX検査', path: '/SearchIdexxTestList' },
      { label: '手入力検査/順序/説明', path: '/SearchLabList' },
      { label: '固定検査結果', path: '/SearchLabPrintList' }
    ]
  },
  {
    label: 'M7: 預り/入院',
    icon: 'monitor_heart',
    children: [
      { label: 'ケージ準備方法', path: '/SearchCageConditionList' },
      { label: 'ごはん準備方法', path: '/SearchFoodPrepList' },
      { label: '入院管理時の状態評価', path: '/SearchReviewList' },
      { label: '預かり品', path: '/SearchCustodyItemOptionList' }
    ]
  },
  {
    label: 'M8: テンプレート',
    icon: 'mediation',
    children: [
      {
        label: '商品・医薬品グループ',
        path: '/SearchServiceGroupList'
      },
      {
        label: 'テキストテンプレート',
        path: '/SearchTextTemplateList'
      },
      {
        label: 'シェーマ図',
        path: '/SearchShemeImageTemplateList'
      },
      { label: 'BK', path: '/SearchBookingList' }
    ]
  },
  {
    label: 'M9: 管理',
    icon: 'category',
    children: [
      { label: 'カテゴリ', path: '/SearchCategoryList' },
      { label: 'オーナー区分・色', path: '/SearchCustomerColorList' },
      { label: '毛色', path: '/SearchPetHairList' },
      { label: 'ペット性格', path: '/SearchPetAlertType' },
      // { label: 'SearchTypeCategory', path: '/SearchTypeCategory' },
      { label: '狂犬病 保健所', path: '/SearchPublicHealthList' },
      { label: 'ペット色', path: '/SearchTypeAnimalColorList' },
      { label: '一括メール', path: '/SearchEmailCompaignList' },
      { label: 'サービス区分', path: '/SearchTypeServiceList' },
      {
        label: '手入力検査のカテゴリ一覧',
        path: '/SearchManualLabCategoryList'
      }
    ]
  },
  {
    label: 'M10: myVetty・診察券',
    icon: 'phone_iphone',
    children: [
      { label: 'myVetty予約 利用規約', path: '/SearchTermList' },
      { label: 'myVetty整理券', path: '/SearchClinicList?tab=受付' },
      { label: 'まとめて診察券', path: '/SearchCustomersList' }
    ]
  },
  {
    label: 'M11: 傷病',
    icon: 'emergency',
    children: [
      { label: '病患・診断', path: '/SearchDiseaseList' }
      // {
      //   label: 'Popup: クイックリクエスト',
      //   name: 'quick-request-modal',
      //   openModal: true,
      // },
      // {
      //   label: 'QR',
      //   name: 'クイック・リクエスト',
      //   openModal: true,
      // },
    ]
  },
  {
    label: 'M12: 印刷/出力',
    icon: 'print',
    children: [
      { label: 'タックシール', path: '/', number: '100' },
      { label: 'タックシール設定', path: '/SearchTackSealList' },
      { label: '帳票テンプレート', path: '/SearchPrintList' },
      { label: '帳票利用ケース', path: '/SearchPrintPdfList' },
      { label: 'DMリスト', path: '/SearchDmCustomerPetList' },
      { label: 'DMテンプレート', path: '/' },
      // { label: 'ダウンロードセンター', path: '/downloadCenter' }
    ]
  },
  {
    label: '',
    icon: '',
    children: []
  },
  {
    label: '',
    icon: '',
    children: []
  },
  {
    label: '',
    icon: '',
    children: []
  },
  ...(isSysAdmin(SYS_ADMIN_ID)
    ? [
        {
          label: 'M13: その他設定',
          icon: 'settings',
          children: [
            {
              label: '**【ADMIN】** 保険プラン',
              path: '/SearchPetInsuranceList'
            },
            {
              label: '**【ADMIN】** 品種別疾患相関',
              path: '/SearchBreedDiseaseList'
            },
            { label: '**【ADMIN】** COMMON', path: '/SearchCommonList' },
            { label: '**【ADMIN】** IDEXX IVLS', path: '/SearchIdexxIvlsList' },
            {
              label: '**【ADMIN】** WaitScreenPerDoctor',
              path: '/WaitingScreenPerDoctor'
            },
            {
              label: '**【ADMIN】** WaitScreenPerDoctorMix',
              path: '/WaitingScreenPerDoctorMix'
            },
            {
              label: '**【ADMIN】** WaitScreenPerPurposeMix',
              path: '/WaitingScreenPerPurposeMix'
            }
          ]
        }
      ]
    : [
        {
          label: '',
          icon: '',
          children: []
        }
      ])
])
const currentRouteName = computed(() => {
  return route.name
})

const todayDate = computed(() => {
  const weekdayOrdinal = dayjs().day()
  return `${dayjs().locale('ja').format('YYYY年MM月DD日')} (${
    daysShort[weekdayOrdinal]
  })`
})

const menuListGenerate = () => {
  const menuSelected: any = []
  selectedMenu.value?.forEach((v, index) => {
    if (v && menuList.value[index]) menuSelected.push(menuList.value[index])
  })
  selectedMenuList.value = menuSelected

  const menuUnSelected: any = []
  selectedMenu.value?.forEach((v, index) => {
    if (v === false && menuList.value[index])
      menuUnSelected.push(menuList.value[index])
  })
  unselectedMenuList.value = menuUnSelected
}

const isPadding = computed(() => {
  if (
    currentRouteName.value !== 'Dashboard' &&
    currentRouteName.value !== 'DoctorAvailability' &&
    currentRouteName.value !== 'UpdateAllDoctorAvailability' &&
    currentRouteName.value !== 'MessageClinic' &&
    currentRouteName.value !== 'Calendar' &&
    currentRouteName.value !== 'MessageCustomer'
  ) {
    return true
  } else false
})

const updateSelectedMenu = (index: number) => {
  selectedMenu.value[index] = !selectedMenu.value[index]
  menuListGenerate()
}
const saveMyMenu = (initOnce: any = false) => {
  const my_menu = selectedMenu.value
    ?.map((value) => {
      if (value) return 1
      else return 0
    })
    .join('')

  if (initOnce) return

  employeeStore.updateEmployee(idEmployee, { my_menu }).then(async () => {
    await employeeStore.fetchPreparationEmployees()
    menuListGenerate()
    authStore.setMyMenu(my_menu)
    mtUtils.autoCloseAlert(aahMessages.success)
    changeHeaderTab('main-menu')
  })
}

async function refreshStatusBoard() {
  useRequestStatus().fetchRequestStatusesDate({
    time_selection: 'today'
  })
}

let timeoutId
let intervalId
const startIntervalAtNextMinute = () => {
  const now = new Date()
  const nextMinute = new Date(now.getTime() + 60000)
  nextMinute.setSeconds(0, 0)

  const timeUntilNextMinute = nextMinute - now
  timeoutId = setTimeout(() => {
    intervalId = setInterval(refreshStatusBoard, 60000) // Set an interval to call the API every 60 seconds
  }, timeUntilNextMinute)
}

const isAdminEmployee = async () => {
  let isValidUser = false

  await mtUtils.littlePopup(IsAdminUser, {
    callBack: (isValid) => {
      isValidUser = isValid
    }
  })

  if (isValidUser) {
    await mtUtils.autoCloseAlert('パスワードを認証しました。')
    return true
  }

  return false
}

const goTo = async (menu: any) => {
  closeModal()
  if (menu.openModal) {
    if (menu.name === 'status-board-list') {
      const currentPageTitle = document.title
      startIntervalAtNextMinute()
      await mtUtils.popup(SearchStatusBoardListModal, {
        fromPage: currentPageTitle
      })
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }

    if (menu.name === 'quick-request-modal') {
      const currentPageTitle = document.title
      await mtUtils.popup(QuickRequestModal, {
        fromPage: currentPageTitle
      })
    }

    if (menu.name === 'sales-daily-report-modal') {
      if (!(await isAdminEmployee())) return
      const currentPageTitle = document.title
      await mtUtils.popup(SalesReportVer1Modal, {
        fromPage: currentPageTitle
      })
    }

    if (menu.name === 'create-booking') {
      const currentPageTitle = document.title
      await mtUtils.smallPopup(QuickBookingModal, {
        fromPage: currentPageTitle
      })
    }
    
    if (menu.name == 'print-tack-seal') {
      mtUtils.smallPopup(UpdateTackSealModal, { mode: 'print' })
    }

    if (menu.name == 'import-medicine') {
      await mtUtils.popup(SearchMedicineList, { importMode: true })
    }
    return false
  }

  if (menu.label === 'チェックインページ') {
    const baseUrl = window.location.origin
    const scheme = baseUrl.startsWith('http://') ? 'http://' : 'https://'
    const pathname = `${scheme}checkin.stg-cs.vetty${
      baseUrl.split('.vetty')[1]
    }/CheckIn`
    window.open(pathname, '_blank')
    return
  }
  if (menu.label === 'ログアウト') {
    useAuthStore().logout()
    useAuthStore().clearAuth()
    window.location.reload()
    return
  }
  if (menu.label === '新規タブで開く') {
    window.open(window.location.pathname, '_blank')
    return false
  }

  if (menu.label === 'タックシール') {
    mtUtils.smallPopup(UpdateTackSealModal, { mode: 'print' })
    return false
  }

  if (menu.label === 'DMテンプレート') {
    await mtUtils.smallPopup(SelectDmPrintTemplates, {
      mode: 'csv',
      callBack: () => {
        //just add callback to continue execution
      }
    })
    return false
  }

  if (menu.newTab) {
    window.open(menu.path, '_blank')
    return false
  }

  if (menu_new_tab.value === true) {
    window.open(menu.path, '_blank')
    return false
  }
  if (menu.label === '急患新規') {
    await mtUtils.mediumPopup(QuickCustomerPetModal)
    return false
  }
  sessionStorage.setItem('pageType', 'page')
  if (menu.action) {
    sessionStorage.setItem('pageType', 'modal')
    localStorage.setItem('pageAction', menu.action)
    actionStore.setAction(menu.action)

    if (
      menu.number === 12 &&
      window.location.pathname === '/SearchRequestList'
    ) {
      requestStore.openUpdateModal = true
      return
    }
    if (
      menu.number === 22 &&
      window.location.pathname === '/SearchQueueTicketList'
    ) {
      queueTicketStore.openUpdateModal = true
      return
    }
    if (
      menu.number === 32 &&
      window.location.pathname === '/SearchCustomerList'
    ) {
      customerStore.openUpdateModal = true
      return
    }
    if (menu.number === 42 && window.location.pathname === '/SearchCartList') {
      cartStore.openUpdateModal = true
      return
    }

    //  window.open(menu.path, '_blank')
    //  return false
  } else {
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
  router.push(menu.path)
  document.getElementsByClassName('q-dialog--modal')[0]?.remove()
}
const changeHeaderTab = (value: string) => {
  // if (getAuthUser.value?.my_menu != 0 || !getAuthUser.value?.my_menu) {
  //   selectedMenu.value = getAuthUser.value?.my_menu
  //     .split('')
  //     .map((v: string) => {
  //       if (v === '1') return true
  //       else return false
  //     })
  // }
  selectedHeader.value = value
}
const topButton = () => {
  window.location.href = '/'
}
const closeModal = () => {
  page_search.value = ''
  modalVisible.value = false
}
const hotkeys = ref([
  {
    keys: ['ctrl', 'd'],
    preventDefault: true,
    handler(keys: any) {
      toggleMainLayout()
    }
  }
])
const setClinicToLocalStorage = () => {
  const storedClinicId = localStorage.getItem('id_clinic')
  const allClinics = clinicStore?.getClinics || []

  // If there is an id_clinic from localStorage
  if (Boolean(storedClinicId) && allClinics.length > 0) {
    const parsedStoredClinicId = JSON.parse(storedClinicId)

    // Find the matching clinic in allClinics and set it as selected
    const matchingClinic = allClinics.find(
      (clinic) => clinic.id_clinic === parseInt(parsedStoredClinicId)
    )
    clinicStore.selectClinic(matchingClinic?.id_clinic)

    if (matchingClinic) {
      clinic_selected.value = matchingClinic.id_clinic
      matchingClinic.flgSelected = true
    }

    // If there is no id_clinic in localStorage, use the first clinic
  } else if (allClinics.length > 0) {
    const firstClinic = allClinics[0]

    clinicStore.selectClinic(firstClinic.id_clinic)
    clinic_selected.value = firstClinic.id_clinic
    firstClinic.flgSelected = true
    localStorage.setItem('id_clinic', JSON.stringify(firstClinic.id_clinic))
  }

  // Fetch employees based on the selected clinic
  employeeStore.fetchPreparationEmployees()
}

const toggleMainLayout = () => {
  page_search.value = ''
  selectedHeader.value = 'main-menu'

  modalVisible.value = !modalVisible.value
  if (modalVisible.value) {
    setClinicToLocalStorage()

    // if (getAuthUser.value?.my_menu != 0 || !getAuthUser.value?.my_menu) {
    //   selectedMenu.value = getAuthUser.value?.my_menu
    //     .split('')
    //     .map((v: string) => {
    //       if (v === '1') return true
    //       else return false
    //     })
    // }

    if (!clinicsList.value.length) {
      clinicsList.value = [...getAllClinics.value]
      clinicsListDefault.push(...clinicsList.value)
      if (clinic_selected.value == '') {
        clinic_selected.value = clinicsList.value[0]?.value
      }
      let clinicDefault = clinicStore.getClinics[0]
      if (clinicDefault && Object.keys(clinicDefault).length > 0) {
        localStorage.setItem(
          'clinic',
          JSON.stringify({
            ...clinicDefault,
            label: clinicDefault.name_clinic_display,
            value: clinicDefault.id_clinic
          })
        )
      }
    }
  }
}
const refreshAllStores = () => {
  preparation(true)
}
const search = async () => {
  if (page_search.value) {
    tmp.value = []
    if (page_search.value == '99') {
      selectedHeader.value = 'master-menu'
      return false
    } else if (page_search.value == '0') {
      page_search.value = ''
      window.open(window.location.pathname, '_blank')
      return false
    } else {
      menuList.value?.map(async (item) => {
        if (item.children) {
          let result = item.children.filter(function (menu) {
            return menu.number == page_search.value
          })
          if (result.length) {
            await goTo(result[0])
            return false
          }
        }
      })
    }
  }
}
const onPress = (event: any) => {
  page_search.value = `${page_search.value}`
  tmp.value.push(page_search.value)
  if (tmp.value?.length == '2') {
    search()
  }
}
const openChangePasswordModal = () => {
  mtUtils.smallPopup(ChangePasswordModal)
}
const typeDepartmentName = (value: any) =>
  cliCommonStore.getCliCommonTypeDepartmentList.find(
    (v) => v.code_func1 == value
  )?.name_cli_common
const typeOccupationName = (value: any) =>
  typeOccupation.find((v) => v.value === value)?.label
const employeeDisplayName = (value: number) => {
  return getEmployees.value.find((emp) => {
    return emp?.id_employee === value
  })?.name_display
}
const stop = useHotkey(hotkeys.value)
const handleNewTab = (value: any) => {
  localStorage.setItem('menu_new_tab', value)
}
const preparation = async (is_hard_refresh = false) => {
  const storedClinicId = localStorage.getItem('id_clinic')
  const promises = []

  // if (cageStore.getAllCages.length === 0 || is_hard_refresh)
  //   promises.push(cageStore.fetchPreparationCages())
  if (employeeStore.getAllEmployees.length === 0 || is_hard_refresh)
    promises.push(employeeStore.fetchPreparationEmployees())
  if (
    cliCommonStore.getCliCommonTypeDepartmentList.length === 0 ||
    cliCommonStore.getCliCommonCustomerColorList.length === 0 ||
    cliCommonStore.getCliCommonTypePaymentMethodList.length === 0 ||
    is_hard_refresh
  )
    promises.push(
      cliCommonStore.fetchPreparationCliCommonList({
        code_cli_common: [1, 3, 6]
      })
    )
  if (customerStore.getAllCustomers.length === 0 || is_hard_refresh)
    promises.push(customerStore.fetchPreparationCustomers())
  if (
    cliCommonStore.getAllCliCommonMedConditionOptionList.length === 0 ||
    is_hard_refresh
  )
    promises.push(cliCommonStore.fetchMedConditionCliCommonList())
  if (itemStore.getAllItems.length === 0 || is_hard_refresh)
    promises.push(itemStore.fetchPreparationItems())
  if (manufacturerStore.getAllManufacturers.length === 0 || is_hard_refresh)
    promises.push(manufacturerStore.fetchPreparationManufacturers())
  if (categoryStore.getAllCategories.length === 0 || is_hard_refresh)
    promises.push(categoryStore.fetchPreparationCategories())
  if (roomStore.getAllRooms.length === 0 || is_hard_refresh)
    promises.push(roomStore.fetchPreparationRooms())
  if (doseStore.getAllDoses.length === 0 || is_hard_refresh)
    promises.push(doseStore.fetchPreparationDoses())
  // if (foodPrepStore.getAllFoodPreps.length === 0 || is_hard_refresh)
  //   promises.push(foodPrepStore.fetchPreparationFoodPreps())
  if (itemServiceStore.getAllServiceItems.length === 0 || is_hard_refresh)
    promises.push(itemServiceStore.fetchPreparationItemService())
  // if (serviceOptionStore.getAllServiceOptions.length === 0 || is_hard_refresh)
  //   promises.push(serviceOptionStore.fetchPreparationServiceOptions())
  if (clinicStore.getAllClinics.length === 0 || is_hard_refresh)
    promises.push(clinicStore.fetchPreparatioClinic())
  // if (petsStore.getPets.length === 0 || is_hard_refresh)
  //   promises.push(petsStore.fetchPreparationPets())
  if (commonStore.getCommonOptionList.length === 0 || is_hard_refresh)
    promises.push(
      commonStore.fetchPreparationCommonList({
        code_common: [1, 2, 3, 4, 5, 9, 10, 25, 28]
      })
    )
  // if (insurancePlanStore.getAllInsurancePlans.length === 0 || is_hard_refresh)
  //   promises.push(insurancePlanStore.fetchPreparationInsurancePlans())

  if (promises.length) {
    Loading.show({
      backgroundColor: 'transparent',
      spinnerColor: 'black',
      message: 'データ取得中...',
      messageColor: 'black',
      delay: 800
    })
    await Promise.all(promises)
      .then(() => {
        Loading.hide()
        return mtUtils.autoCloseAlert('データを更新しました')
      })
      .catch((e) => {
        return mtUtils.autoCloseAlert('error')
      })
  }

  // Set default clinic before waiting for menu toggle
  if (
    localStorage.getItem('id_clinic') === null &&
    localStorage.getItem('clinic') === null
  ) {
    if (clinicStore.getClinics.length) {
      const clinic: any = clinicStore.getClinics[0]
      clinicStore.getClinics[0].flgSelected = true
      clinicStore.selectClinic(clinic.id_clinic)
      localStorage.setItem('id_clinic', JSON.stringify(clinic.id_clinic))
      localStorage.setItem('clinic', JSON.stringify(clinic))
    }
  }

  if (diseaseStore.getAllDiseases.length === 0)
    promises.push(diseaseStore.fetchPreparationDiseases())

  // if there is id clinic in local storage
  if (storedClinicId && clinicStore.getClinics.length) {
    const parsedStoredClinicId = JSON.parse(storedClinicId)

    // Find the matching clinic in clinicStore.getClinics and set it as selected
    const matchingClinic = clinicStore.getClinics.find(
      (clinic) => clinic.id_clinic === parseInt(parsedStoredClinicId)
    )

    clinicStore.selectClinic(matchingClinic?.id_clinic)

    if (matchingClinic) {
      clinic_selected.value = matchingClinic.id_clinic
      matchingClinic.flgSelected = true
    }
  }
}

const selectDefaultClinic = (value: any) => {
  if (!value) return

  localStorage.setItem('id_clinic', JSON.stringify(value))
  clinicStore.selectClinic(value)

  // change flgSelected to false on the previous clinic value
  const prevClinic = clinicsList.value.find((c) => {
    return c.flgSelected
  })

  if (prevClinic && prevClinic.flgSelected) {
    prevClinic.flgSelected = false
  }

  const tempClinic = clinicsList.value.find(
    (clinic: any) => clinic.value === value
  )

  if (tempClinic) {
    // change flgSelected to true on the new selected clinic value
    tempClinic.flgSelected = true
    localStorage.setItem(
      'clinic',
      JSON.stringify({
        ...tempClinic,
        label: tempClinic.name_clinic_display,
        value: tempClinic.id_clinic
      })
    )
  }
}

const handleResizeChange = debounce((e: DragResizeEmitType) => {
  modalConfig.value.width = e.width
  modalConfig.value.height = e.height
  editorHeight.value = e.height / 1.6
  modalConfig.value.class = ''
  if (e.width <= 530) {
    modalConfig.value.class = 'flex-column-footer'
    modalKey.value++
  }
  if (e.width <= 650) {
    memoCarteProps.attr.showHeader = false
  } else {
    memoCarteProps.attr.showHeader = true
  }

  if (e.height <= 600) {
    editorHeight.value = window.innerHeight / 3.2
  }
}, 300)

const handleDragStop = (e: DragResizeEmitType) => {
  modalConfig.value.x = e.left
  modalConfig.value.y = e.top
}

const changePosition = async (value: string) => {
  modalConfig.value.height = 0
  modalConfig.value.x = 0
  modalConfig.value.y = 0
  // memoCarteStore.setMovableMemoCarte(false)
  movableModalStore.hideMovableModal()
  switch (value) {
    case 'topLeft':
      modalConfig.value.x = 0
      modalConfig.value.y = 0
      modalConfig.value.height = window.innerHeight / 2 + 110
      await nextTick(() => movableModalStore.showMovableModal())
      break

    case 'bottomLeft':
      modalConfig.value.x = 0
      modalConfig.value.y = window.innerHeight / 2 - 210
      modalConfig.value.height = window.innerHeight / 2 + 110
      await nextTick(() => movableModalStore.showMovableModal())
      break

    case 'topRight':
      modalConfig.value.x = window.innerWidth / 2 - 5
      modalConfig.value.y = 0
      modalConfig.value.height = window.innerHeight / 2 + 110
      await nextTick(() => movableModalStore.showMovableModal())
      break

    case 'bottomRight':
      modalConfig.value.x = window.innerWidth / 2 - 5
      modalConfig.value.y = window.innerHeight / 2 - 210
      modalConfig.value.height = window.innerHeight / 2 + 110
      await nextTick(() => movableModalStore.showMovableModal())
      break

    case 'halfLeft':
      modalConfig.value.x = 0
      modalConfig.value.y = 0
      modalConfig.value.height = window.innerHeight - 10
      await nextTick(() => movableModalStore.showMovableModal())
      editorHeight.value = modalConfig.value.height / 1.6
      break

    case 'halfRight':
      modalConfig.value.x = window.innerWidth / 2 - 5
      modalConfig.value.y = 0
      modalConfig.value.height = window.innerHeight - 10
      await nextTick(() => movableModalStore.showMovableModal())
      editorHeight.value = modalConfig.value.height / 1.6
      break
  }
  // await nextTick(() => movableModalStore.showMovableModal())

  if (modalConfig.value.width <= 700) {
    memoCarteProps.attr.showHeader = false
  } else {
    memoCarteProps.attr.showHeader = true
  }
}

const getDashboardInfo = () => {
  dashboardKey.value = Date.now()
}
const isClinicChosen = ref(false)
const dashboardKey = ref(Date.now())
onMounted(async () => {
  menuListGenerate()
  await preparation()
  sessionStorage.setItem('pageType', null)
  // saveMyMenu(true)

  // const clinic: any = clinicStore.getClinics[0]
  // select clinic
  // clinicStore.selectClinic(clinic.id_clinic)

  if (getAuthUser?.value && !isSelectClinicDisabled.value) {
    if (getAuthUser.value.id_clinic_list.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await mtUtils.smallPopupWithPresistance(SelectClinicModal, {
        callBack: () => {
          isClinicChosen.value = true
          refreshAllStores()
          dashboardKey.value = Date.now()
        }
      })
    } else if (getAuthUser.value.id_clinic_list.length == 1) {
      isClinicChosen.value = true
      const selected = clinicStore.getClinics.find((c) => {
        return c.id_clinic == getAuthUser.value.id_clinic_list[0]
      })
      localStorage.setItem('selectedClinic', selected.id_clinic)
      localStorage.setItem('id_clinic', selected.id_clinic)
    } else if (getAuthUser.value.id_clinic_list.length == 0) {
      isClinicChosen.value = true
    }

    isSelectClinicDisabled.value = true
  }
  const selectedClinic = localStorage.getItem('selectedClinic')
  if (selectedClinic) {
    isClinicChosen.value = true
  }

  // show update password modal if last time user changed pw is > 180 days
  // if (getAuthUser?.value?.datetime_login_pw_updated) {
  //   const today = dayjs()
  //   const lastUpdatePw = dayjs(getAuthUser?.value?.datetime_login_pw_updated)
  //   const dayDifference = today.diff(lastUpdatePw, 'day')
  //   if (dayDifference > 180 && dayDifference < 210) {
  //     return await mtUtils.smallPopup(UpdateAutoPasswordModal, { lastUpdatePw })
  //   }
  //   if (dayDifference > 210) {
  //     showForceChangePwModal.value = true
  //     return showForceChangePwModal.value
  //   }
  // }

  // show update password modal if last reminder pw is yesterday
  // if (!getAuthUser?.value?.datetime_login_pw_updated) {
  //   const today = dayjs()
  //   const lastReminderPw = dayjs(
  //     localStorage.getItem('lastReminderPw') as string
  //   ).format('YYYY/MM/DD HH:mm:ss')
  //   const lastUpdatePw = dayjs(
  //     localStorage.getItem('lastUpdatePw') as string
  //   ).format('YYYY/MM/DD HH:mm:ss')
  //   const dayDifference = today.diff(lastReminderPw, 'day')
  //   if (dayDifference > 0) {
  //     await mtUtils.smallPopup(UpdateAutoPasswordModal, { lastUpdatePw })
  //   }
  // }

  if (conversationStore.getFlgRecording) {
    mtUtils.draggablePopup()
    if (conversationStore.getSummaryGenerating) resumeCheckingEnqueuedTask()
  }
})
</script>

<template>
  <q-layout view="lHh Lpr fff">
    <div v-if="currentRouteName === 'Dashboard'" class="layout-header">
      <q-btn
        class="q-pa-sm q-mt-sm q-mr-sm q-mb-sm"
        flat
        rounded
        style="z-index: 6"
        @click="toggleMainLayout"
      >
        <q-icon name="menu" size="22px" />
      </q-btn>
      <span class="body1 bold">{{ todayDate }}</span>
      <div
        style="flex: 1; text-align: right"
        v-if="clinicStore.getClinic && isClinicChosen"
      >
        <span>{{ clinicStore.getClinic.name_clinic_display }}</span>
        <q-btn flat @click="getDashboardInfo" class="q-ml-sm">
          <q-icon name="refresh"></q-icon>
        </q-btn>
      </div>
    </div>
    <q-btn
      v-else
      flat
      rounded
      class="fixed-top-left q-pa-sm q-mt-sm q-mr-sm q-mb-sm"
      style="z-index: 6"
      @click="toggleMainLayout"
    >
      <q-icon size="22px" name="menu" />
    </q-btn>
    <q-page-container>
      <div :class="{ 'q-pt-xl': isPadding }">
        <router-view :key="dashboardKey" />
      </div>
      <q-dialog
        v-model="modalVisible"
        full-height
        full-width
        persistent
        transition-duration="0"
      >
        <q-card class="column">
          <q-card-section
            horizontal
            full-width
            class="q-py-sm q-px-md items-center text-primary justify-evenly q-bb"
          >
            <div class="col-md-6 gt-sm col-sm-12 modal-title">
              <q-btn
                class="text-grey-900"
                :style="{ marginRight: '10px' }"
                flat
                @click="topButton"
              >
                TOP
              </q-btn>
              <q-btn
                :class="
                  selectedHeader === 'main-menu'
                    ? 'text-white bg-accent-800'
                    : ''
                "
                class="text-grey-900"
                flat
                @click="changeHeaderTab('main-menu')"
              >
                PickUp
              </q-btn>
              <q-btn
                :class="
                  selectedHeader === 'excluded-menu'
                    ? 'text-white bg-accent-800'
                    : ''
                "
                class="q-ml-sm text-grey-900"
                flat
                @click="changeHeaderTab('excluded-menu')"
              >
                その他
              </q-btn>
              <q-btn
                :class="
                  selectedHeader === 'master-menu'
                    ? 'text-white bg-accent-800'
                    : ''
                "
                class="q-ml-sm text-grey-900"
                flat
                @click="changeHeaderTab('master-menu')"
              >
                病院マスタ
              </q-btn>
            </div>
            <div class="col-md-6 col-sm-12">
              <div class="search-btn-container">
                <MtInputForm
                  v-model="page_search"
                  accept="number"
                  autofocus
                  class="search-field"
                  outlined
                  placeholder="メニュー番号"
                  type="text"
                  @updatedValue="onPress"
                />
                <q-btn
                  dense
                  flat
                  @click="goTo({ label: 'top-page', path: '/' })"
                >
                  <q-icon name="sms">
                    <q-badge color="red" floating rounded />
                  </q-icon>
                </q-btn>

                <q-btn-dropdown dense flat>
                  <template #label>
                    <q-icon name="person" size="md" />
                    <div class="hide-mobile text-left">
                      <div class="caption3">
                        {{ typeDepartmentName(authUser?.typeDepartment) }}
                        {{ typeOccupationName(authUser?.typeOccupation) }}
                      </div>
                      <div class="caption2">
                        {{ employeeDisplayName(authUser?.idEmployee) }}
                      </div>
                    </div>
                  </template>
                  <q-list>
                    <q-item
                      class="lt-md"
                      v-close-popup
                      clickable
                      @click="topButton"
                    >
                      <q-item-section>
                        <q-item-label>Top</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      class="lt-md"
                      v-close-popup
                      clickable
                      @click="changeHeaderTab('main-menu')"
                    >
                      <q-item-section>
                        <q-item-label>PickUp</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      class="lt-md"
                      v-close-popup
                      clickable
                      @click="changeHeaderTab('excluded-menu')"
                    >
                      <q-item-section>
                        <q-item-label>その他</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      class="lt-md"
                      v-close-popup
                      clickable
                      @click="changeHeaderTab('master-menu')"
                    >
                      <q-item-section>
                        <q-item-label>病院マスタ</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="changeHeaderTab('setup-menu')"
                    >
                      <q-item-section>
                        <q-item-label>メニュー設定</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                      @click="openChangePasswordModal()"
                    >
                      <q-item-section>
                        <q-item-label>パスワード変更</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item v-close-popup clickable @click="refreshAllStores()">
                      <q-item-section>
                        <q-item-label>システム再読み込み</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                      @click="
                        goTo({ label: 'ログアウト', path: '/auth/login' })
                      "
                    >
                      <q-item-section>
                        <q-item-label>ログアウト</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
                <q-btn flat round @click="closeModal">
                  <q-icon name="close" size="xs" />
                </q-btn>
              </div>
            </div>
          </q-card-section>
          <q-scroll-area class="col-grow" visible>
            <q-card-section>
              <MainMenu
                v-if="selectedHeader === 'main-menu'"
                :selectedMenuList="selectedMenuList"
                @changeHeaderTab="changeHeaderTab"
                @goTo="goTo"
              />

              <ExcludedMenu
                v-else-if="selectedHeader === 'excluded-menu'"
                :unselectedMenuList="unselectedMenuList"
                @changeHeaderTab="changeHeaderTab"
                @goTo="goTo"
              />

              <MasterMenu
                v-else-if="selectedHeader === 'master-menu'"
                :masterMenuList="masterMenuList"
                @goTo="goTo"
              />

              <SetupMenu
                v-else-if="selectedHeader === 'setup-menu'"
                :menuList="menuList"
                :selectedMenu="selectedMenu"
                @update:selected-menu="updateSelectedMenu"
              />
            </q-card-section>
          </q-scroll-area>
          <q-card-actions
            v-if="selectedHeader === 'setup-menu'"
            class="text-center modal-btn full-width q-bt"
            align="between"
          >
            <q-btn
              class="bg-grey-100 text-grey-800"
              outline
              @click="changeHeaderTab('main-menu')"
            >
              <span>閉じる</span>
            </q-btn>
            <q-btn
              class="q-ml-md"
              color="primary"
              type="submit"
              unelevated
              @click="saveMyMenu(false)"
            >
              <span>保存</span>
            </q-btn>
          </q-card-actions>
          <q-card-actions v-else align="between" class="q-pa-md q-bt">
            <div class="col-md-2 col-sm-3 col-xs-8 q-pr-sm">
              <MtFilterSelect
                v-model:options="clinicsList"
                v-model:selecting="clinic_selected"
                :options-default="clinicsListDefault"
                label="病院"
                outlined
                :optionSlot="true"
                @selected="selectDefaultClinic"
                :hideClearIcon="true"
              >
                <template v-slot:option="{ scope }">
                  <q-item
                    v-if="scope.opt && !isSelectClinicDisabled"
                    class="items-center"
                    style="gap: 4px"
                    v-bind="scope.itemProps"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ scope.opt.label }}
                      </q-item-label>
                    </q-item-section>
                    <q-space></q-space>
                    <MtFormCheckBox v-model:checked="scope.opt.flgSelected" />
                  </q-item>
                  <q-item
                    v-if="scope.opt && isSelectClinicDisabled"
                    class="items-center"
                    style="gap: 4px"
                  >
                    <q-item-section>
                      <q-item-label class="cursor-not-allowed">
                        {{ scope.opt.label }}
                      </q-item-label>
                    </q-item-section>
                    <q-space></q-space>
                    <MtFormCheckBox v-model:checked="scope.opt.flgSelected" />
                  </q-item>
                </template>
              </MtFilterSelect>
            </div>
            <div class="col-md-2 col-sm-2 col-xs-12 hide-mobile">
              <MtFormCheckBox
                v-model:checked="menu_new_tab"
                label="別タブ"
                type="checkbox"
                @update:checked="handleNewTab"
              />
            </div>
            <div class="col-md-4 col-sm-3 col-xs-4">
              <div class="modal-btn">
                <q-btn
                  class="bg-grey-100 text-grey-800 close-btn"
                  outline
                  @click="closeModal()"
                >
                  <span class="btn-label">閉じる</span>
                  <q-icon class="btn-icon" name="close" size="xs" />
                </q-btn>
              </div>
            </div>
            <div class="col-md-4 col-sm-4 col-xs-12 hide-mobile">
              <div class="modal-bottom-informational caption1 q-mb-sm">
                Vetty® 電子カルテ ver.1.0
              </div>
              <div class="modal-bottom-informational caption1">
                <a
                  href="https://docs.google.com/document/d/1DlUwfipKRgxNaAstzbxhLxMkGq3ENiNrzUjCRtS8OQA/edit?usp=sharing"
                  target="_blank"
                  style="text-decoration: none"
                >
                  更新情報 3/2
                  <q-icon name="open_in_new" />
                </a>
              </div>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <ChangePasswordAfter210DaysModal
        :is-modal-shown="showForceChangePwModal"
        :last-update-pw="getAuthUser?.datetime_login_pw_updated"
        @close="showForceChangePwModal = false"
      />
      <MovableModal
        v-if="getMovableModalShowStatus"
        :height="modalConfig.height"
        :width="modalConfig.width"
        :x="modalConfig.x"
        :y="modalConfig.y"
        @update:resize="handleResizeChange"
        @drag-stop="handleDragStop"
      >
        <template v-slot:content>
          <div class="content-container">
            <component
              :is="getMovableModalComponent"
              :class-name="modalConfig.class"
              :editor-height="editorHeight"
              :popup="memoCarteProps"
              @change-position="changePosition"
            />
          </div>
        </template>
      </MovableModal>
      <BasicModal />
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
:deep(.q-card__section--vert) {
  padding: 16px;
}

:deep(.q-field__control) {
  @media screen and (max-width: 600px) {
    width: 100%;
    min-width: 0;
  }
}

:deep(.content) {
  @media screen and (max-width: 1100px) {
    height: calc(100vh - 172px);
  }
}

.layout-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: $white;
  position: sticky;
  top: 0;
  z-index: 1;
}

// .modal-title {
//   @media only screen and (max-width: 768px) {
//     display: none;
//     .row > .col-sm-6 {
//       height: auto;
//       width: 0;
//     }
//   }
// }
.modal-bottom {
  position: fixed;
  bottom: 0;

  .row {
    @media only screen and (max-width: 500px) {
      gap: 8px;
    }
  }
}

.modal-bottom-informational {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  @media only screen and (max-width: 500px) {
    justify-content: space-between;
    gap: 8px;
  }
}

.search-btn-container {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  @media only screen and (max-width: 500px) {
    justify-content: flex-start;
    gap: 4px;
  }
}

.modal-scroll-area {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  overflow: hidden !important;
}

.master-card {
  min-height: 360px;
  border-right: 1px solid $grey-300;
  border-radius: 0;
}

.modal-btn {
  display: flex;
  justify-content: center;
  text-align: center;
  gap: 16px;
  @media only screen and (max-width: 500px) {
    gap: 8px;
  }
}

.max-width {
  max-width: max-content !important;
  min-width: max-content !important;
}

.hide-mobile {
  @media screen and (max-width: 600px) {
    display: none;
  }
}

.btn-label {
  display: inline;
  @media screen and (max-width: 500px) {
    display: none;
  }
}

.btn-icon {
  display: none;
  @media screen and (max-width: 500px) {
    display: inline;
  }
}

// .master-btn {
// }
// .close-btn {
//   @media screen and (max-width: 500px) {
//     width: 50px;
//   }
// }
</style>
