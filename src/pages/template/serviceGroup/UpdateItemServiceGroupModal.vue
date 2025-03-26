<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useServiceGroupItemStore from '@/stores/service-group-items'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import useServiceGroupStore from '@/stores/service-groups'
import useDoseStore from '@/stores/dose-frequencies'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useItemStore from '@/stores/items'
import MtSearchItemServiceUnit from '@/components/MtSearchItemServiceUnit.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'

const serviceGroupItemStore = useServiceGroupItemStore()
const serviceGroupStore = useServiceGroupStore()
const doseStore = useDoseStore()
const { getServiceGroupItem } = storeToRefs(serviceGroupItemStore)
const { getServiceGroup } =
  storeToRefs(serviceGroupStore)
const emits = defineEmits(['close'])
const myForm = ref(null)
const isEdit = ref(false)
const itemServiceStore = useItemStore()
const props = defineProps({
  typeGroupItem: null,
  groupItemData: {
    type: Object,
    default: null
  }
})

const data = ref({
  id_service_group: null,
  id_item_service_unit: null,
  id_item_service: null,
  quantity: null,
  id_dose: null,
  display_order: null
})
const itemServiceList = ref([])

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
            serviceGroupItemStore
              .destroyServiceGroupItem(
                data.value.id_service_group,
                data.value.id_service_group_item
              )
              .then(async () => {
                await serviceGroupStore.fetchServiceGroups()
                await serviceGroupItemStore.fetchServiceGroupItems(
                  getServiceGroup.value?.id_service_group
                )
                serviceGroupStore.selectServiceGroup(
                  getServiceGroup.value?.id_service_group
                )
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const closeModal = () => {
  emits('close')
}
const submit = () => {
  myForm.value.validate().then((success) => {
    if (success) {
      if (isEdit.value) {

        if (data.value.id_item_service_unit && typeof data.value.id_item_service_unit === 'object') {
          data.value.id_item_service_unit =
            data.value.id_item_service_unit.id_item_service_unit
        }

        serviceGroupItemStore
          .updateServiceGroupItem(
            data.value?.id_service_group,
            data.value?.id_service_group_item,
            data.value
          )
          .then(async () => {
            await serviceGroupStore.fetchServiceGroups()
            await serviceGroupItemStore.fetchServiceGroupItems(
              getServiceGroup.value.id_service_group
            )
            serviceGroupStore.selectServiceGroup(
              getServiceGroup.value.id_service_group
            )
            emits('close')
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      } else {
        if (data.value.id_service_group) {
          serviceGroupItemStore
            .submitServiceGroupItem(
              data.value.id_service_group,
              data.value
            )
            .then(async () => {
              await serviceGroupStore.fetchServiceGroups()
              await serviceGroupItemStore.fetchServiceGroupItems(
                data.value.id_service_group
              )
              serviceGroupStore.selectServiceGroup(
                data.value.id_service_group
              )
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
        }
      }
    }
  })
}
onMounted(() => {
  if (props.groupItemData?.id_service_group_item) {
    isEdit.value = true
    data.value = { ...props.groupItemData }
    if (data.value.quantity) data.value.quantity = parseInt(data.value.quantity)
    return
  }
  data.value.id_service_group = props.groupItemData.id_service_group
  
})
</script>

<template>
  <q-form @submit="submit()" ref="myForm">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        サービスグループ項目
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <MtSearchItemServiceUnit
            v-if="props.typeGroupItem != '1'"
            v-model:selecting="data.id_item_service_unit"
            :preselected="props.groupItemData?.id_item_service_unit"
            label="商品CD・名称"
            :type="props.typeGroupItem"
            :rules="[aahValidations.validationSelection]"
            @update:selectingWhole="selectingItemService"
          />
          <MtSearchItemService
            v-else
            :mode="2"
            :pre-selected-id="data.id_item_service?.id_item_service"
            :search-icon="true"
            label="登録商品名 "
            @update:selecting="
              (value) => {
                data.id_item_service = value
              }
            "
            :excludeInject="true"
          />
        </div>
      </div>
      <div
        class="row q-col-gutter-md q-mb-sm"
        v-if="props.typeGroupItem != '1'"
      >
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data.quantity"
            label="数量 *"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
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
        <q-btn @click="submit()" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
