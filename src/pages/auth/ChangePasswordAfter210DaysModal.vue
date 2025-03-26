<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useAuthStore from '@/stores/auth'
import mtUtils from '@/utils/mtUtils'
import { computed, defineProps, onMounted, ref, toRef, withDefaults } from 'vue'
import dayjs from 'dayjs'
import useEmployeeStore from '@/stores/employees'

const props = withDefaults(
  defineProps<{
    lastUpdatePw: string
    isModalShown: boolean
  }>(),
  {
    lastUpdatePw: '',
    isModalShown: false
  }
)
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const showModal = toRef(props, 'isModalShown')
const data = ref({
  new_password: '',
  new_password_confirmation: '',
  datetime_login_pw_updated: dayjs().format("YYYY/MM/DD HH:MM:ss")
})
const isPwd = ref(true)
const isConfirmPasswordMatch = ref(false)
const showingPasswordToolTip = ref(false)
const passwordToolTipContent = ref('')
const today = dayjs()
const idEmployee = JSON.parse(localStorage.getItem('id_employee')!) as string
const monthDiffReminderPw = ref(0)
const lastUpdatePw = ref('')
const id_clinic_list = JSON.stringify([
  JSON.parse(localStorage.getItem('id_clinic')!)
])

const closeModal = async () => {
  const date = dayjs().format()
  if (props.lastUpdatePw) {
    localStorage.setItem('lastUpdatePw', props.lastUpdatePw)
  }
  localStorage.setItem('lastReminderPw', date)
  emit('close')
  return await employeeStore.updateEmployee(idEmployee, {
    datetime_login_pw_updated: '1111/01/01 00:00:00',
    id_clinic_list,
    image_path1: true
  })
}

const getRuleValues = (val: string) => {
  let rules = { r1: true, r2: true, r3: true, r4: true }
  val = val == null ? '' : val
  if (val?.length < 8 || val?.length > 20) {
    rules.r1 = false
  }
  if (val?.search(/\d/) == -1) {
    rules.r2 = false
  }
  if (val?.search(/[a-z]/) == -1) {
    rules.r3 = false
  }
  if (val?.search(/[A-Z]/) == -1) {
    rules.r4 = false
  }
  return rules
}

const passwordChanged = (val: string) => {
  const rules = getRuleValues(val)
  const htmlString = `<div class='custom-tooltip' >
    <p class="q-py-sm">以下の条件を満たしてください。</p>
    <p class='${rules.r1 ? 'hit' : 'missed'}'>
      <i  class="material-icons">${rules.r1 ? 'check' : 'cancel'}</i>
      8-20文字の範囲
    </p>
    <p class='${rules.r2 ? 'hit' : 'missed'}'>
      <i  class="material-icons">${rules.r2 ? 'check' : 'cancel'}</i>
      1つ以上の数字を含む
    </p>
    <p class='${rules.r3 ? 'hit' : 'missed'}'>
      <i   class="material-icons">${rules.r3 ? 'check' : 'cancel'}</i>
      1つ以上の小文字を含む
    </p>
    <p class='${rules.r4 ? 'hit' : 'missed'}'>
      <i  class="material-icons">${rules.r4 ? 'check' : 'cancel'}</i>
      1つ以上の大文字を含む
    </p>
  </div>
  `
  passwordToolTipContent.value = htmlString
  isConfirmPasswordMatch.value =
    val == data.value.new_password_confirmation && data.value.new_password != ''
}

// todo
const submit = async () => {
  const response = await authStore.updatePasswordReminder(data.value)
  if(response.data.message == "PASSWORD_RESET_SUCCESSFULLY"){
    emit('close')
    return mtUtils.autoCloseAlert('パスワードを更新しました', '')
  }
  return response
}

const isConfirmPasswordMatched = (val: string) => {
  if (val != data.value.new_password) {
    isConfirmPasswordMatch.value = false
    return aahMessages.password_must_be_same
  } else if (!Boolean(data.value.new_password)) {
    isConfirmPasswordMatch.value = false
  } else {
    isConfirmPasswordMatch.value = true
  }
}

const calculateDate = computed(() => {
  const today = dayjs()
  const lastUpdatePw = dayjs(props.lastUpdatePw)
  const yearDifference = today.diff(lastUpdatePw, 'year')
  const monthDifference = today.diff(lastUpdatePw, 'month')
  return `${yearDifference}年${monthDifference%12}ヵ月`
})

onMounted(async () => {
  if (props.lastUpdatePw) {
    monthDiffReminderPw.value = today.diff(dayjs(props.lastUpdatePw), 'month')
  }
  passwordChanged('')
})
</script>

<template>
  <q-dialog
    v-model="showModal"
    persistent
    transition-show="0"
    transition-hide="0"
  >
    <q-card class="bg-white" style="min-width: 350px">
      <MtModalHeader @closeModal="closeModal" :closeBtn="false">
        <q-toolbar-title class="title2 bold">
          パスワードを変更する
        </q-toolbar-title>
      </MtModalHeader>
      <q-card-section class="q-px-xl">
        <div>
          <p>最終パスワード変更より{{calculateDate}}が経過しました。</p>
          <p>
            院内の情報セキュリティを強化する為、パスワードを必ず変更するようにお願い致します。
          </p>
          <p>※この操作はスキップできません。</p>
        </div>
        <div>
          <span class="body1 regular text-primary q-pb-xs block">
            新しいパスワード
          </span>

          <q-input
            dense
            outlined
            v-model="data.new_password"
            class="q-mb-none"
            tabindex="2"
            :type="isPwd ? 'password' : 'text'"
            @input="showingPasswordToolTip = true"
            @focus="showingPasswordToolTip = true"
            @blur="showingPasswordToolTip = false"
            @update:modelValue="passwordChanged"
            :rules="[aahValidations.validationPassword]"
            autocomplete="off"
          >
            <template v-slot:append>
              <q-icon
                :style="{ display: isConfirmPasswordMatch ? 'block' : 'none' }"
                :name="'checked'"
                class="cursor-pointer"
                color="green"
                size="22px"
              />
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-400"
                size="22px"
                @click="isPwd = !isPwd"
              />
            </template>
            <q-tooltip
              class="bg-primary q-pa-sm text-white"
              v-model="showingPasswordToolTip"
              v-html="passwordToolTipContent"
            />
          </q-input>
          <div class="q-mb-lg">
            <ul>
              <li>他人とパスワードを共有しないでください</li>
            </ul>
          </div>
          <span class="body1 regular text-primary q-pb-xs block">
            確認用 再度入力してください
          </span>
          <q-input
            dense
            outlined
            v-model="data.new_password_confirmation"
            class="q-mb-md"
            tabindex="3"
            :type="isPwd ? 'password' : 'text'"
            :rules="[isConfirmPasswordMatched]"
          >
            <template v-slot:append>
              <q-icon
                :style="{ display: isConfirmPasswordMatch ? 'block' : 'none' }"
                :name="'checked'"
                class="cursor-pointer"
                color="green"
                size="22px"
              />
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-400"
                size="22px"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </div>
      </q-card-section>
      <q-card-section class="q-bt bg-white">
        <div class="text-center modal-btn">
          <q-btn
            unelevated
            color="primary"
            tabindex="4"
            class="q-ml-md"
            @click="submit"
          >
            <span>保存</span>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style>
.missed {
  color: #e74c3c;
}

.hit {
  color: #27ae60;
}

.custom-tooltip {
  font-size: 11px;
}

.custom-tooltip > p {
  line-height: 1px;
  font-weight: bold;
}
</style>
