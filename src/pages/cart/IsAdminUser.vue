<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

const emits = defineEmits(['close'])
const props = defineProps({ callBack: Function })

const showingPasswordToolTip = ref(false)

const closeModal = () => {
  emits('close')
}

const isPwd = ref(true)

const data = ref({
  file_password: null
})

const validateAdmin = async () => {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'mst/validate_admin',
    {
      file_password: data.value.file_password
    }
  )

  if (response && response.is_valid) {
    props.callBack(true)
    closeModal()
    return
  }

  showingPasswordToolTip.value = true
}
</script>

<template>
  <q-card class="mt-small-popup">
    <MtModalHeader class="bg-light-blus" @close-modal="closeModal">
      <div class="full-width">会計帳票</div>
    </MtModalHeader>
    <q-form @submit.prevent="validateAdmin">
      <div class="q-px-md q-mt-md">
        <div class="q-my-md text-center">パスワードを入力してください。</div>
        <q-input
          v-model="data.file_password"
          :type="isPwd ? 'password' : 'text'"
          class="q-my-md"
          dense
          outlined
          tabindex="2"
          autofocus
          autocomplete="new-password"
          @update:model-value="() => (showingPasswordToolTip = false)"
        >
          <template v-slot:append>
            <q-icon
              :name="'checked'"
              :style="{ display: isConfirmPasswordMatch ? 'block' : 'none' }"
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
        <div
          v-if="showingPasswordToolTip"
          class="text-danger text-center q-mb-md"
        >
          パスワードが不正です。
        </div>
      </div>
      <div class="flex columns q-pb-md justify-around">
        <q-btn
          class="q-ml-sm flex items-center"
          color="grey-800"
          size="md"
          text-color="white"
          unelevated
          type="submit"
        >
          <span>接続</span>
        </q-btn>
      </div>
    </q-form>
  </q-card>
</template>

<style lang="scss" scoped>
.box {
  display: flex;
  align-items: center;
  color: $grey-800;
  padding: 10px 15px;
  margin: 5px 10px !important;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.hover {
  &:hover {
    background-color: rgba(255, 236, 248, 0.9);
  }
}
</style>
