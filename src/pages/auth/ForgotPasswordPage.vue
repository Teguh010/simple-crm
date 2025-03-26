<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import aahValidations from '@/utils/aahValidations';
import useAuthStore from '@/stores/auth'
import mtUtils from '@/utils/mtUtils';

const authStore = useAuthStore()

const router = useRouter();
const data = ref({
  action: "gl",
  email: ""
});

const submitForm = async () => {
  const response = await authStore.forgotPassword(data.value)
  if (response.data.message == "EMAIL_NOT_REGISTERED"){
    mtUtils.autoCloseAlert("このメールアドレスは登録されていません。", "エラー")
  }else if(response.data.message == "EMAIL_SENT_SUCCESSFULLY"){
    mtUtils.autoCloseAlert("メールを送信しました。", "成功する")
  }else if(response.data.message == "LINK_ALREADY_SENT"){
    mtUtils.autoCloseAlert("リンクはすでに送信されています", "中止された")
  }else{
    mtUtils.autoCloseAlert(response.data.message, "警告")
  }
}

const login = () => {
  router.push({ name: "Login" });
};
</script>

<template>
  <q-form @submit="submitForm">
    <q-page class="flex flex-center">
      <q-card class="full-width">
        <q-card-section>
          <div class="text-h6">パスワードの再設定</div>

          <q-input 
            outlined 
            v-model="data.email" 
            label="Email" 
            class="q-mt-md" 
            :rules="[aahValidations.validationEmail]"
          />

          <q-btn color="primary" class="full-width q-mt-md" type="submit"
            >パスワード再設定</q-btn
          >
        </q-card-section>

        <q-card-section>
          <q-btn flat color="primary" @click="login">Login</q-btn>
        </q-card-section>
      </q-card>
    </q-page>
  </q-form>

</template>



<style scoped>
.q-card {
  max-width: 400px;
}
</style>
