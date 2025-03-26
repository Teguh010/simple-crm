<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const router = useRouter()
const authStore = useAuthStore()

const data = ref({
  login_id: '',
  login_pw: ''
})
const isPwd = ref(true)
const checked = ref(false)

const submitForm = () => {
  authStore.login(data.value).then((v) => {
    if (v?.status === 200 && checked.value) {
      localStorage.setItem('rememberAuth', JSON.stringify(data.value))
    } else if (v?.status === 200 && !checked.value) {
      localStorage.removeItem('rememberAuth')
    }

    router.push('/')
  })
}
const forgotPassword = () => {
  router.push({ name: 'ForgotPassword' })
}

onMounted(() => {
  const rememberAuth = localStorage.getItem('rememberAuth')

  if (rememberAuth) {
    data.value.login_id = JSON.parse(rememberAuth).login_id
    data.value.login_pw = JSON.parse(rememberAuth).login_pw

    checked.value = true
  }
})
</script>

<template>
  <q-form @submit="submitForm">
    <q-page class="flex flex-center">
      <q-card flat class="full-width">
        <q-card-section>
          <img
            src="@/assets/img/login/logo.png"
            class="q-mb-lg"
            alt="login image"
            loading="lazy"
          />
          <span class="body1 regular text-primary q-pb-xs block"
            >ログインID</span
          >
          <q-input dense outlined v-model="data.login_id" class="q-mb-md" />
          <span class="body1 regular text-primary q-pb-xs block"
            >パスワード（英数字を含む8文字以上）</span
          >
          <q-input
            dense
            outlined
            v-model="data.login_pw"
            class="q-mb-md"
            :type="isPwd ? 'password' : 'text'"
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
          <div class="flex justify-end">
            <MtFormCheckBox
              v-model="checked"
              label="自動ログイン"
              class="q-mb-md"
            />
          </div>
          <div class="text-right q-mb-lg q-pb-sm">
            <q-btn
              dense
              flat
              :ripple="false"
              @click="forgotPassword"
              class="body1 regular password"
              >パスワードを忘れた方はこちら</q-btn
            >
          </div>

          <div class="text-center">
            <q-btn type="submit" padding="10px 92px" color="grey-800"
              >ログイン</q-btn
            >
          </div>
        </q-card-section>
      </q-card>
    </q-page>
  </q-form>
</template>

<style lang="scss" scoped>
.q-card {
  max-width: 400px;
  img {
    object-fit: contain;
    width: 100%;
  }
}
.password {
  color: #2b7cdd;
  &:hover {
    background-image: none !important;
    :deep(.q-focus-helper) {
      opacity: 0 !important;
    }
  }
}
</style>
