<script setup lang="ts">
/* ------------------------ Core Imports ------------------------ */
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { exportFile } from 'quasar'
import * as Encoding from 'encoding-japanese'

/* ------------------------ Store Imports ------------------------ */
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import useClinicStore from '@/stores/clinics'
import useAuthStore from '@/stores/auth'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import useQueueTicketStore from '@/stores/queue_ticket'

/* ---------------------- Utility Imports ------------------------ */
import mtUtils from '@/utils/mtUtils'
import {
  calculateDate,
  dateFormat,
  formatPhoneNumber,
  getCustomerLabelColor,
  getCustomerName,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetImageUrl,
  handleImageError,
  searchWithHighlight
} from '@/utils/aahUtils'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { menuHelperContents } from '@/utils/menuHelperContents'

/* ---------------------- Component Imports ---------------------- */
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
/* ---------------------- Type Imports ---------------------- */
import { CustomerType, PetType } from '@/types/types'
import UpdAutoRequestModal from '@/pages/request/UpdAutoRequestModal.vue'
import useMemoCustomerStore from '@/stores/memo-customer'

import { api } from '@/boot/axios'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useRequestStore from '@/stores/requests'
import { Notify } from 'quasar'

/* ---------------------- Async Page Imports ---------------------- */
const UpdateCustomerModal = defineAsyncComponent(
  () => import('./UpdateCustomerModal.vue')
)
const AdditionalFilterCustomerPetModal = defineAsyncComponent(
  () => import('./AdditionalFilterCustomerPetModal.vue')
)
const UpdateRequestModal = defineAsyncComponent(
  () => import('@/pages/request/UpdateRequestModal.vue')
)
const WaitListCustomermodal = defineAsyncComponent(
  () => import('./WaitListCustomermodal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('./ViewPetDetailModal.vue')
)
const ViewVrHtmlModal = defineAsyncComponent(
  () => import('./ViewVrHtmlModal.vue')
)

/* ---------------------- Variable Declarations ---------------------- */
const router = useRouter(),
  route = useRoute()

const customerStore = useCustomerStore()
const actionStore = useActionStore()
const commonStore = useCommonStore()
const clinicStore = useClinicStore()
const cliCommonStore = useCliCommonStore()
const queueTicketStore = useQueueTicketStore()
const authStore = useAuthStore()
const memoCustomerStore = useMemoCustomerStore()
const requestStore = useRequestStore()

const action = computed(() => actionStore.action)
const { getClinic } = storeToRefs(clinicStore)
const { getCustomerPetSearchCount, getCustomerPetSearchParams } =
  storeToRefs(customerStore)

const searchText = ref('')
const customerList = ref<any>([])
const showAddressColumn = ref(false)
const showPhoneColumn = ref(false)

const MENU_NAMES = [
  'ペット基本',
  '予防',
  '現疾患・既往歴',
  '手術・麻酔',
  '治療・サービス',
  '処方箋',
  '注射・点滴',
  'タスク',
  'メモカルテ',
  '検査結果',
  '生体情報',
  '状態管理',
  '関連資料',
  'フード・シャンプー'
]
const columns = computed(() => {
  const customerAddressColumn = {
    name: 'customer_address',
    label: '住所表示',
    field: 'customer_address',
    align: 'left',
    style: 'width: 20%'
  }
  const customerPhoneColumn = {
    name: 'phone',
    label: '電話番号',
    field: 'phone',
    align: 'left',
    style: 'width: 10%'
  }
  var allColumns = [
    {
      name: 'code_customer',
      label: '診察券番号',
      field: 'code_customer',
      align: 'right',
      style: 'width: 7%'
    },
    {
      name: 'customer_name',
      label: 'オーナー姓名',
      field: 'customer_name',
      align: 'left',
      style: 'width: 13%'
    },
    {
      name: 'name_pet',
      label: 'ペット名',
      field: 'name_pet',
      align: 'left',
      style: 'width: 13%'
    },
    {
      name: 'create_auto_request',
      label: '',
      field: 'create_auto_request',
      align: 'left',
      style: 'width: 6%'
    },
    {
      name: 'create_auto_request_modal',
      label: '',
      field: 'create_auto_request_modal',
      align: 'left',
      style: 'width: 5%'
    },
    {
      name: 'id_cm_breed',
      label: '品種',
      field: 'id_cm_breed',
      align: 'left',
      style: 'width: 13%'
    },
    {
      name: 'date_last_visit',
      label: '最終来院日',
      field: 'date_last_visit',
      align: 'left',
      style: 'width: 10%'
    },
    {
      name: 'flg_unpaid',
      label: '未払',
      field: 'flg_unpaid',
      align: 'left',
      style: 'width: 5%'
    },
    {
      name: 'html_site',
      label: '',
      field: 'html_site',
      align: 'left',
      style: 'width: 5%'
    },
    {
      name: 'create_queue_ticket',
      label: '',
      field: 'create_queue_ticket',
      align: 'left',
      style: 'width: 5%'
    },
    {
      name: 'create_request',
      label: '',
      field: 'create_request',
      align: 'left',
      style: 'width: 5%'
    },
    
  ]
  if (showAddressColumn.value) {
    allColumns.splice(2, 0, customerAddressColumn)
  }
  if (showPhoneColumn.value) {
    allColumns.splice(3, 0, customerPhoneColumn)
  }
  return allColumns
})

// Add these refs
const isDownloading1 = ref(false)
const isDownloading2 = ref(false)
const showDownloadMenu = ref(false)
const last_visit_start = ref('')
const last_visit_end = ref('')
const register_start = ref('')
const register_end = ref('')
const codeCustomerStart = ref('')
const codeCustomerEnd = ref('')
const csvFilterAgeStart = ref('')
const csvFilterAgeEnd = ref('')
const csvFilterTypeAnimal = ref([])
const exp_deceased = ref(false)
const exp_unlist = ref(false)

async function init(initOnce: any = false) {
  customerStore.resetCustomerList()
  if (!initOnce) {
    await customerStore.fetchCustomerPets() // Don't call api onload
  }
  customerList.value = customerStore.getCustomers

  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [1, 2, 25] }),
    cliCommonStore.fetchPreparationCliCommonList(
      { code_cli_common: [3, 7, 8] },
      false
    )
  ])

  if (
    action.value === 'createCustomer' ||
    localStorage.getItem('pageAction') === 'createCustomer'
  ) {
    openAddModal()
    localStorage.removeItem('pageAction')
    actionStore.resetAction()
    customerStore.openUpdateModal = false
  } else if (localStorage.getItem('pageAction') === 'updateCustomer') {
    const cusId = localStorage.getItem('pageActionParam')
    const cusData = customerStore.getCustomers.find(
      (cus: any) => cus?.id_customer === cusId
    )
    localStorage.removeItem('pageAction')
    localStorage.removeItem('pageActionParam')
    onRowClick(cusData)
  } else if (route.query.id && route.query.petId) {
    const customerObj: any = await customerStore.selectCustomer(
      route.query.id,
      true
    )

    customerObj.id_pet = Number(route.query.petId)
    const petData = customerObj.pets.find(
      (pet: any) => pet.id_pet === Number(route.query.petId)
    )

    openDetailPet(petData)
  } else if (route.query.id && !route.query.petId) {
    // TODO Improvement Needed
    const customerObj: any = await customerStore.selectCustomer(
      route.query.id,
      true
    )
    if (customerObj) await onRowClick(customerObj)
  } else if (localStorage.getItem('pageAction') === 'searchCustomer') {
    const customerCode = localStorage.getItem('pageActionParam')
    if (customerCode) {
      searchText.value = customerCode
      await search()
      localStorage.removeItem('pageAction')
      localStorage.removeItem('pageActionParam')
    }
  }
}

const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}

const commonTypeAnimalOptionList = computed(() => {
  return commonStore.getCommonTypeAnimalOptionList.map((o: any) => {
    return {
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common,
      value1: o.code_func2
    }
  })
})

const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

const getBreedName = (id_cm_breed: any) => {
  return commonStore.getCommonBreedOptionList.find(
    (v: any) => v.id_common == id_cm_breed
  )?.name_common
}

const getMainAddress = (customerAdresses: Array<any>) => {
  let mainAddress: any = customerAdresses.find(
    (address: any) => !!address.flg_main_address
  )
  if (mainAddress) return mainAddress
  return customerAdresses[0]
}

const getMainTel = (customerTel: Array<CustomerTelephoneType>) => {
  let mainTel = customerTel.find((tel) => !!tel.flg_main_tel)
  if (mainTel) return mainTel
  let emergencyTel = customerTel.find((tel) => !!tel.flg_emergency)
  return emergencyTel
  return customerTel[0]
}

const downloadCSV = async (csvFormat: number, downloading: Ref<boolean>) => {
  downloading.value = true;
  const typeAnimalPayload = csvFilterTypeAnimal.value.map(
    (item: { id_common: number }) => item.id_common
  );

  try {
    const response = await api({
      url: '/mst/export-customer-list',
      method: 'GET',
      params: {
        last_visit_start: last_visit_start.value,
        last_visit_end: last_visit_end.value,
        register_start: register_start.value,
        register_end: register_end.value,
        code_customer_start: codeCustomerStart.value,
        code_customer_end: codeCustomerEnd.value,
        exp_deceased: exp_deceased.value,
        exp_unlist: exp_unlist.value,
        age_start: csvFilterAgeStart.value,
        age_end: csvFilterAgeEnd.value,
        animal_types: JSON.stringify(typeAnimalPayload),
        csv_format: csvFormat
      },
      responseType: 'blob'
    });

    const currentDate = dateFormat(getDateToday(), 'YYYYMMDD');
    const loggedInUserName = authStore.getAuthUser.name_display;
    const fileName = `${currentDate}_DMリスト_${loggedInUserName}.csv`;

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV download failed:', error);
  } finally {
    downloading.value = false;
    codeCustomerStart.value = '';
    codeCustomerEnd.value = '';
    exp_deceased.value = false;
    exp_unlist.value = false;
    showDownloadMenu.value = false;
  }
};

const directDownloadCSV1 = () => downloadCSV(2, isDownloading1);
const exportOwnerCSV = async () => {
  const confirmation = await mtUtils.confirm(
    'ペットのDM不可のペットレコードは出力対象外です。',
    '確認',
    '出力する', 
    null,
    null,
    null,
    { show: false, callBackFun: Function }, 
    true,  
    'キャンセル', 
    false  
  );
  if (!confirmation) {
    return;
  }
  
  await downloadCSV(1, isDownloading2);
};





// const downloadCSV = () => {
//   const headers = [
//     '診察券番号',
//     'オーナー名',
//     '郵便番号',
//     '都道府県',
//     '住所',
//     '電話番号',
//     'ペットCD',
//     'ペット名',
//     '品種'
//   ]

//   const flattenedRows = customerList.value.flatMap((row) => {
//     const mainAddress = getMainAddress(row.address) // Assuming address is processed by getMainAddress function
//     const mainTel = row.tel_list.length > 0 ? getMainTel(row.tel_list) : null

//     return row.pets.map((pet) => ({
//       診察券番号: row.code_customer,
//       オーナー名: getCustomerName(row), // Assuming this formats customer name
//       郵便番号: mainAddress?.zip_code ?? '',
//       都道府県: mainAddress?.address_prefecture ?? '',
//       住所: `${mainAddress?.address_city ?? ''} ${
//         mainAddress?.address_other ?? ''
//       }`,
//       電話番号: mainTel ? `'${mainTel.tel_full}` : '',
//       ペットCD: pet.code_pet,
//       ペット名: pet.name_pet,
//       品種: `${getTypeAnimal(pet.id_cm_animal)?.name_common ?? ''} / ${
//         getBreedName(pet.id_cm_breed) ?? ''
//       }`
//     }))
//   })

//   if (flattenedRows.length === 0) {
//     console.warn('No data found to export.')
//     return // Exit if there's no data
//   }

//   // Create CSV content
//   const csvContent = [
//     headers.join(','), // Header row
//     ...flattenedRows.map((row) =>
//       headers
//         .map((header) => {
//           const fieldValue = row[header] ?? ''
//           return typeof fieldValue === 'string' && fieldValue.includes(',')
//             ? `"${fieldValue}"`
//             : fieldValue
//         })
//         .join(',')
//     )
//   ].join('\n')

//   // Convert CSV content to Shift-JIS
//   const shiftJISArray = Encoding.stringToCode(csvContent)
//   const shiftJIS = Encoding.convert(shiftJISArray, {
//     to: 'SJIS',
//     from: 'UNICODE'
//   })
//   const uint8Array = new Uint8Array(shiftJIS)

//   // Generate the file name
//   const currentDate = dateFormat(getDateToday(), 'YYYYMMDD')
//   const loggedInUserName = authStore.getAuthUser.name_display
//   const fileName = `${currentDate}_DMリスト_${loggedInUserName}.csv`

//   // Create a Blob for the CSV file
//   const blob = new Blob([uint8Array], { type: 'text/csv' })

//   // Download the file
//   const link = document.createElement('a')
//   link.href = URL.createObjectURL(blob)
//   link.download = fileName
//   document.body.appendChild(link)
//   link.click()
//   document.body.removeChild(link)
// }

const onRowClick = async (data: CustomerType) => {
  router.replace({
    path: route.path,
    query: {
      code_customer: data.code_customer
    }
  })
  // force fetch is true in selecting customer b'cause it will pass updated customer details to modal.
  await mtUtils
    .popup(UpdateCustomerModal, {
      data,
      fromPage: 'オーナー・ペット',
      pageTitle: `顧客: ${data.name_customer_display} 様`
    })
    .then(async () => {
      if (route.name == 'SearchCustomerList') {
        await router.replace({ name: 'SearchCustomerList' })
      }
    })
  await search()
}
const search = async (additional_search: Object = {}) => {
  customerList.value.length = 0

  await customerStore.fetchCustomerPets({
    name_customer_search: searchText.value,
    additional_search_params: getCustomerPetSearchParams?.value,
    ...additional_search
    // id_clinic: JSON.parse(localStorage.getItem('id_clinic'))
  })

  customerList.value = customerStore.getCustomers
}

const openSearchModal = async () => {
  await mtUtils.smallPopup(AdditionalFilterCustomerPetModal)
  search()
}

const openAddModal = async () => {
  customerStore.selectCustomer(null)
  memoCustomerStore.resetMemoCustomers()
  await mtUtils.popup(UpdateCustomerModal)
  search()
}

const openDetailPet = async (row: PetType) => {
  const pageTitle = `顧客: ${getFullPetNameWithoutHonorific(row, row)}`
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet,
    code_customer: row.code_customer,
    code_pet: row.code_pet,
    tab: row.tab,
    fromPage: 'オーナー・ペット検索',
    pageTitle
  })
  await search()
}

const handleCreateRequest = async (data: any) => {
  let params = { id_customer: data.id_customer, id_pet: data.id_pet }
  await mtUtils.mediumPopup(UpdateRequestModal, params)
}

const handleCreateQT = (data: { id_customer: number; id_pet: number }) => {
  let payload = { id_customer: data.id_customer, id_pet: data.id_pet }
  sessionStorage.setItem('pageType', 'modal')
  localStorage.setItem('pageAction', 'createQueueTicket')
  actionStore.setAction('createQueueTicket')
  queueTicketStore.dataFromCustomerPage = payload
  router.push('SearchQueueTicketList')
  // await mtUtils.mediumPopup(UpdateQueueTicketModal, { data: payload })
}

const WaitList = () => {
  if (window.location.href.split('/')[3] !== 'SearchCustomerList?=waitlist') {
    router.push('SearchCustomerList?=waitlist').then(() => {
      mtUtils.fullHeightPopup(WaitListCustomermodal)
    })
  }
}

const formatClinicURL = (value: string) => {
  // value as the target URL
  // Define the regex pattern
  const pattern = /\/html\/([\d\/]+)\//

  // Get the part that matches the pattern
  const match = value.match(pattern)

  if (match && match[1]) {
    // Store the numeric sequence in a variable
    const numberString = match[1].split('/').join('_')
    return numberString
  } else {
    return null
  }
}

const openHtmlSite = (event, row) => {
  event.stopPropagation()
  if (!row.id_customer) return

  const formattedCodeCustomer = String(row.code_customer).padStart(6, '0')

  const clinicData = JSON.parse(localStorage.getItem('clinic'))

  if (
    clinicData &&
    Object.keys(clinicData).length > 0 &&
    Boolean(clinicData.clinic?.url_vr_html)
  ) {
    const urlHeader = 'https://'
    const baseUrl = '.vetty.clinic/'
    let clinicPath = clinicData.clinic?.url_vr_html
    const clinicPathWithoutPrefix = formatClinicURL(clinicPath)
    const ownerPrefix = 'オーナー情報'
    const location = `${clinicPath}${formattedCodeCustomer}/${clinicPathWithoutPrefix}_${formattedCodeCustomer}_${ownerPrefix}.html`

    // window.open(location, '_blank')
    let buttons: any = []
    buttons.push({
      label: 'オーナー情報',
      code_customer_ex: row.code_customer_ex,
      flgCustomerBtn: true
    })
    if (row.pets && row.pets.length && row.pets.length > 0) {
      row.pets.forEach((pet: any) => {
        //push pet detail button
        buttons.push({
          label: `${pet.code_pet_ex ? pet.code_pet_ex : ''} ${
            pet.name_pet
          } 詳細情報`,
          code_customer_ex: row.code_customer_ex,
          code_pet_ex: pet.code_pet_ex,
          flgPetDetailBtn: true
        })

        // push pet memo carte button
        buttons.push({
          label: `${pet.code_pet_ex ? pet.code_pet_ex : ''} ${
            pet.name_pet
          } カルテ情報`,
          code_customer_ex: row.code_customer_ex,
          code_pet_ex: pet.code_pet_ex,
          flgPetMemoCarteBtn: true
        })
      })
    }

    mtUtils.littlePopup(ViewVrHtmlModal, { buttons })
  }
}

const openAutoRequestModal = async (data: any) => {
  let params = { id_customer: data.id_customer, id_pet: data.id_pet }
  await mtUtils.popup(UpdAutoRequestModal, params)
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.customerPetList.title,
    content: menuHelperContents.customerPetList.content
  })
}

const updateLastVisitStart = () => {
  last_visit_end.value = last_visit_start.value
}

const updateRegisterStart = () => {
  register_end.value = register_start.value
}

const handleOpenRequestInNewTab = async (petId: string, openCartePerDateList: boolean = false) => {
  if (!!!petId) return
  try {
    await requestStore.fetchRequestByPet(petId)
    const resolved = router.resolve({
      name: 'SearchRequestList'
    })

    // Only open the window if we have a valid href
    const latestRequest = requestStore.getLatestRequestByPet.id_pet === petId
      ? requestStore.getLatestRequestByPet?.id_request ?? ''
      : ''

    if (resolved && resolved.href && !!latestRequest) {
      window.open(`${resolved.href}/${latestRequest}${openCartePerDateList ? '?open_carte_per_date_list=true' : ''}`  , '_blank')
    } else {
      mtUtils.autoCloseAlert('最新RQはありませんでした')
    }
  } catch (error) {
    mtUtils.autoCloseAlert('最新RQはありませんでした')
  }
}

watch(
  () => customerStore.openUpdateModal,
  (nowValue) => {
    if (nowValue) {
      openAddModal()
      localStorage.removeItem('pageAction')
      actionStore.resetAction()
      customerStore.openUpdateModal = false
    }
  }
)

onMounted(async () => {
  await init(true)
  const savedAddressPreference = localStorage.getItem('showAddressColumn')
  showAddressColumn.value = savedAddressPreference === '1'

  const savedPhonePreference = localStorage.getItem('showPhoneColumn')
  showPhoneColumn.value = savedPhonePreference === '1'

  // set page title
  setPageTitle('オーナー・ペット検索')

  if (window.location.href.split('/')[3] === 'SearchCustomerList?=waitlist') {
    mtUtils.fullHeightPopup(WaitListCustomermodal)
  }

  const { code_customer, code_pet, tab } = route.query
  if (code_customer && code_pet && tab) {
    await search({ code_customer, code_pet, tab })

    const customer = customerList.value.find((c) => {
      return c.code_customer === parseInt(code_customer as string)
    })
    const payload = { ...customer, code_customer, code_pet, tab }
    await openDetailPet(payload)
    return
  }

  if (code_customer) {
    await search({ code_customer })

    const customer = customerList.value.find((c) => {
      return c.code_customer === parseInt(code_customer as string)
    })
    await onRowClick(customer)
    return
  }
})

const toggleColumns = () => {
  if (!showAddressColumn.value || !showPhoneColumn.value) {
    showAddressColumn.value = true
    showPhoneColumn.value = true
  } else {
    showAddressColumn.value = false
    showPhoneColumn.value = false
  }

  localStorage.setItem('showAddressColumn', showAddressColumn.value ? '1' : '0')
  localStorage.setItem('showPhoneColumn', showPhoneColumn.value ? '1' : '0')

  console.log('Columns toggled', {
    showAddressColumn: showAddressColumn.value,
    showPhoneColumn: showPhoneColumn.value
  })
}

const buttonLabel = computed(() =>
  showAddressColumn.value && showPhoneColumn.value
    ? '電話/住所を非表示'
    : '電話/住所を表示'
)
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar
        class="text-primary q-pa-none flex item-center justify-between"
      >
        <div class="flex items-center">
          <q-toolbar-title class="title2 bold text-grey-900">
            オーナー・ペット検索
          </q-toolbar-title>
          <q-btn @click="WaitList" outline class="q-ml-sm"> 未承認 </q-btn>
        </div>
        <div class="flex items-center">
          <MtInputForm
            v-model="searchText"
            v-on:keyup.enter="search"
            outlined
            label="番号・名前・住所"
            autofocus
            type="text"
            class="search-field q-mx-sm"
          />
          <q-btn dense flat round @click="openHelpMenu">
            <q-icon size="24px" name="help_outline" />
          </q-btn>
          <q-btn @click="openSearchModal" outline class="q-mx-sm">
            詳細検索
            <q-badge v-if="getCustomerPetSearchCount > 0" color="red" floating>
              {{ getCustomerPetSearchCount }}
            </q-badge>
          </q-btn>
          <q-btn
            unelevated
            @click="search"
            color="accent-800"
            text-color="white"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
          <q-btn
            @click="openAddModal()"
            unelevated
            class="q-ml-sm"
            color="primary"
          >
            <q-icon size="20px" name="add" />オーナー
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="q-mt-sm">
      <div class="flex justify-end items-center q-pt-sm q-mb-xs q-px-md">
        <div class="flex justify-end">
          <q-btn outline unelevated class="q-mx-sm" @click="toggleColumns">
            {{ buttonLabel }}
          </q-btn>
          <q-btn-dropdown
            outline
            unelevated
            class="q-mx-sm"
            v-model="showDownloadMenu"
          >
            <template v-slot:label>
              <div class="row items-center no-wrap">
                <q-icon
                  name="download"
                  class="text-grey-700 q-mr-xs"
                  size="16px"
                />
                <div class="text-center">CSV</div>
              </div>
            </template>

            <q-card style="min-width: 300px" class="q-pa-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col">
                  <q-input
                    v-model="codeCustomerStart"
                    label="診察券番号：Start"
                    dense
                  />
                </div>
                <div class="col">
                  <q-input
                    v-model="codeCustomerEnd"
                    label="診察券番号：End"
                    dense
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col">
                  <MtFormInputDate
                    v-model:date="register_start"
                    label="登録日：Start"
                    type="date"
                    dense
                    @update:date="updateRegisterStart"
                  />
                </div>
                <div class="col">
                  <MtFormInputDate
                    v-model:date="register_end"
                    label="登録日: End"
                    type="date"
                    dense
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col">
                  <MtFormInputDate
                    v-model:date="last_visit_start"
                    label="最終来院日： Start"
                    type="date"
                    dense
                    @update:date="updateLastVisitStart"
                  />
                </div>
                <div class="col">
                  <MtFormInputDate
                    v-model:date="last_visit_end"
                    label="最終来院日： End"
                    type="date"
                    dense
                  />
                </div>
              </div>
              <div class="row q-mb-sm">
                <q-select
                  v-model="csvFilterTypeAnimal"
                  :options="commonTypeAnimalOptionList"
                  clearable
                  dense
                  label="動物種別（複数可）"
                  map-options
                  multiple
                  option-value="id_common"
                  use-chips
                  class="col"
                />
              </div>
              <div class="row q-col-gutter-md q-mb-sm">
                <q-input
                  v-model="csvFilterAgeStart"
                  label="年齢 : Start"
                  dense
                  class="col"
                  hint="6ヶ月齢なら「0.5」と入力"
                />
                <q-input
                  v-model="csvFilterAgeEnd"
                  label="年齢 : End"
                  dense
                  class="col"
                  hint="2歳未満なら「 2 」と入力"
                />
              </div>
              <div class="q-my-md">
                <q-checkbox
                  v-model="exp_deceased"
                  label="死亡ペットを含む"
                  dense
                />
              </div>
              <div class="q-mb-md">
                <q-checkbox
                  v-model="exp_unlist"
                  label="システムで除外されたペットを含む"
                  dense
                />
              </div>
              <div class ="row q-col-gutter-md">
                <div class="col-6">
                  <q-btn
                    color="primary"
                    label="出力（オーナー）"
                    class="full-width"
                    :loading="isDownloading2"
                    :disable="isDownloading2"
                    @click="exportOwnerCSV"
                  />
                </div>
                <div class="col-6">
                  <q-btn
                    color="primary"
                    label="出力（ペット）"
                    class="full-width"
                    :loading="isDownloading1"
                    :disable="isDownloading1"
                    @click="directDownloadCSV1"
                  />
                </div>
              </div>            
            </q-card>
          </q-btn-dropdown>
        </div>
      </div>
      <MtTable2
        :columns="columns"
        :rows="customerList"
        :rowsBg="true"
        class="custody-table"
        :style="{ boxShadow: 'none' }"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            @click="onRowClick(row)"
          >
            <div
              v-if="col.field == 'customer_name'"
              class="body1 regular text-grey-900"
            >
              <span class="caption1 regular text-grey-700">
                <span
                  v-html="
                    searchWithHighlight(row['name_kana_family'], searchText)
                  "
                ></span>
                <span
                  v-html="
                    searchWithHighlight(row['name_kana_first'], searchText)
                  "
                ></span>
              </span>
              <div class="text-bold avatar-container">
                <span
                  v-html="searchWithHighlight(getCustomerName(row), searchText)"
                ></span>
                <q-icon
                  v-if="row['type_customer_color']"
                  size="12px"
                  name="circle"
                  class="q-ml-xs"
                  :color="getCustomerLabelColor(row['type_customer_color'])"
                  :style="{
                    color: getCustomerLabelColor(row['type_customer_color'])
                  }"
                />
              </div>
            </div>
            <div
              v-if="col.field == 'customer_address'"
              class="body1 regular text-grey-900"
            >
              <div
                v-for="(address, index) in row['address']"
                :key="address.id_address"
                class="body regular text-grey-900"
              >
                <div
                  v-if="
                    (row['address'].length === 1 && index === 0) ||
                    (row['address'].length > 1 && address.flg_main_address) ||
                    (row['address'].length > 1 &&
                      !row['address'].some((addr) => addr.flg_main_address) &&
                      index === 0)
                  "
                >
                  <span
                    v-html="
                      searchWithHighlight(
                        (address.address_prefecture ? address.address_prefecture + ' ' : '') + (address.address_city ? address.address_city : ''),
                        searchText
                      )
                    "
                  ></span
                  ><br />
                  <span
                    v-html="
                      searchWithHighlight(address.address_other || '', searchText)
                    "
                  ></span>
                </div>
              </div>
              <div
                v-if="row['address'].length > 1"
                class="caption2 text-other-address"
              >
                他住所登録あり
              </div>
            </div>
            <div
              v-else-if="col.field == 'code_customer'"
              class="body1 regular text-grey-900 text-center"
            >
              <span
                v-if="row['code_customer']"
                v-html="
                  searchWithHighlight(
                    row['code_customer'].toString(),
                    searchText
                  )
                "
              ></span>
            </div>
            <div v-else-if="col.field == 'phone'">
              <div
                v-for="(tel, index) in row['tel_list']"
                :key="tel.id_tel"
                class="ellipsis"
              >
                <span
                  v-html="
                    searchWithHighlight(
                      formatPhoneNumber(tel.tel_full),
                      searchText
                    )
                  "
                ></span>
              </div>
            </div>
            <div
              v-else-if="col.field == 'name_pet'"
              class="body1 regular text-grey-900"
            >
              <div
                @click.stop="openDetailPet(row)"
                class="avatar-container"
                v-if="row.isPet"
              >
                <img
                  v-if="row"
                  :src="getPetImageUrl(row)"
                  @error="handleImageError($event, row)"
                  :alt="row['name_pet']"
                  class="image-responsive"
                  loading="lazy"
                />
                <div v-else class="default bg-grey-300" />
                <div>
                  <span class="caption1 regular text-grey-700">
                    <span
                      v-html="
                        searchWithHighlight(row['name_kana_pet'], searchText)
                      "
                    ></span>
                  </span>
                  <div class="text-blue text-bold">
                    <span
                      v-html="searchWithHighlight(row['name_pet'], searchText)"
                    ></span>
                    <q-icon
                      size="12px"
                      name="circle"
                      class="q-ml-xs"
                      :color="getTypeAnimalColor(row['id_cm_animal'])"
                      :style="{
                        color: getTypeAnimalColor(row['id_cm_animal'])
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="col.field == 'phone'"
              class="body1 regular text-grey-900"
            >
              <span
                v-html="searchWithHighlight(row['phone1'], searchText)"
              ></span>
            </div>
            <div
              v-else-if="col.field == 'id_cm_breed'"
              class="body1 regular text-grey-900"
            >
              <span v-if="row.id_cm_animal">
                <span
                  v-html="
                    searchWithHighlight(
                      getTypeAnimal(row['id_cm_animal'])?.name_common,
                      searchText
                    )
                  "
                ></span>
              </span>
              <span v-if="row.id_cm_breed && getBreedName(row['id_cm_breed'])">
                <span
                  v-html="
                    searchWithHighlight(
                      ' / ' + getBreedName(row['id_cm_breed']),
                      searchText
                    )
                  "
                ></span>
              </span>
            </div>
            <div
              v-else-if="col.field == 'date_last_visit'"
              class="body1 regular text-grey-900"
            >
              <span
                v-html="searchWithHighlight(row['date_last_visit'], searchText)"
              ></span>
            </div>
            <div
              v-else-if="['flg_unpaid'].includes(col.field)"
              class="body1 regular text-grey-900"
            >
              <q-icon name="circle" color="red" v-if="row[col.field]" />
            </div>
            <div v-else-if="col.field == 'html_site'">
              <q-btn
                class="text-grey-800"
                icon="stars"
                round
                size="12px"
                unelevated
                @click="openHtmlSite($event, row)"
                v-if="getClinic?.url_vr_html?.substr(0, 5) === 'https'"
              />
            </div>
            <div
              v-else-if="col.field == 'create_queue_ticket'"
              class="body1 regular text-grey-900"
            >
              <span
                class="search-button bg-grey-300"
                @click.stop="handleCreateQT(row)"
                >＋ 受付</span
              >
            </div>
            <div
              v-else-if="col.field == 'create_request'"
              class="body1 regular text-grey-900"
            >
              <span
                class="search-button bg-accent-200"
                @click.stop="handleCreateRequest(row)"
                >＋ RQ</span
              >
            </div>
            <div
              v-else-if="col.field == 'create_auto_request'"
              class="body1 regular text-grey-900"
            >
              <span
                class="cursor-pointer text-blue"
                @click.stop="handleOpenRequestInNewTab(row['id_pet'])"
              >
              最新RQ
              </span>
              <q-btn
                class="text-grey-800"
                icon="library_add"
                round
                size="12px"
                unelevated
                @click.stop="openAutoRequestModal(row)"
                v-if="false"
              />
            </div>
            <div
              v-else-if="col.field == 'create_auto_request_modal'"
              class="body1 regular text-grey-900"
            >
              <span
                class="cursor-pointer text-blue"
                @click.stop="handleOpenRequestInNewTab(row['id_pet'], true)"
              >
              日別
              </span>
            </div>
            <div v-else class="body1 regular text-grey-900">
              <span
                v-html="searchWithHighlight(row[col.field], searchText)"
              ></span>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </q-page>
</template>
<style scoped lang="scss">
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
.text-other-address {
  color: #174f97;
}
.search-button {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 800;
  color: #555;
}
</style>
