<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateItemServiceGroupModal from './UpdateItemServiceGroupModal.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import useServiceGroupStore from '@/stores/service-groups'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useServiceGroupItemStore from '@/stores/service-group-items'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { storeToRefs } from 'pinia'
import useItemStore from '@/stores/items'
import useCategoryStore from '@/stores/categories'
import useCommonStore from '@/stores/common'
import { typeGroupItem, typeItem } from '@/utils/enum'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

const commonStore = useCommonStore()
const serviceGroupItemStore = useServiceGroupItemStore()
const serviceGroupStore = useServiceGroupStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const itemStore = useItemStore()
const categoryStore = useCategoryStore()
const emits = defineEmits(['close'])
const { getCommonTypeAnimalOptionList, getCommonTypeServiceOptionList } = storeToRefs(commonStore)
const { getServiceGroupItems } = storeToRefs(serviceGroupItemStore)

const props = defineProps({ data: Object })
const myForm = ref(null)

const isEdit = ref(false)

const data = ref({
  name_service_group: null,
  type_group_item: null,
  memo_type_service_group: null,
  id_cm_animal: [],
  display_order: null,
  service_group_items: null,
  id_clinic: null
})
const getItem = (value: string) =>
  itemStore.getAllItems.find((v) => v.id_item_service === value)
const categoryName = (value: any) =>
  categoryStore.getAllCategories.find((v) => v.value === value)?.label
const serviceGroupItemName = (value) =>
  itemServiceUnitStore.getItemServiceUnits.find(
    (v) => v.id_item_service_unit === value
  )
const closeModal = () => {
  emits('close')
}

const openItemServiceGroupModal = async () => {
  await mtUtils.smallPopup(UpdateItemServiceGroupModal, {
    typeGroupItem: data.value.type_group_item,
    groupItemData: data.value
  })
}
const openEditItemServiceGroupModal = async (groupItemData: any) => {
  await mtUtils.smallPopup(UpdateItemServiceGroupModal, {
    typeGroupItem: data.value.type_group_item,
    groupItemData
  })
}
const getTypeServiceName = (value) => {
  return getCommonTypeServiceOptionList.value.find((v) => v.id_common == value)?.name_common
}
const getTypeItemName = (value) => {
  return typeItem.find((v) => v.value == value)?.label
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
            serviceGroupStore
              .destroyServiceGroup(data.value.id_service_group)
              .then(() => {
                serviceGroupStore.fetchServiceGroups()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const deleteItem = async (id = null) => {
  await mtUtils
    .confirm(aahMessages.delete_ask, aahMessages.delete)
    .then((confirmation) => {
      if (confirmation) {
        if (props.data) {
          serviceGroupItemStore
            .destroyServiceGroupItem(data.value.id_service_group, id)
            .then(async () => {
              await serviceGroupStore.fetchServiceGroups()
              await serviceGroupItemStore.fetchServiceGroupItems(
                data.value.id_service_group
              )
              serviceGroupStore.selectServiceGroup(data.value.id_service_group)
              mtUtils.autoCloseAlert(aahMessages.success)
            })
        }
      }
    })
}
const submit = () => {
  myForm.value.validate().then((success) => {
    if (success) {
      if (props.data) {
        serviceGroupStore
          .updateServiceGroup(data.value.id_service_group, data.value)
          .then(async () => {
            await serviceGroupStore.fetchServiceGroups()
            emits('close')
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      } else {
        serviceGroupStore
          .submitServiceGroup(data.value)
          .then(async (response: any) => {
            await serviceGroupStore.fetchServiceGroups()
            data.value = { ...serviceGroupStore.getRecentServiceGroup }
            isEdit.value = true
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      }
    }
  })
}
onMounted(async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [1, 11] })
  if (props.data?.id_service_group) {
    // Update case
    isEdit.value = true
    data.value = props.data
    serviceGroupItemStore.fetchServiceGroupItems(props.data?.id_service_group)
  } else {
    // Create case
    serviceGroupItemStore.selectServiceGroupItems([]) // reset to empty array for create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit" ref="myForm">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        治療・サービスグループ（テンプレート）
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-scroll-area class="modal-content">
      <q-card-section class="q-px-xl">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-lg-6 col-md-12 col-sm-12" tabindex="1">
            <MtInputForm
              type="text"
              v-model="data.name_service_group"
              label="テンプレートグループ名 *"
              autofocus
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-6 col-md-4 col-sm-12" tabindex="2">
            <MtFormPullDown
              v-model:selected="data.type_group_item"
              :options="typeGroupItem"
              label="グループ区分"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12" tabindex="3">
            <MtInputForm
              type="text"
              v-model="data.memo_type_service_group"
              label="説明"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-3" tabindex="4">
            <q-select
              v-model="data.id_cm_animal"
              :options="getCommonTypeAnimalOptionList"
              clearable
              dense
              emit-value
              label="動物種別"
              map-options
              multiple
              use-chips
              @clear="()=> data.id_cm_animal = []"
            />
          </div>
        </div>
        <div class="row q-col-gutter-xs">
          <div class="col-3">
            <MtInputForm
              type="text"
              v-model="data.display_order"
              label="表示順序（0~999; 小を上位表示）"
            />
          </div>
        </div>
        <div class="q-mt-lg" v-if="isEdit">
          <div class="body1 bold text-black q-mb-md">グループ項目</div>
          <div
            v-for="(value, index) in getServiceGroupItems"
            class="row q-mb-xs"
          >
            <div
              class="col-11 q-pa-md body1 regular text-grey-900 cursor-pointer"
              :class="{
                'bg-grey-050': index % 2 === 0,
                'bg-grey-100': index % 2 !== 0
              }"
              @click="openEditItemServiceGroupModal(value)"
            >
              <div class="row">
                <div v-if="value.id_item_service_unit" class="col-2 ">
                  {{
                    value?.id_item_service_unit?.id_item_service?.flg_service
                      ? getTypeServiceName(
                        value?.id_item_service_unit?.id_item_service
                          ?.id_cm_type_service
                      )
                      : getTypeItemName(
                        value?.id_item_service_unit?.id_item_service
                          ?.type_item
                      )
                  }}
                </div>
                <div v-if="value.id_item_service" class="col-2">
                  {{
                    value?.id_item_service?.flg_service
                      ? getTypeServiceName(value?.id_item_service?.type_service)
                      : getTypeItemName(value?.id_item_service?.type_item)
                  }}
                </div>
                <div
                  v-if="value.id_item_service_unit"
                  class="col-4 text-left overflow-break"
                >
                  <span>{{
                      value.id_item_service_unit.code_item_service_unit
                    }}</span>
                  <span class="q-ml-md">
                    {{
                      value.id_item_service_unit.name_service_item_unit
                    }}
                  </span>
                </div>
                <div
                  v-if="value.id_item_service"
                  class="col-4 text-left overflow-break"
                >
                  <span>{{ value.id_item_service.code_item_service }}</span>
                  <span class="q-ml-md">{{
                      value.id_item_service.name_item_service
                    }}</span>
                </div>
                <template v-if="value.id_item_service">
                  <div class="text-body1 text-grey-900 col-2"></div>
                  <div class="text-body2 text-grey-700 flex items-center col-2">
                    {{
                      value?.id_item_service?.name_category1
                        ? value?.id_item_service?.name_category1
                        : '-'
                    }}
                  </div>
                  <div class="col-2">
                    {{
                      value?.id_item_service?.name_category2
                        ? value?.id_item_service?.name_category2
                        : '-'
                    }}
                  </div>
                </template>
                <template v-if="value.id_item_service_unit">
                  <div class="text-body1 text-grey-900 col-2"></div>
                  <div class="text-body2 text-grey-700 flex items-center col-2">
                    {{
                      value?.id_item_service_unit?.id_item_service
                        ?.name_category1
                        ? value?.id_item_service_unit?.id_item_service
                          ?.name_category1
                        : '-'
                    }}
                  </div>
                  <div class="col-2">
                    {{
                      value?.id_item_service_unit?.id_item_service
                        ?.name_category2
                        ? value?.id_item_service_unit?.id_item_service
                          ?.name_category2
                        : '-'
                    }}
                  </div>
                </template>
              </div>
            </div>
            <div class="col-auto q-pa-md">
              <q-btn
                @click="
                  deleteItem(value.id_service_group_item)
                "
                size="10px"
                unelevated
                round
                color="grey-500"
                icon="close"
              />
            </div>
          </div>
          <div class="row q-mt-md">
            <div class="col-12">
              <q-btn
                @click="openItemServiceGroupModal"
                unelevated
                size="24px"
                color="grey-100"
                text-color="grey-800"
                icon="add"
                class="full-width q-pa-sm"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          type="submit"
          unelevated
          color="primary"
          tabindex="10"
          class="q-ml-md"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss">
.modal-content {
  height: 50vh;
}
</style>
