<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCageStore from '@/stores/cages'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useRoomStore from '@/stores/rooms'
import useClinicStore from '@/stores/clinics'

const props = defineProps({ data: Object })
const emits = defineEmits(['close'])
const cageStore = useCageStore()
const roomStore = useRoomStore()
const clinicStore = useClinicStore()
const { getAllRooms } = storeToRefs(roomStore)
const { getAllClinics } = storeToRefs(clinicStore)
const allRoomsList = ref<any>([])
const allRoomsListDefault = reactive<any>([])
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])
const isEdit = ref(false)
const showRooms = ref(false)
const data = ref({
  id_room: null,
  id_clinic: null,
  code_cage: null,
  name_cage: null,
  flg_icu: false,
  flg_usable: false,
  display_order: '999'
})

const menuOptions = [
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

const closeModal = () => {
  emits('close')
}

const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            cageStore.destroyCage(data.value.id_cage).then(() => {
              cageStore.fetchCages()
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
    cageStore.updateCage(data.value.id_cage, data.value).then(async () => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    delete data.value.code_cage
    cageStore.submitCage(data.value).then(async () => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const init = async () => {
  if (data.value.id_clinic === null || data.value.id_clinic === '') {
    data.value.id_room = null
    showRooms.value = false
  } else if (data.value.id_clinic !== null || data.value.id_clinic !== '') {
    showRooms.value = true
  }
  if (allRoomsListDefault.length < 1) {
    data.value.id_room = null
  }
}

const selectingClinic = (value: string) => {
  if (value) {
    const filteredRooms = getAllRooms.value.filter(
      (room: any) => room.id_clinic === value
    )
    allRoomsList.value = [...filteredRooms]
    allRoomsListDefault.push(...filteredRooms)
    if (!isEdit.value && allRoomsList.value.length > 0) {
      data.value.id_room = allRoomsList.value[0]?.value
    }
  } else {
    allRoomsList.value.length = 0
    allRoomsListDefault.length = 0
    data.value.id_clinic = null
    showRooms.value = false
    data.value.id_room = null
  }
  init()
}

onMounted(async () => {
  allClinicList.value = [...getAllClinics.value]
  allClinicListDefault.push(...getAllClinics.value)
  if (props.data?.id_cage) {
    // Update case
    isEdit.value = true
    data.value = { ...props.data }
    selectingClinic(props.data?.id_clinic)
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
  }
  await init()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        ケージ
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-lg">
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="isEdit" class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            type="text"
            disable
            v-model="data.code_cage"
            label="ケージCD"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFilterSelect
            v-model:options="allClinicList"
            v-model:selecting="data.id_clinic"
            :options-default="allClinicListDefault"
            label="施設"
            :disable="isEdit"
            @update:selecting="selectingClinic"
          />
        </div>
        <div v-if="showRooms" class="col-lg-6 col-md-6 col-sm-12">
          <MtFilterSelect
            v-model:options="allRoomsList"
            v-model:selecting="data.id_room"
            :options-default="allRoomsListDefault"
            label="部屋"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12" tabindex="1">
          <MtInputForm
            type="text"
            v-model="data.name_cage"
            label="ケージ名 *"
            autofocus
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="checkbox"
            tabindex="-1"
            :items="[{ label: 'ICU' }]"
            v-model="data.flg_icu"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="checkbox"
            tabindex="-1"
            :items="[{ label: '使用可能' }]"
            v-model="data.flg_usable"
          />
        </div>
      </div>
      <div class="row items-center q-col-gutter-md">
        <div class="col-lg-4 col-md-4 col-sm-6" tabindex="2">
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
        <q-btn
          tabindex="-1"
          outline
          class="bg-grey-100 text-grey-800"
          @click="closeModal"
        >
          <span> キャンセル </span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span> 保存 </span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
