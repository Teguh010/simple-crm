<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahValidations from '@/utils/aahValidations'
import { useServiceOptionStore } from '@/stores/service_option'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import SearchItemService from '@/components/MtSearchItemService.vue'


const emits = defineEmits(['close'])
const serviceOptionStore = useServiceOptionStore()

const isEdit = ref(false)
const props = defineProps({serviceData: Object, propServiceItem: Object})
const data = ref({
  id_item_service_parent: props.propServiceItem?.id_item_service,
  id_item_service_child: '',
  display_order: null
})
const itemServiceName = ref('')
const closeModal = () => {
  emits('close')
}
const selectingItemService = (value: any) => {
  if (value !== null && value !== '') {
    itemServiceName.value = value?.name_item_service
  } else {
    itemServiceName.value = ''
    data.value.display_order = 0
  }
}
const submit = async () => {

  console.log(props.serviceData)
  
  if (props.serviceData?.id_item_service_option) {
    if (data.value.id_item_service_child !== '' &&
      data.value.id_item_service_child !== null
      && data.value.display_order !== ''
      && data.value.display_order !== null) {
      await serviceOptionStore.updateServiceOption(props.serviceData?.id_item_service_option, data.value)
      closeModal()
    }
  } else {
    console.log(data.value)
    await serviceOptionStore.submitServiceOptions(data.value)
    closeModal()
  }
}
const openMenu = async () => {
  let menuOptions = [
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
  await mtUtils.littlePopup(OptionModal, {options: menuOptions})
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await serviceOptionStore.destroyServiceOption(props.serviceData?.id_item_service_option).then(() => {
              closeModal()
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}


onMounted(async () => {
  if (props.serviceData?.id_item_service_option) {
    data.value.display_order = props.serviceData?.display_order
    data.value.id_item_service_child = props.serviceData?.id_item_service_child?.id_item_service
    itemServiceName.value = props.serviceData?.id_item_service_child?.name_item_service
    isEdit.value = true
  } else {
    isEdit.value = false
  }
})

</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        オプション管理
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon name="more_horiz" size="xs"/>
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-md">
      <div class="col-lg-12 col-md-12 col-sm-12 ">
        <MtInputForm
          v-model="props.propServiceItem.code_item_service"
          label="サービス商品CD"
          readonly
          type="text"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 ">
        <MtInputForm
          v-model="props.propServiceItem.name_item_service"
          label="連携元 サービス商品CD"
          readonly
          type="text"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 ">
        <SearchItemService
          v-model:selecting="data.id_item_service_child"
          :preselected="props.serviceData?.id_item_service_child"
          :rules="[aahValidations.validationSelection]"
          label="サービス商品CD" @update:selectingWhole="selectingItemService"/>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 ">
          <MtInputForm
            v-model="itemServiceName"
            autogrow
            readonly
            type="text"
          />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6 q-mb-lg">
        <MtInputForm
          v-model="data.display_order"
          type="text"
          label="表示順序（0~999; 小を上位表示）"
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
<style lang="scss" scoped>

.q-btn:hover {
  background-image: none !important;
}

</style>