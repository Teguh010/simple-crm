<script setup lang="ts">
import { computed, defineAsyncComponent, getCurrentInstance, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { aahUtilsGetEmployeeName, formatDateWithTime, concatenate } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import { setPageTitle } from '@/utils/pageTitleHelper'

// Stores
import useCustomerStore from '@/stores/customers'
import useCartStore from '@/stores/carts'
import useEmployeeStore from '@/stores/employees'
import useMessageStore from '@/stores/message-clinic'
import useUtilsStore from '@/stores/Utils'
import useClaimStore from '@/stores/claim'
import usePaymentStore from '@/stores/payment'

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'

// Lazy-loaded Components
const SearchStatusBoardListModal = defineAsyncComponent(
  () => import('@/pages/statusBoard/SearchStatusBoardListModal.vue')
)
const UpdateCartHeaderModalLeft = defineAsyncComponent(
  () => import('./UpdateCartHeaderModalLeft.vue')
)
const UpdateCartHeaderModalRight = defineAsyncComponent(
  () => import('./UpdateCartHeaderModalRight.vue')
)
const UpdateCartOverviewLeftModal = defineAsyncComponent(
  () => import('./UpdateCartOverviewLeftModal.vue')
)
const UpdateCartDetailModal = defineAsyncComponent(
  () => import('./UpdateCartDetailModal.vue')
)
const CartDetailMergeModal = defineAsyncComponent(
  () => import('./CartDetailMergeModal.vue')
)
const UpdateMessageThreadModal = defineAsyncComponent(
  () => import('@/pages/message/UpdateMessageThreadModal.vue')
)

// Refund Components
const UpdateCartHeaderRefundModalRight = defineAsyncComponent(
  () => import('./UpdateCartHeaderRefundModalRight.vue')
)
const UpdateCartOverviewRefundLeftModal = defineAsyncComponent(
  () => import('./UpdateCartOverviewRefundLeftModal.vue')
)

const isMobile = window.innerWidth < 640

// Emits
const emits = defineEmits(['close'])

// Store Instances
const customerStore = useCustomerStore()
const cartStore = useCartStore()
const employeeStore = useEmployeeStore()
const messageStore = useMessageStore()

// Store References
const { getCustomer } = storeToRefs(customerStore)
const { getCart } = storeToRefs(cartStore)
const { getAllEmployees } = storeToRefs(employeeStore)

// Router
const router = useRouter()
const route = useRoute()

// Reactive Variables
const selectedCart = ref([])
const selectedTab = ref(null)
const awaitedPanel = ref(null)
const fromPage = ref('')

const tabsData = ref({})
const props = defineProps({
  data: Object,
  selectedIllnessHistory: Object,
  allData: Array,
  fromPage: String,
  fromList: Boolean
})
console.log(props.data)
const data = ref({})
const headerEnabled = ref(false)
const groupedCartDetails = ref({})
const cartData = reactive({})

const refresh = ref(false)
const toggleMerge = ref(false)
const isSplit = ref(false)
const id_cart_merge = ref(null)
const isSpecificCartRefresh = ref(false)

const detailModalHeaderAndFooterHeight = ref(0) // Adjust this value based on header height

const isSelectedCart = ref(false)
const refreshCheckBox = ref(true)
const { proxy } = getCurrentInstance()

const showElements = computed(() => {
  return window.innerWidth < 720
})

const isMediumLaptop = computed(() => {
  return window.innerWidth > 1200
})

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }

  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

const CHInfo = ref()

// Compute the main content style object based on above properties
const detailModalScrollAreaHeight = computed(() => {
  let CHInfoHeight = 0

  if (CHInfo.value && CHInfo.value.length > 0) {
    CHInfoHeight = CHInfo.value[0].clientHeight
  }

  const isMobileOrTablet = window.innerWidth <= 1440
  // adjust this value based on header height
  detailModalHeaderAndFooterHeight.value = isMobileOrTablet ? 60 : 0
  const extraHeight = isMobileOrTablet ? 150 : 200

  return {
    height: `calc(100vh - (${
      detailModalHeaderAndFooterHeight.value
    }px + ${extraHeight}px + ${isMobileOrTablet ? CHInfoHeight : '0'}px + ${
      cartData.name_insured_disease ? 30 : 0
    }px))`
  }
})

const detailModalScrollAreaHeightRight = computed(() => {
  const isMobileOrTablet = window.innerWidth <= 1440
  // adjust this value based on header height
  detailModalHeaderAndFooterHeight.value = isMobileOrTablet ? 130 : 150
  return {
    height: `calc(100vh - ${detailModalHeaderAndFooterHeight.value}px)`
  }
})

const resetSelectedCart = () => {
  selectedCart.value = {}

  getCart.value?.cart_details?.forEach((element) => {
    selectedCart.value[element.id_cart_detail] = false
  })
}
const updateSelectedCart = (value) => {
  selectedCart.value = value

  if (
    Object.values(selectedCart.value).filter((value) => value === true).length >
    1
  )
    isSelectedCart.value = true
  else isSelectedCart.value = false
}
const mergeCartDetail = async (pet: any) => {
  await mtUtils.smallPopup(CartDetailMergeModal, {
    selectedCart: selectedCart.value,
    petObj: pet
  })
  await init()
  resetSelectedCart()
  useUtilsStore().setValidationParam(null, null)
}

const closeModal = () => {
  emits('close')
  setPageTitle('会計一覧')
  router.replace({
    path: route.path,
    query: {}
  })
}
const goSwitch = (direction: string) => {
  if (props.allData) {
    const currentIndex = props.allData?.findIndex(
      (item) => item.id_cart === getCart.value?.id_cart
    )
    if (direction === 'next') {
      if (props.allData[currentIndex + 1]) init(props.allData[currentIndex + 1])
    } else if (direction === 'previous') {
      if (props.allData[currentIndex - 1]) init(props.allData[currentIndex - 1])
    }
  }
}
const openMenu = async () => {
  let menuOptions
  if (!getCart.value.flg_refund) {
    menuOptions = [
      {
        title: 'URLコピー',
        name: 'URL copy',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      },
      {
        title: 'スレッド作成',
        name: 'create_thread',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      },
      {
        title: 'スレッド検索',
        name: 'Thread Search',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      },
      {
        title: '会計修正',
        name: 'allowModification',
        isChanged: false,
        attr: {
          class: !getCart.value.flg_completed ? 'disabled' : '',
          clickable: getCart.value.flg_completed
        }
      },
      {
        title: '会計処理完了',
        name: 'Completed accounting',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      },
      {
        title: '返金',
        name: 'refund',
        isChanged: false,
        attr: {
          class: !getCart.value.flg_completed ? 'disabled' : '',
          clickable: getCart.value.flg_completed
        }
      },
      {
        title: '削除',
        name: 'Delete',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      },
      ...(isMobile
        ? [
            {
              title: '分割',
              name: 'split',
              isChanged: false,
              attr: {
                class: UiDisable ? 'disabled' : ''
              }
            },
            {
              title: '統合',
              name: 'merge',
              isChanged: false,
              attr: {
                class: UiDisable ? 'disabled' : ''
              }
            },
            {
              title: '切替',
              name: 'switch',
              isChanged: false
            }
          ]
        : [])
    ]
  } else {
    menuOptions = [
      {
        title: '会計修正',
        name: 'allowModification',
        isChanged: false,
        attr: {
          class: !getCart.value.flg_completed ? 'disabled' : '',
          clickable: getCart.value.flg_completed
        }
      },
      {
        title: '削除',
        name: 'Delete',
        isChanged: false,
        attr: {
          class: null,
          clickable: true
        }
      }
    ]
  }

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'Delete') {
      await mtUtils
        .confirm(
          'この削除操作は、会計明細、保険請求、支払いの全てを削除します。\n実行しますか？',
          aahMessages.delete
        )
        .then((confirmation) => {
          if (confirmation) {
            let id = getCart.value?.id_cart

            cartStore
              .destroyCart(id)
              .then(async () => {
                await mtUtils.autoCloseAlert(aahMessages.success)

                const index = tabsData.value.findIndex((tab: any) => {
                  return tab.id == id
                })
                tabsData.value.splice(index, 1)

                const parentId = getCart.value.parent.id
                if (getCart.value.parent.id == getCart.value.id_cart) {
                  closeModal()
                  return
                }
                selectedTab.value = parentId
                awaitedPanel.value = parentId

                await mtUtils.promiseAllWithLoader([cartStore.updateBillingAmount(parentId, {})])
                await mtUtils.promiseAllWithLoader([
                  cartStore.fetchCart(parentId),

                  usePaymentStore().fetchPaymentByCustomer({
                    id_cart: parentId,
                    flg_upfront_ui: true,
                    flg_refund_occurred: true,
                    id_customer: useCartStore().getCart.id_customer
                  }),
                  await usePaymentStore().fetchPaymentsByCart(getCart.value.parent.id)
                ])
                resetSelectedCart()
                tabsData.value = prepareTabData(getCart.value)
              })
              .catch(async (error) => {
                if (error.response.data.data.includes('40200')) {
                  await mtUtils.autoCloseAlert(
                    '削除できません。\nこの会計には前受金から引き当てた支払いがあります。\nこの会計を削除する場合には支払いを削除して、その後に会計の削除を実行してください。'
                  )
                  return
                }

                if (error.response.data.data.includes('40010')) {
                  await mtUtils.autoCloseAlert(
                    'この会計を参照している別の会計データがある為削除できません。\n参照会計を先に削除してください。'
                  )
                  return
                }

                await mtUtils.autoCloseAlert(
                  '会計は完了しているため、削除できません。'
                )
              })
          }
        })
    } else if (selectedOption.name == 'allowModification') {
      const confirmation = await mtUtils.confirm(
        'この会計を修正しますか？',
        '確認して下さい',
        'はい'
      )
      if (confirmation) {
        await checkInsuranceClaimStatus()
      }
    } else if (selectedOption.name == 'refund') {
      cartStore.setFlgRefundCart(true)
      await mtUtils.autoCloseAlert('返金を作成する明細を選択してください。')
    } else if (selectedOption.name == 'URL copy') {
      try {
        let url = window.location.href
        if(route.name === 'RequestDetail' && !(route.query?.openCart)) {
          url = url + '?openCart=true'
        }
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました!')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました')
      }
    } else if (selectedOption.name == 'Duplicate Accounting') {
      // cartStore.duplicateCart(getCart.value?.id_cart).then(() => {
      //   emits('close')
      //   mtUtils.autoCloseAlert(aahMessages.success)
      // })
    } else if (selectedOption.name == 'Completed accounting') {
      cartStore
        .updateCart(getCart.value.id_cart, { flg_completed: true })
        .then(async () => {
          await cartStore.createCartBalance(getCart.value.id_cart)
          await cartStore.fetchLatestCartBalanceOfCustomer(
            getCart.value.id_customer
          )
          if (Number(getCustomerCartBalance.value) < 0) {
            await customerStore.updateCustomer(getCart.value.id_customer, {
              flg_unpaid: true
            })
          }
          await cartStore.fetchCart(getCart.value.id_cart)
          // await mtUtils.promiseAllWithLoader([
          //   cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer),
          //   cartStore.fetchCart(getCart.value.id_cart)
          // ])
        })
        .catch((error) => {
          if (
            error.response &&
            error.response.data &&
            error.response.data.data &&
            error.response.data.data.detail.includes('40050')
          ) {
            Notify.create({
              progress: true,
              message:
                ' Cart Balance Created by this cart has been already paid partially or whole. ',
              type: 'negative',
              actions: [
                {
                  label: 'OK',
                  color: 'white',
                  textColor: 'white',
                  handler: () => {}
                }
              ],
              timeout: 0
            })
          }
        })
    } else if (selectedOption.name == 'create_thread') {
      const threadData = {
        memo_goal: '',
        id_pet: cartData?.id_pet,
        id_customer: cartData?.id_customer,
        linkCategory: 6,
        id_link1: cartData.id_cart,
        number_link1: cartData.number_cart
      }
      if (cartData && cartData.pets && cartData.pets.length > 0) {
        const petId = cartData.pets[0]
        threadData['id_pet'] = petId
      }
      localStorage.setItem('pageAction', 'createThread')
      localStorage.setItem('createThread', JSON.stringify(threadData))
      await mtUtils.popup(UpdateMessageThreadModal, {})
      const recentThread = messageStore.getRecentThreadMessage
      if (recentThread && Object.keys(recentThread).length > 0) {
        messageStore.setRecentMessageThread(null)
        const confirmation = await mtUtils.confirm(
          '院内スレッドを作成しました。スレッドを開きますか？',
          '確認',
          'スレッドを開く'
        )
        if (confirmation) {
          const route = router.resolve({ name: 'MessageClinic' })?.href
          window.open(route, '_blank')
        }
      }
    } else if (selectedOption.name == 'split') {
      toggleMerge.value = true
      isSplit.value = true
    } else if (selectedOption.name == 'merge') {
      toggleMerge.value = true
    } else if (selectedOption.name == 'switch') {
      toggleHeaderEnabledBtn()
    }
  }
}
const openRequestDetail = (id_request) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}
const toggleHeaderEnabledBtn = async () => {
  headerEnabled.value = !headerEnabled.value
}
const openStatusBoard = async () => {
  await mtUtils.popup(SearchStatusBoardListModal, {
    id_customer: getCart.value?.id_customer,
    id_request: getCart.value?.id_request?.id_request,
    header: false
  })
}

async function checkInsuranceClaimStatus() {
  if (
    useCartStore().getCart.flg_insure_request &&
    useCartStore().getCart.id_pet_insurance
  ) {
    const response: any = await useClaimStore()?.fetchClaimByCart(
      getCart.value.id_cart
    )

    if (response && response.length === 0) {
      await mtUtils.autoCloseAlert('Error-INS01：保険の承認番号が不正です。')
      return
    }

    if (response && response.length > 0) {
      const claim = response[0]
      if (claim.id_claim) {
        if (claim.type_status_application == 11) {
          const confirmation = await mtUtils.confirm(
            '保険請求前の準備が完了しています。\n ' +
              '再請求を行ってください。\n現在の保険請求を削除しますか？',
            '確認',
            'はい'
          )

          if (confirmation) {
            await cartStore.updateCartInsurance(
              useCartStore().getCart.id_cart,
              {
                allow_modification: true
              }
            )
            await cartStore.updateBillingAmount(
              useCartStore().getCart.id_cart,
              {}
            )
            await cartStore.validateCartBalance({
              id_cart: useCartStore().getCart.id_cart,
              id_customer: useCartStore().getCart.id_customer,
              current_balance: 0,
              total_payment_amount: 0,
              bill: useCartStore().getCart.bill
            })

            await mtUtils.promiseAllWithLoader([
              cartStore.fetchCart(useCartStore().getCart.id_cart),
              cartStore.fetchLatestCartBalanceOfCustomer(
                getCart.value.id_customer
              ),
              usePaymentStore().fetchPaymentByCustomer({
                id_cart: useCartStore().getCart.id_cart,
                flg_upfront_ui: true,
                id_customer: useCartStore().getCart.id_customer,
                flg_refund_occurred: true
              })
            ])
            return false
          }

          return true
        } else if (claim.type_status_application == 20) {
          return true
        }
      }
    }
  }

  let response

  await cartStore
    .updateCartInsurance(useCartStore().getCart.id_cart, {
      id_pet_insurance: null,
      flg_insure_request: false
    })
    .then((res) => {
      response = res.data
    })
    .catch((error) => {
      response = error.data
    })

  if (response && response.code == 200) {
    await mtUtils.promiseAllWithLoader([
      cartStore.fetchCart(useCartStore().getCart.id_cart),
      cartStore.fetchLatestCartBalanceOfCustomer(getCart.value.id_customer),
      usePaymentStore().fetchPaymentByCustomer({
        id_cart: useCartStore().getCart.id_cart,
        flg_upfront_ui: true,
        id_customer: useCartStore().getCart.id_customer,
        flg_refund_occurred: true
      })
    ])
  }

  if (response && response.code == 400) {
    await mtUtils.autoCloseAlert(response.data)
  }

  return
}

const prepareTabData = (cart) => {
  let tabs = []

  // Add parent tab
  tabs.push({
    id: cart?.parent?.id,
    label: '会計 1',
    isCurrent: cart?.parent?.is_current,
    value: cart?.parent?.id
  })

  // Add child tabs
  cart.children.forEach((child, index) => {
    tabs.push({
      id: child.id,
      label: `会計 ${index + 2}`,
      isCurrent: child?.is_current,
      value: cart.id
    })
  })

  return tabs
}
const setActiveTab = (tabs) => {
  let activeTab = tabs.find((tab) => tab.isCurrent)
  selectedTab.value = activeTab ? activeTab.id : null
  awaitedPanel.value = activeTab ? activeTab.id : null
}


async function selectAwaitTab(value) {
  let activeTab = tabsData.value.find((tab) => tab.isCurrent)
  id_cart_merge.value = null
  await mtUtils.promiseAllWithLoader([cartStore.updateBillingAmount(value, {})])

  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(value),

    usePaymentStore().fetchPaymentByCustomer({
      id_cart: value,
      flg_upfront_ui: true,
      flg_refund_occurred: true,
      id_customer: useCartStore().getCart.id_customer
    }),
    await usePaymentStore().fetchPaymentsByCart(value)
  ])
  
  resetSelectedCart()
  awaitedPanel.value = activeTab ? activeTab.id : null
}

const transformData = () => {
  const groupedData = {}
  let cart_data = JSON.parse(JSON.stringify(getCart.value))
  if (cart_data.cart_details) {
    cart_data.cart_details.forEach((detail) => {
      // TODO: need to check if this is hiding CD's unintentionally
      // Skip adding this `detail` if `group_detail.flg_group_item` is true
      if (detail.group_detail && detail.group_detail.flg_group_item) {
        return // Skip this iteration
      }
      const petId = detail.id_pet ? detail.id_pet.id_pet : 'その他'
      const petName = detail.id_pet ? detail.id_pet.name_pet : 'その他'
      const flgInsurancePlan = detail.id_pet
        ? detail.id_pet.flg_insurance_plan
        : false
      const dateStart = detail.date_order_start

      // Determine id_insurance_plan
      let idInsurancePlan = null
      let hasPetInsurance = null
      if (detail.id_pet && detail.id_pet.pet_insurance.length > 0) {
        hasPetInsurance = true
        const insuranceRecord = detail.id_pet.pet_insurance.find(
          (record) => record.flg_insurance_main === true
        )
        if (insuranceRecord) {
          idInsurancePlan = insuranceRecord.id_insurance_plan
        }
      }

      if (!groupedData[petId]) {
        groupedData[petId] = {
          id_pet: petId,
          id_customer: detail.id_pet?.id_customer,
          name_pet: petName,
          flg_insurance_plan: flgInsurancePlan,
          id_insurance_plan: idInsurancePlan,
          hasPetInsurance: hasPetInsurance,
          dates: {},
          id_pet: petId,
          isCheckedUi: false,
          flg_pet_insurance_master: false
        }
      }

      if (!groupedData[petId].dates[dateStart]) {
        groupedData[petId].dates[dateStart] = []
      }

      groupedData[petId].dates[dateStart].push(detail)
      // groupedData[petId].dates[dateStart].sort((a, b) =>  b.row - a.row)
    })
  }

  return groupedData
}

function initializeParentCheckbox() {
  for (const petId in groupedCartDetails.value) {
    if (groupedCartDetails.value.hasOwnProperty(petId)) {
      handleParentCheckbox(groupedCartDetails.value[petId])
    }

    // handleParentCheckbox(groupedData[pet])
  }
}

function handleParentCheckbox(pet) {
  let countTrue = 0
  let totalCount = 0

  for (const date in pet.dates) {
    if (pet.dates.hasOwnProperty(date)) {
      const cartDetailsArray = pet.dates[date]
      cartDetailsArray.forEach((cd) => {

        if (parseInt(cd.type_tax) == 1) {
          totalCount += 1
        }
        if (cd.flg_pet_insurance) {
          countTrue += 1
        }
      })
    }
  }

  if (countTrue === 0) {
    pet.flg_pet_insurance_master = false // All false
  } else if (countTrue === totalCount) {
    pet.flg_pet_insurance_master = true // All true
  } else {
    pet.flg_pet_insurance_master = null // Intermediate state
  }

}

const openAddCartDetailModal = async () => {
  await mtUtils.mediumPopup(UpdateCartDetailModal, { data: cartData })
  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value.id_cart, {})
  ])
}

async function splitCart() {
  let id_cart = getCart.value.id_cart
  let r1 = null

  useCartStore().getCart.cart_details.forEach((cartDetail) => {
    if (selectedCart.value[cartDetail.id_cart_detail] === true) {
      if (
        cartDetail.flg_group_title &&
        cartDetail.group_detail &&
        cartDetail.group_detail.id_cart_detail_list &&
        cartDetail.group_detail.id_cart_detail_list.length > 0
      ) {
        cartDetail.group_detail.id_cart_detail_list.forEach(
          (id_cart_detail_list) => {
            selectedCart.value[id_cart_detail_list] = true
          }
        )
      }
    }
  })

  const cartDetailsIds = cartData.cart_details.map((cd) => cd.id_cart_detail)
  if (
    Object.keys(selectedCart.value).filter(
      (key) => selectedCart.value[key] === true
    ).length === cartDetailsIds.length &&
    isSplit.value
  ) {
    await mtUtils.autoCloseAlert(
      '会計1の全明細項目を他の会計に統合することはできません。'
    )
    return
  }

  if (!isSplit.value) {
    if (!id_cart_merge.value?.id) {
      await mtUtils.autoCloseAlert('統合対象の会計を選択してください')
      return
    }
  }

  const id_cart_detail_list = Object.keys(selectedCart.value).filter(
    (key) => selectedCart.value[key] === true
  )
  const id_cart_merged_tab = JSON.parse(JSON.stringify(id_cart_merge.value))

  const response = await mtUtils.promiseAllWithLoader([
    cartStore.splitAndMergeCart(getCart.value.id_cart, {
      id_cart_detail_list: id_cart_detail_list,
      is_merge: !isSplit.value,
      is_split: isSplit.value,
      id_cart_target: id_cart_merge?.value?.id
    })
  ])

  if (response && response[0] && response[0].data) {
    r1 = response[0].data.data
  }

  const remainingItems = Object.keys(selectedCart.value)
    .filter((key) => !id_cart_detail_list.includes(key))
    .reduce((obj, key) => {
      obj[key] = selectedCart.value[key]
      return obj
    }, {})

  if (!r1) {
    await mtUtils.autoCloseAlert('Error: 会計の統合に失敗しました') //TODO
    resetSelectedCartDetail()
    return
  }

  if (r1) {
    if (!isSplit.value) {
      if (r1.is_cart_deleted) id_cart = r1.id_cart_target
      selectedCart.value = remainingItems
    }

    if (isSplit.value) {
      if (r1.is_cart_deleted) id_cart = r1.id_cart_target
      selectedCart.value = remainingItems
    }

    isSpecificCartRefresh.value = true
  }

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(id_cart, {})
  ])

  await mtUtils.promiseAllWithLoader([cartStore.fetchCart(id_cart)])

  // console.log(id_cart_merged_tab)
  if (id_cart_merged_tab?.id) {
    selectedTab.value = id_cart_merged_tab?.id
    awaitedPanel.value = id_cart_merged_tab?.id
    resetSelectedCartDetail()
  }
}

function resetSelectedCartDetail() {
  toggleMerge.value = !toggleMerge.value
  isSplit.value = false
  id_cart_merge.value = null

  Object.keys(selectedCart.value).forEach((v) => {
    selectedCart.value[v] = false
  })
  Object.keys(groupedCartDetails.value).forEach((v) => {
    groupedCartDetails.value[v].isCheckedUi = false
  })

  resetSelectedCart()
}

watch(
  getCart,
  async (newVal: any, oldValue: any) => {
    if (newVal) {
      refresh.value = false
      data.value = JSON.parse(JSON.stringify(getCart.value))
      Object.assign(cartData, JSON.parse(JSON.stringify(getCart.value)))
      groupedCartDetails.value = transformData()
      initializeParentCheckbox()
      if (isSpecificCartRefresh.value) {
        tabsData.value = prepareTabData(getCart.value)
        isSpecificCartRefresh.value = false
      }
      if (
        newVal.children &&
        newVal.children.length > 0 &&
        oldValue?.children &&
        oldValue?.children.length === 0
      ) {
        tabsData.value = prepareTabData(getCart.value)
      }
      refresh.value = true
    }
  },
  { deep: true }
)

const init = async (newData: object = null) => {
  const cart = newData ? newData : props.data

  // await mtUtils.promiseAllWithLoader([
  //   customerStore.selectCustomer(props?.data?.id_customer),
  //   cartStore.fetchCart(cart?.id_cart)
  // ])

  /**
   * This change is to make it easier to call cart header modal just by passing the id_cart from other pages.
   */
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(cart?.id_cart).then(() => 
        customerStore.selectCustomer(getCart.value?.id_customer)
    )
  ]);

  tabsData.value = prepareTabData(getCart.value)

  setActiveTab(tabsData.value)
  // this might not be needed now, may remove this later
  if (getCustomer.value?.id_customer != getCart.value.id_customer) {
    await customerStore.selectCustomer(getCart.value?.id_customer, true)
  }

  let flg_surgery = getCart.value.cart_details.find(
    (v) => v.type_insurance_purpose == 4
  )
  let flg_hospitalization = getCart.value.cart_details.find(
    (v) => v.type_insurance_purpose == 3
  )
  let flg_normal = getCart.value.cart_details.find(
    (v) => v.type_insurance_purpose == 2
  )

  if (
    getCart.value.flg_insure_request &&
    flg_normal &&
    flg_hospitalization &&
    flg_surgery
  ) {
    await mtUtils.alert(
      '通院、入院、手術を一緒に保険請求することはできません。\n',
      '確認してください。'
    )
  }
  data.value.type_ch_disc = '1'
}

// Remove scroll class
const toggleScrollClass = (action) => {
  setTimeout(() => {
    const modalElement = proxy.$el
    if (!modalElement) return

    const scrollContainers = modalElement.querySelectorAll(
      '.q-scrollarea__container'
    )
    const scrollThumbs = modalElement.querySelectorAll(
      '.q-scrollarea__thumb--v'
    )
    const parentScrollArea = modalElement.closest('.q-scrollarea')

    if (action === 'remove') {
      scrollContainers.forEach((container) => {
        container.classList.remove('scroll')
        container.style.overflow = 'hidden'
      })

      scrollThumbs.forEach((thumb) => {
        if (thumb && thumb.parentNode) {
          thumb.parentNode.removeChild(thumb)
        }
      })

      if (parentScrollArea) {
        const parentContainer = parentScrollArea.querySelector(
          '.q-scrollarea__container'
        )
        const parentThumb = parentScrollArea.querySelector(
          '.q-scrollarea__thumb--v'
        )

        if (parentContainer) {
          parentContainer.classList.remove('scroll')
          parentContainer.style.overflow = 'hidden'
        }

        if (parentThumb && parentThumb.parentNode) {
          parentThumb.parentNode.removeChild(parentThumb)
        }
      }
    } else if (action === 'add') {
      scrollContainers.forEach((container) => {
        container.classList.add('scroll')
        container.style.overflow = 'auto'
      })

      if (parentScrollArea) {
        const parentContainer = parentScrollArea.querySelector(
          '.q-scrollarea__container'
        )
        if (parentContainer) {
          parentContainer.classList.add('scroll')
          parentContainer.style.overflow = 'auto'
        }
      }
    }
  }, 100)
}

const getEmployeeName = (id_employee) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}

const updateNameInsuredDisease = async () => {
  let payload = {
    ...data.value,
    name_insured_disease: concatenate(cartData.name_ins1 + cartData.name_ins2),
    id_request: data.value?.id_request?.id_request ?? null
  }
  cartStore.updateCart(data.value.id_cart, payload).then(() => {
    cartStore.fetchCart(data.value.id_cart)
    mtUtils.autoCloseAlert('更新しました')
  })
}

onMounted(async () => {
  cartStore.setFlgAddCartBalance(false)

  const customerName = getCustomer.value.name_family
  if (props.data.id_cart) {
    await init()
  }

  resetSelectedCart()
  cartStore.setFlgAllowCartUpdate(false)
  cartStore.setFlgRefundCart(false)

  if (customerName) {
    setPageTitle(`会計: ${customerName} 様`)
  }
  fromPage.value = `会計: ${customerName} 様`

  toggleScrollClass('remove')
})

onUnmounted(() => {
  resetSelectedCart()
  resetSelectedCartDetail()
  toggleScrollClass('add')
})

</script>

<template>
  <q-form>
    <MtModalHeader @close-modal="closeModal" :closeBtn="false">
      <small
        v-if="getCart?.flg_completed"
        class="field-label-free-color body2 text-white bg-green-800"
      >
        <span v-if="$q.screen.lt.md">完了</span>
        <span v-else>この会計は完了しています</span>
      </small>
      <q-toolbar-title
        class="text-grey-900 title2 bold q-pa-none col-auto q-mr-md"
      >
        <span
          :class="{ 'text-danger': getCart?.flg_refund }"
          class="hide-mobile"
        >
          {{
            getCart?.id_request?.flg_in_app_payment
              ? 'myVetty'
              : getCart?.flg_refund
              ? ' 返金'
              : '窓口'
          }}会計：
        </span>
        <span>{{ getCart?.number_cart }}</span>
      </q-toolbar-title>

      <span
        v-if="!showElements && getCart?.flg_completed == false"
        class="text-grey-900 hide-mobile"
        >RQ番号：</span
      >
      <q-btn
        v-if="!showElements && getCart?.flg_completed == false"
        flat
        dense
        class="body1 regular text-blue text-underline hide-mobile"
        @click="openRequestDetail(getCart?.id_request?.id_request)"
      >
        {{ getCart?.id_request?.number_request }}
      </q-btn>
      <q-tabs
        v-if="!showElements"
        v-model="selectedTab"
        align="left"
        class="tab-style2 no-wrap position-fixed tab-scroll"
        dense
        style="max-width: calc(100vh - 360px)"
        @update:model-value="selectAwaitTab"
      >
        <q-tab
          v-for="tab in tabsData"
          :key="tab.id"
          :name="tab.id"
          :label="tab.label"
          class="tabsBox body2 regular q-mr-md position-fixed"
        />
      </q-tabs>
      <q-space />
      <div v-if="isMediumLaptop" class="hide-mobile">
        <template v-if="!toggleMerge">
          <q-btn flat round @click="goSwitch('previous')">
            <q-icon name="navigate_before" />
          </q-btn>
          <q-btn @click="goSwitch('next')" flat round class="q-mx-md">
            <q-icon name="navigate_next" />
          </q-btn>
        </template>
      </div>
      <div class="flex no-wrap q-ml-auto no-wrap-container">
        <div v-if="!toggleMerge && !isMobile">
          <q-btn
            v-if="!getCart?.flg_completed && !getCart?.flg_refund"
            class="body1 regular border-btn q-mr-sm"
            color="grey-100"
            text-color="grey-800"
            unelevated
            @click="
              () => {
                toggleMerge = true
                isSplit = true
              }
            "
            :disable="UiDisable"
          >
            分割
          </q-btn>
          <q-btn
            v-if="!getCart?.flg_completed && !getCart?.flg_refund"
            :disabled="
              (tabsData && tabsData.length == 1) ||
              (tabsData &&
                tabsData.length > 0 &&
                tabsData[0].id &&
                tabsData[0].id == selectedTab)
            "
            class="body1 regular border-btn"
            color="grey-100"
            text-color="grey-800"
            unelevated
            @click="
              () => {
                toggleMerge = true
              }
            "
            :disable="UiDisable"
          >
            統合
          </q-btn>
          <q-btn
            v-if="!getCart?.flg_refund"
            class="bg-grey-100 body1 regular text-grey-800 border-btn q-mx-sm"
            unelevated
            @click="toggleHeaderEnabledBtn()"
          >
            切替
          </q-btn>
          <!-- <q-btn
            class="bg-grey-100 body1 regular bg-grey-800 text-white border-btn q-mx-sm"
            unelevated
            @click="openStatusBoard()"
          >
            ステータス
          </q-btn> -->
        </div>
        <div v-if="toggleMerge" class="flex items-center">
          <div v-if="isSplit" class="q-mr-md">
            移動する明細を選択してください。
          </div>
          <div v-else class="q-mr-md">統合する明細と選択してください。</div>
          <q-select
            v-if="!isSplit"
            v-model="id_cart_merge"
            :option-disable="
              (opt) => (Object(opt) === opt ? opt.id == selectedTab : false)
            "
            :options="tabsData"
            class="q-mr-md"
            dense
            outlined
            size="sm"
          >
          </q-select>
          <div>
            <q-btn
              class="bg-grey-800 text-white q-mr-sm round"
              size="sm"
              unelevated
              @click="
                () => {
                  splitCart()
                  if (isSplit) resetSelectedCartDetail()
                  // toggleMerge = false
                }
              "
            >
              決定
            </q-btn>
            <q-btn
              class="bg-grey-800 text-white q-mr-sm round"
              size="sm"
              unelevated
              @click="
                () => {
                  resetSelectedCartDetail()
                }
              "
            >
              キャンセル
            </q-btn>
          </div>
        </div>
        <q-btn round unelevated @click="openMenu">
          <q-icon name="more_horiz" size="18px" />
        </q-btn>
        <q-btn unelevated @click="closeModal" round class="q-ml-md">
          <q-icon size="18px" name="close" />
        </q-btn>
      </div>
    </MtModalHeader>
    <q-card-section class="non-scrolled">
      <q-tab-panels v-model="awaitedPanel" animated class="non-scrolled">
        <q-tab-panel
          v-if="tabsData"
          v-for="tab in tabsData"
          :key="tab.id"
          :name="tab.id"
          class="q-pa-none"
        >
          <div class="row q-col-gutter-md">
            <!-- List of CDs -->
            <div
              class="col-8 flex column"
              style="border-right: 1px solid #cdcdcd"
            >
              <div style="flex: none">
                <!--CH info start-->
                <div
                  class="cart-summary-box"
                  ref="CHInfo"
                  v-if="!headerEnabled"
                >
                  <div
                    class="row items-center"
                    :class="{ 'q-mb-xs': cartData.name_insured_disease }"
                  >
                    <div
                      calss="col-lg-3 col-md-4 col-sm-12 "
                      v-if="cartData.date_cart"
                    >
                      <div class="flex items-center">
                        <div class="flex items-center">
                          <small class="field-label-free-color-small bg-white"
                            >会計日</small
                          >
                        </div>
                        <div class="">
                          <span class="q-mr-md">{{ cartData.date_cart }}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      calss="col-lg-3 col-md-4 col-sm-12"
                      v-if="cartData.code_customer"
                    >
                      <div class="flex items-center">
                        <div class="flex items-center">
                          <small class="field-label-free-color-small bg-white"
                            >診察券番号</small
                          >
                        </div>
                        <div class="">
                          <span class="q-mr-md"
                            >{{ cartData.code_customer }}
                            {{ cartData.name_customer + ' 様' }}</span
                          >
                        </div>
                      </div>
                    </div>
                    <div
                      calss="col-lg-3 col-md-4 col-sm-12"
                      v-if="
                        cartData.code_customer && cartData.id_employee_doctor
                      "
                    >
                      <div class="flex items-center">
                        <div class="flex items-center">
                          <small class="field-label-free-color-small bg-white"
                            >主担当</small
                          >
                        </div>
                        <div class="">
                          <span class="q-mr-md">{{
                            getEmployeeName(cartData.id_employee_doctor)
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <div calss="col-lg-3 col-md-4 col-sm-12">
                      <div class="flex items-center">
                        <div class="flex items-center">
                          <small class="field-label-free-color-small bg-white"
                            >傷病名</small
                          >
                        </div>
                        <div class="">
                          <span
                            v-if="cartData.name_ins1 || cartData.name_ins2"
                            class="q-mr-md"
                            >{{ cartData.name_ins1 }}
                            {{ cartData.name_ins2 }}
                            <span> 
                              <q-icon 
                                class="cursor-pointer q-ml-xs"
                                size="20px"
                                name="redo"
                                @click="updateNameInsuredDisease" 
                              /> 
                            </span>
                            </span
                          >
                          <span v-else class="q-mr-md">未選択</span>
                        </div>
                      </div>
                    </div>
                    <div
                      calss="col-lg-3 col-md-4 col-sm-12"
                      v-if="cartData.name_insured_disease"
                    >
                      <div class="flex items-center">
                        <div class="flex items-center">
                          <small class="field-label-free-color-small bg-white"
                            >診療明細書の傷病名</small
                          >
                        </div>
                        <div class="">
                          <span class="q-mr-md">{{
                            cartData.name_insured_disease
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      class="col-auto q-ml-auto flex items-center justify-end"
                    >
                      <q-btn
                        flat
                        round
                        size="10px"
                        @click="toggleHeaderEnabledBtn()"
                      >
                        <q-icon name="edit" />
                      </q-btn>
                    </div>
                  </div>
                  <div class="row item-center q-mb-xs">
                    <div
                      calss="col-lg-12 col-md-12 col-sm-12"
                      v-if="cartData.flg_modified"
                    >
                      <small class="field-label-free-color-small bg-white"
                        >会計修正</small
                      >
                      <span class="q-mr-sm">{{
                        formatDateWithTime(
                          cartData.datetime_modified,
                          'YYYY/MM/DD HH:MM'
                        )
                      }}</span>
                      <span class="q-mr-md"
                        ><small class="text-grey-800 q-mr-sm">[メモ]</small
                        >{{ cartData.memo_cart_asked2 }}</span
                      >
                    </div>
                  </div>
                </div>
                <!--CH info end-->
              </div>
              <div class="flex relative-position" v-if="headerEnabled">
                <transition
                  appear
                  enter-active-class="animated fadeIn"
                  leave-active-class="animated fadeOut"
                >
                  <UpdateCartHeaderModalLeft
                    :data="data"
                    @close="toggleHeaderEnabledBtn()"
                  />
                </transition>
              </div>
              <div style="flex: 1 1 0" v-else>
                <transition
                  appear
                  enter-active-class="animated fadeIn"
                  leave-active-class="animated fadeOut"
                  v-if="!cartData.flg_refund"
                >
                  <UpdateCartOverviewLeftModal
                    :fromList="fromList"
                    v-if="refreshCheckBox"
                    :groupedCartDetails="groupedCartDetails"
                    :cartData="cartData"
                    class="left-side"
                    :scrollAreaHeight="detailModalScrollAreaHeight"
                    @updateSelectedCart="updateSelectedCart"
                    :selectedCart="selectedCart"
                    :isSelectedCart="isSelectedCart"
                    :headerEnabled="headerEnabled"
                    @openAddCartDetailModal="openAddCartDetailModal"
                    @mergeCartDetail="mergeCartDetail"
                    :toggleMerge="toggleMerge"
                  />
                </transition>
                <transition
                  appear
                  enter-active-class="animated fadeIn"
                  leave-active-class="animated fadeOut"
                  v-if="cartData.flg_refund"
                >
                  <UpdateCartOverviewRefundLeftModal
                    v-if="refreshCheckBox"
                    :groupedCartDetails="groupedCartDetails"
                    :cartData="cartData"
                    class="left-side"
                    :scrollAreaHeight="detailModalScrollAreaHeight"
                    @updateSelectedCart="updateSelectedCart"
                    :selectedCart="selectedCart"
                    :isSelectedCart="isSelectedCart"
                    :headerEnabled="headerEnabled"
                    @openAddCartDetailModal="openAddCartDetailModal"
                    @mergeCartDetail="mergeCartDetail"
                    :toggleMerge="toggleMerge"
                  />
                </transition>
              </div>
            </div>
            <!-- Price Table -->
            <div v-show="!toggleMerge" class="col-4">
              <UpdateCartHeaderModalRight
                :from-page="fromPage"
                :data="data"
                :groupedCartDetail="groupedCartDetails"
                v-if="refresh && !cartData.flg_refund"
                :scrollAreaHeight="detailModalScrollAreaHeightRight"
              />
              <UpdateCartHeaderRefundModalRight
                :from-page="fromPage"
                :data="data"
                :groupedCartDetail="groupedCartDetails"
                v-if="refresh && cartData.flg_refund"
                :scrollAreaHeight="detailModalScrollAreaHeightRight"
              />
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.cart-summary-box {
  background: rgb(236, 236, 236);
  border-radius: 5px;
  padding: 5px 10px 3px 10px;
  margin-right: 10px;
  margin-bottom: 8px;
}
.border-btn {
  border: 1px solid $grey-800;
}

.status-chip {
  max-width: 71px;
  width: 100%;

  :deep(.q-chip__content) {
    justify-content: center;
  }
}

// .non-scrolled {
//   overflow-y: hidden;
// }
@media (max-width: 1200px) {
  .hide-mobile {
    display: none;
  }
}
.no-wrap-container {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-scroll {
  overflow-x: auto !important;
  overflow-y: hidden;
  height: 35px !important;
}
</style>
