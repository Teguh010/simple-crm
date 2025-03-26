<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useItemServiceUnitStore from '@/stores/item-service-units'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import aahValidations from '@/utils/aahValidations'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import SearchItemService from '@/components/MtSearchItemService.vue'
import useCommonStore from '@/stores/common'
import useClinicStore from '@/stores/clinics'
import { intervalUnit, noAutoCorrect, typeTax } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { convertAllDateTimeFields, getDateToday, isBitSet, roundZeroAfterPoint } from '@/utils/aahUtils'
import SearchIdexxTestListModal from '@/pages/request/serviceDetail/SearchIdexxTestListModal.vue'
import useCliCommonStore from '@/stores/cli-common'
import useCategoryStore from '@/stores/categories'
import { imageResize } from '@/utils/helper'
import SearchLabSetDeviceModal from '@/pages/master/lab/SearchLabSetDeviceModal.vue'
import { Platform } from 'quasar'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { event_bus } from '@/utils/eventBus'
import useModalStore from '@/stores/modal'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import useItemStore from '@/stores/items'
import UpdItemServiceUnitPriceModal from '@/pages/master/itemService/UpdItemServiceUnitPriceModal.vue'
import selectOptions from '@/utils/selectOptions'

const itemStore = useItemStore()
const itemUnitStore = useItemServiceUnitStore()
const cliCommonStore = useCliCommonStore()
const categoryStore = useCategoryStore()
const commonStore = useCommonStore()
const emits = defineEmits(['close', 'init'])
const props = defineProps({ data: Object, propServiceItem: Object, initFunc: Function })


const clinicStore = useClinicStore()
const { getClinic } = storeToRefs(clinicStore)

const selectedItemService: any = ref({
  flg_temp_cash: false
})

const isEdit = ref(false)
const toggleInterval = ref(false)
const itemImagePreview = ref()

const itemImage = ref()
const itemImageFile = ref()
const f1_status = ref('unchanged')

const visibleCount = ref(4)
const unitMedicineList: any = ref([])
const unitMedicineListDefault: any = reactive([])

const serviceUnitList: any = ref([])
const serviceUnitDefaultList: any = reactive([])

const efficacyUnitList: any = ref([])
const efficacyUnitListDefault: any = reactive([])


const formData = ref({
  id_item_service: '',
  id_unit: '',
  id_common: '',
  name_service_item_unit: '',
  display_order: null,
  type_medicine_dosage: 1,
  val_efficacyingredient: null,
  id_unit_medicine: '',
  unit_price: '',
  interval: '',
  flg_minus_count: false,
  flg_non_charge: false,
  purchase_price: '0',
  type_tax: props.propServiceItem.type_tax,
  flg_tax_included: false,
  interval_unit: 1,
  interval_count: '',
  list_idexx_test: [],
  list_test: null,
  memo_etc1: '',
  memo_etc3: '',
  flg_etc1: false,
  date_start: getDateToday(),
  date_end: '9999-12-31'
})
const disableTax = ref(false)
const unit_price_UI = ref(null)
const purchase_price_UI = ref(null)
const price_list = ref([])

const openIdexxListModal = async () => {

  await mtUtils.mediumPopup(SearchIdexxTestListModal, {
    is_item_service_unit: true,
    default_idexx: JSON.stringify(formData.value.list_idexx_test),
    is_showing_no_auto_correct_btn: true,
  })
  if (itemUnitStore.getSelectedIdexx.length > 0) {
    formData.value.list_idexx_test = itemUnitStore.getSelectedIdexx

    itemUnitStore.resetSelectedIdexx()
  }
}
const openLabSetDeviceModal = async (type: string) => {
  await mtUtils.smallPopup(SearchLabSetDeviceModal, { type, list_test: formData.value.list_test })
  if (itemUnitStore.getSelectedLab) {
    formData.value.list_test = itemUnitStore.getSelectedLab
    formData.value.memo_etc3 = type

    itemUnitStore.resetSelectedLab()
  }
}

const showIdexxName = (value: Array<string | number>) => {
  if (typeof(value) == 'string') value = JSON.parse(value)

  if (value && value.length && value.length > 0) {
    if (value.includes(noAutoCorrect)) return '適用する'

    return value?.map((v) => {
      const name = commonStore.getCommonIdexxSearchList.find((c) => c.code_func2 == v)?.name_common
      return name
    }).join(', ')
  }
  return ''
}

const submit = () => {
  formData.value.unit_price = parseInt(Number(unit_price_UI.value))
  formData.value.purchase_price = parseInt(Number(purchase_price_UI.value))

  if (!formData.value.interval || formData.value.interval.trim() === 'null') {
    formData.value.interval = ''
  }
  if (price_list.value.length === 0) {
    mtUtils.alert("販売単価を登録してください。")  
    return
  }

  if (formData.value.list_idexx_test) {
    formData.value.list_idexx_test = JSON.stringify(formData.value.list_idexx_test)
  }

  if (formData.value.flg_tax_included) {
    if (props.propServiceItem.type_tax == 1) {
      formData.value.unit_price = (unit_price_UI.value / (1 + 10 / 100)).toFixed(7)
      formData.value.purchase_price = (purchase_price_UI.value / (1 + 10 / 100)).toFixed(7)
    }

    if (props.propServiceItem.type_tax == 2) {
      formData.value.unit_price = (unit_price_UI.value / (1 + 8 / 100)).toFixed(7)
      formData.value.purchase_price = (purchase_price_UI.value / (1 + 8 / 100)).toFixed(7)
    }
  }
  formData.value.type_tax = props.propServiceItem.type_tax
 
  let data = new FormData()
  convertAllDateTimeFields(formData.value)

  Object.keys(formData.value).forEach((v) => {
    if ((formData.value[v] || formData.value[v] === '') && v != 'image_path' && v != 'id_clinic_list') {
      data.append(v, formData.value[v])
    } else if (['purchase_price', 'unit_price', 'val_efficacyingredient', 'id_cm_unit_medicine', 'interval'].includes(v)) {
      if (v == 'val_efficacyingredient' && !formData.value[v]) formData.value[v] = ''
      if (v == 'id_cm_unit_medicine' && !formData.value[v]) formData.value[v] = ''
      if (v == 'interval' && !formData.value[v]) formData.value[v] = ''
      data.append(v, formData.value[v])
    }
  })

  data.append('id_clinic', JSON.parse(localStorage.getItem('id_clinic')!))
  if (f1_status.value == 'changed') {
    data.append('image_path1', itemImageFile.value)
    data.append('image_path', itemImageFile.value)
  } else {
    data.append('image_path', null)
  }
  if (props.data) {
    itemUnitStore
      .updateItemServiceUnit(props.data?.id_item_service_unit, data)
      .then(() => {
        // itemUnitStore.fetchItemServiceUnits();
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {

    data.append('price_list', JSON.stringify(price_list.value))
    
    itemUnitStore.submitItemServiceUnit(data).then(() => {
      // itemUnitStore.fetchItemServiceUnits();
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const fetchList = async () => {
  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/item_service_unit_price', {
    id_item_service_unit: props.data.id_item_service_unit
  })

  if (response) {
    price_list.value = response
  }
}

const addPriceModal = async () => {

  await mtUtils.smallPopup(UpdItemServiceUnitPriceModal, {
    idItemServiceUnit: props.data?.id_item_service_unit,
    modalName: '単価登録',
    ItemService: props.data?.price_list,
    callBack: (value) => {
      price_list.value.push(value)
    }
  })

  if (isEdit.value) {
    await fetchList()
  }

}
const editPriceModal = async (selectedPrice) => {
  if (isEdit.value) {
    const updatedPrice = await mtUtils.smallPopup(UpdItemServiceUnitPriceModal, {
      idItemServiceUnit: props.data?.id_item_service_unit,
      modalName: '編集',
      ItemService: props.data?.price_list,
      priceObj: selectedPrice
    })

    await fetchList()
  }

}


const onFilePicked = async (e, type) => {
  const files = e.target.files;
  const reader = new FileReader();
  reader.onload = (e) => {
    mtUtils.smallPopup(ImageCropper, {image: e.target.result})
  };  
  reader.readAsDataURL(files[0]);
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
const removeImage = () => {
  formData.value.image_path = ''
  itemImagePreview.value = ''
}

const modalStore = useModalStore()

const openMenu = async () => {
  let menuOptions = [

  //  This code is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian 
  // {
  //     title: '品名・包装単位を複製する',
  //     name: 'duplicate',
  //     isChanged: false,
  //     attr: {
  //       class: null,
  //       clickable: true
  //     }
  //   },
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
            itemUnitStore
              .destroyItemServiceUnit(props.data?.id_item_service_unit)
              .then(() => {
                modalStore.close()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
              .finally(() => {
                modalStore.toggleLoading(false)
              })
          },
        }
      })
    }

  //  This code is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian 
    // } else if (selectedOption.name === 'duplicate') {
    //   copyMode.value = true
    //   oldId.value = props.data?.id_item_service_unit_reference ? props.data?.id_item_service_unit_reference : props.data?.id_item_service_unit
    //   assignPageData({ ...props.data })
    //   formData.value.id_item_service_unit = null
    // }
  }
}

const isMedicine = computed(() => {
  return (
    selectedItemService?.value?.type_item === 1 &&
    !selectedItemService?.value?.flg_service
  )
})
const closeModal = () => {
  emits('close')
  // copyMode.value = false
  // oldId.value = null
}

function isItemMedicineOrService(value: any) {
  selectedItemService.value = value
}

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      formData.value[key] = data[key]

  //  This code is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian 
      // if (key === 'id_item_service_unit' && copyMode.value) {
      //   formData.value[key] = null
      // } else {
      // }
    }
  }
}

const removeLabIdexx = () => {
  formData.value.list_idexx_test = []
  formData.value.memo_etc3 = ''
  formData.value.list_test = null
}

const handleUnitSalesUpdate = (value: any) => {
  if (!Boolean(purchase_price_UI.value)) purchase_price_UI.value = unit_price_UI.value
}

const init = async () => {
  await isItemMedicineOrService(props.propServiceItem)
}

const isIpad = computed(() => {
  return Platform.is.ipad
})


//ISUが医薬品で錠剤とそれ以外の場合のコンポーネントラベル名の表示制御
const dynamicLabel = computed(() => {
  
  const medicineFormat = useCommonStore()
    .getCommonTypeMedicineFormatOptionList.find(
      (v) => v.id_common == props.propServiceItem.medicine.id_cm_med_format
    )?.name_common;

  return medicineFormat === '錠' ? '錠剤重量 *' : '薬液全量 *';
});

const hasMorePrices = computed(() => {
  return (price_list && visibleCount.value < price_list.length)
})

function showMoreItems() {
  visibleCount.value += 4
}

function showLessItems() {
  visibleCount.value = 4
}
function isActivePrice(price) {
  const today = new Date()
  const start = new Date(price?.date_start)
  const end = new Date(price?.date_end)
  return today >= start && today <= end
}
onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({ code_common: [4] })

  unitMedicineList.value = [...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 512)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    )]

  unitMedicineListDefault.push(...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 512)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    ))

  serviceUnitList.value = [...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 256)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    )]

  serviceUnitDefaultList.push(...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 256)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    ))

  efficacyUnitList.value = [...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 128)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    )]

  efficacyUnitListDefault.push(...useCommonStore().getCommonUnitOptionList
    .filter((common) => isBitSet(parseInt(common.code_func1), 128)).map(
      (o: any) => ({
        value: o.id_common,
        label: o.name_common,
        status: 1,
        id_common: o.id_common
      })
    ))

  if (props.data?.id_item_service_unit) {
    isEdit.value = true
    // Update case

    price_list.value = props.data?.price_list
    
    assignPageData({ ...props.data })
    isItemMedicineOrService(props.propServiceItem)
    itemImagePreview.value = props.data.image_path


    unit_price_UI.value = formData.value.unit_price
    purchase_price_UI.value = formData.value.purchase_price

    if (formData.value.flg_tax_included) {
      if (formData.value.type_tax == 1) {
        unit_price_UI.value = (formData.value.unit_price * 1.1)
        purchase_price_UI.value = (formData.value.purchase_price * 1.1)
      }

      if (formData.value.type_tax == 2) {
        unit_price_UI.value = (formData.value.unit_price * 1.08)
        purchase_price_UI.value = (formData.value.purchase_price * 1.08)
      }
    }

    if (Array.isArray(formData.value.list_idexx_test)) {
      formData.value.list_idexx_test = JSON.stringify(formData.value.list_idexx_test)
    } else {
      if (formData.value.list_idexx_test && JSON.parse(formData.value.list_idexx_test).length > 0) {
        await commonStore.fetchPreparationCommonList({ code_common: [31] })
        formData.value.list_idexx_test = JSON.parse(formData.value.list_idexx_test)
      } else formData.value.list_idexx_test = []
    }
    
    
    // if (formData.value.memo_etc3 == 'lab-set') await categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2')
    if (formData.value.memo_etc3 == 'lab-device') await commonStore.fetchPreparationCommonList({ code_common: [7] })

  } else {
    isEdit.value = false
    // Create case
    formData.value.flg_tax_included = getClinic.value.flg_tax_included
    if (props.propServiceItem) {
      formData.value.id_item_service = props.propServiceItem.id_item_service
      formData.value.name_service_item_unit =
        props.propServiceItem.name_item_service
    }
  }

  if (props.propServiceItem.flg_temp_cash) {
    formData.value.type_tax = 3
    disableTax.value = true
  }

  init()
})


const itemCSV = ref<HTMLInputElement | null>(null);

const triggerFileSelect = () => {
  itemCSV.value?.click();
};
const removePrice = (id) => {
  price_list.value = price_list.value.filter(price => price.id_price !== id)
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">

  <!--  This code is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian  -->
      <!-- <q-toolbar-title class="text-grey-900 title2 bold" v-if='copyMode'>
        品名・包装単位の複製
      </q-toolbar-title> -->
      <q-toolbar-title class="text-grey-900 title2 bold" >
        品名・包装単位
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl content" :class="{'q-mt-md': isIpad}">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-4">
      
          <SearchItemService
            v-model:selecting="formData.id_item_service"
            
            :preselected="props.propServiceItem"
            :rules="[aahValidations.validationSelection]"
            label="サービス商品"
            @update:selectingWhole="isItemMedicineOrService"
          />
        </div>
        <!-- add here condition if using copymode v-if='!copyMode'  -->
        <div >
          <div v-if="props.propServiceItem?.medicine" class="col-4">
            <MtFilterSelect
              v-model:options="unitMedicineList"
              v-model:selecting="formData.id_common"
              :options-default="unitMedicineListDefault"
              :rules="[aahValidations.validationRequired]"
              label="医薬品単位"
              required
            />
          </div>

          <div v-else class="col-4">
            <MtFilterSelect
              v-model:options="serviceUnitList"
              :options-default="serviceUnitDefaultList"
              v-model:selecting="formData.id_common"
              label="販売 単位 *"
              required
              :rules="[aahValidations.validationRequired]"           
            />
          </div>
         </div>

        <!-- add here condition if using copymode v-if='!copyMode'  -->
        <div  class="col-3">
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
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="formData.name_service_item_unit"
            :input-style="{color: 'black' }"
            label=" 商品名・包装単位 *"
           
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>

        <!-- add here condition if using copymode v-if='!copyMode'  -->
        <div  class="col-2" @click="()=> {
          formData.interval_count = formData.interval && formData.interval.length > 0 ? formData.interval.split(' ')[0] : ''
          formData.interval_unit = formData.interval && formData.interval.length > 0 ? formData.interval.split(' ')[1] : ''
         toggleInterval = true 
        }">
          <MtInputForm
            type="text"
            v-model="formData.interval"
            label="繰返し期間"
            :disable="true"
            icon-append="calendar_month"
          />
          <q-dialog
            v-model="toggleInterval"
            style="
               {
                width: 200px !important;
              }
            "
          >
            <q-card class="mt-small-popup">
              <MtModalHeader
                class="bg-sky-blue"
                @close-modal="() => (toggleInterval = !toggleInterval)"
              >
                <div class="full-width">繰返し期間</div>
              </MtModalHeader>
              <div class="q-ma-lg">
                <MtInputForm
                  v-model="formData.interval_count"
                  class="q-mb-lg"
                  label="繰り返し期間"
                  type="number"
                ></MtInputForm>
                <MtFormPullDown
                  v-model:selected="formData.interval_unit"
                  :options="intervalUnit"
                  label="単位"
                >

                </MtFormPullDown>
              </div>
              <div class="flex justify-center q-py-md">
                <q-btn
                  color="primary"
                  label="保存"
                  size="sm"
                  @click="() => {
                    if (formData.interval_count && formData.interval_unit) {
                      formData.interval = `${formData.interval_count} ${formData.interval_unit}`
                    } else {
                      formData.interval = ''
                    }
                    toggleInterval = false
                  }"
                ></q-btn>
              </div>
            </q-card>
          </q-dialog>
        </div>

        <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
        <div  class="col-3">
          <MtInputForm 
            v-if="propServiceItem?.flg_calendar"
            v-model="formData.memo_etc1" 
            label="予約所要時間 (分）"
            type="number" 
            
          />
        </div>
      </div>

        <!-- add here condition if using copymode v-if='!copyMode'  -->
      <div  >
      <template v-if="props.propServiceItem?.code_category2?.substr(0, 2) == 'EZ'">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-3">
            <q-btn :disable="formData.memo_etc == 'lab-device' || formData.memo_etc3 == 'lab-set'" outline
                   @click="openIdexxListModal">
              {{ formData.list_idexx_test && formData.list_idexx_test.length > 0 ? 'IDEXX 臨床検査' : 'IDEXX 臨床検査 [追加]'
              }}
            </q-btn>
          </div>
          <template v-if="formData.list_idexx_test && formData.list_idexx_test.length > 0">
            <div class="col-7">
              {{ showIdexxName(formData?.list_idexx_test) }}
            </div>
            <div class="col-2">
              <q-btn outline @click="removeLabIdexx()">削除</q-btn>
            </div>
          </template>
        </div>

        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-3">
            <q-btn :disable="formData.memo_etc == 'lab-device' || ( formData.list_idexx_test && formData.list_idexx_test.length && formData.list_idexx_test.length > 0)"
                   outline
                   @click="openLabSetDeviceModal('lab-set')">手入力検査
            </q-btn>
          </div>
          <template v-if="formData.memo_etc3 == 'lab-set' && formData.list_test">
            <div class="col-7">
              {{ categoryStore.getAllCategories.find((v) => v.id_category == formData.list_test)?.name_category }}
            </div>
            <div class="col-2">
              <q-btn outline @click="removeLabIdexx()">削除</q-btn>
            </div>
          </template>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-3">
            <q-btn
              :disable="formData.memo_etc3 == 'lab-set' || ( formData.list_idexx_test && formData.list_idexx_test.length && formData.list_idexx_test.length > 0)"
              outline @click="openLabSetDeviceModal('lab-device')">検査機器（IDEXX以外）
            </q-btn>
          </div>
          <template v-if="formData.memo_etc3 == 'lab-device' && formData.list_test">
            <div class="col-7">
              {{ commonStore.getCommonDeviceOptionActiveList.find((v) => v.id_common == formData.list_test)?.name_common }}
            </div>
            <div class="col-2">
              <q-btn outline @click="removeLabIdexx()">削除</q-btn>
            </div>
          </template>
        </div>
      </template>
    </div>
      

        <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
      <div v-if="!copyMode" class="row q-col-gutter-md">
        <div class="col-3">
          <MtFormCheckBox
            label="会計対象外"
            v-model:checked="formData.flg_non_charge"
          />
        </div>
        <div class="col-3">
          <MtFormCheckBox
            label="マイナス会計"
            v-model:checked="formData.flg_minus_count"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            v-model:selected="propServiceItem.type_tax"
            :options="typeTax"
            label="消費税 区分"
            :disable="true"
          />
        </div>
      </div>


        <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="formData.flg_tax_included"
            label="内税"
            :disable="disableTax"
          />
        </div>
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="selectedItemService.flg_temp_cash"
            :disable="true"
            label="売上外商品"
            type="checkbox"
          />
        </div>
      </div>

      <!-- old -->
       <!--  This code is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian -->
      <!-- <div v-if='copyMode' class="row q-col-gutter-md q-mb-lg">
        <div class="col-6">
          <MtFormInputNumber2
            label="販売価格（旧)"
            :label-style="{ color: 'gray' }"
             v-model:value="unit_price_UI"
            :input-style="{ 'font-size': '15px',color:'gray'  }"
            @update:value="handleUnitSalesUpdate"
            :readonly="copyMode"
          ></MtFormInputNumber2>
        </div>
        <div class="col-6">
          <MtFormInputNumber2
            v-model:value="purchase_price_UI"
            :input-style="{ 'font-size': '15px',color:'gray'  }"
            label="仕入価格（旧)"
            :label-style="{ color: 'gray' }"
            :readonly="copyMode"
          ></MtFormInputNumber2>
        </div>
        <div class="col-6">
          <MtFormInputNumber2
            v-model:value="new_unit_price_UI"
            :input-style="{ 'font-size': '15px' }"
            label="販売価格（新)"
            v-bind:disabled="copyMode"
            required
            :rules="[aahValidations.validationRequired]"           
            autofocus          
          ></MtFormInputNumber2>
        </div>
        <div class="col-6">
          <MtFormInputNumber2
            v-model:value="new_purchase_price_UI"
            :input-style="{ 'font-size': '15px' }"
            label="仕入価格（新)"
            v-bind:disabled="copyMode"
          ></MtFormInputNumber2>
        </div>
      </div> -->
      <div v-if="false" class="row q-col-gutter-md q-mb-lg">
        <div class="col-3">
          <MtFormInputNumber2
            label="販売価格"
            v-model:value="unit_price_UI"
            :input-style="{ 'font-size': '15px' }"
            @update:value="handleUnitSalesUpdate"
          ></MtFormInputNumber2>
        </div>
        <div class="col-3">
          <MtFormInputNumber2
            v-model:value="purchase_price_UI"
            :input-style="{ 'font-size': '15px' }"
            label="仕入価格"
          ></MtFormInputNumber2>
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-4">
          <div class="active-section">
            <div class="section-header">
              <span>販売単価（有効）</span>
              <span class="text-blue cursor-pointer" @click="addPriceModal">+ 販売単価</span>
            </div>

            <div v-for="price in price_list.slice(0, visibleCount)"
                v-if="price_list.length > 0"
                :key="price?.id_price"
                class="row no-wrap justify-between items-center cursor-pointer q-pa-sm q-mb-sm"
                :class="{ highlight: isActivePrice(price) }"
                @click="editPriceModal(price)"
            >
              <div>{{ price?.date_start }} ~ {{ price?.date_end }}</div>
              <div class="price-bold">{{ roundZeroAfterPoint(price?.price) }}</div>
              <q-icon v-if="!isEdit" name="close" class="text-red cursor-pointer" @click.stop="removePrice(price.id_price)"  />
            </div>

            <div class="past-price-link" v-if="hasMorePrices">
              <span class="text-blue cursor-pointer" @click="showMoreItems">
                See more
              </span>
            </div>
          </div>
        </div>

        <!-- Right column: Active unit-purchase -->
        <!-- <div class="col-4">
          <div class="active-section">
            <div class="section-header">
              <span>Active unit-purchase</span>
              <span class="text-blue cursor-pointer" @click="addPurchasePriceModal">
                + Price
              </span>
            </div>

            <div class="highlight q-pa-sm q-mb-sm">
              <div class="row no-wrap justify-between items-center q-mb-xs">
                <div>ABC company</div>
                <div>2023/01/01 ~</div>
                <div class="price-bold">1,450</div>
              </div>
              <div class="row no-wrap justify-between items-center q-mb-xs">
                <div>FGH company</div>
                <div>2024/06/01 ~</div>
                <div class="price-bold">1,450</div>
              </div>
              <div class="row no-wrap justify-between items-center">
                <div>XTZ company</div>
                <div>2021/01/01 ~</div>
                <div class="price-bold">1,360</div>
              </div>
            </div>
            <div class="future-prices q-mb-sm">
              <div class="row no-wrap justify-between items-center q-mb-xs">
                <div>FGH company</div>
                <div>2025/04/01 ~</div>
                <div>1,450</div>
              </div>
              <div class="row no-wrap justify-between items-center">
                <div>XTZ company</div>
                <div>2025/03/13 ~</div>
                <div>1,360</div>
              </div>
            </div>
            <div class="past-price-link">
              <span class="text-blue cursor-pointer">See past price</span>
            </div>
          </div>
        </div> -->
      </div>
      <!-- End NEW SECTIONS -->
        <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
      <div v-if="isMedicine" class="q-mb-md">
        <hr class="light" />
        <!-- Let a user register further if this ISU is about medicine item. -->
        <div class="q-mb-lg q-mt-lg">
          <h4 class="text-white bg-grey-600 title4">医薬品 詳細設定</h4>
        </div>
        <div  class="row q-col-gutter-md q-mb-md">
          <template
            v-if="props.propServiceItem && props.propServiceItem?.medicine &&!props.propServiceItem?.medicine?.flg_no_efficacy_ingredient ">
            <div class="col-3">
              <MtInputForm
                v-model="formData.val_efficacyingredient"
                label="有効成分量*"
                type="number"
                
              />
            </div>
            <div class="col-3">
              <MtFilterSelect
                v-model:options="efficacyUnitList"
                v-model:selecting="formData.id_cm_unit_medicine"
                :options-default="efficacyUnitListDefault"
                label="有効成分量 単位 *"
                
              />
            </div>
          </template>
          <div v-else class="col-3 text-grey-700">有効成分指定なし</div>
          <div
            v-if="props.propServiceItem && 
            props.propServiceItem.medicine &&
             props.propServiceItem.medicine.id_cm_med_format &&
              useCommonStore().getCommonTypeMedicineFormatOptionList
              .find((v)=> v.id_common == props.propServiceItem.medicine.id_cm_med_format)?.flg_func2"
            class="col-3">
            <div class="c-grid-w items-center">
              <div>
                <MtFormInputNumber
                  v-model:value="formData.val_liquid"
                  :rules="[aahValidations.validationRequired]"
                  class="right-text"
                  decimal-size="2"
                  :label="dynamicLabel"
                  mode="dosage"
                  required
                  
                />
              </div>
              <span>
                 {{ ['錠', '粉B', '粉A', 'カプセル2'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v) => v.id_common == props.propServiceItem.medicine.id_cm_med_format)?.name_common) ? 'mg' : 'ml'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
        <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-2">
          <MtFormCheckBox
            v-model:checked="formData.flg_etc1"
            label="帳票出力"
            
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-if="formData.flg_etc1"
            type="text"
            v-model="formData.memo_etc1"
            label="備考1"
            autogrow
           
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-if="formData.flg_etc1"
            type="text"
            v-model="formData.memo_etc2"
            label="備考2"
            autogrow
            
          />
        </div>
        <!-- <div class="col-3">
          <MtInputForm
            v-if="formData.flg_etc1"
            type="text"
            v-model="formData.memo_etc3"
            label="予備フィールド3"
            :disabled="copyMode"
          />
        </div> -->
      </div>

       <!--  This modal is being commented out due to the implementation of the new price management module. commit out when you want copyMode agian -->
      <!-- <div v-if='copyMode' class="row q-col-gutter-md q-my-md">
        <div class="col-6">
          <MtFormInputDate
            v-model:date="formData.date_start"
            label="有効開始日（新)"
            :disabled="copyMode"
            required
            :rules="[aahValidations.validationRequired]" 
          />
        </div>
        <div class="col-6">
          <MtFormInputDate
              v-model:date="formData.date_end"
            label="有効終了日（新)"
            :disabled="copyMode"
            required
            :rules="[aahValidations.validationRequired]" 
          />
        </div>
      </div> -->
      <div v-if="true" class="row q-col-gutter-md q-my-md">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="formData.date_start"
            label="有効開始日"
           
          />
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-model:date="formData.date_end"
            label="有効終了日"
            
          />
        </div>
      </div>

      <!-- add here condition if using copymode v-if='!copyMode' and :disabled="copyMode"  -->
      <div  class="row q-col-gutter-md">
        <div class="col-3">
          <MtInputForm
            type="number"
            v-model="formData.display_order"
            label="表示順序（0~999; 小を上位表示）"
            
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
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
.mt-small-popup {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  width: 260px !important;
}

.assort-drip-text-1:after {
  content: 'mL';
  top: 65% !important;
}


.assort-drip-text-2:after {
  content: 'mg';
  top: 65% !important;
}

.c-grid-w {
  display: grid;
  grid-template-columns: 3fr 1fr;
  column-gap: 10px;
}
.item-service-img {
  border-radius: 20px;
  position: absolute;
  right: 20px;
  top: 20px;
}
.price-bold {
  font-weight: bold;
}
.highlight {
  background-color: #fff9c4;
}
.active-section {
 
  padding: 1rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

</style>
