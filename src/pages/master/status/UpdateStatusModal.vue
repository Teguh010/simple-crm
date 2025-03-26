<script setup lang="ts">
import { onMounted, ref, reactive, computed, unref, h } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useStatusStore from '@/stores/status'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { blank } from '@/utils/aahUtils'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import { typeCategoryChild, typeCategoryParent } from '@/utils/enum'

const emits = defineEmits(['close'])
const statusStore = useStatusStore()
const clinicStore = useClinicStore()
const props = defineProps<{
  data: Record<string, any>
  statuses: Array<Record<string, any>>
}>()
const { getAllClinics } = storeToRefs(clinicStore)
const parentStatusCode = ref<number | undefined>()
const childOptions = ref([])

const isEdit = ref(false)
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])

const data = ref({
  type_category_parent: parentStatusCode.value,
  id_employee: null,
  type_category_child: null,
  name_status: null,
  display_order: null,
  id_emp_show: false,
  id_clinic: null
})

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

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
            statusStore.destroyStatus(data.value.id_status).then(() => {
              statusStore.fetchStatuses()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}
const submit = () => {
  data.value.type_category_parent = parentStatusCode.value
  if (props.data) {
    statusStore.updateStatus(data.value.id_status, data.value).then(() => {
      // statusStore.fetchStatuses()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    statusStore.submitStatus(data.value).then(() => {
      // statusStore.fetchStatuses()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}
const closeModal = () => {
  emits('close')
}

const blankField = (row) => (data.value = blank(data.value, row))

// Custom function to determine child options
function determineChildOptions(parentValue: number) {
  const filteredStatuses = props.statuses?.filter((s) => {
    return s.func1?.toString() === parentValue?.toString()
  })
  if (!data.value.type_category_child)
    data.value.type_category_child = filteredStatuses[0].value

  return filteredStatuses
}

// Computed property that uses the custom function
function updateChildOptions(newValue) {
  childOptions.value = determineChildOptions(newValue)
}

function init(parentCategory: number) {
  // Function for determining the child options
  updateChildOptions(parentCategory)
  if (getAllClinics.value) {
    let allClinics = [] as any
    const noFacilityArr = clinicStore.getClinics.filter(
      (cli) => cli?.flg_facility === false
    )
    allClinics = getAllClinics.value.filter((clint) =>
      noFacilityArr.find((cli) => cli?.id_clinic == clint?.value)
    )
    allClinicList.value = [...allClinics]
    allClinicListDefault.push(...allClinics)
  }
}

const selectDefaultEmployee = () => {
  data.value.id_employee = defaultEmployee
}

const renderColorPeek = (colorValue: string) => {
  return h(
    'div',
    {
      class: 'flex items-end full-height',
      style: { paddingBottom: '0px', marginTop: '4px' }
    },
    [
      h('div', {
        class: 'rounded-borders',
        style: {
          height: '15px',
          width: '15px',
          backgroundColor: colorValue
        }
      })
    ]
  )
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  parentStatusCode.value =
    data.value.type_category_parent ?? typeCategoryParent[0].value
  if (props.data?.id_status) {
    // Update case
    isEdit.value = true
    data.value = props.data
    if (data.value.id_employee) data.value.id_emp_show = true
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }

  // init(data.value.type_category_parent)
  init(parentStatusCode.value)
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        院内ステータス
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content row q-col-gutter-lg">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFilterSelect
          :options-default="allClinicListDefault"
          v-model:options="allClinicList"
          v-model:selecting="data.id_clinic"
          label="病院名"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <MtFormPullDown
          label="院内ステータス 大区分 *"
          v-model:selected="parentStatusCode"
          :options="typeCategoryParent"
          required
          :rules="[aahValidations.validationSelection]"
          @update:modelValue="init"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12" v-show="parentStatusCode">
        <MtFormPullDown
          label="院内ステータス 中区分 *"
          v-model:selected="data.type_category_child"
          :options="childOptions"
          :rules="[aahValidations.validationSelection]"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          type="text"
          v-model="data.name_status"
          label="ステータス名 *"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <!-- <MtInputForm
          type="text"
          v-model="data.bg_color_code"
          label="背景色 bg colour"
        /> -->
        <q-input v-model="data.bg_color_code" label="背景色" class="my-input">
          <template #label v-if="data.bg_color_code">
            <span class="row" style="column-gap: 5px">
              背景色<component :is="renderColorPeek(data.bg_color_code)" />
            </span>
          </template>
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-color v-model="data.bg_color_code" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <!-- <MtInputForm
          type="text"
          v-model="data.color_code"
          label="文字色 colour code"
        /> -->
        <q-input v-model="data.color_code" label="文字色" class="my-input">
          <template #label v-if="data.color_code">
            <span class="row" style="column-gap: 5px">
              文字色<component :is="renderColorPeek(data.color_code)" />
            </span>
          </template>
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-color v-model="data.color_code" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <MtInputForm
          type="checkbox"
          :items="[{ label: '従業員の設定' }]"
          v-model="data.id_emp_show"
          @click="blankField(['id_employee'])"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12" v-show="data.id_emp_show">
        <InputEmployeeOptGroup
          label="従業員名"
          v-model="data.id_employee"
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6 q-mb-lg">
        <MtInputForm
          type="text"
          v-model="data.display_order"
          label="表示順序（0~999; 小を上位表示）"
          required
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
.my-input {
  max-width: 250px;
}
</style>
