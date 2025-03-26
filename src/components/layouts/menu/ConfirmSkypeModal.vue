<script setup lang="ts">

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const emits = defineEmits(['close'])

const closeModal = () => { emits('close') }

const ConfirmExternaLinkRedirection = () => {
  props.popup.isConfirmed = true
  closeModal()
}
</script>

<template>
 <div>
  <q-card-section class="content q-px-xl">
    <div class="q-mb-md">
      <div class="q-gutter-md">
        <div class="row">
          <div class="col-12 title2 text-center">
            <h4>臨時Skypeサポートデスク</h4>
            <p class="text-left">
              スカイプで課題を共有する際は以下の情報を合わせてご提供お願いします。
            </p>
            <ul class="text-left">
              <li class="q-mt-sm">画面全体のスクリーンショット</li>
              <li class="q-mt-sm">対象のオーナーCDやペットCD</li>
              <li class="q-mt-sm">不具合や不明点など</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </q-card-section>

   <q-card-section class="bg-grey-200">
     <div class="text-center modal-btn">
       <q-btn
         outline
         class="bg-grey-100 text-grey-800"
         type="button"
         @click="closeModal()"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" @click="ConfirmExternaLinkRedirection">
          <span>Web Skypeを開く</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style scoped>


</style>