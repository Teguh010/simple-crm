<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateClinicModal from './UpdateClinicModal.vue'
import mtUtils from '@/utils/mtUtils'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import _ from 'lodash'
import router from '@/router'
import { useRoute } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { ClinicType } from '@/types/types'

const clinicStore = useClinicStore()
const { getClinics } = storeToRefs(clinicStore)
const nameClinicDisplay = ref('')
const clinicList = ref([])
const mainClinicList = ref([])
const flgMainClinic = ref(true)
const route = useRoute()
const currentClinic = JSON.parse(localStorage.getItem('id_clinic') as string)

const columns = [
  {
    name: 'name_clinic_display',
    label: '病院名',
    field: 'name_clinic_display',
    align: 'left',
    style: 'width: 12%',
    headerStyle: 'width: 12%'
  },
  {
    name: 'flg_clinic_main',
    label: '本院',
    field: 'flg_clinic_main',
    align: 'left',
    style: 'width: 20%',
    headerStyle: 'width: 20%'
  },
  {
    name: 'name_director',
    label: '院長名',
    field: 'name_director',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  }
]

const openAddModal = async () => {
  clinicStore.selectClinic(null)
  const data = null
  await mtUtils.mediumPopup(UpdateClinicModal, {
    data,
    flgMainClinic: flgMainClinic.value
  })
  await clinicStore.fetchClinics()
  await init()
}
const onRowClick = async (data: ClinicType) => {
  // Allow adding/editing for the main clinic or if the clicked clinic is the main clinic, even if flgMainClinic is false.
  const canUpdateMainClinic = flgMainClinic.value || data?.flg_clinic_main

  await mtUtils.mediumPopup(UpdateClinicModal, {
    data,
    flgMainClinic: canUpdateMainClinic
  })
  await clinicStore.fetchClinics()
  await init()
}
const openClinicModal = async (id: number, selectedTab: string) => {
  const data = await clinicStore.fetchClinicById(id.toString())

  const canUpdateMainClinic = flgMainClinic.value || data?.flg_clinic_main
  await mtUtils.mediumPopup(UpdateClinicModal, {
    data,
    selectedTab,
    flgMainClinic: canUpdateMainClinic
  })
  await init()
}
const search = () => {
  clinicStore.fetchClinics({
    name_clinic_display: nameClinicDisplay.value
  })
}
function transformToTree(arr: any) {
  var nodes = {}
  return arr.filter(function (obj: any) {
    var id = obj['id_clinic'],
      parentId = obj['id_clinic_parent']
    nodes[id] = _.defaults(obj, nodes[id], { children: [] })
    parentId &&
      (nodes[parentId] = nodes[parentId] || { children: [] })['children'].push(
        obj
      )
    return !parentId
  })
}
const init = async () => {
  flgMainClinic.value = true
  if (getClinics.value) {
    clinicList.value = getClinics.value
    var result = transformToTree(clinicList.value)
    result.filter((cli: any) => {
      if (cli?.flg_clinic_main) {
        flgMainClinic.value = false
      }
    })
    // const noFacilityArr = result.filter((cli) => cli?.flg_facility === false)
    mainClinicList.value = result

    console.log('mainClinicList', mainClinicList.value)
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  const {
    query: { tab }
  } = route
  if (tab && currentClinic) {
    await openClinicModal(currentClinic, tab as string)
  }
  setPageTitle('病院・施設一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          病院・施設一覧
        </q-toolbar-title>
        <q-btn
          class="q-mr-sm q-ba"
          unelevated
          padding="1px 2px"
          @click="router.push('/SearchRoomList')"
        >
          <span class="q-px-md">部屋・区画</span>
        </q-btn>
        <q-btn
          class="q-mr-sm q-ba"
          unelevated
          padding="1px 2px"
          @click="router.push('/SearchCageList')"
        >
          <span class="q-px-md">ケージ</span>
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />病院・施設
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div
      class="row items-start q-px-xl q-pb-xs q-mb-md bg-white full-width q-mt-lg"
      v-for="(clinic, i) in mainClinicList"
      :key="i"
    >
      <div
        class="row items-center justify-center parent bg-grey-300 full-width q-px-lg q-py-sm"
      >
        <span v-if="clinic?.flg_clinic_main">
          <q-icon size="22px" name="business" class="q-mr-sm" />
          <span class="q-pr-xs">（本院）</span>
        </span>
        <span>{{ clinic.name_clinic_display }}</span>
      </div>
      <div class="justify-start flex items-start q-mt-md" v-if="clinic">
        <q-btn
          padding="10px 20px"
          unelevated
          color="grey-200"
          text-color="grey-900"
          no-caps
          class="q-ml-md q-mb-md border-outline-600 border-radius"
          @click="onRowClick(clinic)"
        >
          <div>
            <span>{{ clinic?.name_clinic_display }}</span>
            <div class="column item-start justify-left text-left">
              <span v-if="clinic?.flg_facility == false"
                >病院CD: {{ clinic?.code_clinic }}</span
              >
              <span v-if="clinic?.name_director"
                >院長名: {{ clinic?.name_director }}</span
              >
              <span v-if="clinic?.phone1">電話: {{ clinic?.phone1 }}</span>
              <span v-if="clinic?.name_clinic_short"
                >略称: {{ clinic?.name_clinic_short }}</span
              >
            </div>
          </div>
        </q-btn>
      </div>
      <div
        class="children justify-center flex items-center q-mt-md"
        v-if="clinic.children && clinic.children.length > 0"
      >
        <q-btn
          v-for="(child, n) in clinic.children"
          :key="n"
          padding="10px 20px"
          unelevated
          color="grey-200"
          text-color="grey-900"
          no-caps
          class="q-ml-md q-mb-md border-outline-600 border-radius"
          @click="onRowClick(child)"
        >
          <div>
            <span>{{ child?.name_clinic_display }}</span>
            <div class="column item-start justify-left text-left">
              <span v-if="child?.name_director"
                >責任者: {{ child?.name_director }}</span
              >
              <span v-if="child?.phone1">電話: {{ child?.phone1 }}</span>
            </div>
          </div>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.border-radius {
  border-radius: 10px !important;
}
</style>
