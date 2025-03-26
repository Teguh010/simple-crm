<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import useRoomStore from '@/stores/rooms'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'

const clinicStore = useClinicStore()
const roomStore = useRoomStore()
const { getAllClinics } = storeToRefs(clinicStore)
const emits = defineEmits(['close'])
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])

const closeModal = () => {
  emits('close')
}

const props = defineProps({ data: Object })

const data = ref({
  id_clinic: null,
  level_floor: '',
  name_room: '',
  display_order: 0
})

const isEdit = ref(false)

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
            roomStore.destroyRoom(data.value.id_room).then(() => {
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
    roomStore.updateRoom(data.value.id_room, data.value).then(async () => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    roomStore.submitRoom(data.value).then(async () => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

onMounted(async () => {
  // await clinicStore.fetchClinics()
  allClinicList.value = [...getAllClinics.value]
  allClinicListDefault.push(...getAllClinics.value)

  if (props.data?.id_room) {
    // Update case
    data.value = props.data
    isEdit.value = true
  } else {
    // Create case
    isEdit.value = false
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        部屋・区画
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFilterSelect
            :options-default="allClinicListDefault"
            v-model:options="allClinicList"
            v-model:selecting="data.id_clinic"
            label="施設名"
            :disable="isEdit"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="number"
            v-model="data.level_floor"
            label="フロア Lv."
            tabindex="2"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtFormInputText
            v-model="data.name_room"
            label="部屋・区画名"
            autofocus
            tabindex="1"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="number"
            v-model="data.display_order"
            tabindex="3"
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
        <q-btn unelevated color="primary" tabindex="5" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
