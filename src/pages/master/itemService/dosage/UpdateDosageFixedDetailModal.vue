<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import aahValidations from '@/utils/aahValidations'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useDosageFixedDetailStore from '@/stores/dosage-fixed-detail'
import useDosageFixedStore from '@/stores/dosage-fixed'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useCommonStore from '@/stores/common'

const dosageFixedStore = useDosageFixedStore()
const dosageFixedDetailStore = useDosageFixedDetailStore()
const itemUnitStore = useItemServiceUnitStore()

const emits = defineEmits(['close'])
const props = defineProps({ data: Object, serviceItem: Object, id_item_service:String })
const data = ref({
  id_dosage_fixed: '',
  id_item_service_unit: '',
  val_dose_min: '',
  val_dose_max: ''
})

const isEdit = ref(false)
const commonOptionList = ref([])

const units: any = ref([])
const unitsDefault: any = reactive([])

const dosageFixed: any = ref([])
const dosageFixedDefault: any = reactive([])
const itemServices: any = ref([])
const itemServicesDefault: any = reactive([])

const submit = async () => {
  if (props.data) {
    await mtUtils.promiseAllWithLoader([dosageFixedDetailStore.updateDosageFixedDetail(data.value.id_dosage_fixed_detail, data.value)])
    emits('close')
    await mtUtils.autoCloseAlert(aahMessages.success)
  } else {
    await mtUtils.promiseAllWithLoader([
      dosageFixedDetailStore.submitDosageFixedDetail(data.value)
    ])
    emits('close')
    await mtUtils.autoCloseAlert(aahMessages.success)
  }
}
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
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await dosageFixedDetailStore.destroyDosageFixedDetail(
              data.value?.id_dosage_fixed_detail
            )
            emits('close')
            return false
          }
        })
    }
  }
}
const closeModal = () => {
  emits('close')
}

const init = async () => {
  if (props.serviceItem) {
    data.value.id_item_service_unit = props.serviceItem?.id_item_service_unit
    data.value.id_dosage_fixed = props.serviceItem?.id_dosage_fixed
  }
}

onMounted(async () => {

  await Promise.all([dosageFixedStore.fetchDosageFixed({ 'id_item_service': props?.id_item_service }),
    itemUnitStore.fetchItemServiceUnits({'id_item_service': props?.id_item_service}),
    useCommonStore().fetchPreparationCommonList({'code_common': [4]})
  ])
  
  if (dosageFixedStore.getAllDosageFixed) {
    dosageFixed.value = [...dosageFixedStore.getAllDosageFixed]
    dosageFixedDefault.push(...dosageFixedStore.getAllDosageFixed)
  }

  if (itemUnitStore.itemServiceUnitOptions) {
    itemServices.value = [...itemUnitStore.itemServiceUnitOptions]
    itemServicesDefault.push(...itemUnitStore.itemServiceUnitOptions)
  }

  commonOptionList.value = useCommonStore().getCommonUnitOptionList

  units.value = [...commonOptionList.value]
  unitsDefault.push(...commonOptionList.value)
  

  if (props.data?.id_dosage_fixed_detail) {
    isEdit.value = true
    // Update case
    data.value = { ...props.data }
  } else {
    isEdit.value = false
    // Create case
    data.value = data.value
  }

  init()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        早見表：服用量の指定
      </q-toolbar-title>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-md">
      <div class="col-lg-12 col-md-12 col-sm-12 ">
        <MtFilterSelect
          :options-default="dosageFixedDefault"
          v-model:options="dosageFixed"
          v-model:selecting="data.id_dosage_fixed"
          label="早見表 体重範囲 *"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 ">
        <MtFilterSelect
          :options-default="itemServicesDefault"
          v-model:options="itemServices"
          v-model:selecting="data.id_item_service_unit"
          label="医薬品（品名包装単位） *"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtInputForm
          type="number"
          v-model="data.quantity"
          label="処方量 *"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtFilterSelect
          :options-default="unitsDefault"
          v-model:options="units"
          v-model:selecting="data.id_common"
          label="処方単位 *"
          required
          :rules="[aahValidations.validationRequired]"
        />
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
