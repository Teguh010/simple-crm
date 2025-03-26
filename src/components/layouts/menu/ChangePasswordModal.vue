<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useAuthStore from '@/stores/auth'
import { onMounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'

const authStore = useAuthStore()

const emit = defineEmits(['close'])
const data = ref({
  old_password: '',
  new_password: '',
  new_password_confirmation: '',
})
const isPwd = ref(true)
const isConfirmPasswordMatch = ref(false)
const showingPasswordToolTip = ref(false)
const passwordToolTipContent = ref("")

const closeModal = () => emit('close')

const getRuleValues = (val: String) => {
  let rules = {r1: true, r2: true, r3: true, r4: true}
  val = val == null? "" : val
  if (val?.length < 8 || val?.length > 20){
    rules.r1 = false
  }
  if(val?.search(/\d/) == -1){
    rules.r2 = false 
  }
  if(val?.search(/[a-z]/) == -1) {
    rules.r3 = false
  }
  if(val?.search(/[A-Z]/) == -1) {
    rules.r4 = false
  }
  return rules;
}

const passwordChanged = (val:String)=>{
  const rules = getRuleValues(val)
  var htmlString = `<div class='custom-tooltip' >
    <p class="q-py-sm">以下の条件を満たしてください。</p>
    <p class='${rules.r1 ? "hit" : "missed"}'>
      <i  class="material-icons">${rules.r1 ? 'check' : 'cancel'}</i>
      8-20文字の範囲
    </p>
    <p class='${rules.r2 ? "hit" : "missed"}'>
      <i  class="material-icons">${rules.r2 ? 'check' : 'cancel'}</i>
      1つ以上の数字を含む 
    </p>
    <p class='${rules.r3 ? "hit" : "missed"}'>
      <i   class="material-icons">${rules.r3 ? 'check' : 'cancel'}</i>
      1つ以上の小文字を含む
    </p>
    <p class='${rules.r4 ? "hit" : "missed"}'>
      <i  class="material-icons">${rules.r4 ? 'check' : 'cancel'}</i>
      1つ以上の大文字を含む
    </p>
  </div>
  `
  passwordToolTipContent.value = htmlString
  isConfirmPasswordMatch.value = val == data.value.new_password_confirmation && data.value.new_password != ""
}

const submit = async () => {
  const response = await authStore.resetPassword(data.value)
  if (response.data.message == "OLD_PASSWORD_INCORRECT"){
    mtUtils.autoCloseAlert("現在のパスワードが不正です。", "エラー")
  }else if(response.data.message == "PASSWORD_RESET_SUCCESSFULLY"){
    mtUtils.autoCloseAlert("パスワードを更新しました", "")
    closeModal()
  }
}

const isConfirmPasswordMatched = (val: String)=>{
  if(val != data.value.new_password){
    isConfirmPasswordMatch.value = false
    return aahMessages.password_must_be_same
  }else if(!Boolean(data.value.new_password)){
    isConfirmPasswordMatch.value = false
  }else{
    isConfirmPasswordMatch.value = true
  }
}

onMounted(async () => {
  passwordChanged('')
})

</script>

<template>
  <q-form @submit="submit" >
    <MtModalHeader
      @closeModal="closeModal"
      :closeBtn="true"
    >
      <q-toolbar-title class="title2 bold">
        パスワードを変更する
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      
      <div>
        <span class="body1 regular text-primary q-pb-xs block">
          現在のパスワード
        </span>
        <q-input 
          dense outlined 
          v-model="data.old_password" 
          class="q-mb-md" 
          tabindex="1" 
          :type="isPwd ? 'password' : 'text'"
          :rules="[aahValidations.validationRequired]"
        >
          <template v-slot:append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              color="grey-400"
              size="22px"              
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
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
              :style="{display: isConfirmPasswordMatch ? 'block': 'none'}"
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
          <q-tooltip class="bg-primary q-pa-sm text-white" v-model="showingPasswordToolTip" v-html="passwordToolTipContent"/>
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
          dense outlined 
          v-model="data.new_password_confirmation" 
          class="q-mb-md"
          tabindex="3" 
          :type="isPwd ? 'password' : 'text'"
          :rules="[isConfirmPasswordMatched]"
        >
          <template v-slot:append>
            <q-icon
              :style="{display: isConfirmPasswordMatch ? 'block': 'none'}"
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
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" tabindex="4" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>

.missed{
  color: #E74C3C;
}

.hit{
  color: #27AE60;
}

.custom-tooltip{
  font-size: 11px;
}

.custom-tooltip > p{
  line-height: 1px;
  font-weight: bold;
}

</style>