<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
// import { toKatakana } from 'wanakana'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCustomerStore from '@/stores/customers'
import useManufacturerStore from '@/stores/manufacturers'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import useDoseStore from '@/stores/dose-frequencies'
import useItemStore from '@/stores/items'
import { concatenate, convertAllDateTimeFields, isBitSet } from '@/utils/aahUtils'
import { imageResize } from '@/utils/helper'
import { itemServiceHelperContents } from '@/utils/menuHelperContents'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import useCommonStore from '@/stores/common'
import {
  typeDosageCalculation,
  typeInsurer,
  typeItem,
  typeMedicineCategory,
  typeMedicineRegulation,
  typePreventionV1,
  typeTax
} from '@/utils/enum'
import { Common } from '@/types/types'
import { event_bus } from '@/utils/eventBus'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import useModalStore from '@/stores/modal'

const {
  getCommonTypeServiceOptionList,
  getCommonTypeMedicineFormatOptionList
} = storeToRefs(useCommonStore())
const itemStore = useItemStore(),
  categoryComponentKey = ref(0)
// TODO Set the default to NULL instead of empty string (Bai-Rinkesh)
const itemServiceObj = reactive({
  flg_service: false,
  type_service: null,
  type_item: null,
  name_item_service: '',
  name_kana_item_service: '',
  name_item_service2: '',
  name_short: '',
  id_category1: '',
  id_category2: '',
  name_category1: '',
  name_category2: '',
  type_insurer: 0,
  flg_surgery: false,
  flg_anesthesia: false,
  flg_prevention: false,
  type_prevention: null,
  flg_pet_custody_control: false,
  flg_temp_cash: false,
  flg_merge_price: false,
  id_manufacturer: '',
  id_customer_supplier: '',
  code_item_supplier: '',
  memo_unit: '',

  type_tax: 1,
  val_top30: null,
  memo_item_description: '',
  memo_rule: '',
  memo_alert: '',

  flg_discount: false,
  rate_discount_max: null,
  flg_sellable: false,
  flg_insurance_anicom: false,
  flg_insurance_ipet: false,
  flg_stop_purchase: false,
  date_stop_purchase: null,
  flg_plus_item: false,
  flg_discontinued: false,
  date_discontinued: null,
  display_order: null,
  id_cm_type_service: null,
  type_animal: null,
  flg_calendar: false,
  flg_takeout: false,
})

const typeAnimalUi = ref([])

let itemServiceObjDefault = { ...itemServiceObj }
const commonTypeAnimalOptionList: any = ref([])
const columns = [
  {
    name: 'type_animal',
    label: '動物種別',
    field: 'type_animal',
    align: 'left',
    style: 'width: 60px'
  },
  {
    name: 'status1',
    label: '対象',
    field: 'status1',
    align: 'left',
    style: 'width: 60px'
  },
  {
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
  }
]
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
  flg_dosage_quantity: true,
  flg_dosage_per_head: false,
  flg_dosage_variable: false,
  flg_dosage_fixed: false,
  id_cm_animal: [],
  id_cm_med_format: null,
  flg_no_efficacy_ingredient: false,
  type_efficacy_calculation: null,
  flg_drip_carrier: false
})

const itemImage = ref()
const itemImageFile = ref()
const f1_status = ref('unchanged')
const itemImagePreview = ref()

const typeInsurerItem = ref([])
const typePreventionItem = ref([])

const manufacturerStore = useManufacturerStore()
const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const doseStore = useDoseStore()
const { getAllDoses } = storeToRefs(doseStore)
const emits = defineEmits(['close'])
const customersList = ref<any>([])

const props = defineProps({ data: Object })

const isEdit = ref(false)

const tab = ref('pharmaceutical_details')

const parentCategory: any = ref([])
const parentCategoryDefault: any = reactive([])
const subCategory: any = ref([])
const subCategoryDefault: any = reactive([])

const serviceItem: any = ref([])

const customerSupplierList: any = ref([])
const customerSupplierListDefault: any = reactive([])

function handleItemTypeAnimal(value: any) {
  if (!value) {
    itemServiceObj.type_animal = null
    return
  }
  var tempSum = 0

  value.map(({ value1 }: any) => (tempSum += Number(value1)))
  
  itemServiceObj.type_animal = tempSum
}
const submit = async () => {
  if (isEdit.value) {
    itemServiceObj.medicine = medicineObj
    itemServiceObj.id_employee_update = localStorage.getItem('id_employee')
    if (!itemServiceObj.display_order) itemServiceObj.display_order = null
    if (!itemServiceObj.val_top30) itemServiceObj.val_top30 = null

    if (!itemServiceObj.code_category2)
      itemServiceObj.code_category2 = categoryStore.getAllCategories.find((v) => v.id_category == itemServiceObj.id_category2)?.code_category

    let formData = new FormData()

    convertAllDateTimeFields(itemServiceObj)

    formData.append('item_service_obj', JSON.stringify(itemServiceObj))

    if (f1_status.value == 'changed') {
      formData.append('image_path1', itemImageFile.value)
    } else {
      formData.append('image_path1', null)
    }

    await itemStore
      .updateItem(itemServiceObj.id_item_service, formData)
      .then(async () => {
        await itemStore.fetchItems()
        // closeModal()
        await mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    convertAllDateTimeFields(itemServiceObj)
    itemServiceObj.medicine = medicineObj
    itemServiceObj.id_clinic = JSON.parse(localStorage.getItem('id_clinic')!)
    
    let formData = new FormData()
    formData.append('item_service_obj', JSON.stringify(itemServiceObj))

    if (f1_status.value == 'changed') {
      formData.append('image_path1', itemImageFile.value)
    } else {
      formData.append('image_path1', null)
    }

    const data = await itemStore.submitItem(formData).then(async (res) => {
      await itemStore.fetchItems()
      closeModal()
      await mtUtils.autoCloseAlert(aahMessages.success)
      return res
    })
    event_bus.emit('onAddISU', data)
  }
}

const selectedCategory = async (value: any) => {
  if (value) {
    await categoryStore.fetchSubCategories(value)
    subCategory.value = [...categoryStore.getAllSubCategories]
    subCategoryDefault.push(...categoryStore.getAllSubCategories)
  }
}

const modalStore = useModalStore()

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      modalStore.open({
        component: ExtraConfirmationModal,
        data: {
          submitFn: async () => {
            modalStore.toggleLoading(true)
            mtUtils
              .callApi(
                selectOptions.reqMethod.DELETE,
                `/mst/item_services/${itemServiceObj.id_item_service}`,
                {}
              )
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
const closeModal = () => {
  emits('close')
}

const checkedFlgService = (value) => {
  if (value) {
  } else {
    delete itemServiceObj.type_service
  }
  resetItemServiceFields(['flg_service', 'type_service'])
  ++categoryComponentKey.value
}

const checkedFlgStopPurchase = (value) => {
  if (!value) {
    delete itemServiceObj.date_stop_purchase
  }
}

const checkedFlgDiscontinued = (value) => {
  if (!value) {
    delete itemServiceObj.date_discontinued
  }
}
const checkedFlgAnimal = async (value) => {
  if (value) {
  }
}

const handleMiscData = () => {
  itemServiceObj.flg_surgery = false
  itemServiceObj.flg_anesthesia = false
  itemServiceObj.flg_pet_custody_control = false
  itemServiceObj.flg_prevention = false
  // const miscSelection = [
  //   'flg_surgery',
  //   'flg_anesthesia',
  //   'flg_pet_custody_control',
  //   'flg_prevention'
  // ]

  // if (miscSelection.length) {
  //   for (let key of miscSelection) {
  //     if (key == fieldName) {
  //       itemServiceObj[key] = true
  //     } else {
  //       itemServiceObj[key] = false
  //     }
  //   }
  // }

  if (!itemServiceObj.flg_prevention) {
    delete itemServiceObj.type_prevention
  }
}

const handleFlgPrevention = (value: boolean) => {
  if (!value) {
    itemServiceObj.type_prevention = null
    typePreventionItem.value.map((item) => (item.checked = false))
  }
}

const handleNumber = (value) => {
  if (value > 30) {
    itemServiceObj.val_top30 = 30
  }
}

const handleDog = (value) => {
  if (value) {
    medicineObj.flg_for_dog = false
  }
}

const handleCat = (value) => {
  if (value) {
    medicineObj.flg_for_cat = false
  }
}

const handleCategory = (value) => {
  if (value === null) {
    itemServiceObj.id_category2 = ''
  }
}

const scrollToSection = (val) => {
  let element = document.getElementById(val)
  element.scrollIntoView({ behavior: 'smooth' })
}

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      itemServiceObj[key] = data[key]
    }
    for (let key in data.medicine) {
      medicineObj[key] = data.medicine[key]
    }
  }
}

const init = async () => {
  if (isEdit.value) {
  }

  // initialize the sub categories
  await selectedCategory(itemServiceObj.id_category1)

  // Updated the form as the value changes.
  handleNumber(itemServiceObj.val_top30)
  handleDog(medicineObj.flg_prohibited_for_dog)
  handleCategory(itemServiceObj.id_category1)
  handleCat(medicineObj.flg_prohibited_for_cat)

  // Set field's based on the flg value.
  checkedFlgService(itemServiceObj.flg_service)
  checkedFlgStopPurchase(itemServiceObj.flg_stop_purchase)
  checkedFlgDiscontinued(itemServiceObj.flg_discontinued)
}

const resetCategoryFields = () => {
  itemServiceObj.id_category1 = ''
  itemServiceObj.id_category2 = ''
  itemServiceObj.name_category1 = ''
  itemServiceObj.name_category2 = ''
  selectedCategory1(itemServiceObj.id_category1)
  selectedCategory2(itemServiceObj.id_category2)
}

const selectedCategory1 = (value) => {
  if (!value) {
    itemServiceObj.name_category1 = ''
  }
  itemServiceObj.id_category1 = value
}

const selectedCategory2 = (value) => {
  if (!value) {
    itemServiceObj.name_category2 = ''
  }
  itemServiceObj.id_category2 = value
}

const selectedCategory1Name = (value) => {
  itemServiceObj.name_category1 = value
}
const selectedCodeCategory1 = (value) => {
  itemServiceObj.code_category2 = value
}
const selectedCategory2Name = (value) => {
  itemServiceObj.name_category2 = value
}

const resetItemServiceFields = (exceptions = [], callback = () => {}) => {
  if (!isEdit.value) {
    for (let key in itemServiceObj) {
      if (!exceptions.includes(key)) {
        itemServiceObj[key] = itemServiceObjDefault[key]
      }
    }
  }
  callback()
}

// const convertToKatakana = () => {
//   // 入力された値をカタカナに変換
//   itemServiceObj.name_kana_item_service = toKatakana(
//     itemServiceObj.name_item_service
//   )
// }

async function checkedInsurerFlg(event: any, checkbox: any) {
  if (event) {
    if (!itemServiceObj.type_insurer) itemServiceObj.type_insurer = 0
    itemServiceObj.type_insurer =
      parseInt(itemServiceObj.type_insurer) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(itemServiceObj.type_insurer, checkbox.value)) {
    itemServiceObj.type_insurer =
      parseInt(itemServiceObj.type_insurer) - parseInt(checkbox.value)
  }
}

async function checkedTypePrevention(event: any, checkbox: any) {
  if (event) {
    if (!itemServiceObj.type_prevention) itemServiceObj.type_prevention = 0
    itemServiceObj.type_prevention =
      parseInt(itemServiceObj.type_prevention) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(itemServiceObj.type_prevention, checkbox.value)) {
    itemServiceObj.type_prevention =
      parseInt(itemServiceObj.type_prevention) - parseInt(checkbox.value)
  }
}

const handleUrlClick = () => {
  if (medicineObj.url_nval !== null) {
    window.open(medicineObj.url_nval, '_blank')
  }
}

const openHelpMenu1 = async () => {
  await mtUtils.mediumPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage.title,
    content: itemServiceHelperContents.itemServiceViewPage.content,
  })
}

const openHelpMenu2 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage2.title,
    content: itemServiceHelperContents.itemServiceViewPage2.content,
  })
}

const openHelpMenu7 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage7.title,
    content: itemServiceHelperContents.itemServiceViewPage7.content,
  })
}

const openHelpMenu8 = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: itemServiceHelperContents.itemServiceViewPage8.title,
    content: itemServiceHelperContents.itemServiceViewPage8.content,
  })
}

const removeImage = () => {
  itemServiceObj.image_path1 = ''
  itemImagePreview.value = ''
  f1_status.value = 'removed'
}

const onFilePicked = async (e, type) => {
  const files = e.target.files;
  const reader = new FileReader();
  reader.onload = (e) => {
    mtUtils.smallPopup(ImageCropper, {image: e.target.result})
  };  
  reader.readAsDataURL(files[0]);
}

const updateNameShort = () => {
  if(!isEdit.value) itemServiceObj.name_short = itemServiceObj.name_item_service
}

event_bus.on('cropped-image', async (image) => {
  await imageResize(image.blob).then((i) => {
    itemImageFile.value = i
    itemImagePreview.value = URL.createObjectURL(i)
    f1_status.value = 'changed'
  })
  .catch((error) => {
    console.error('Failed to resize image:', error)
  })
})
onMounted(async () => {
  // TODO; need to prepare the master data on login
  customerStore.getCustomerListOptions
    .filter((v: any) => v.flg_supplier)
    .map((v: any) => {
      customerSupplierListDefault.push({
        value: v.id_customer,
        label: concatenate(v.code_customer, v.name_family, v.name_first)
      })
    })

  typeInsurerItem.value = [...JSON.parse(JSON.stringify(typeInsurer))]

  typePreventionItem.value = [...JSON.parse(JSON.stringify(typePreventionV1))]

  customerSupplierList.value = [...customerSupplierListDefault]

  await mtUtils.promiseAllWithLoader([
    doseStore.fetchPreparationDoses(),
    manufacturerStore.fetchPreparationManufacturers(),
    useCommonStore().fetchPreparationCommonList({ code_common: [1, 11, 12, 5] })
  ])

  pillCalculationOption.value = useCommonStore().getCommonPillDivisionOptionList.map((v: any) => ({
    label: v.name_common,
    value: v.id_common, ...v
  }))

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common,
      value1: o.code_func2
    }))

  // TODO; need to prepare the master data on login
  if (
    categoryStore.getAllCategories &&
    categoryStore.getAllCategories.length > 0
  ) {
    parentCategory.value = [
      ...categoryStore.getAllCategories.filter((i) => i?.parentCategory === 1)
    ]
    parentCategoryDefault.push(...parentCategory.value)
  }

  if (props.data?.id_item_service) {
    isEdit.value = true
    // Update case
    assignPageData(props.data)
    itemImagePreview.value = props.data.image_path1
    if (itemServiceObj.type_insurer) {
      typeInsurerItem.value = typeInsurerItem.value.map((o: any) => ({
        ...o,
        checked: isBitSet(itemServiceObj.type_insurer, o.value)
      }))
    }

    if (itemServiceObj.flg_prevention) {
      typePreventionItem.value = typePreventionItem.value.map((o: any) => ({
        ...o,
        checked: isBitSet(itemServiceObj.type_prevention, o.value)
      }))
    }
    
    if (itemServiceObj.type_animal) {
      commonTypeAnimalOptionList.value.map((o: any) => {
        if (isBitSet(itemServiceObj.type_animal, parseInt(o.value1))) {
          typeAnimalUi.value.push(o.value1)
        }
      })
    }

    if (itemServiceObj.medicine && itemServiceObj.medicine.type_efficacy_calculation) {
      pillCalculationOption.value.map((o: any) => {
        if (isBitSet(itemServiceObj.medicine.type_efficacy_calculation, parseInt(o.code_func2))) {
          pillCalculationUI.value.push(o)
        }
      })
    }
    
  } else {
    isEdit.value = false
    // Create case
  }
  if (customerStore.getCustomers) {
    const filterdCustomers = customerStore.getCustomers.filter(
      (cus: any) => cus?.flg_supplier == true
    )
    customersList.value = customerStore.getAllCustomers?.filter((customer) =>
      filterdCustomers?.find((cus) => cus?.id_customer == customer?.value)
    )
  }
  init()
})

// File input reference
const itemCSV = ref<HTMLInputElement | null>(null);

// Trigger the file input dialog
const triggerFileSelect = () => {
  itemCSV.value?.click();
};

const onTypeEfficacyChange = (value) => {
  medicineObj.type_efficacy_calculation = value.reduce((accumulator, currentValue) => {
    return accumulator + parseInt(currentValue.code_func2)
  }, 0)
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        サービス・商品（親商品の登録）
        <q-tabs
          v-model="tab"
          class="tab-style2 q-ml-md"
          @update:model-value="scrollToSection"
        >
          <q-tab
            class="tabsBox body2 regular q-mr-md"
            name="pharmaceutical_details"
            label="基本"
          />
          <q-tab
            class="tabsBox body2 regular q-mr-md"
            name="medicine_section"
            label="医薬品詳細"
            v-if="!itemServiceObj.flg_service && itemServiceObj.type_item == 1"
          />
        </q-tabs>
      </q-toolbar-title>
      <q-btn dense flat round @click="openHelpMenu1" class="q-mx-sm">
        <q-icon size="20px" name="help_outline" />
      </q-btn>
      <q-btn v-if="props.data" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl q-pt-none">
      <div
        id="pharmaceutical_details"
        class="row q-mb-md bg-grey-600 text-grey-100 title2 q-pa-sm q-pl-md"
      >
        基本情報
      </div>
      <div class="row q-col-gutter-md q-mb-sm relative-position">
        <div class="col-3" v-if="itemServiceObj.type_item == 1 || itemServiceObj.flg_service == false">
          <MtFormCheckBox            
            type="checkbox"
            @update:checked="checkedFlgService"
            label="サービス"
            v-model:checked="itemServiceObj.flg_service"
            :disable="isEdit"
          />
        </div>
        <div class="col-3" v-else>
          <MtFormCheckBox            
            type="checkbox"
            @update:checked="checkedFlgService"
            label="サービス"
            v-model:checked="itemServiceObj.flg_service"
            :disable="isEdit"
            
          />
        </div>
        <!--Removed from above :disable="isEdit"-->
        <div class="col-3" v-if="itemServiceObj.flg_service">
          <MtFormPullDown
            v-model:selected="itemServiceObj.id_cm_type_service"
            label="サービス区分 *"
            :options="getCommonTypeServiceOptionList"
            required
            :rules="[aahValidations.validationSelection]"
            @updateModelValue="
              ($event) =>
                resetItemServiceFields(
                  ['flg_service', 'id_cm_type_service'],
                  () => {
                    resetCategoryFields()
                  }
                )
            "
          />
        </div>
        <!--Removed from above :disable="!itemServiceObj.flg_service || isEdit"-->
        <div class="col-3" v-else>
          <MtFormPullDown
            v-model:selected="itemServiceObj.type_item"
            :options="typeItem"
            type="selection"
            label="商品区分 *"
            :disable="itemServiceObj.flg_service || isEdit"
            required
            :rules="[aahValidations.validationSelection]"
            @updateModelValue="
              () =>
                resetItemServiceFields(['flg_service', 'type_item'], () => {
                  ++categoryComponentKey
                  resetCategoryFields()
                })
            "
          />
        </div>
        <div class="col-3">
          <div class="item-service-img">
            <div v-if="itemImagePreview" class="row no-wrap items-start">
              <q-img
                :src="itemImagePreview"
                class="roundedImage cursor-pointer"
                spinner-color="white"
                style="width: 170px; height: 170px"
              />
              <q-badge
                class="badge-position cursor-pointer"
                color="red"
                transparent
                @click="removeImage"
              >
                <q-icon name="close" />
              </q-badge>
            </div>
            <q-icon
              v-else
              class="bg-grey-300 roundedImage q-pa-xl- cursor-pointer"
              color="white"
              name="add"
              size="lg"
              @click="$refs.itemImage.click()"
            />
            <input
              ref="itemImage"
              accept="image/*"
              style="display: none"
              type="file"
              @change="onFilePicked($event, 'pet_image')"
            />
          </div>
        </div>
      </div>
      <template
        v-if="
          itemServiceObj.id_cm_type_service ||
          itemServiceObj.type_item ||
          isEdit
        "
      >
      <div class="row">
        <div :class="itemImagePreview ? 'col-9' : 'col-12'">
          <div class="row q-col-gutter-md q-mb-sm">
            <MtCategorySelectionComponent
              :key="categoryComponentKey"
              :data="itemServiceObj"
              :prefix="
                itemServiceObj.flg_service
                  ? getPrefixCategoryService
                  : getPrefixCategoryItem
              "
              :show_code_category="true"
              :prefixCondition="
                itemServiceObj.flg_service ||
                (!itemServiceObj.flg_service &&
                  [3, 4, 5, 6].includes(itemServiceObj.type_item))
                  ? 'and'
                  : 'or'
              "
              :flg_for_medicine="
                !itemServiceObj.flg_service && itemServiceObj.type_item == 1
              "
              :flg_for_food="
                !itemServiceObj.flg_service && itemServiceObj.type_item == 2
              "
              :flg_for_item="
                !itemServiceObj.flg_service && itemServiceObj.type_item != 1
              "
              :flg_for_service="itemServiceObj.flg_service"
              @category1Selected="selectedCategory1"
              @category2Selected="selectedCategory2"
              @category1="selectedCategory1Name"
              @category2="selectedCategory2Name"
              @codeCategory="selectedCodeCategory1"
              :rules="[aahValidations.validationRequired]"
              required
            />
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.name_item_service"
                :rules="[aahValidations.validationRequired]"
                label="サービス商品名 *"
                required
                type="text"
                @blur="updateNameShort"            
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.name_kana_item_service"
                label="サービス商品名カナ"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.name_short"
                label="診療明細表示名"
                type="text"
              />
            </div>
            <div class="col-3" v-if="itemServiceObj.type_item == '1'">
              <MtInputForm
                v-model="itemServiceObj.name_item_service2"
                label="有効成分名（検索対象）"
                type="text"
                @blur="updateNameShort"            
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.search_key1"
                label="検索語句 1"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.search_key2"
                label="検索語句 2"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.search_key3"
                label="検索語句 3"
                type="text"
              />
            </div>
            <div class="col-auto">
              <q-btn flat round @click="openHelpMenu2" class="q-mx-sm">
                <q-icon size="24px" name="help_outline" />
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <MtFormCheckBox
              v-model:checked="itemServiceObj.flg_surgery"
              label="手術"
            />
            <MtFormCheckBox
              v-model:checked="itemServiceObj.flg_anesthesia"
              label="麻酔"
            />
            <MtFormCheckBox
              v-model:checked="itemServiceObj.flg_pet_custody_control"
              label="預かり管理"
            />
            <MtFormCheckBox
              v-model:checked="itemServiceObj.flg_prevention"
              label="予防"
              @update:checked="handleFlgPrevention"
            />
            <div v-if="itemServiceObj.flg_prevention == '1'" class="col-2">
              <MtFormCheckBox v-for="(checkbox, index) in typePreventionItem"
                              v-if="itemServiceObj.flg_prevention == '1'"
                              :key="index"
                              v-model:checked="checkbox.checked"
                              :label="checkbox.label"
                              class="col-3"
                              @update:checked="checkedTypePrevention($event, checkbox)" />
            </div>
            <div class="col-2 flex items-center">
              <q-btn
                class="bg-grey-100 text-grey-800"
                outline
                padding="5px 10px"
                size="sm"
                type="button"
                @click="handleMiscData"
              >
                <span>クリア</span>
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-3">
              <MtFormInputNumber
                v-model:value="itemServiceObj.val_top30"
                :rules="[aahValidations.validationNumber]"
                label="TOP30"
                required
                type="number"
                @update:modelValue="handleNumber"
              />
            </div>
            <div class="col-auto">
              <q-btn dense flat round @click="openHelpMenu7" class="q-mx-sm">
                <q-icon size="24px" name="help_outline" />
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div v-if="!itemServiceObj.flg_service" class="col-3">
              <MtFormPullDown
                v-model:selected="itemServiceObj.id_manufacturer"
                :options="manufacturerStore.getAllManufacturers"
                label="製造販売業者"
                type="selection"
              />
            </div>
            <!-- <div v-if="!itemServiceObj.flg_service" class="col-3">
              <MtFilterSelect
                v-model:options="customerSupplierList"
                v-model:selecting="itemServiceObj.id_customer_supplier"
                :options-default="customerSupplierListDefault"
                label="仕入先"
              />
            </div> -->
            <!-- <div class="col-3">
              <MtInputForm
                v-model="itemServiceObj.code_item_supplier"
                label="取引先商品CD"
                type="text"
              />
            </div> -->
            <div v-if="!itemServiceObj.flg_service" class="col-3">
              <MtInputForm
                v-model="itemServiceObj.memo_unit"
                label="包装単位"
                type="text"
              />
            </div>
            <div class="col-3">
              <q-select
                v-model="typeAnimalUi"
                :options="commonTypeAnimalOptionList"
                clearable
                dense
                label="動物種別"
                map-options
                multiple
                option-value="value1"
                use-chips
                @update:modelValue="handleItemTypeAnimal"
                @clear="()=> {
                  itemServiceObj.type_animal = null
                }"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="itemServiceObj.memo_item_description"
                autogrow
                label="商品説明"
                type="text"
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="itemServiceObj.memo_rule"
                autogrow
                label="院内ルール"
                type="text"
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="itemServiceObj.memo_alert"
                autogrow
                label="注意事項"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-3">
              <MtFormPullDown
                v-model:options="typeTax"
                v-model:selected="itemServiceObj.type_tax"
                label="消費税区分"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-sm">
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_discount"
                label="割引適用"
                type="checkbox"
              />
            </div>
            <div v-if="itemServiceObj.flg_discount" class="col-3">
              <MtFormInputNumber
                v-model:value="itemServiceObj.rate_discount_max"
                :numberRange="[1, 99]"
                label="最大割引適用率"
                mode="percent"

              >
                <template v-slot:append>
                  <q-icon name="percent" size="12px"></q-icon>
                </template>
              </MtFormInputNumber>
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_sellable"
                label="販売不可"
                type="checkbox"
              />
            </div>
            <MtFormCheckBox
              v-for="(checkbox, index) in typeInsurerItem"
              :key="index"
              v-model:checked="checkbox.checked"
              :label="checkbox.label"
              class="col-3"
              @update:checked="checkedInsurerFlg($event, checkbox)"
            >
            </MtFormCheckBox>
            <div v-if="itemServiceObj.flg_service" class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_calendar"
                label="カレンダー予約商品"
                type="checkbox"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                label="追加商品・サービス"
                v-model:checked="itemServiceObj.flg_plus_item"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_no_illness_history"
                label="対応歴を利用しない"
                type="checkbox"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_merge_price"
                label="技術料（会計非表示商品）"
                type="checkbox"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_temp_cash"
                label="売上外扱い"
                type="checkbox"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-sm">
            <div v-if="!itemServiceObj.flg_service" class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_stop_purchase"
                label="入荷停止"
                type="checkbox"
                @update:checked="checkedFlgStopPurchase"
              />
            </div>
            <div
              v-if="
                !itemServiceObj.flg_service && itemServiceObj.flg_stop_purchase
              "
              class="col-3"
            >
              <MtFormInputDate
                v-model:date="itemServiceObj.date_stop_purchase"
                :rules="[aahValidations.validationRequired]"
                label="入荷停止日"
                required
                type="date"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_discontinued"
                label="販売停止"
                type="checkbox"
                @update:checked="checkedFlgDiscontinued"
              />
            </div>
            <div v-if="itemServiceObj.flg_discontinued" class="col-3">
              <MtFormInputDate
                v-model:date="itemServiceObj.date_discontinued"
                label="販売停止日"
                type="date"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="itemServiceObj.flg_takeout"
                label="持ち帰り"
                type="checkbox"
              />
            </div>
          </div>
          <div class="row q-col-gutter-xs q-mb-md">
            <div class="col-2">
              <MtInputForm
                v-model="itemServiceObj.display_order"
                label="表示順序（0~999; 小を上位表示）"
                type="text"
              />
            </div>
          </div>
        </div>
      </div>
      </template>
      <template v-if="!itemServiceObj.flg_service && itemServiceObj.type_item == 1">
        <div
          class="row q-mb-md q-mt-md bg-grey-600 text-grey-100 title2 regular q-pa-sm q-pl-md"
          id="medicine_section"
        >
          医薬品詳細
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-auto">
            服用量の計算
            <q-btn dense flat round @click="openHelpMenu8" class="q-mx-sm">
              <q-icon size="24px" name="help_outline" />
            </q-btn>
          </div>
          <div class="col-auto q-ml-md">
            <MtFormCheckBox
              label="早見表"
              v-model:checked="medicineObj.flg_dosage_fixed"
            />
          </div>
          <div class="col-auto q-ml-md">
            <MtFormCheckBox
              label="per キロ (可変)"
              v-model:checked="medicineObj.flg_dosage_variable"
            />
          </div>
          <div class="col-auto q-ml-md">
            <MtFormCheckBox
              label="per ヘッド (可変)"
              v-model:checked="medicineObj.flg_dosage_per_head"
            />
          </div>
          <div class="col-auto q-ml-md">
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
          />
          <small class="text-grey-700 q-ml-sm">（※ 品名包装単位に有効成分を指定しない/できない）</small>
          <div v-if="medicineObj.flg_no_efficacy_ingredient" class="caption1 regular text-darkred">この条件下で「可変 有効成分量 範囲」を利用する際、投与量の計算は有効成分ベースではなく、投与量ベースになります。<br/>例えば、ある医薬品の指定範囲が10~30ml/kgで体重3kgの場合、投与量の提案範囲は30~90mlとなります。</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-3">
            <MtFormPullDown
              v-model:selected="medicineObj.id_cm_med_format"
              :options="getCommonTypeMedicineFormatOptionList"
              label="医薬品形状"
              required
              :rules="[aahValidations.validationSelection]"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              v-model:selected="medicineObj.id_dosage_frequency_1"
              :options="getAllDoses"
              label="デフォルト服用回数 1 *"
              required
              :rules="[aahValidations.validationSelection]"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              v-model:selected="medicineObj.id_dosage_frequency_2"
              :options="getAllDoses"
              label="デフォルト服用回数 2"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              v-model:selected="medicineObj.id_dosage_frequency_3"
              :options="getAllDoses"
              label="デフォルト服用回数 3"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col-3">
            <MtFormPullDown
              v-model:selected="medicineObj.type_dosage_calculation"
              :options="typeDosageCalculation"
              label="処方料金計算区分 *"
              required
              :rules="[aahValidations.validationSelection]"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              v-model:selected="medicineObj.type_medicine_category"
              :options="typeMedicineCategory"
              label="製剤区分"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              v-model:selected="medicineObj.type_medicine_regulation"
              :options="typeMedicineRegulation"
              label="規制区分"
            />
          </div>
          <div class="col-3">
            <q-select
              v-model="pillCalculationUI"
              :options="pillCalculationOption"
              dense
              label="デフォルト許容 錠剤分割"
              map-options
              multiple
              @update:modelValue="onTypeEfficacyChange"
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
        <div class="row items-center q-col-gutter-md q-my-sm">
          <!-- <div class="col-2">
            <MtFormCheckBox
              label="追加商品・サービス"
              v-model:checked="medicineObj.flg_plus_item"
            />
          </div> -->
          <div class="col-2">
            <MtFormCheckBox
              label="点滴ベース溶液"
              v-model:checked="medicineObj.flg_drip_carrier"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-3">
            <q-select
              v-model="medicineObj.id_cm_animal"
              :options="commonTypeAnimalOptionList"
              clearable
              dense
              label="医薬品 対象動物（禁忌チェック）"
              map-options
              multiple
              use-chips
            />
          </div>
          <div class="col-6">
            <MtTable2
              :columns="columns"
              :rows="medicineObj.id_cm_animal"
              :rowsBg="true"
              class="custody-table"
              flat
            >
              <template v-slot:row="{ row }">
                <td v-for="(col, index) in columns" class="cursor-pointer">
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
                    <MtFormRadiobtn v-model:selected="row.status" :val="1" />
                  </div>
                  <div
                    v-if="col.field == 'status2'"
                    class="body1 regular text-grey-900"
                  >
                    <MtFormRadiobtn v-model:selected="row.status" :val="20" />
                  </div>
                  <div
                    v-if="col.field == 'status3'"
                    class="body1 regular text-grey-900"
                  >
                    <MtFormRadiobtn v-model:selected="row.status" :val="99" />
                  </div>
                </td>
              </template>
            </MtTable2>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-xl">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.memo_package_unit"
              label="包装単位"
              autogrow
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.memo_efficacy"
              label="効能効果"
              autogrow
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.memo_dose"
              label="用法用量"
              autogrow
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.memo_sideeffect"
              label="副作用"
              autogrow
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.memo_stock"
              label="貯蔵方法"
              autogrow
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="medicineObj.url_nval"
              label="NVALリンク"
              iconPrepend="insert_link"
              :buttonAppend="
                medicineObj.url_nval?.length ? 'リンクを開く' : null
              "
              :handleBtnClick="handleUrlClick"
            />
          </div>
        </div>
      </template>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          type="button"
          @click="closeModal()"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
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
  top: 0;
  z-index: 1;

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
  border-radius: 20px;
  position: absolute;
  right: 20px;
  top: 20px;
}
</style>
