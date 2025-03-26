<script setup lang="ts">
import { ref } from 'vue'
import useModalStore from '@/stores/modal'
import { storeToRefs } from 'pinia'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const modalStore = useModalStore()
const { close } = modalStore
const { getModalData, getModalLoading } = storeToRefs(modalStore)

const confirmation = ref(false)

const submit = async () => {
  await getModalData.value?.submitFn?.()
}

</script>

<template>
  <q-card class="extra-confirmation-card">
    <q-card-section class="row q-col-gutter-md q-pa-md">
      <div class="col-12 title1 bold text-danger text-center q-my-md">
        <q-icon name="report" class="q-mr-sm"/>
        重要データの削除
      </div>
      <div class="col-12 body1 regular text-center q-pa-md">
        <div class="col-12 q-mb-md">
          この登録データは重要な可能性があります。<br/>
          この操作はやり直せません。<br/>
          本当に削除しますか？
        </div>

        <div class="col-12 body1 bold text-danger cursor-pointer q-my-sm">
          <MtFormCheckBox
            v-model:checked="confirmation"
            label="はい、このデータを削除します。"
          />
        </div>
      </div>
      <div class="col-12 row justify-end q-pa-md">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="close()" :loading="getModalLoading">
          <span>キャンセル</span>
        </q-btn>
        <q-btn :disable="!confirmation" class="q-ml-md" color="primary" @click="submit" unelevated :loading="getModalLoading">
          <span>削除する</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.extra-confirmation-card {
  background-color: #F4CCCC;
}
</style>