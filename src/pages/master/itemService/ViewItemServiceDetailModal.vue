<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import useCategoryStore from '@/stores/categories'
import OptionModal from '@/components/OptionModal.vue'
import useCustomerStore from '@/stores/customers'
import useManufacturerStore from '@/stores/manufacturers'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import UpdateDosageFixedModal from './dosage/UpdateDosageFixedModal.vue'
import UpdateDosageFixedDetailModal from './dosage/UpdateDosageFixedDetailModal.vue'
import UpdateItemServiceUnitModal from './UpdateItemServiceUnitModal.vue'
import UpdateDosageVariableModal from './dosage/UpdateDosageVariableModal.vue'
import UpdateItemServiceModal from './UpdateItemServiceModal.vue'
import UpdateOptionItemServiceModal from './UpdateOptionItemServiceModal.vue'
import { useRoute, useRouter } from 'vue-router'
import useDoseStore from '@/stores/dose-frequencies'
import { storeToRefs } from 'pinia'
import { copyText, isBitSet, roundFloat } from '@/utils/aahUtils'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { groupBy, sortBy } from 'lodash'
import MtTable2 from '@/components/MtTable2.vue'
import { useServiceOptionStore } from '@/stores/service_option'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCommonStore from '@/stores/common'
import {
  typeBodyWeightUnit,
  typeDosageCalculation,
  typeInsurer,
  typeItem,
  typeMedicineCategory,
  typeMedicineRegulation,
  typePreventionV1,
  typeTax
} from '@/utils/enum'
import { Category, Common } from '@/types/types'
import { formatNumber } from '../../../utils/helper'
import { itemServiceHelperContents } from '@/utils/menuHelperContents'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { HIDE_CATEGORY_FREQUENCY } from '@/utils/const/costCategoryItemDetail'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import useModalStore from '@/stores/modal'


const {
  getCommonTypeServiceOptionList,
  getCommonTypeMedicineFormatOptionList
} = storeToRefs(useCommonStore())

const params = defineProps<{
  id: string
  sectionTo: number
}>()
const emits = defineEmits(['close'])
const refresh = ref(false)
const readonlyLabels = reactive({
  type_service: '',
  type_item: '',
  category1: '',
  category2: ''
})
const itemServiceObj = reactive({
  id_item_service: '',
  flg_service: false,
  type_service: null,
  type_item: null,
  name_item_service: '',
  name_kana_item_service: '',
  name_item_service2: '',
  name_short: '',
  id_category1: '',
  id_category2: '',
  flg_temp_cash: false, 
  flg_prevention: false,
  flg_drip_carrier: false,
  flg_plus_item: false,
  type_prevention: null,
  flg_pet_custody_control: false,

  id_manufacturer: '',
  id_customer_supplier: '',
  code_item_supplier: '',
  memo_unit: '',
  val_top30: '',

  memo_item_description: '',
  memo_rule: '',
  memo_alert: '',

  flg_insurance_anicom: false,
  flg_insurance_ipet: false,
  flg_unsellable: false,
  flg_discount: false,
  flg_anesthesia: false,
  flg_surgery: false,
  flg_stop_purchase: false,
  flg_calendar: false,
  rate_discount_max: null,
  date_stop_purchase: null,
  flg_discontinued: false,
  date_discontinued: null,
  display_order: null,
  image_path1: null,
  item_service_unit_list: []
})
const pillCalculationUI = ref([])
const pillCalculationOption = ref([])

const medicineObj = reactive({
  type_medicine_format: null,
  id_dosage_frequency_1: '',
  id_dosage_frequency_2: '',
  id_dosage_frequency_3: '',
  type_dosage_calculation: null,
  type_medicine_category: null,
  type_medicine_regulation: null,
  flg_for_bird: false,
  flg_for_cat: false,
  flg_for_dog: false,
  flg_for_rabbit: false,
  flg_for_other_animals: false,
  flg_prohibited_for_cat: false,
  flg_prohibited_for_dog: false,
  memo_package_unit: '',
  memo_efficacy: '',
  memo_sideeffect: '',
  memo_dose: '',
  memo_stock: '',
  url_nval: '',
  flg_dosage_fixed: false,
  flg_dosage_variable: false,
  flg_dosage_per_head: false,
  flg_dosage_quantity: false,
  flg_no_efficacy_ingredient: false,
})

const router = useRouter()
const route = useRoute()

const manufacturerStore = useManufacturerStore();
const customerStore = useCustomerStore();
const categoryStore = useCategoryStore();
const itemStore = useItemStore();
const itemUnitStore = useItemServiceUnitStore();
const serviceOptionStore = useServiceOptionStore()
const doseStore = useDoseStore();
const commonStore = useCommonStore();
const { getAllDoses } = storeToRefs(doseStore);
const { getItems } = storeToRefs(itemStore)
const {getServiceOption} = storeToRefs(serviceOptionStore)

const isEdit = ref(false)
const parentCategory: any = ref([])
const parentCategoryDefault: any = reactive([])
const subCategory: any = ref([])
const subCategoryDefault: any = reactive([])

const itemServiceUnitList: any = ref([]);
const dosagefixedListByGroup: any = ref([]);
const dosageVariables: any = ref([]);
const dosageVariableGroup: any = ref({});
const itemServiceUnitInfo: any = ref({});

const itemImage = ref()

const f1_status = ref('unchanged')
const itemImagePreview = ref()
const commonOptionList: any = ref([])
const commonOptionList1: any = ref([])

const typeInsurerItem: any = ref([])
const typePreventionItem: any = ref([])

const tab = ref('ServiceProductDetails')
const medecineTabItems = ref([
  { name: 'ServiceProductDetails', text: '基本', },
  { name: 'PharmaceuticalDetails', text: '医薬品詳細', },
  { name: 'ItemServiceUnit', text: '品名包装単位リスト', },
  { name: 'DoseSetting', text: '服用量設定', },
  { name: 'OptionItemService', text: 'オプションリスト', },
])
const tabItems = ref([
  { name: 'ServiceProductDetails', text: 'サービス商品詳細', },
  { name: 'ItemServiceUnit', text: '品名包装単位リスト', },
  { name: 'OptionItemService', text: 'オプションリスト', },
])
const menuOptions = [
    {
      title: 'URLコピー',
      name: 'copy_url',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
const initOnce = async () => {
  //Hide PharmaceuticalDetails if flg_service is true
  if (itemServiceObj.flg_service || itemServiceObj.type_item !== 1) {
    // Remove item with the name PharmaceuticalDetails and DoseSetting
    const itemsToRemove = ['PharmaceuticalDetails', 'DoseSetting'];

    itemsToRemove.forEach(name => {
      const indexToRemove = medecineTabItems.value.findIndex(item => item.name === name);
      if (indexToRemove !== -1) {
        medecineTabItems.value.splice(indexToRemove, 1);
      }
    });
  }
}
const openDosageFixedModal = async (itemData: any = null) => {
  await mtUtils.smallPopup(UpdateDosageFixedModal, { data: itemData, itemService: itemServiceObj })
  init()
}

const openDosageVariableModal = async (itemData: any = {}) => {
  itemData.id_item_service_unit = itemServiceUnitInfo.value.id_item_service_unit
  await mtUtils.smallPopup(UpdateDosageVariableModal, { data: itemData, itemService: itemServiceObj })
  init()
}

const openItemServiceUnitModal = async (itemData: any = null) => {
  await mtUtils.mediumPopup(UpdateItemServiceUnitModal, {
    data: itemData,
    propServiceItem: itemServiceObj,
    initFunc: () => {
      init()
    }
  })
  init()
};

const openDosageFixedDetailModal = async (detailData: any = null, itemData: any = null) => {
  await mtUtils.smallPopup(UpdateDosageFixedDetailModal, { data: detailData, serviceItem: itemData, id_item_service: itemServiceObj?.id_item_service })
  init()
}

const openOptionItemServiceModal = async (serviceData: any = null) => {
  const propServiceItem = itemServiceObj
  await mtUtils.smallPopup(UpdateOptionItemServiceModal, {serviceData, propServiceItem})
  init()
}
const taxLabel = computed(() => {
  const typeTaxValue = itemServiceObj?.type_tax
  const tax = typeTax.find((t) => t.value === typeTaxValue)
  return tax?.label ?? 'Unknown Tax Type'
})


const getPrefixCategoryService = computed(() => {
  const prefix = getCommonTypeServiceOptionList.value.find(
    (v: Common) => v.id_common === itemServiceObj.id_cm_type_service
  )?.code_func2

  return prefix
})


const getPrefixCategoryItem = computed(() => {
  let prefix = ''
  if (![1, 2].includes(itemServiceObj.type_item)) {
    switch (itemServiceObj.type_item) {
      case 3:
        prefix = 'SP'
        break
      case 4:
        prefix = 'MI'
        break
      case 5:
        prefix = 'NI'
        break
      case 6:
        prefix = 'OI'
        break
    }
  }

  return prefix
})

const openHelpMenu = async () => {
  await mtUtils.mediumPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage.title,
    content: itemServiceHelperContents.itemServiceViewPage.content,
  })
}

const openHelpMenu3 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage3.title,
    content: itemServiceHelperContents.itemServiceViewPage3.content,
  })
}

const openHelpMenu4 = async () => {
  await mtUtils.mediumPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage4.title,
    content: itemServiceHelperContents.itemServiceViewPage4.content,
  })
}

const openHelpMenu5 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage5.title,
    content: itemServiceHelperContents.itemServiceViewPage5.content,
  })
}

const openHelpMenu6 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage6.title,
    content: itemServiceHelperContents.itemServiceViewPage6.content,
  })
}

const modalStore = useModalStore()

const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'copy_url') {
      const itemServicePath = 'SearchItemServiceList'
      const baseUrl = `${window.location.origin}/${itemServicePath}`
      const url = new URL(baseUrl)
      const urlParams = new URLSearchParams()
      urlParams.append('id', itemServiceObj.id_item_service)
      url.search = urlParams.toString();
      await navigator.clipboard.writeText(url)
      localStorage.setItem('pageAction', 'itemServiceDetails')
      localStorage.setItem('pageActionParam', itemServiceObj.id_item_service)
      mtUtils.autoCloseAlert('URLをコピーしました。')
    }

    if (selectedOption.name == 'edit') {
      await mtUtils.popup(UpdateItemServiceModal, { data: itemServiceObj })
      init()
    }

    if (selectedOption.name == 'delete') {
      modalStore.open({
        component: ExtraConfirmationModal,
        data: {
          submitFn: async () => {
            modalStore.toggleLoading(true)
            mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/item_services/${params.id}`, {})
              .then(() => {
                modalStore.close()
                closeModal()
                mtUtils.autoCloseAlert(aahMessages.success)
              })
              .finally(() => {
                modalStore.toggleLoading(false)
              })
          },
        }
      })
    }
  }
}
const getUnitName = (id_unit) => commonStore.getCommonUnitOptionList.find((v) => v.id_common == id_unit)?.name_common
const medicineColumns = [
  {
    name: 'type_animal',
    label: '動物種別',
    field: 'type_animal',
    align: 'left',
    style: 'width: 60px'
  }, {
    name: 'status1',
    label: '対象',
    field: 'status1',
    align: 'left',
    style: 'width: 60px'
  }, {
    name: 'status2',
    label: '注意',
    field: 'status2',
    align: 'left',
    style: 'width: 60px'
  },
  {
    name: 'status3',
    label: '禁忌',
    field: 'status3',
    align: 'left',
    style: 'width: 60px'
  },
]

const columns = [
  {
    name: 'code_item_service_unit',
    label: '品名・包装単位コード',
    field: 'code_item_service_unit',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'name_service_item_unit',
    label: '商品名・包装単位',
    field: 'name_service_item_unit',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'name_unit',
    label: '単位',
    field: 'name_unit',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'unit_price',
    label: '販売単価',
    field: 'unit_price',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'val_efficacyingredient',
    label: '有効成分量（単位）',
    field: 'val_efficacyingredient',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
]

const optionColumns = [
  {
    name: 'name_item_service_parent',
    label: '対象',
    field: 'name_item_service_parent',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'name_item_service_child',
    label: '連携オプション',
    field: 'name_item_service_child',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'id_category1',
    label: '大分類',
    field: 'id_category1',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'id_category2',
    label: '中分類',
    field: 'id_category2',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
  {
    name: 'flg_service',
    label: 'サービス',
    field: 'flg_service',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  }
]

const onRowClick = async (data) => {
  await mtUtils.mediumPopup(UpdateItemServiceUnitModal, {data, propServiceItem: itemServiceObj})
  init()
}
const onOptionRowClick = async (serviceData: any) => {
  const propServiceItem = itemServiceObj
  await mtUtils.smallPopup(UpdateOptionItemServiceModal, { serviceData, propServiceItem })
  init()
}

const unitName = (value) => commonStore.getCommonUnitOptionList.find((v) => v.id_common === value)?.label
const getUnitPrice = (value) => {

  const today = new Date()


  const price = value?.price_list.find((p) => {
    const formatedDateStart = new Date(p.date_start)
    formatedDateStart.setHours(0, 0, 0, 0)
    return formatedDateStart <= today && today <= new Date(p.date_end)
  })

  if (price) {
    return Math.round(price.price)
  }

  return 0
}

const closeModal = () => {
  emits('close')
}

const scrollToSection = async (val: string) => {
  const scroll = () => {
    nextTick(() => {
      const element = document.getElementById(val)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      } else {
        // Retry if element is not found
        setTimeout(scroll, 100)
      }
    })
  }
  scroll()
}

const orderAndMapServiceTableList = () => {
  if (itemServiceUnitList.value && itemServiceUnitList.value.length > 0) {
    // sort list by display order
    itemServiceUnitList.value.sort((itemA: any, itemB: any) => {
      return parseInt(itemA.display_order) - parseInt(itemB.display_order)
    })
  }

  Object.values(dosagefixedListByGroup.value).map((dosagefixedList: any) => {
    if (dosagefixedList && dosagefixedList.length > 0) {
      // sort list by display order
      dosagefixedList.sort((itemA: any, itemB: any) => {
        return parseInt(itemA.display_order) - parseInt(itemB.display_order)
      }).sort((itemAA: any, itemBB: any) => itemAA.type_animal - itemBB.type_animal)
      // map list
      dosagefixedList.map(item => {
        if (item?.dosage_fixed_detail_list) {
          item?.dosage_fixed_detail_list.map(itemDetail => {
            itemDetail.type_unit_label = commonStore.getCommonOptionList.find(v => v.id_common == itemDetail.id_common)?.label
            return itemDetail
          })
        }
        return item
      })
    }
  })
}

const showDosageFrequency = computed(() => {
  let status = false
  const category1 = categoryStore.getAllCategories.find((item: Category) => item.value === itemServiceObj.id_category1)?.code_category
  const category2 = categoryStore.getAllCategories.find((item: Category) => item.value === itemServiceObj.id_category2)?.code_category
  const findCategoryFrequency1 = HIDE_CATEGORY_FREQUENCY.find((item: object) => item.code_category1 == category1)
  if (findCategoryFrequency1?.code_category2 != '') {
    const findCategoryFrequency2 = HIDE_CATEGORY_FREQUENCY.find((item: object) => item.code_category2 == category2)
    if (findCategoryFrequency2) status = true
  } else {
    status = true
  }

  if (itemServiceObj.type_item == 1 && status)
    return false
  return true
})

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      itemServiceObj[key] = data[key]
    }
    for (let key in data.medicine) {
      medicineObj[key] = data.medicine[key]
    }
    if(itemServiceObj.flg_service) readonlyLabels.type_service = useCommonStore().getCommonTypeServiceOptionList.find((v: Common) => v.value === itemServiceObj.id_cm_type_service)?.label
    else readonlyLabels.type_item = typeItem.find((item: any) => item.value === itemServiceObj.type_item)?.label
    readonlyLabels.category1 = categoryStore.getAllCategories.find((item: any) => item.value === itemServiceObj.id_category1)?.label
    readonlyLabels.category2 = categoryStore.getAllCategories.find((item: any) => item.value === itemServiceObj.id_category2)?.label
  }
}

const init = async () => {
  if (isEdit.value) {
    typeAnimalUi.value.length = [] 
    let responseItemService: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/item_services/${itemServiceObj.id_item_service}`, {})
    // await serviceOptionStore.fetchServiceOptionById(itemServiceObj.id_item_service)

    if (responseItemService) {
      itemServiceUnitList.value = (responseItemService?.item_service_unit_list.sort((iSUObjA: any, iSUObjB: any) =>
        parseInt(iSUObjA.display_order) - parseInt(iSUObjB.display_order)) ?? [])
      responseItemService.item_service_unit_list = itemServiceUnitList.value
      dosagefixedListByGroup.value = groupBy(responseItemService?.dosage_fixed_list, 'id_common') ?? []
      itemServiceUnitInfo.value = responseItemService?.item_service_unit_list?.find((item: any) => item.id_item_service == itemServiceObj.id_item_service && item.type_medicine_dosage == '2') ?? {}

      assignPageData({ ...responseItemService })
      orderAndMapServiceTableList()
      itemImagePreview.value = responseItemService.image_path1
      
      dosageVariables.value = []
      if (responseItemService?.dosage_variable_list && responseItemService?.dosage_variable_list.length > 0) {
        let dosageVariablesList = responseItemService?.dosage_variable_list ?? []

        dosageVariablesList = dosageVariablesList.map(item => {
          item.medicines_label = commonStore.getCommonOptionList.find(v => v.id_common == item.id_cm_unit_medicine)?.name_common
          item.type_body_weight_unit_label = typeBodyWeightUnit.find(v => v.value == item.type_body_weight_unit)?.label
          return item
        })

        await nextTick()
        dosageVariables.value = dosageVariablesList
        dosageVariableGroup.value = groupBy(dosageVariables.value,'type_body_weight_unit')
      }
      if (responseItemService.type_insurer) {
        typeInsurerItem.value = typeInsurerItem.value.map((o: any) => ({
          ...o,
          checked: isBitSet(itemServiceObj.type_insurer, o.value)
        }))
      }
      if (responseItemService.flg_prevention) {
        typePreventionItem.value = typePreventionItem.value.map((o: any) => ({
          ...o,
          checked: isBitSet(itemServiceObj.type_prevention, o.value)
        }))
      }
      if (itemServiceObj.type_animal) {
        commonOptionList.value.map((o: any) => {
          if (isBitSet(itemServiceObj.type_animal, parseInt(o.value1))) {
            typeAnimalUi.value.push(o.value1)
          }
        })
      }

      if (itemServiceObj.medicine && itemServiceObj.medicine.type_efficacy_calculation) {
        const pillCalculationValue: number = []
        pillCalculationOption.value.map((o: any) => {
          if (isBitSet(itemServiceObj.medicine.type_efficacy_calculation, parseInt(o.code_func2))) {
            pillCalculationValue.push(o.id_common)
          }
        })
        pillCalculationUI.value = pillCalculationValue
      }
    
      if (typeAnimalUi.value.length === 0) {
        typeAnimalUi.value.push('0')
      }
    }

  }
  refresh.value = true
}

const typeAnimalUi = ref([])

const getFlgServiceData = (typeService: Number) => {
  return useCommonStore().getCommonTypeServiceOptionList.find((ser) => ser.value === typeService)?.label
}
const handleUrlClick = () => {
  if (medicineObj.url_nval !== null) {
    window.open(medicineObj.url_nval, '_blank')
  }
}

const removeImage = () => {
  itemServiceObj.image_path1 = ''
  itemImagePreview.value = ''
  f1_status.value = 'removed'
}

const openUpdateItemServiceModal = async () => {
  await mtUtils.popup(UpdateItemServiceModal, {
    data: itemServiceObj,
    callBackClose: () => {
      emits('close')
    }
  })

  await init()
}

onMounted(async () => {

  await useCommonStore().fetchPreparationCommonList({ code_common: [1, 4, 11, 12, 5] })

  typeInsurerItem.value = [...typeInsurer]
  typePreventionItem.value = [...typePreventionV1]

  pillCalculationOption.value = useCommonStore().getCommonPillDivisionOptionList.map((v: any) => ({
    label: v.name_common,
    value: v.id_common, ...v
  }))
  commonOptionList.value = useCommonStore().getCommonTypeAnimalOptionList
    .map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common,
      value1: o.code_func2
    }))

  commonOptionList1.value = useCommonStore().getCommonTypeAnimalOptionList
    .map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common,
      value1: o.code_func2
    }))

  commonOptionList1.value.splice(0, 0, { value1: '0', label: '全種' })
  
  // TODO; need to prepare the master data on login
  if (categoryStore.getAllCategories && categoryStore.getAllCategories.length > 0) {
    parentCategory.value = [
      ...categoryStore.getAllCategories.filter((i) => i?.parentCategory === 1)
    ]
    parentCategoryDefault.push(
      ...parentCategory.value
    )

    subCategory.value = [...categoryStore.getAllCategories]
    subCategoryDefault.push(...subCategory.value)

  }

  if (params.id) {
    // Update case
    isEdit.value = true
    itemServiceObj.id_item_service = params.id

  } else {
    isEdit.value = false
    // Create case
  }
  initOnce()
  await init()

  if (params.sectionTo) scrollToSection('isu-' + params.sectionTo)
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="row no-wrap items-center text-grey-900 title2 bold">
      サービス・商品 
      <q-tabs v-model="tab" class="tab-style2 q-ml-md" @update:model-value="scrollToSection">
        <template v-for="item in medecineTabItems" :key="item.name" v-if="itemServiceObj.type_item == 1">
          <q-tab class="tabsBox body2 regular q-mr-md" :name="item.name" :label="item.text" />
        </template>
        <template v-for="item in tabItems" :key="item.text" v-else-if="itemServiceObj.type_item != 1">
          <q-tab class="tabsBox body2 regular q-mr-md" :name="item.name" :label="item.text" />
        </template>
      </q-tabs>
    </q-toolbar-title>
    <q-btn dense flat round @click="openHelpMenu">
      <q-icon size="24px" name="help_outline" />
    </q-btn>
    <q-btn v-permission unelevated round @click="openUpdateItemServiceModal" class="q-mx-sm">
      <q-icon size="15px" name="edit" />
    </q-btn>
    <q-btn round flat @click="openMenu" class="q-mr-sm">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <q-card-section class="content q-px-lg q-pt-none">
    <!-- // ServiceProductDetails -->
    <div id="ServiceProductDetails" class="row q-col-gutter-none q-mb-md">
      <div class="col-12 q-pa-none">
        <div class="q-mt-xs q-mb-xs q-px-md q-py-sm text-white bg-grey-600">
          <span>詳細</span>
        </div>
      </div>
    </div>

    <div class="bg-grey-050 q-px-sm q-pb-md relative-position">
      <div class="row q-col-gutter-md q-mb-md">
        <div @click="copyText(itemServiceObj?.code_item_service)" class="col-12 cursor-pointer">
          <div class="text-grey-700 body2 regular">サービス商品コード</div>
          <div class="text-grey-900">
            {{ itemServiceObj.code_item_service }}
            <q-icon name="content_copy" class="text-blue" />
          </div>
        </div>
      </div>
      <div class="item-service-img">
        <div v-if="itemImagePreview" class="row no-wrap items-start">
          <q-img
            :src="itemImagePreview"
            class="roundedImage"
            spinner-color="white"
            style="width:170px;height:170px;"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2 text-weight-bold">
          {{ itemServiceObj.flg_service ? 'サービス' : '商品' }}
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_service">
          <MtInputForm type="text" v-model="readonlyLabels.type_service" label="サービス区分" readonly />
        </div>
        <div class="col-2" v-else>
          <MtInputForm type="text" v-model="readonlyLabels.type_item" label="商品区分" readonly />
        </div>
        <div class="col-2">
          <MtInputForm type="text" v-model="readonlyLabels.category1" label="大分類" readonly />
        </div>
        <div class="col-2">
          <MtInputForm type="text" v-model="readonlyLabels.category2" label="中分類" readonly />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2">
          <MtInputForm readonly type="text" v-model="itemServiceObj.name_item_service" label="サービス商品名" /> 
        </div>
        <div class="col-2">
          <MtInputForm readonly type="text" v-model="itemServiceObj.name_kana_item_service"
            label="サービス商品名カナ" />
        </div>
        <div class="col-2">
          <MtInputForm readonly type="text" v-model="itemServiceObj.name_short" label="診療明細表示名" />
        </div>
        <div class="col-auto">
          <q-btn dense flat round @click="openHelpMenu3">
            <q-icon size="24px" name="help_outline" />
          </q-btn>
        </div>
        <div class="col-2" v-if="itemServiceObj.type_item == '1'">
          <MtInputForm readonly type="text" v-model="itemServiceObj.name_item_service2" label="有効成分名" />
        </div>
        <div class="col-2" v-if="itemServiceObj.val_top30">
          <MtInputForm readonly type="text" v-model="itemServiceObj.val_top30" label="Top30" class="bg-accent-100" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2" v-if="itemServiceObj.flg_surgery">
          <MtFormCheckBox :disable="true" type="checkbox" label="手術" v-model:checked="itemServiceObj.flg_surgery"/>
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_anesthesia">
          <MtFormCheckBox :disable="true" type="checkbox" label="麻酔" v-model:checked="itemServiceObj.flg_anesthesia" />
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_prevention">
          <MtFormCheckBox :disable="true" type="checkbox" label="予防" v-model:checked="itemServiceObj.flg_prevention" />
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_calendar">
          <MtFormCheckBox :disable="true" type="checkbox" label="予約商品" v-model:checked="itemServiceObj.flg_calendar" />
        </div>
<!--        <div class="col-2" v-if="itemServiceObj.flg_prevention">-->
<!--          <MtFormPullDown readonly v-model:selected="itemServiceObj.type_prevention" label="予防区分"-->
<!--            :options="typePrevention" />-->
<!--        </div>-->
                <template v-if="itemServiceObj.flg_prevention">
                  <MtFormCheckBox v-if="itemServiceObj.flg_prevention == '1'" 
                    v-for="(checkbox, index) in typePreventionItem"
                    :key="index"
                    v-model:checked="checkbox.checked"
                    :label="checkbox.label"
                                  :disable="true"
                                  class="w-75px"
                                  @update:checked="checkedTypePrevention($event, checkbox)"
                  />
                </template>
        <div class="col-2" v-if="itemServiceObj.flg_pet_custody_control">
          <MtFormCheckBox :disable="true" type="checkbox" label="預かり管理" v-model:checked="itemServiceObj.flg_pet_custody_control" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2" v-if="itemServiceObj.id_manufacturer">
          <MtFormPullDown readonly v-model:selected="itemServiceObj.id_manufacturer" label="製造販売業者"
            :options="manufacturerStore.getAllManufacturers" />
        </div>
        <div class="col-2" v-if="itemServiceObj.id_customer_supplier">
          <MtFormPullDown readonly v-model:selected="itemServiceObj.id_customer_supplier" label="仕入先"
            :options="customerStore.getAllCustomers" />
        </div>
        <div class="col-2" v-if="itemServiceObj.code_item_supplier">
          <MtInputForm readonly type="text" v-model="itemServiceObj.code_item_supplier" label="取引先商品CD" />
        </div>
        <div class="col-2" v-if="itemServiceObj.memo_unit">
          <MtInputForm readonly type="text" v-model="itemServiceObj.memo_unit" label="包装単位" />
        </div>
        <div class="col-3">
          <q-select
            v-model="typeAnimalUi"
            :options="commonOptionList1"
            clearable
            dense
            disable
            label="対象動物"
            map-options
            multiple
            option-value="value1"
            use-chips
            @update:modelValue=""
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat round @click="openHelpMenu6">
            <q-icon size="24px" name="help_outline" />
          </q-btn>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm" >
        <div class="col-lg-6 col-md-6 col-sm-12" v-if="itemServiceObj.memo_item_description">
          <MtInputForm readonly autogrow type="text" v-model="itemServiceObj.memo_item_description" label="商品説明" />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12" v-if="itemServiceObj.memo_rule">
          <MtInputForm readonly autogrow type="text" v-model="itemServiceObj.memo_rule" label="院内使用ルール" />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12" v-if="itemServiceObj.memo_alert">
          <MtInputForm readonly autogrow type="text" v-model="itemServiceObj.memo_alert" label="注意事項" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-2 col-md-3 col-sm-6" v-if="itemServiceObj.flg_calendar">
          <MtFormCheckBox :disable="true" type="checkbox" label="カレンダー予約商品" v-model:checked="itemServiceObj.flg_calendar" class="bg-emerald-green text-black q-pr-sm" />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-6" v-if="itemServiceObj.flg_plus_item">
          <MtFormCheckBox v-model:checked="itemServiceObj.flg_plus_item" :disable="true" label="追加商品・サービス" type="checkbox" class="bg-emerald-green text-black q-pr-sm" />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-6" v-if="itemServiceObj.flg_merge_price">
          <MtFormCheckBox v-model:checked="itemServiceObj.flg_merge_price" :disable="true" label="技術料（会計非表示商品）" type="checkbox" class="bg-emerald-green text-black q-pr-sm" />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-6" v-if="itemServiceObj.flg_takeout">
          <MtFormCheckBox v-model:checked="itemServiceObj.flg_takeout" :disable="true" label="持ち帰り" type="checkbox" class="bg-emerald-green text-black q-pr-sm" />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-6" v-if="itemServiceObj.flg_no_illness_history">
          <MtFormCheckBox v-model:checked="itemServiceObj.flg_no_illness_history" :disable="true" label="対応歴を利用しない" type="checkbox" class="bg-emerald-green text-black q-pr-sm" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2">
          {{ itemServiceObj.flg_discount ? '割引可能商品' : '割引不可' }}
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_discount">
          <MtFormInputNumber
                v-model:value="itemServiceObj.rate_discount_max"
                :numberRange="[1, 99]"
                label="最大割引適用率"
                mode="percent"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="percent" size="12px"></q-icon>
                </template>
              </MtFormInputNumber>
        </div>
        <div class="col-2">
          <MtInputForm
            type="text"
            v-model="taxLabel"
            label="消費税区分"
            readonly
          />
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_unsellable">
          <MtFormCheckBox :disable="true" type="checkbox" label="販売不可" v-model:checked="itemServiceObj.flg_unsellable" class="bg-darkred text-white q-pr-sm" />
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_temp_cash">
          <MtFormCheckBox v-model:checked="itemServiceObj.flg_temp_cash" :disable="true" label="売上外商品" type="checkbox" class="bg-pink text-white q-pr-sm" />
        </div>
        <MtFormCheckBox
          v-for="(checkbox, index) in typeInsurerItem" :key="index"
          v-model:checked="checkbox.checked"
          :disable="true" :label="checkbox.label"
          class="col-2">
        </MtFormCheckBox>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-2" v-if="itemServiceObj.flg_stop_purchase">
          <MtFormCheckBox :disable="true" type="checkbox" label="入荷停止" v-model:checked="itemServiceObj.flg_stop_purchase" class="bg-pink text-white q-pr-sm" />
        </div>
        <div class="col-2" v-show="itemServiceObj.flg_stop_purchase">
          <MtFormInputDate readonly type="date" v-model:date="itemServiceObj.date_stop_purchase" label="入荷停止日" />
        </div>
        <div class="col-2" v-if="itemServiceObj.flg_discontinued">
          <MtFormCheckBox :disable="true" type="checkbox" label="販売停止" v-model:checked="itemServiceObj.flg_discontinued" class="bg-darkred text-white q-pr-sm" />
        </div>
        <div class="col-2" v-show="itemServiceObj.flg_discontinued">
          <MtFormInputDate readonly type="date" v-model:date="itemServiceObj.date_discontinued" label="販売停止日" />
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-2">
          <MtInputForm readonly type="text" v-model="itemServiceObj.display_order" label="表示順序" />
        </div>
      </div>
    </div>
    <!-- // ServiceProductDetails End -->

    <!-- // PharmaceuticalDetails 1 -->
    <template v-if="!itemServiceObj.flg_service && itemServiceObj.type_item == 1">
      <div id="PharmaceuticalDetails" class="row q-col-gutter-none q-mb-sm">
        <div class="col-12 q-pa-none">
          <div class="q-mt-md q-mb-xs q-px-md q-py-sm text-white bg-grey-600">
            <span>医薬品詳細</span>
          </div>
        </div>
      </div>
      <div class="bg-grey-050 q-px-sm q-pb-md">
        <div class="row items-center q-col-gutter-md q-py-sm">
          <div class="col-1">処方量 計算区分</div>
          <div class="col-auto q-ml-md" v-if="medicineObj.flg_dosage_fixed">
            <MtFormCheckBox
              label="早見表"
              v-model:checked="medicineObj.flg_dosage_fixed"
              disable
            />
          </div>
          <div class="col-auto q-ml-md" v-if="medicineObj.flg_dosage_variable">
            <MtFormCheckBox
              label="per キロ (可変)"
              v-model:checked="medicineObj.flg_dosage_variable"
              disable
            />
          </div>
          <div class="col-auto q-ml-md" v-if="medicineObj.flg_dosage_per_head">
            <MtFormCheckBox
              label="per ヘッド (可変)"
              v-model:checked="medicineObj.flg_dosage_per_head"
              disable
            />
          </div>
          <div class="col-auto q-ml-md" v-if="medicineObj.flg_dosage_quantity">
            <MtFormCheckBox
              label="数量指定"
              v-model:checked="medicineObj.flg_dosage_quantity"
              disable
            />
          </div>
        </div>
        <div class="q-my-sm">
          <MtFormCheckBox
            v-model:checked="medicineObj.flg_no_efficacy_ingredient"
            label="有効成分を指定しない"
            aria-disabled=""
          />
          <small class="text-grey-700 q-ml-sm">（※ 品名包装単位に有効成分を指定しない/できない）</small>
          <div v-if="medicineObj.flg_no_efficacy_ingredient" class="caption1 regular text-darkred">この条件下で「可変 有効成分量 範囲」を利用する際、投与量の計算は有効成分ベースではなく、投与量ベースになります。<br/>例えば、ある医薬品の指定範囲が10~30ml/kgで体重3kgの場合、投与量の提案範囲は30~90mlとなります。</div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-md" v-if="medicineObj.flg_drip_carrier">
          <div class="col-3">
            点滴ベース溶液
          </div>
        </div>
        <div v-if="showDosageFrequency" class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
              <MtFormPullDown
                type="selection"
                readonly
                v-model:selected="medicineObj.id_dosage_frequency_1"
                :options="getAllDoses"
                label="デフォルト服用回数 1"
              />
          </div>
          <div class="col-3" v-if="medicineObj.id_dosage_frequency_2 !== null">
            <MtFormPullDown
              type="selection"
              readonly
              v-model:selected="medicineObj.id_dosage_frequency_2"
              :options="getAllDoses"
              label="デフォルト服用回数 2"
            />
          </div>
          <div class="col-3" v-if="medicineObj.id_dosage_frequency_3 !== null">
            <MtFormPullDown
                type="selection"
                readonly
                v-model:selected="medicineObj.id_dosage_frequency_3"
                :options="getAllDoses"
                label="デフォルト服用回数 3"
              />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
              <MtFormPullDown
                readonly
                v-model:selected="medicineObj.type_dosage_calculation"
                :options="typeDosageCalculation"
                label="処方料金 計算区分"
              />
          </div>
          <div class="col-3" v-if="medicineObj.type_medicine_category !== null">
              <MtFormPullDown
                readonly
                v-model:selected="medicineObj.type_medicine_category"
                :options="typeMedicineCategory"
                label="製剤区分"
              />
          </div>
          <div class="col-3" v-if="medicineObj.type_medicine_regulation !== null">
              <MtFormPullDown
                readonly
                v-model:selected="medicineObj.type_medicine_regulation"
                :options="typeMedicineRegulation"
                label="規制区分"
              />
          </div>
          <div v-if="medicineObj.type_efficacy_calculation !== null" class="col-3">
            <q-select
              v-model="pillCalculationUI"
              :options="pillCalculationOption"
              dense
              label="デフォルト許容 錠剤分割"
              map-options
              multiple
              readonly
            >
              <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps">
                  <q-item-section>
                    <q-item-label v-html="opt.label" />
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-3">
            <q-select
              v-model="medicineObj.id_cm_animal"
              :options="commonOptionList"
              dense
              label="医薬品 対象動物（禁忌チェック）"
              map-options
              multiple
              use-chips
              disable
            />
          </div>
          <div class="col-6">
            <MtTable2
              :columns="medicineColumns"
              :rows="medicineObj.id_cm_animal"
              :rowsBg="true"
              class="custody-table"
              flat
            >
              <template v-slot:row="{ row }">

                <td
                  v-for="(col, index) in medicineColumns"
                  class="cursor-pointer"
                >
                  <div
                    v-if="col.field == 'type_animal'"
                    class="body1 regular text-grey-900"
                  >
                    {{ row['label'] }}
                  </div>
                  <div
                    v-if="col.field == 'status1'"
                    class="body1 regular text-grey-900"
                  >
                    <MtFormRadiobtn v-model:selected="row.status" :disable="true" :val="1"/>
                  </div>
                  <div
                    v-if="col.field == 'status2'"
                    class="body1 regular text-grey-900"
                  >
                    <MtFormRadiobtn v-model:selected="row.status" :disable="true" :val="20"/>
                  </div>
                  <div
                    v-if="col.field == 'status3'"
                    class="body1 regular text-grey-900"
                  >
                    <MtFormRadiobtn v-model:selected="row.status" :disable="true" :val="99"/>
                  </div>
                </td>
              </template>
            </MtTable2>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.memo_package_unit" label="包装単位" autogrow />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.memo_efficacy" label="効能効果" autogrow />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.memo_dose" label="用法用量" autogrow />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.memo_sideeffect" label="副作用" autogrow />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.memo_stock" label="貯蔵方法" autogrow />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm readonly type="text" v-model="medicineObj.url_nval" label="NVALリンク" iconPrepend="insert_link" :buttonAppend="medicineObj.url_nval?.length ? 'リンクを開く': null"
            :handleBtnClick="handleUrlClick"/>
          </div>
        </div>
      </div>
    </template>
    <!-- // PharmaceuticalDetails 1 End -->

    <!-- // Item Service Unit List of MEDICINE Item Service -->
    <div v-if="!itemServiceObj.flg_service && itemServiceObj.type_item === 1">
      <div id="ItemServiceUnit" class="row q-col-gutter-none q-mt-lg q-mb-md">
        <div class="col-12 q-pa-none flex justify-between bg-grey-600 items-center">
          <div class="q-mt-xs q-mb-xs q-px-md q-py-sm text-white bg-grey-600">
            <span>医薬品名・包装単位：成分及び分量</span>
          </div>
          <q-btn style="min-width: 175px; height: 36px;" class="q-mr-md" unelevated color="primary" type="button" @click="openItemServiceUnitModal()">
            <span>品名（包装単位）</span>
            <q-icon name="add" />
          </q-btn>
        </div>
      </div>
      <div class="bg-grey-050 q-px-sm q-pb-md">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 cursor-pointer">
            <span class="text-grey-900">
              医薬品名・包装単位の一覧
            </span>
          </div>
        </div>

        <MtTable2
          :columns="columns"
          :rows="itemServiceObj.item_service_unit_list"
          :rowsBg="true"
          class="custody-table"
          flat
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:row="{ row }">
            <td
              v-for="(col, index) in columns"
              @click="onRowClick(row)"
              class="cursor-pointer"
            >
              <div v-if="col.field == 'name_unit'" class="body1 regular text-grey-700">
                {{ (unitName(row.id_common) ? unitName(row.id_common) : '-') }}
              </div>
              <div v-else-if="col.field == 'val_efficacyingredient'" class="body1 regular text-grey-700">
                <span v-if="!medicineObj.flg_no_efficacy_ingredient">
                  {{
                    row.val_efficacyingredient + ' ( ' + (unitName(row.id_cm_unit_medicine) ? unitName(row.id_cm_unit_medicine) : '-') + ' ) '
                  }}
                </span>
              </div>
                <div v-else-if="col.field == 'unit_price'" class="body1 regular text-grey-700">
                  {{ row.unit_price ? formatNumber(getUnitPrice(row)) : '-' }} {{ row.flg_tax_included ? '(内税)' : ''
                  }}
                </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row[col.field] }}
              </div>
            </td>
          </template>
        </MtTable2>
      </div>
    </div>
    <!-- // Item Service Unit List of MEDICINE Item Service -->

    <!-- Item Service Unit List for NON medicine items services -->
    <div v-if="itemServiceObj.type_item !== 1">
      <div id="ItemServiceUnit" class="row q-col-gutter-none q-mt-lg q-mb-md">
        <div class="col-12 q-pa-none flex justify-between bg-grey-600 items-center">
          <div class="q-mt-xs q-mb-xs q-px-md q-py-sm text-white bg-grey-600">
            <span class="q-mr-sm">品名包装単位</span>
            <q-btn dense flat round @click="openHelpMenu4">
              <q-icon size="18px" name="help_outline" />
            </q-btn>
          </div>
          <q-btn style="min-width: 175px; height: 36px;" class="q-mr-md" unelevated color="primary" type="button" @click="openItemServiceUnitModal()">
            <span>品名包装単位</span>
            <q-icon name="add" />
          </q-btn>
        </div>
      </div>
      <div class="bg-grey-050 q-px-sm q-pb-md">
        <MtTable2
          :columns="columns"
          :rows="itemServiceObj.item_service_unit_list"
          :rowsBg="true"
          class="custody-table"
          flat
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:body="{ row }">
            <tr :id="'isu-' + row.id_item_service_unit">
              <td
                v-for="(col, index) in columns"
                @click="onRowClick(row)"
                class="cursor-pointer"
              >
                <div v-if="col.field == 'name_unit'" class="body1 regular text-grey-700">
                  {{ (unitName(row.id_common) ? unitName(row.id_common) : '-') }}
                </div>
                <div v-else-if="col.field == 'name_service_item_unit'" class="body1 regular text-grey-700">
                  {{ row.name_service_item_unit }}
                </div>
                <div v-else-if="col.field == 'unit_price'" class="body1 regular text-grey-700">
                  {{ row.unit_price ? formatNumber(getUnitPrice(row)) : '-' }} {{ row.flg_tax_included ? '(内税)' : ''
                  }}
                </div>
                <div v-else class="body1 regular text-grey-900">
                  {{ row[col.field] || '-' }}
                </div>
              </td>
            </tr>
          </template>
        </MtTable2>
      </div>
    </div>
    <!-- Item Service Unit List for NON medicine items services -->

    <!-- // Pharmaceutical detail 2 : DoseSetting -->
    <template v-if="itemServiceObj.type_item == 1">
      <div id="DoseSetting" class="row q-col-gutter-none" v-if="medicineObj.flg_dosage_variable == true || medicineObj.flg_dosage_fixed == true || medicineObj.flg_dosage_per_head == true ">
        <div class="col-12 q-pa-none">
          <div class="q-mt-md q-px-md q-py-sm text-white bg-grey-600">
            <span>処方量設定（自動計算時に使用）</span>
          </div>
        </div>
      </div>

      <div class="bg-grey-050 q-px-sm q-pb-md">
        <div class="row q-col-gutter-xs" v-if="medicineObj.flg_dosage_fixed">
          <div class="col-12 q-mb-md">
            <p class="q-mb-md">早見表</p>
            <div class="">
              <q-btn style="min-width: 175px;" @click="openDosageFixedModal()" unelevated color="primary" type="button">
                <span>早見表 体重範囲</span>
                <q-icon name="add" />
              </q-btn>
            </div>
          </div>
        </div>

        <!-- TODO; add condition to next div;  v-if="itemServiceObj.type_medicine_dosage == '1'" -->
        <div class="row q-col-gutter-xs q-my-md" v-if="medicineObj.flg_dosage_fixed">
          <div class="col-12" v-if="medicineObj.flg_dosage_fixed">
            <!--<p class="q-mb-md">早見表</p>-->
            <table class="table-custom-fixed q-mb-lg" v-for="[key, value] in Object.entries(dosagefixedListByGroup)" :key="key">
              <thead>
                <tr>
                  <td class="flex justify-center ">
                    {{ `( ${commonOptionList.find((cObj: any) => cObj.id_common == key)?.label ?? '全種'} )` }}
                  </td>
                  <template
                    v-if="itemServiceUnitList && itemServiceUnitList.length > 0">
                    <template v-for="(item, index) in itemServiceUnitList" :key="index">
                      <td>
                        <q-btn @click="openItemServiceUnitModal(item)" unelevated color="primary" :ripple="false" style="min-width: 150px;"
                          class="q-mr-sm q-px-lg full-width full-height" no-caps type="button">
                          <span>{{ item.name_service_item_unit }}</span>
                        </q-btn>
                      </td>
                    </template>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template
                  v-if="value && value.length > 0">
                  <tr v-for="(fixedDosage, index2) in value" :key="index2">
                    <td>
                      <q-btn @click="openDosageFixedModal(fixedDosage)" unelevated color="primary" :ripple="false" style="min-width: 150px;"
                        class="q-mr-sm q-px-lg full-width full-height" no-caps type="button">
                        <span>{{ roundFloat(fixedDosage.val_weight_min / 1000) }}<span class="body2">kg</span> ~ {{ roundFloat(fixedDosage.val_weight_max / 1000) }}
                        <span class="body2">kg</span>{{ '  未満 ' + ` ( ${commonOptionList.find((v) => v.value == fixedDosage.id_common)?.label ?? '全種'} )` }}</span>
                      </q-btn>
                    </td>
                    <template
                      v-if="itemServiceUnitList && itemServiceUnitList.length > 0">
                      <template v-for="(item2, index3) in itemServiceUnitList" :key="index3">
                        <td class="q-ba text-center fixed-detail-hover">
                          <div class="cursor-pointer"
                            v-if="fixedDosage.dosage_fixed_detail_list && fixedDosage.dosage_fixed_detail_list.length > 0 && fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit == item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)"
                            @click="openDosageFixedDetailModal(fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit == item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed))">
                            {{ fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit ==
                              item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)?.quantity
                            }} <span class="body2">{{ getUnitName(fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit ==
                              item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)?.id_common) }}</span>
                          </div>
                          <div v-else
                            class="fixed-detail-hover-btn cursor-pointer bg-grey-050 text-black full-width full-height"
                            @click="openDosageFixedDetailModal(null, { ...item2, id_dosage_fixed: fixedDosage.id_dosage_fixed })">
                            <q-icon name="add" />
                          </div>
                        </td>
                      </template>
                    </template>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TODO; add condition to next div; v-if="data.type_medicine_dosage == '2'" -->
        <div v-if="medicineObj.flg_dosage_variable == true || medicineObj.flg_dosage_per_head == true"
             class="row q-col-gutter-xs q-mt-md">
          <div class="col-12">
            <p class="q-mb-md">有効成分量 範囲</p>
            <div class="q-mt-sm flex" v-if="dosageVariableGroup" v-for="[key, dosageVariables] in Object.entries(dosageVariableGroup)">
              <div class="q-mb-md">
                <q-btn unelevated color="primary" class="q-mr-sm q-px-lg" no-caps type="button">
                  <span v-if="key == '1'">可変 (Kg) </span>
                  <span v-if="key == '2'">可変 (G) </span>
                  <span v-if="key == '3'">可変 </span>
                </q-btn>
              </div>
              <template v-if="dosageVariables && dosageVariables.length > 0">
                <div class="">
                  <q-btn v-for="(variable, indexVar) in dosageVariables" :key="indexVar"
                    @click="openDosageVariableModal(variable)" unelevated color="white" class="q-ba q-mr-md q-mb-md"
                    no-caps :ripple="false" text-color="black" type="button" style="min-width: 300px;">
                    <!-- Need to show the id_unit_medicine -->
                    <span>{{ variable.val_dose_min }}{{ variable.medicines_label }} ~ {{ variable.val_dose_max }} 
                      <span class="body2">{{
                          variable.medicines_label
                        }}/{{
                          variable.type_body_weight_unit_label
                        }} {{
                          ` ( ${commonOptionList.find((v: any) => v.value == variable.id_cm_animal)?.label ?? '全種'} ) `
                        }}
                      </span>
                    </span>
                  </q-btn>
                </div>
              </template>
            </div>
            <div class="q-mb-md">
              <q-btn  @click="openDosageVariableModal()"
                      unelevated color="grey-300" text-color="black" no-caps
                      class="q-mr-lg" type="button" style="min-width: 300px;">
                <q-icon name="add" />
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- // Pharmaceutical detail 2 : DoseSetting End -->

    <!-- Option Item Service List -->
    <div id="OptionItemService" class="row q-col-gutter-none q-mt-lg q-mb-md">
      <div class="col-12 q-pa-none flex justify-between bg-grey-600 items-center">
        <div class="q-mt-xs q-mb-xs q-px-md q-py-sm text-white bg-grey-600">
          <span>オプション</span>
          <q-btn dense flat round @click="openHelpMenu5">
            <q-icon size="18px" name="help_outline" />
          </q-btn>
        </div>
        <q-btn style="min-width: 175px; height: 36px;" class="q-mr-md" unelevated color="primary" type="button" @click="openOptionItemServiceModal()">
          <span>オプション</span>
          <q-icon name="add" />
        </q-btn>
      </div>
    </div>
    <div class="bg-grey-050 q-px-sm q-pb-md">
      <MtTable2
        :columns="optionColumns"
        :rows="sortBy(itemServiceObj.option_list, 'display_order', 'asc')"
        :rowsBg="true"
        class="custody-table"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした">
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in optionColumns"
            @click="onOptionRowClick(row)"
            class="cursor-pointer"
          >
            <div v-if="col.field == 'name_item_service_parent'" class="body1 regular text-grey-700">
              {{ itemServiceObj.name_item_service ?? '-' }}
            </div>
            <div v-else-if="col.field == 'name_item_service_child'" class="body1 regular text-grey-700">
              {{ row?.id_item_service_child?.name_item_service ?? '-' }}
            </div>
            <div v-else-if="col.field == 'id_category1'" class="body1 regular text-grey-700">
              {{ row?.id_item_service_child?.name_category1 ?  row?.id_item_service_child?.name_category1 : "-" }}
            </div>
            <div v-else-if="col.field == 'id_category2'" class="body1 regular text-grey-700">
              {{ row?.id_item_service_child?.name_category2 ? row?.id_item_service_child?.name_category2 : '-' }}
            </div>
            <div v-else-if="col.field == 'flg_service'" class="body1 regular text-grey-700">
              {{
                getFlgServiceData(row?.id_item_service_child?.id_cm_type_service) ? getFlgServiceData(row?.id_item_service_child?.id_cm_type_service) : "-"
              }}
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
    <!-- Option Item Service List -->
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn
        outline
        class="bg-grey-050 text-grey-800"
        type="button"
        @click="closeModal()"
      >
        <span>キャンセル</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.table-custom-fixed {
  border-spacing: 0px;

  td {
    padding: 2px;
  }

  .fixed-detail-hover {
    .fixed-detail-hover-btn {
      display: none;
      height: 32px !important;
      font-size: 14px;
      padding: 4px 0;
    }

    &:hover {
      .fixed-detail-hover-btn {
        display: inline-block;
      }
    }
  }
}

.item-service-tabs {
  width: fit-content;
  position: sticky;
  top: 0px;
  z-index: 2;

  .q-tab--active {
    min-width: 175px;
    border-radius: 5px;
  }

  .q-tab--inactive {
    min-width: 175px;
    border: 1px solid $grey-800;
    border-radius: 5px;
    background-color: $grey-100;
  }
}

.item-service-img {
  //display: block;
  //width: 150px;
  //height: 150px;
  //background: black;
  border-radius: 20px;
  position: absolute;
  right: 20px;
  top: 20px;
}

.w-75px {
  width: 125px;
}
</style>