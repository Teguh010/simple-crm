<script setup lang="ts">
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCommonStore from '@/stores/common'
import useCustomerStore from '@/stores/customers'
import useInjectStore from '@/stores/inject'
import usePrescriptionStore from '@/stores/prescription'
import { InjectDetailType, InjectType, RabiesType, RequestDetailPageType } from '@/types/types'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { storeToRefs } from 'pinia'
import { computed, defineProps, onMounted, onUnmounted, ref, withDefaults } from 'vue'
import InjectHeaderListBox from './InjectHeaderListBox.vue'
import InjectDetailListBox from './InjectDetailListBox.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

const props = withDefaults(
  defineProps<{
    injectHeader: InjectType
    injectDetailList: InjectDetailType[]
    requestObj: RequestDetailPageType
    rabies: RabiesType
  }>(),
  {
    rabies: () => {
      return {} as RabiesType
    },
    requestObj: () => {
      return {} as RequestDetailPageType
    },
    injectHeader: () => {
      return {} as InjectType
    },
    injectDetailList: () => {
      return [] as InjectDetailType[]
    }
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const injectStore = useInjectStore()
const prescriptionStore = usePrescriptionStore()

const { getInjectDetailList } = storeToRefs(injectStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const injectHeaderRef = ref()
const injectHeader = ref(props.injectHeader)
const injectDetailList = ref(props.injectDetailList)
const rabies = ref(props.rabies)

const petSelected = ref()
const petList = ref()
const commonTypeAnimalOptionList: any = ref([])
const childFormRefs = ref([])

const closeModal = () => {
  emit('close')
}

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    delete childFormRefs.value[index]
  }
}

const save = async () => {
  let rabies = props.rabies
  injectDetailList.value = Object.values(childFormRefs.value).map((childForm, index) => {
    if (childForm.getFormData().rabies && childForm.getFormData()?.rabies?.id_rabies == rabies?.id_rabies) {
      rabies = {
        ...childForm.getFormData().rabies
      }
    }
    return {
      ...childForm.getFormData()
    }
  })

  injectHeader.value = injectHeaderRef.value.getFormData()

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `request/${props.requestObj.id_request}/inject/${injectHeader.value.id_inject}`,
    {
      id_inject: injectHeader.value.id_inject,
      inject: injectHeader.value,
      inject_detail_list: injectDetailList.value,
      rabies: rabies
    },
    true
  )

  if (response && response.code == 200) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    closeModal()
    return
  }

  await mtUtils.autoCloseAlert('エラー')
  return
}

const changePet = async (v: any) => {
  if (!injectStore.getInjectHeaderByPet(petSelected.value)) {
    // await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    return
  }
  await prescriptionStore.fetchPrescriptionDetailList({
    id_pet: petSelected.value
  })
  customerStore.selectPet(petSelected.value)
}

const typeAnimalUI = computed(() => {
  if (
    customerStore.getCustomer &&
    customerStore.getCustomer?.pets.length
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
  
    if (!typeAnimal) {
      return ''
    }
  
    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label
    }`
  }
})

onMounted(async () => {
  commonTypeAnimalOptionList.value = getCommonTypeAnimalOptionList.value.map(
    (o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    })
  )

  petSelected.value = customerStore?.getPet?.id_pet
  petList.value = customerStore?.getCustomer?.pets

  if (!typeAnimalUI.value) {
    await mtUtils.alert('動物種を設定してください。', '確認')
  }
})

onUnmounted(() => {
  injectStore.resetItemServiceUnitList()
})
</script>
<template>
  <div>
    <MtModalHeader class="bg-c-purple" @closeModal="closeModal()">
      <q-toolbar-title class="text-grey-900 title2 bold">
        注射・点滴
      </q-toolbar-title>
      <q-space></q-space>
      <MtPetFilterSelect
        v-model:selecting="petSelected"
        :pet-list="petList"
        label="対象ペット名"
        @update:model-value="changePet"
      />
      <div class="q-ml-sm col-1">
        <MtInputForm
          v-model="typeAnimalUI"
          label="動物種"
          readonly
          type="text"
        />
      </div>
    </MtModalHeader>
    <q-card-section>
      <q-scroll-area class="full-width view">
        <InjectHeaderListBox
          ref="injectHeaderRef"
          :request-obj="props.requestObj"
          :inject-header="injectHeader"
        ></InjectHeaderListBox>
        <div
          v-for="(item, index) in injectDetailList"
          v-if="injectDetailList.length > 0"
          :key="index"
          class="q-mb-lg"
        >
          <InjectDetailListBox
            v-model:item="injectDetailList[index]"
            :ref="setChildRef(index)"
            :index="index"
            :request-obj="props.requestObj"
            :rabies="rabies?.id_inject_detail == injectDetailList[index]?.id_inject_detail ? rabies : null"
          />
        </div>
      </q-scroll-area>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="save()">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped>
.view {
 height: calc(76vh - 70px);
}
</style>