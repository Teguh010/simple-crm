<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useEmployeeStore from '@/stores/employees'
import useConversationStore from '@/stores/Conversation'
import useClinicStore from '@/stores/clinics'
import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import { blank, checkPassword, dateFormat, passwordRule } from '@/utils/aahUtils'
import { imageResize } from '@/utils/helper'
import useAddressesStore from '@/stores/addresses'
import { storeToRefs } from 'pinia'
import InputZipcode from '@/components/form/InputZipcode.vue'
import { typeCustomerGender, typeEmployee, typeOccupation } from '@/utils/enum'
import { event_bus } from '@/utils/eventBus'
import { CliCommon } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import { SYS_ADMIN_ID } from '@/utils/constent'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const emits = defineEmits('close')
const addressStore = useAddressesStore()
const employeeStore = useEmployeeStore()
const conversationStore = useConversationStore()
const clinicStore = useClinicStore()

// const { getZipCode } = storeToRefs(addressStore) // not in use
const _zipCode = computed(() => addressStore.zipCode)

const { getClinics, getClinic } = storeToRefs(clinicStore)
const isEdit = ref(false)
const empImagePreview = ref()
const props = defineProps({ data: Object, searchData: Function })
const cliCommonStore = useCliCommonStore()
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const employeeDeptList = ref([])
const passwordFeedback = ref('')
const passwordScore = ref(0)

const data = ref({
  name_family: '',
  name_first: '',
  name_kana_family: null,
  name_kana_first: null,
  name_display: null,
  code_employee: null,
  image_path1: '',
  type_employee: null,
  type_department: null,
  type_occupation: null,
  type_position: null,
  flg_calendar: false,
  flg_cart_approver: false,

  birthday: '',

  zip_code: null,
  address_prefecture: null,
  address_city: null,
  address_other: null,
  phone_emergency: null,

  phone_title1: null,
  phone1: null,
  phone_title2: null,
  phone2: null,

  email_title1: null,
  email1: null,
  email_title2: null,
  email2: null,

  memo_employee: null,

  date_joined: null,
  flg_resignation: false,
  date_resignation: null,

  login_id: null,
  login_pw: null,
  flg_login_disabled: false,
  display_order: null,
  id_clinic_list: []
})
const f1_status = ref('unchanged')

const blankField = (row) => (data.value = blank(data.value, row))

const closeModal = () => {
  emits('close')
}
const submit = async () => {
  const payload = {...data.value}  

  if(payload.flg_resignation){
    const confirmation = await mtUtils.confirm(
      '院内で共有アカウントの使用がある場合には本ユーザーの退職後のログインがないように全共有パスワードの更新をしてください。\n \n パスワードの更新をしていない場合には本ユーザーを退職更新しないようにしてください。',
      '確認',
      '更新したので退職登録',
    );
    
    if (!confirmation) {
      emits('close');
      return;
    }
  }

  payload.birthday = dateFormat(payload.birthday, 'YYYY-MM-DD')
  payload.id_clinic_list = JSON.stringify(payload.id_clinic_list)

  if (f1_status.value === 'removed') {
    delete data.value.image_path1
  }
  
  if (props.data) {
    employeeStore
      .updateEmployee(data.value.id_employee, payload)
      .then(() => {
        props.searchData()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
      .catch((error) => {
        if (
          error.response?.status === 400 &&
          error?.response?.data?.data?.login_id.length > 0
        ) {
          mtUtils.autoCloseAlert('ログインIDが重複しています')
        }
      })
    data.value.id_clinic_list = JSON.parse(data.value.id_clinic_list)

  } else {
    employeeStore.submitEmployee(payload).then((res) => {
      if (res.data.id_employee) {
        // Create vet user
        let employeeData = res.data.data
        let payload = {
          name_user: employeeData.code_employee,
          name_display: employeeData.name_display
        }
        conversationStore.createVeterinary(payload)
      }
      employeeStore.fetchEmployees()
      emits('close')
      mtUtils.autoCloseAlert('更新しました')
    })
  }
}
const onFilePicked = (e, type) => {
  const files = e.target.files;
  const reader = new FileReader();
  reader.onload = (e) => {
    mtUtils.smallPopup(ImageCropper, {image: e.target.result})
  };  
  reader.readAsDataURL(files[0]);
}
const changeZipCode = (value: any) => {
  // Convert zip code to string/numbers
  if (typeof value === 'object') {
    data.value.address_prefecture = value.address_prefecture
    data.value.address_city = value.address_city
    data.value.address_other = value.address_other
    data.value.zip_code = value.zip_code
  }
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
            employeeStore.destroyEmployee(data.value.id_employee).then(() => {
              props.searchData()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const callCheckPassword = (value: string) => {
  const result = checkPassword(value)
  passwordScore.value = result.score
  passwordFeedback.value = result.feedback
}

const removeImage = () => {
  data.value.image_path1 = empImagePreview.value = null
  f1_status.value = 'removed'
}
const handleIdClinic = (value: any) => {
  if (!value || value.length === 0) {
    data.value.id_clinic_list = null
  }
}
event_bus.on('cropped-image', (image) => {
  imageResize(image.blob).then((i) => {
    data.value.image_path1 = i
    empImagePreview.value = URL.createObjectURL(i)
    f1_status.value = 'changed'
  })
  .catch((error) => {
    console.error('Failed to resize image:', error)
  })
})
onMounted(async () => {
  if (props.data?.id_employee) {
    // Update case
    isEdit.value = true
    data.value = JSON.parse(JSON.stringify(props.data))
    if (data.value.flg_cart_approver == 1) {
      data.value.flg_cart_approver = true
    }

    if (data.value.login_pw == '') delete data.value.login_pw
    if (data.value.image_path1 != '')
      empImagePreview.value = data.value.image_path1
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
  }

  init()
})
const init = async () => {
  employeeDeptList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
}
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{ isEdit ? '従業員：' : '新規 従業員' }}
        <span v-if="isEdit">
          {{ data.name_family + ' ' + data.name_first + 'さん' }}
        </span>
      </q-toolbar-title>
      <MtInputForm
        type="checkbox"
        :items="[{ label: 'カレンダー' }]"
        v-model="data.flg_calendar"
      />
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row items-center q-mb-md">
        <div class="col-2">
          <div
            v-if="empImagePreview"
            class="relative-position"
            style="width: 200px"
          >
            <q-img
              :src="empImagePreview"
              spinner-color="white"
              style="width: 200px"
              class="border-radius cursor-pointer"
              @click="$refs.emp_image.click()"
            />
            <q-badge
              color="red"
              transparent
              class="clear-image cursor-pointer"
              @click="removeImage"
            >
              <q-icon name="close" />
            </q-badge>
          </div>
          <q-icon
            v-else
            @click="$refs.emp_image.click()"
            name="add"
            size="lg"
            color="white"
            class="bg-grey-300 q-pa-xl border-radius cursor-pointer"
          />
          <input
            type="file"
            style="display: none"
            ref="emp_image"
            accept="image/*"
            @change="onFilePicked($event, 'emp_image')"
          />
        </div>
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.code_employee"
            label="従業員CD"
            readonly
          />
        </div>
      </div>
      <div class="row items-center q-mb-md">
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.name_family"
            :isKatakana="false"
            label="姓 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.name_first"
            label="名 *"
            :isKatakana="false"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.name_display"
            label="アプリ内表示名 *"
            :isKatakana="false"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row items-center q-mb-md q-mr-md">
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.name_kana_family"
            :isKatakana="false"
            label="姓カナ"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.name_kana_first"
            :isKatakana="false"
            label="名カナ"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row items-center q-mb-lg">
        <div class="col-3 q-mr-md">
          <MtInputForm
            type="radio"
            v-model="data.type_gender"
            :items="typeCustomerGender"
          />
        </div>
        <div class="col-3 q-mr-md">
          <MtFormInputDate
            type="date"
            v-model:date="data.birthday"
            label="生年月日 "
          />
        </div>
      </div>
      <hr class="light" />
      <!-- employee address -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">所属・職位</h4>
      </div>
      <div class="row items-center q-mb-md">
        <div class="col-3 q-pr-md">
          <MtFormMultipleSelection
            label="所属施設 *"
            class="bg-yellow-1"
            :options="getClinics"
            option-label="name_clinic_display"
            option-value="id_clinic"
            v-model="data.id_clinic_list"
            @update:model-value="handleIdClinic"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3 q-pr-md" v-if="getClinic.flg_vetty_cti">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '着信を表示' }]"
            v-model="data.flg_show_call"
          />
        </div>
      </div>
      <div class="row items-center q-mb-md">
        <div class="col q-mr-md">
          <MtFormPullDown
            v-model:selected="data.type_employee"
            :options="typeEmployee"
            type="selection"
            label="従業員区分 *"
            required
          />
        </div>
        <div class="col q-mr-md">
          <MtFormPullDown
            v-model:selected="data.type_department"
            :options="employeeDeptList"
            type="selection"
            label="病院部門 *"
            required
          />
        </div>
        <div class="col q-mr-md">
          <MtFormPullDown
            v-model:selected="data.type_occupation"
            :options="typeOccupation.filter((v) => v.value !== SYS_ADMIN_ID)"
            type="selection"
            label="職種区分 *"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        <!--<div class="col q-mr-md">
          <MtFormPullDown
            v-model:selected="data.type_position"
            :options="typePosition"
            type="selection"
            label="職位区分"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>-->
      </div>
      <hr class="light" />
      <!-- employee address -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">住所</h4>
      </div>
      <div class="row items-center q-mb-lg">
        <div class="col q-mr-md">
          <InputZipcode
            v-model="data.zip_code"
            @changeZipCode="changeZipCode"
            label="郵便番号"
          />
        </div>
        <div class="col q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.address_prefecture"
            label="都道府県"
          />
        </div>
        <div class="col q-mr-md">
          <MtInputForm
            type="text"
            v-model="data.address_city"
            label="市区町村"
          />
        </div>
        <div class="col q-mr-md">
          <MtInputForm type="text" v-model="data.address_other" label="住所" />
        </div>
      </div>
      <hr class="light" />
      <!-- employee contact information -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">連絡先</h4>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6 field-right-text phone-icon">
              <MtInputForm
                type="number"
                v-model="data.phone_emergency"
                label="緊急電話番号 *"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtInputForm
                type="number"
                v-model="data.phone_title1"
                label="電話番号タイトル1"
              />
            </div>
            <div class="col-6 field-right-text phone-icon">
              <MtInputForm
                type="number"
                v-model="data.phone1"
                label="電話番号1"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                type="number"
                v-model="data.phone_title2"
                label="電話番号タイトル2"
              />
            </div>
            <div class="col-6 field-right-text phone-icon">
              <MtInputForm
                type="number"
                v-model="data.phone2"
                label="電話番号2"
              />
            </div>
          </div>
        </div>
        <div class="col-6">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtInputForm
                type="text"
                v-model="data.email_title1"
                label="メールタイトル 1"
              />
            </div>
            <div class="col-6 field-right-text email-icon">
              <MtInputForm type="text" v-model="data.email1" label="メール 1" />
            </div>
            <div class="col-6">
              <MtInputForm
                type="text"
                v-model="data.email_title2"
                label="メールタイトル 2"
              />
            </div>
            <div class="col-6 field-right-text email-icon">
              <MtInputForm type="text" v-model="data.email2" label="メール 2" />
            </div>
          </div>
        </div>
      </div>
      <hr class="light" />
      <!-- employee contact information -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">勤務メモ</h4>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data.memo_employee"
            label="従業員メモ"
            autogrow
          />
        </div>
      </div>
      <hr class="light" />
      <!-- employee contact information -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">入社日</h4>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-3">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_joined"
            hide-bottom-space
            label="入社日"
          />
        </div>
        <div class="col-3 field-right-text work-year">
          <MtInputForm type="text" label="勤続年数" readonly />
        </div>
        <div class="col-3" v-if="isEdit">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '退職' }]"
            v-model="data.flg_resignation"
            @click="blankField(['date_resignation'])"
          />
        </div>
        <div class="col-3" v-show="data.flg_resignation">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_resignation"
            label="退職日"
          />
        </div>
      </div>
      <hr class="light" />
      <!-- employee contact information -->
      <div class="q-mt-lg q-mb-md items-center">
        <h4 class="text-white bg-grey-600 title4">ログイン</h4>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3 field-right-text id-icon">
          <MtInputForm
            type="text"
            v-model="data.login_id"
            label="ログインID"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3 field-right-text pw-icon">
          <MtInputForm
            type="text"
            v-model="data.login_pw"
            label="ログインPW"
            @update:model-value="(value) => callCheckPassword(value)"
            :rules="[(val) => passwordRule(val, passwordScore)]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="text"
            v-model="data.datetime_login_pw_updated"
            label="パスワード最終更新日"
            readonly
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: 'ログイン不可' }]"
            v-model="data.flg_login_disabled"
          />
        </div>
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="data.flg_cart_approver"
            label="会計承認者"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs q-mb-xl">
        <div class="col-3">
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
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>
.phone-icon::after {
  content: 'phone / smartphone';
  font-family: 'Material Icons';
  top: 65% !important;
}

.email-icon::after {
  content: 'alternate_email';
  font-family: 'Material Icons';
  top: 65% !important;
}

.id-icon::after {
  content: 'lock';
  font-family: 'Material Icons';
  top: 65% !important;
}

.pw-icon::after {
  content: 'vpn_key 英数字８～２０文字';
  font-family: 'Material Icons';
  top: 65% !important;
}

.work-year::after {
  content: '年';
  top: 65% !important;
}

.clear-image {
  position: absolute;
  top: 20%;
  right: -6px;
}
</style>
