<script setup lang="ts">
import { toKatakana } from 'wanakana'
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { blank } from '@/utils/aahUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useManufacturer from '@/stores/manufacturers'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

const manufacturerStore = useManufacturer()
const { getManufacturer } = storeToRefs(manufacturerStore)
const emits = defineEmits(['close'])

const props = defineProps({ data: Object })

const isEdit = ref(false)

const data = ref({
  name_manufacturer: '',
  name_kana_manufacturer: '',
  // flg_stop_purchase: false,
  flg_halt: false,
  date_halt: null,
  memo: null,
  display_order: null,
  id_clinic: null
})

const blankField = (row: any) => (data.value = blank(data.value, row))

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
            manufacturerStore
              .destroyManufacturer(data.value.id_manufacturer)
              .then(() => {
                manufacturerStore.fetchManufacturers()
                manufacturerStore.fetchPreparationManufacturers()
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
    manufacturerStore
      .updateManufacturer(data.value.id_manufacturer, data.value)
      .then(async () => {
        await manufacturerStore.fetchManufacturers()
        await manufacturerStore.fetchPreparationManufacturers()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    manufacturerStore.submitManufacturer(data.value).then(async () => {
      await manufacturerStore.fetchManufacturers()
      await manufacturerStore.fetchPreparationManufacturers()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const convertToKatakana = () => {
  // 入力された値をログに出力
  // 入力された値をカタカナに変換
  data.name_kana_manufacturer = toKatakana(data.name_manufacturer);
}
onMounted(() => {
  if (props.data?.id_manufacturer) {
    // Update case
    isEdit.value = true
    data.value = props.data
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        製造販売業者
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.name_manufacturer"
            @update:modelValue="convertToKatakana"
            :isKatakana="false"
            label="製造販売業者名 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.name_kana_manufacturer"
            :isKatakana="false"
            label="略称 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '入荷停止' }]"
            v-model="data.flg_halt"
            @click="blankField(['date_stop_purchase'])"
          />
        </div>
        <div class="col-4" v-show="data.flg_halt">
          <MtFormInputDate
          type="date"
          v-model:date="data.date_halt"
          label="入荷停止日"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtInputForm type="text" v-model="data.memo" label="メモ" autogrow />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-4">
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
        <q-btn v-permission type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
