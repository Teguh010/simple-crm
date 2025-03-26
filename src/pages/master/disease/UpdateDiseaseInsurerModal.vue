<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useInsuranceStore from '@/stores/insurances'
import useDiseasesInsuredStore from '@/stores/diseasesInsured'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import useCategoryStore from '@/stores/categories'
import useCommonStore from '@/stores/common'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'


const DiseasesInsuredStore = useDiseasesInsuredStore()
const InsuranceStore = useInsuranceStore()
const categoryStore = useCategoryStore()

const { getInsurers } = storeToRefs(InsuranceStore)
const { getCategories, getAllSubCategories } = storeToRefs(categoryStore)

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })
const isEdit = ref(false)
const data = ref({
  id_insurer: null,
  name_disease_insurance: null,
  code_disease_insurance: null,
  id_category1: "",
  id_category2: "",
  name_category1: "",
  name_category2: "",
  code_category2: "",
  display_order: '999'
})
const isMounted = ref(false)

const closeModal = () => {
  emits('close')
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
        .then((confirmation) => {
          if (confirmation) {
            DiseasesInsuredStore.destroyDiseaseInsured(data.value.id_disease_insurer).then(() => {
              DiseasesInsuredStore.fetchDiseasesInsured()
              // DiseasesInsuredStore.fetchPreparationDiseases()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const submit = () => {
  if (props.data) {
    DiseasesInsuredStore
      .updateDiseaseInsured(data.value.id_disease_insurer, data.value)
      .then(async () => {
        await DiseasesInsuredStore.fetchDiseasesInsured()
        // diseaseStore.fetchPreparationDiseases()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    DiseasesInsuredStore.submitDiseaseInsured(data.value).then(async () => {
      await DiseasesInsuredStore.fetchDiseasesInsured()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const insurerSelected = async () => {
}

const insurerSelection = computed(() => {
  return getInsurers.value.map((ins: any) => ({
    name: `${ins.name_insurer} / ${ins.code_clinic}`,
    value: ins.id_insurer
  }))
})

const categories1Selection = computed(() => {
  const categories1List = getCategories.value
    .filter((cat_1: any) => !cat_1.id_category_parent)
    .map((cat_1: any) => ({
      name: `${cat_1.code_category} / ${cat_1.name_category}`,
      value: cat_1.id_category,
      label: `${cat_1.code_category} / ${cat_1.name_category}`
    }))
  return categories1List
})

const categories2Selection = computed(() => {
  return getAllSubCategories.value.map((cat_2: any) => {
    return {
      name: cat_2.label,
      value: cat_2.value,
      label: cat_2.label
    }
  })
})

const category1Selected = async (value: any) => {
  data.value.id_category1 = value
  const category_1 = getCategories.value.find((cat_1: any) => cat_1.id_category == value)
  if(Boolean(category_1)){
    data.value.name_category1 = category_1.name_category
  }
}

const category2Selected = async (value: any) => {
  data.value.id_category2 = value
  const category_2 = getCategories.value.find((cat_2: any) => cat_2.id_category == value)
  if(Boolean(category_2)){
    data.value.name_category2 = category_2.name_category
    data.value.code_category2 = data.value.id_category2
  }
}

onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({ code_common: [29] })


  if (props.data?.id_disease_insurer) {
    // Edit case
    isEdit.value = true
    data.value = props.data
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
  }
  isMounted.value = true
})

onUnmounted(() => {
  isMounted.value = false
})

</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 boldtitle2">
        疾病保険
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-lg">
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormPullDown
            v-model:selected="data.id_cm_insurer"
            :options="useCommonStore().getCommonTypeGeneralInsurerOptionList"
            :rules="[aahValidations.required]"
            :disable = "isEdit"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md" v-if="isMounted">
        <MtCategorySelectionComponent
          :flg_for_disease="true"
          :data="{id_category1: data.id_category1,id_category2: data.id_category2}"
          :id_category1="data.id_category1"
          :id_category2="data.id_category2"
          @category1Selected="category1Selected"
          @category2Selected="category2Selected"
        />
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.code_disease_insurance"
            :isKatakana="false"
            label="疾病コード * "
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.name_disease_insurance"
            :isKatakana="false"
            label="病名 * "
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="data.display_order"
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
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

