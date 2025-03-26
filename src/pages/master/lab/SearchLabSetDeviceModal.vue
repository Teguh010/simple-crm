<script setup lang="ts">
import MtFilterSelect from '@/components/MtFilterSelect.vue';
import MtModalHeader from '@/components/MtModalHeader.vue';
import useCategoryStore from '@/stores/categories';
import useCommonStore from '@/stores/common';
import useItemServiceUnitStore from '@/stores/item-service-units';
import aahMessages from '@/utils/aahMessages';
import mtUtils from '@/utils/mtUtils';
import { onMounted, reactive, ref, withDefaults } from 'vue';

const categoryStore = useCategoryStore()
const commonStore = useCommonStore()
const itemServiceUnitStore = useItemServiceUnitStore()

const labSetList = ref([])
const labSetListDefault = reactive([])
const labDeviceList = ref([])
const labDeviceListDefault = reactive([])
const formData = ref({
  list_test: null
})

const props = withDefaults(
  defineProps<{
    type: string
    list_test: string
  }>(),
  {
    type: '',
    list_test: ''
  }
)
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }

const submit = async () => {
  itemServiceUnitStore.setSelectedLab(formData.value.list_test)

  mtUtils.autoCloseAlert(aahMessages.success)
  closeModal()
}

onMounted(async () => {
  const promises = []
  if (props.type == 'lab-set') promises.push(categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'))
  if (props.type == 'lab-device') promises.push(commonStore.fetchPreparationCommonList({ code_common: [7] }))
  await Promise.all([
    ...promises,
  ])

  if (props.type == 'lab-set') {
    labSetList.value.length = 0
    labSetListDefault.length = 0
    labSetList.value = [...categoryStore.getCategoriesLB2.map((v) => ({...v, label: v.name_category, value: v.id_category}))]
    labSetListDefault.push(...labSetList.value)
  } else if (props.type == 'lab-device') {
    labDeviceList.value.length = 0
    labDeviceListDefault.length = 0
    labDeviceList.value = [...commonStore.getCommonDeviceOptionActiveList.map((v) => ({...v, label: v.name_common, value: v.id_common}))]
    labDeviceListDefault.push(...labDeviceList.value)
  }

  if (props.list_test)
    formData.value.list_test = props.list_test
})

</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title3 bold">
        {{ props.type == 'lab-set' ? '手入力検査' : '検査機器（IDEXX以外）' }}
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content">
      <MtFilterSelect
        v-if="props.type == 'lab-set'"
        option-label="name_category"
        option-value="id_category"
        v-model:options="labSetList"
        :options-default="labSetListDefault"
        label="手入力検査"
        class="q-mr-sm"
        outlined
        v-model:selecting="formData.list_test"
      />
      <MtFilterSelect
        v-else-if="props.type == 'lab-device'"
        option-label="name_common"
        option-value="id_common"
        v-model:options="labDeviceList"
        :options-default="labDeviceListDefault"
        label="院内検査機器"
        class="q-mr-sm"
        outlined
        v-model:selecting="formData.list_test"
      />
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>選択</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

</template>