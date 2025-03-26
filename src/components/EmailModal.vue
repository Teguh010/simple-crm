<script setup lang="ts">
import { ref, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import { Loading } from 'quasar'
import aahValidations from '@/utils/aahValidations'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

const props = defineProps<{
  emailToSend: String, subject: String, body: String
}>()

const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const closeModal = () => {emits('close')}

const emailToSend = ref(props.emailToSend)
const subject = ref(props.subject)
const body = ref(props.body)

const submit = async () => {
  const bodyTosend = body.value.replaceAll(/\n/g, '<br>')
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: 'メールを送信する...',
    messageColor: 'black'
  })
  const data = {
    recipient: emailToSend.value,
    subject: subject.value,
    body: bodyTosend
  }
  const resp = await customerStore.sendEmail(data)
  Loading.hide()
  if(resp.data.message === 'EMAIL_SEND') {
    mtUtils.autoCloseAlert("電子メールを正常に送信")
  }else{
    mtUtils.autoCloseAlert("操作が完了しませんでした")
  }
  closeModal() 
}

const recipientEmails = computed(() => {
  const returnValue = [
    {
      label: props.emailToSend,
      value: props.emailToSend
    }
  ]
  return returnValue
})


</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span >
          メールを送る
        </span>
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl" >
      <div class="email-content q-py-sm">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormPullDown
            type="selection"
            label="送信対象メール"
            outlined
            v-model:selected="emailToSend"
            :options="recipientEmails"
            :rules="[aahValidations.validationRequired]"
          />
        </div>

        <div class="col-lg-12 col-md-12 col-sm-12 q-my-md">
          <MtInputForm
            outlined
            type="text"
            label="メールタイトル *"
            v-model="subject"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12 q-mt-md">
          <MtInputForm
            outlined
            label="メール本文 *"
            class="textarea"
            maxlength="500"
            type="textarea"
            tabindex="10"
            autogrow
            v-model="body"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="col-12 q-pt-sm q-px-md text-center">
        <q-btn outline class="bg-grey-100 text-grey-800" type="submit">
          <span>メールを送る</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>

.bold{
  font-weight: bold;
}
.border{
  border: 1px solid gray;
}
</style>
