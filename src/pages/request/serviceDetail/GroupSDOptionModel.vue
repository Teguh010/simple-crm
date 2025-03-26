<script lang="ts" setup>

import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import { onMounted, ref } from 'vue'
import aahValidations from '@/utils/aahValidations'


const emits = defineEmits(['close'])
const props = defineProps({ service_detail_list: Object, setSelectedServiceList: Function, returnModal: Function })

const name_item_service = ref('')

const service_detail_list = ref([])

const closeModal = () => {
  props.returnModal()
  emits('close')
}

const save = () => {
  const idexxGroup = service_detail_list.value.filter(item => item.isChecked)
  const normalGroup = service_detail_list.value.filter(item => !item.isChecked)
  props.setSelectedServiceList(name_item_service.value, idexxGroup, normalGroup)
  
  emits('close')
}

onMounted(() => {

  if (props && props.service_detail_list && props.service_detail_list.length > 0) {
    name_item_service.value = props.service_detail_list[0].name_item_service ?? props.service_detail_list[0].name_service_item_unit
    service_detail_list.value = JSON.parse(JSON.stringify(props.service_detail_list))
    service_detail_list.value.forEach(item => item.isChecked = true)
  }


})

</script>

<template>
  <q-form @submit="save">
    <q-card class="mt-small-popup">
    <MtModalHeader class="bg-light-blus" @close-modal="closeModal">
      <div class="full-width">治療サービスのグループ化</div>
    </MtModalHeader>
    <q-scroll-area style="height: 50vh">
      <div class="row">
        <MtFormInputText v-model="name_item_service" :rules="[aahValidations.validationRequired]" class="col-12 text-input"
                         outlined>
          <template v-slot:append>
            <q-icon class="q-pt-xs" name="edit" size="sm" />
          </template>
        </MtFormInputText>
      </div>
      <div class="flex columns q-pb-md">
        <div v-for="ISU1 in service_detail_list.filter((item)=> item.isChecked)" :key="ISU1?.id_item_service_unit"
             class="flex">

          <div class="flex item-service-unit-box1" @click="()=> ISU1.isChecked = !ISU1.isChecked">
            <q-icon class="q-pt-xs q-mr-sm" name="arrow_right" />
            {{ ISU1.name_item_service ? ISU1.name_item_service : ISU1.name_service_item_unit }}
            <MtFormCheckBox v-model:checked="ISU1.isChecked" />
          </div>
        </div>
      </div>
      <q-separator></q-separator>
      <div class="flex columns q-pb-md">
        <div v-for="ISU1 in service_detail_list.filter((item)=> !item.isChecked)" :key="ISU1?.id_item_service_unit"
             class="flex">

          <div class="flex item-service-unit-box" @click="()=> ISU1.isChecked = !ISU1.isChecked">
            <q-icon class="q-pt-xs q-mr-sm" name="arrow_right" />
            {{ ISU1.name_item_service ? ISU1.name_item_service : ISU1.name_service_item_unit }}
            <MtFormCheckBox v-model:checked="ISU1.isChecked" />
          </div>
        </div>
      </div>
    </q-scroll-area>

      <q-card-section class="q-bt bg-white">
        <div class="text-center modal-btn">
          <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
            <span>キャンセル</span>
          </q-btn>
          <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
            <span>保存</span>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-form>
</template>

<style lang="scss" scoped>
.text-input {
  padding: 8px 7px;
  margin: 5px 0px !important;
}

.item-service-unit-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 236, 248, 0.7);
  color: $grey-800;
  padding: 8px 10px;
  margin: 5px 8px !important;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background-color: rgba(236, 213, 228, 0.7);
  }
}


.item-service-unit-box1 {
  display: flex;
  align-items: center;
  background-color: rgba(181, 233, 193, 0.7);
  color: $grey-800;
  padding: 8px 10px;
  margin: 5px 8px !important;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background-color: rgba(181, 260, 193, 0.7);
  }
}

</style>