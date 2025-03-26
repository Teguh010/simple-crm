<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import aahValidations from '@/utils/aahValidations';
import useAuthStore from '@/stores/auth'
import mtUtils from '@/utils/mtUtils';
import aahMessages from '@/utils/aahMessages';

const authStore = useAuthStore()

const data = ref({
  action: "sp",
  new_password: '',
  new_password_confirmation: '',
  token: null
})
const isPwd = ref(true)
const isConfirmPasswordMatch = ref(false)
const showingPasswordToolTip = ref(false)
const passwordToolTipContent = ref("")
const linkExpired = ref(false)
const router = useRouter()

const submitForm = async () => {
  const response = await authStore.forgotPassword(data.value)
  if (response.data.message == "PASSWORD_RESET_SUCCESSFULLY") {
    mtUtils.autoCloseAlert("パスワードリセットしました", "成功")
    router.push(`/auth/login`)
  } else{
    mtUtils.autoCloseAlert(response.data.message, "警告")
  }
}

const getRuleValues = (val) => {
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

const passwordChanged = (val)=>{
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

const isConfirmPasswordMatched = (val)=>{
  if(val != data.value.new_password){
    isConfirmPasswordMatch.value = false
    return aahMessages.password_must_be_same
  }else if(!Boolean(data.value.new_password)){
    isConfirmPasswordMatch.value = false
  }else{
    isConfirmPasswordMatch.value = true
  }
}

const isTokenValid = async (token)=>{
  const d = {token: token, action: 'jc'}
  const response = await authStore.checkPasswordResetToken(d)
  return response.data.status === 200
}

onMounted(async ()=>{
  const token = window.location.search.split('?token=')[1].trim()
  if(await isTokenValid(token)){
    data.value.token = token
    passwordChanged('')
  }else{
    linkExpired.value = true
  }

})

</script>

<template>
  <q-form @submit="submitForm">
    <q-page class="flex flex-center">
      <q-card class="full-width" v-if="linkExpired == false">
        <q-card-section class="q-px-xl">
          <span class="q-px-md body1 regular text-primary block text-center">新しいパスワードを作成する</span>
        </q-card-section>
        <q-card-section class="q-px-xl">
          <div class="q-py-sm">
            <span class="body1 regular text-primary q-pb-xs block">
              新しいパスワード
            </span>
            <q-input dense outlined v-model="data.new_password" class="q-mb-none" tabindex="2"
              :type="isPwd ? 'password' : 'text'" @input="showingPasswordToolTip = true"
              @focus="showingPasswordToolTip = true" @blur="showingPasswordToolTip = false"
              @update:modelValue="passwordChanged" :rules="[aahValidations.validationPassword]" autocomplete="off">
              <template v-slot:append>
                <q-icon :style="{ display: isConfirmPasswordMatch ? 'block' : 'none' }" :name="'checked'"
                  class="cursor-pointer" color="green" size="22px" />
                <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" color="grey-400"
                  size="22px" @click="isPwd = !isPwd" />
              </template>
              <q-tooltip class="bg-primary q-pa-sm text-white" v-model="showingPasswordToolTip"
                v-html="passwordToolTipContent" />
            </q-input>
          </div>
          <div class="q-py-sm">
            <span class="body1 regular text-primary q-pb-xs block">
              確認用 再度入力してください
            </span>
            <q-input dense outlined v-model="data.new_password_confirmation" class="q-mb-md" tabindex="3"
              :type="isPwd ? 'password' : 'text'" :rules="[isConfirmPasswordMatched]">
              <template v-slot:append>
                <q-icon :style="{ display: isConfirmPasswordMatch ? 'block' : 'none' }" :name="'checked'"
                  class="cursor-pointer" color="green" size="22px" />
                <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" color="grey-400"
                  size="22px" @click="isPwd = !isPwd" />
              </template>
            </q-input>
          </div>
          <q-btn color="primary" class="full-width q-mt-sm" type="submit">
            パスワード再設定
          </q-btn>
        </q-card-section>
      </q-card>

      <q-card class="full-width" v-else>
        <q-card-section class="q-px-xl">
          <span class="q-px-md body1 regular text-primary block text-center">無効なリンクです。</span>
        </q-card-section>
      </q-card>

    </q-page>
  </q-form>

</template>



<style>

.q-card {
  max-width: 500px;
}

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
