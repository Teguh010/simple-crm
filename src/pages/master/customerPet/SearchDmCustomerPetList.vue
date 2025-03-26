<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import UpdateInfoListModal from '@/pages/info/UpdateInfoListModal.vue'
import * as Encoding from 'encoding-japanese'
// Stores
import useAuthStore from '@/stores/auth'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import useServiceDetailStore from '@/stores/service-details'
import useInjectStore from '@/stores/inject'
import usePrescriptionStore from '@/stores/prescription'
import useClinicStore from '@/stores/clinics'

// Utilities
import mtUtils from '@/utils/mtUtils'
import {
  dateFormat,
  formatPhoneNumber,
  getCustomerLabelColor,
  getCustomerName,
  getDateToday,
  getFullPetNameWithoutHonorific,
  handleImageError
} from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { filterCustomerPetDmHelperContents } from '@/utils/menuHelperContents'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'

// Types and Enums
import { CustomerTelephoneType, CustomerType, DmCustomerPetListType, PetType } from '@/types/types'
import { typePreventionV1 } from '@/utils/enum'
import { regularAttributes } from '@/utils/pdfAttributes/regular'

// Images
import otherThumbnail from '@/assets/img/petdetail/types/other.png'
import dogThumbnail from '@/assets/img/petdetail/types/dog.png'
import catThumbnail from '@/assets/img/petdetail/types/cat.png'
import rabbitThumbnail from '@/assets/img/petdetail/types/rabbit.png'
import rodentThumbnail from '@/assets/img/petdetail/types/rodent.png'
import birdThumbnail from '@/assets/img/petdetail/types/bird.png'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import dayjs from 'dayjs'
import _ from 'lodash'

// Lazy-Loaded Components
const UpdateCustomerModal = defineAsyncComponent(
  () => import('./UpdateCustomerModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('./ViewPetDetailModal.vue')
)
const AdditionalCustomerDmFilterModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/AdditionalCustomerDmFilterModal.vue')
)
const ViewPrescriptionModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)
const ViewInjectHeaderModal = defineAsyncComponent(
  () => import('@/pages/request/inject/ViewInjectHeaderModal.vue')
)
const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue')
)
const SelectPrintTemplate = defineAsyncComponent(
  () => import('@/pages/master/customerPet/detail/SelectPrintTemplate.vue')
)
const SelectDmPrintTemplates = defineAsyncComponent(
  () => import('@/pages/master/customerPet/SelectDmPrintTemplates.vue')
)

const UpdateTackSealModal = defineAsyncComponent(
  () => import('@/pages/master/cliCommon/tackSeal/UpdateTackSealModal.vue')
)

// const router = useRouter()
// const route = useRoute()

const authStore = useAuthStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const serviceDetailStore = useServiceDetailStore()
const injectStore = useInjectStore()
const prescriptionStore = usePrescriptionStore()
const { getDmSearchCount } = storeToRefs(prescriptionStore)
const clinicStore = useClinicStore()

const { getServiceDetail } = storeToRefs(serviceDetailStore)
const { getAllPrescriptionData } = storeToRefs(prescriptionStore)
const { getAllInjectData } = storeToRefs(injectStore)

const searchParam = ref({
  // date_start: dayjs().startOf('month').format('YYYY/MM/DD'),
  booking_confirmed_date_start: null,
  booking_confirmed_date_end: dayjs().endOf('month').format('YYYY/MM/DD'),
  type_distinct: '1'
})

const customerList = ref<DmCustomerPetListType[]>([])

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    style: 'width:1%',
    overLoad: true
  },
  {
    name: 'date_start',
    label: '予防実施日',
    field: 'date_start',
    align: 'right',
    style: 'width: 7%'
  },
  {
    name: 'date_confirm',
    label: '次回予定日',
    field: 'date_booking_confirmed',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: 'customer_name',
    label: 'オーナー名',
    field: 'customer_name',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'address',
    label: '住所',
    field: 'address',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'phone',
    label: '電話番号',
    field: 'phone',
    align: 'left',
    style: 'width: 8%'
  },
  {
    name: 'flg_dm',
    label: 'オーナーDM可否',
    field: 'flg_dm',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'name_pet',
    label: 'ペット名',
    field: 'name_pet',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'id_cm_breed',
    label: '品種',
    field: 'id_cm_breed',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'pet_dm',
    label: 'ペットDM可否',
    field: 'pet_dm',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'type_prevent',
    label: '予防区分',
    field: 'type_prevent',
    align: 'left',
    style: 'width: 8%'
  },
  {
    name: 'ISU',
    label: '商品名',
    field: 'ISU',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'categories',
    // label: '大分類',
    label: '分類',
    field: 'categories',
    align: 'left',
    style: 'width: 10%'
  }
  // {
  //   name: 'name_category2',
  //   label: '中分類',
  //   field: 'name_category2',
  //   align: 'left',
  //   style: 'width: 15%'
  // }
]

async function init(initOnce: any = false) {
  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [1, 2, 25] }),
    cliCommonStore.fetchPreparationCliCommonList(
      { code_cli_common: [3, 7, 8] },
      false
    )
  ])
}

const isBitSet = (bit: number, value: number) => {
  return (value & bit) === bit
}

const typePreventionName = (value: number) => {
  return typePreventionV1
    .filter((v) => isBitSet(v.value, value))
    .map((v) => v.label)
    .join(',')
}

const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}

const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

const getBreedName = (id_cm_breed: any) => {
  return commonStore.getCommonBreedOptionList.find(
    (v: any) => v.id_common == id_cm_breed
  )?.name_common
}

const getPetImageUrl = (pet: any) => {
  if (!pet.id_pet) {
    return otherThumbnail
  }

  if (pet) {
    if (pet.thumbnail_path1 !== null && pet.thumbnail_path1 !== '')
      return pet.thumbnail_path1
    else if (pet.thumbnail_path2 !== null && pet.thumbnail_path2 !== '')
      return pet.thumbnail_path2
    else {
      const commonStore = useCommonStore()
      const common = commonStore.getCommonTypeAnimalOptionList.find(
        (v) => v.id_common == pet.id_cm_animal
      )
      if (common) {
        if (parseInt(common.code_func1) == 1) return dogThumbnail
        else if (parseInt(common.code_func1) == 2) return catThumbnail
        else if (parseInt(common.code_func1) == 3) return rabbitThumbnail
        else if (parseInt(common.code_func1) == 4) return rodentThumbnail
        else if (parseInt(common.code_func1) == 5) return birdThumbnail
        return otherThumbnail
      } else return otherThumbnail
    }
  }
}

const openHelpMenu1 = async () => {
  await mtUtils.mediumPopup(MtToolTipsSmall, {
    title: filterCustomerPetDmHelperContents.customerPetViewPage.title,
    content: filterCustomerPetDmHelperContents.customerPetViewPage.content,
  })
}

const onRowClick = async (data: any) => {
  // force fetch is true in selecting customer b'cause it will pass updated customer details to modal.
  // await search()
}

const openSearchModal = async () => {
  await mtUtils.smallPopupScrollable(
    AdditionalCustomerDmFilterModal,
    {
      search: searchParam.value,
      callBackSearch: (value) => {
        let count = 0

        // Split filter header
        const modalOnlyFilters = { ...value }
        delete modalOnlyFilters.booking_confirmed_date_start
        delete modalOnlyFilters.booking_confirmed_date_end
        delete modalOnlyFilters.type_distinct

        // Count active filter (only from modal)
        Object.keys(modalOnlyFilters).forEach((key) => {
          if (key === 'date_range_list') {
            // Special for date_range_list, count only with value
            modalOnlyFilters[key].forEach((range) => {
              if (range.date_start || range.date_end) {
                count++
              }
            })
          } else if (
            (['number', 'string'].includes(typeof modalOnlyFilters[key]) &&
              modalOnlyFilters[key] !== '') ||
            (Array.isArray(modalOnlyFilters[key]) &&
              modalOnlyFilters[key].length > 0)
          ) {
            count++
          }
        })

        prescriptionStore.setDmSearchParams(value, count)
        searchParam.value = { ...searchParam.value, ...value }
      }
    },
    {
      width: '550px'
    }
  )
  await search()
}

const search = async () => {
  customerList.value.length = 0


  if (typeof searchParam.value.date_range_list != 'string') {
    searchParam.value.date_range_list = JSON.stringify(
      searchParam.value.date_range_list
    )
  }

  const params = { ...searchParam.value }

  if (searchParam.value.id_cm_animal_list && Array.isArray(searchParam.value.id_cm_animal_list)) {
    params.id_cm_animal_list = searchParam.value.id_cm_animal_list.join(',')
  }
  
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'mst/SearchDmCustomerPetList',
    {
      ...params
    }
  )

  if (response) {
    customerList.value = response
  }
}

const openAddModal = async () => {
  customerStore.selectCustomer(null)
  await mtUtils.popup(UpdateCustomerModal)
  search()
}

const openDetailPet = async (row: PetType) => {
  const pageTitle = `顧客: ${getFullPetNameWithoutHonorific(row, row)}`
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet,
    fromPage: 'オーナー・ペット検索',
    pageTitle
  })
}

const openCustomerModal = async (data: CustomerType) => {
  await mtUtils.popup(UpdateCustomerModal, {
    data,
    fromPage: 'DMリスト作成',
    pageTitle: `顧客: ${data.name_customer_display} 様`
  })
}

const openTreatmentModal = async (data: DmCustomerPetListType) => {
  if (data.id_inject_detail) {
    await injectStore.fetchAllInjectData()
    const injectDetail = getAllInjectData.value.find((v) => {
      return v.inject_detail_list.find((d) => {
        return d.id_inject_detail === data.id_inject_detail
      })
    })
    await mtUtils.mediumPopup(ViewInjectHeaderModal, {
      InjectObj: injectDetail,
      id_pet: data.pet.id_pet,
      id_customer: data.customer.id_customer,
      id_inject: data.id_inject_detail,
      fromPD: true
    })
  }
  if (data.id_prescription_detail) {
    await prescriptionStore.fetchAllPrescriptionData()
    const prescriptionDetail = getAllPrescriptionData.value.find((p) => {
      return p.id_prescription === data.id_prescription_detail
    })
    await mtUtils.mediumPopup(ViewPrescriptionModal, {
      id_pet: data.pet.id_pet,
      prescriptionObj: prescriptionDetail
    }, true)
  }
  if (data.id_service_detail) {
    await serviceDetailStore.fetchServiceDetailById(data.id_service_detail)
    await mtUtils.mediumPopup(UpdateServiceDetailModal)
  }
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

const checkUserSelectedData = () => {
  if (checkedData.value === 0) {
    mtUtils.alert(
      '出力対象の行を選択してください。\n最上位のチェックボックスを選択すると全選択/全解除を行います。',
      '確認',
    )
    return true
  }
  return false
}

const downloadCSV = () => {
  if (checkUserSelectedData()) return
  const headers = [
    '予防実施日',
    '次回予定日',
    '診察券番号',
    'オーナー名',
    '郵便番号',
    '都道府県',
    '住所',
    '電話番号',
    'ペットCD',
    'ペット名',
    '品種',
    'オーナーDM可否',
    'ペットDM可否',
    '予防区分',
    '商品名',
    '分類1',
    '分類2'
  ]
  let customerList_ = customerList.value.filter((c) => c.checked)
  const flattenedRows = customerList_.map((row) => {
    const mainAddress = getMainAddress(row.customer.address)
    const mainTel =
      row.customer.customer_tel.length > 0
        ? getMainTel(row.customer.customer_tel)
        : null
    const phone = mainTel ? `"${mainTel.tel_full}"` : ''
    // const phone = mainTel ? `"=${mainTel.tel_full}"` : '';

    return {
      予防実施日: row.date_start,
      次回予定日: row.date_booking_confirmed,
      診察券番号: row.customer.code_customer,
      オーナー名: getCustomerName(row.customer),
      郵便番号: mainAddress?.zip_code ?? '',
      都道府県: mainAddress?.address_prefecture ?? '',
      住所: `${mainAddress?.address_city ?? ''} ${
        mainAddress?.address_other ?? ''
      }`,
      電話番号: phone,
      ペットCD: row.pet.code_pet,
      ペット名: row.pet.name_pet,
      品種: `${getTypeAnimal(row.pet.id_cm_animal)?.name_common ?? ''} / ${
        getBreedName(row.pet.id_cm_breed) ?? ''
      }`,
      オーナーDM可否: row.customer.flg_dm ? '可' : 'NG',
      ペットDM可否: row.pet.flg_dm ? '可' : 'NG',
      予防区分: typePreventionName(row.type_prevention),
      商品名: row.item_service_name,
      // 分類: `${row.name_category1} / ${row.name_category2}`,
      分類1: row.name_category1,
      分類2: row.name_category2
    }
  })

  if (flattenedRows.length === 0) {
    console.warn('No data found to export.')
    return // Exit if there's no data
  }

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...flattenedRows.map((row) =>
      headers
        .map((header) => {
          const fieldValue = row[header] ?? ''
          return typeof fieldValue === 'string' && fieldValue.includes(',')
            ? `"${fieldValue}"`
            : fieldValue
        })
        .join(',')
    )
  ].join('\n')

  // Generate the file name
  const currentDate = dateFormat(getDateToday(), 'YYYYMMDD')
  const loggedInUserName = authStore.getAuthUser.name_display
  const fileName = `${currentDate}_DMリスト_${loggedInUserName}.csv`

  // Export the file using Quasar's exportFile utility
  // const status = exportFile(fileName, csvContent, 'text/csv')
  const status = exportToCSV(fileName, csvContent)

  if (status !== true) {
    console.error('Error: CSVダウンロードに失敗しました。')
  }
}

function exportToCSV(fileName, csvContent) {
  const utf8Array = new TextEncoder().encode(csvContent)

  // Add BOM to ensure correct encoding detection in Excel
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])

  const uint8Array = new Uint8Array([...bom, ...utf8Array])

  const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-8' })
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, fileName)
    return true
  } else {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  }
}

const getPdfMappingJson = async (currentJson: any) => {
  let currentClinic = {}
  if (clinicStore.getClinic?.id_clinic != currentJson.customer.id_clinic && _.has(currentJson.customer , 'id_clinic')) {
    currentClinic = await clinicStore.fetchClinicById(
      currentJson.customer.id_clinic
    )
  } else {
    currentClinic = clinicStore.getClinic
  }

  const pdfMappingJson = {}
  pdfMappingJson.id_pet = currentJson.pet
  pdfMappingJson.id_customer = currentJson.customer
  pdfMappingJson.id_clinic = currentClinic
  pdfMappingJson.booking = currentJson.booking

  return pdfMappingJson
}

function base64ToBlob(base64, type = 'application/pdf') {
  const base64String = base64.split(',')[1] || base64
  const byteCharacters = atob(base64String)
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type })
}

const onBasePdfSelect = async (selectedPrintTemplate: any , options?:{ hasBackground: number }) => {
  const customers = customerList.value.filter((item:any) => item.checked)
  if (customers.length <= 0) {
    mtUtils.autoCloseAlert('まず顧客を選択してください')
    return
  }
  const customersData = await Promise.all(
    customers.map(async (c) => {
      let pdfJson = await getPdfMappingJson(c)
      return pdfJson
    })
  )
  const data = {
    has_bg: options?.hasBackground ?? 0,
    customers: customersData,
    id_print: selectedPrintTemplate,
    mapped_attributes: regularAttributes
  }
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'mst/generateDmCustomerPdf',
    data
  )
  if (response) {
    const base64Pdf = response.pdf
    const blob = base64ToBlob(base64Pdf)
    const pdfUrl = URL.createObjectURL(blob)

    // Create a temporary anchor element
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'customer_report.pdf' // Specify the desired file name
    document.body.appendChild(a) // Append the anchor to the body
    a.click() // Programmatically click the anchor to trigger the download
    document.body.removeChild(a) // Remove the anchor from the document

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(pdfUrl)
  }
}

const downloadDmPdf = () => {
  if (checkUserSelectedData()) return
  mtUtils.smallPopup(SelectPrintTemplate, {
    callBack: onBasePdfSelect,
    type_print: 1
  })
}

const downloadCompleteDmPdf = () => {
  if (checkUserSelectedData()) return
  mtUtils.smallPopup(SelectDmPrintTemplates, {
    callBack: onBasePdfSelect,
    type_prints: [1, 2]
  })
}

const openTackSealModal = () => {
 mtUtils.smallPopup(UpdateTackSealModal, { mode: 'print' })
}


const openNotificationModal = () => {
  const checkedCustomers = customerList.value.filter((r: any) => r.checked)
  if (checkedCustomers.length == 0) {
    mtUtils.alert(
      '出力対象の行を選択してください。\n最上位のチェックボックスを選択すると全選択/全解除を行います。',
      '確認',
    )
    return
  }

  mtUtils.popup(UpdateInfoListModal, {
    lineMessageType: 'multicast_message',
    checkedCustomers: checkedCustomers
  })
}

function checkedRowList(value: any) {
  customerList.value = customerList.value.map((r: any) => ({
    ...r,
    checked: value
  }))
}

const totalData = computed(() => {
  return customerList.value.length
})
const checkedData = computed(() => {
  return customerList.value.filter((r: any) => r.checked).length
})

onMounted(async () => {
  await init(true)

  // set page title
  setPageTitle('DMリスト作成')

  search()
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar
        class="text-primary q-pa-none flex item-center justify-between"
      >
        <div class="flex items-center">
          <q-toolbar-title class="title2 bold text-grey-900">
            予防実施ペット DMリスト抽出
            <q-btn dense flat round @click="openHelpMenu1" class="q-mx-sm">
              <q-icon size="20px" name="help_outline" />
            </q-btn>
          </q-toolbar-title>
        </div>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchParam.booking_confirmed_date_start"
                autofocus
                class="col-2"
                outlined
                label="予約日：Start"
                type="date"
              />
              <MtFormInputDate
                v-model:date="searchParam.booking_confirmed_date_end"
                class="col-2 q-mx-sm"
                label="予約日：End"
                outlined
                type="date"
              />
              <MtFormPullDown
                v-model:selected="searchParam.type_prevention"
                class="col-4"
                :options="typePreventionV1"
                label="予防区分"
                outlined
                style="min-width: 200px"
              />
              <q-btn outline @click="openSearchModal" class="q-mx-sm">
                検索条件
                <q-badge v-if="getDmSearchCount > 0" color="red" floating>
                  {{ getDmSearchCount }}
                </q-badge>
              </q-btn>
              <q-btn
                color="primary"
                text-color="white"
                unelevated
                @click="search"
              >
                <q-icon name="search" size="20px" class="q-mr-xs" />
                検索
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchParam.booking_confirmed_date_start"
                autofocus
                class="col"
                outlined
                label="予約日：Start"
                type="date"
              />
              <MtFormInputDate
                v-model:date="searchParam.booking_confirmed_date_end"
                class="col q-mx-sm"
                label="予約日：End"
                outlined
                type="date"
              />
              <MtFormPullDown
                v-model:selected="searchParam.type_prevention"
                class="col-3"
                :options="typePreventionV1"
                label="予防区分"
                outlined
                style="min-width: 200px"
              />
              <q-btn outline @click="openSearchModal" class="q-mx-sm">
                <q-icon name="tune" size="20px" />
              </q-btn>
              <q-btn
                color="primary"
                text-color="white"
                unelevated
                @click="search"
              >
                <q-icon name="search" size="20px" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="q-mt-sm">
      <div class="flex justify-between items-center q-pt-sm q-mb-xs q-px-md">
        <div class="">
          検索結果 {{ totalData }} 件 / {{ checkedData }} 件 選択中
        </div>
        <div class="flex justify-end">
          <MtFormRadiobtn
            v-model:selected="searchParam.type_distinct"
            label="重複オーナー除外"
            val="1"
          />
          <MtFormRadiobtn
            v-model:selected="searchParam.type_distinct"
            class="q-mr-md"
            label="重複ペット除外"
            val="2"
          />
          <!--Download CSV-->
          <q-btn outline unelevated class="q-mr-sm" @click="downloadCSV">
            <q-icon name="download" class="text-grey-700 q-mr-xs" size="16px" />
            CSV
          </q-btn>
          <!--Download DM PDF-->
          <q-btn outline unelevated class="q-mr-sm" @click="downloadDmPdf">
            <q-icon name="download" class="text-grey-700 q-mr-xs" size="16px" />
            PDF
          </q-btn>
          <!--Download DM PDF-->
          <q-btn
            outline
            unelevated
            class="q-mr-sm"
            @click="downloadCompleteDmPdf"
          >
            <q-icon name="download" class="text-grey-700 q-mr-xs" size="16px" />
            (調整中)ハガキ印刷
          </q-btn>
          <!--Open tackseal modal-->
          <q-btn class="q-mr-sm" @click="openTackSealModal" outline unelevated>
            タックシール
          </q-btn>
          <!--Open t-info modal-->
          <q-btn @click="openNotificationModal" outline unelevated>
            お知らせ送信
          </q-btn>
        </div>
      </div>
      <MtTable2
        :columns="columns"
        :rows="customerList"
        :rowsBg="true"
        :style="{ boxShadow: 'none' }"
        class="custody-table"
        @checked="checkedRowList"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            @click="onRowClick(row)"
            class="small-table-font"
          >
            <div v-if="col.field == 'checkbox'">
              <MtFormCheckBox v-model:checked="row.checked" />
            </div>
            <div
              v-if="col.field == 'customer_name'"
              @click.stop="openCustomerModal(row.customer)"
              class="cursor-pointer"
            >
              <div>
                {{ row?.customer?.code_customer }}
                <span
                  v-if="row.customer"
                  class="caption2 regular text-grey-600"
                >
                  {{ row.customer['name_kana_family'] }}
                  {{ row.customer['name_kana_first'] }}
                </span>
              </div>
              <div class="text-blue">
                {{ getCustomerName(row.customer) }}
                {{ row.customer?.['type_customer_color'] }}
                <q-icon
                  v-if="row.customer && row.customer?.['type_customer_color']"
                  :color="
                    getCustomerLabelColor(row.customer?.['type_customer_color'])
                  "
                  class="q-ml-xs"
                  name="circle"
                  size="12px"
                  :style="{
                    color: getCustomerLabelColor(
                      row.customer['type_customer_color']
                    )
                  }"
                />
              </div>
            </div>
            <div v-else-if="col.field == 'phone'">
              <div v-if="row.customer && row.customer.customer_tel">
                {{
                  row.customer.customer_tel.length > 0 &&
                  getMainTel(row.customer.customer_tel)?.tel_full
                    ? formatPhoneNumber(getMainTel(row.customer.customer_tel)?.tel_full)
                    : ''
                }}
              </div>
            </div>
            <div v-else-if="col.field == 'name_pet'">
              <div class="avatar-container" @click.stop="openDetailPet(row)">
                <img
                  v-if="row"
                  :alt="row.pet['name_pet']"
                  :src="getPetImageUrl(row.pet)"
                  class="image-responsive"
                  loading="lazy"
                  @error="handleImageError($event, row.pet)"
                />
                <div v-else class="default bg-grey-300" />
                <div>
                  <span class="caption2 regular text-grey-600">{{
                    row.pet['name_kana_pet']
                  }}</span>
                  <div class="text-blue text-bold">
                    {{ row.pet['name_pet'] }}
                    <q-icon
                      :color="getTypeAnimalColor(row.pet['id_cm_animal'])"
                      :style="{
                        color: getTypeAnimalColor(row.pet['id_cm_animal'])
                      }"
                      class="q-ml-xs"
                      name="circle"
                      size="12px"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="col.field == 'id_cm_breed'">
              <span v-if="row.pet.id_cm_animal">
                {{ getTypeAnimal(row.pet['id_cm_animal'])?.name_common }}
              </span>
              <span
                v-if="
                  row.pet.id_cm_breed && getBreedName(row.pet['id_cm_breed'])
                "
              >
                {{ ' / ' + getBreedName(row.pet['id_cm_breed']) }}
              </span>
            </div>
            <div v-else-if="col.field == 'id_cm_breed'"></div>
            <div v-else-if="col.field == 'address'" key="address" auto-width>
              <div
                v-if="
                  row.customer &&
                  row.customer.address &&
                  row.customer.address.length &&
                  row.customer.address.length > 0
                "
                class="column"
              >
                <span>
                  {{
                    getMainAddress(row.customer.address)?.address_prefecture ??
                    ''
                  }}
                  {{
                    getMainAddress(row.customer.address)?.address_city ?? ''
                  }} </span
                ><span>
                  {{
                    getMainAddress(row.customer.address)?.address_other ?? ''
                  }}
                </span>
              </div>
            </div>
            <div
              v-else-if="col.field == 'ISU'"
              class="text-blue cursor-pointer"
              @click="openTreatmentModal(row)"
            >
              {{ row['item_service_name'] }}
            </div>
            <div v-else-if="col.field == 'type_prevent'">
              {{ typePreventionName(row['type_prevention']) }}
            </div>
            <div v-else-if="col.field == 'flg_dm'">
              <span
                v-if="row.customer"
                :class="
                  row.customer['flg_dm'] ? 'text-positive' : 'text-darkred'
                "
                >{{ row.customer['flg_dm'] ? '可' : 'NG' }}</span
              >
            </div>
            <div v-else-if="col.field == 'pet_dm'">
              <span
                :class="row.pet['flg_dm'] ? 'text-positive' : 'text-darkred'"
                >{{ row.pet['flg_dm'] ? '可' : 'NG' }}</span
              >
            </div>
            <div v-else-if="col.field == 'categories'">
              <p class="q-ma-none">{{ row['name_category1'] }}</p>
              <p class="q-ma-none">{{ row['name_category2'] }}</p>
            </div>

            <div v-else>
              <!--date start of type-prevent-->
              {{ row[col.field] }}
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
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

.small-table-font {
  font-size: 14px !important;
  color: #000;
}
</style>
