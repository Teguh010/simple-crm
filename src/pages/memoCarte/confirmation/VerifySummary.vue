<script setup lang="ts">

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const emits = defineEmits(['close'])

const closeModal = () => { emits('close') }

const verifyConfirm = () => {
  props.popup.isConfirmed = true
  closeModal()
}

</script>

<template>
  <div>
    <q-toolbar-title class="text-grey-900 title2 bold title">
      AIカルテのレビュー
    </q-toolbar-title>
    <q-card-section class="content q-px-xl">
      <div class="q-mb-md">
        <div class="q-gutter-md">
          <div class="row">
            <div class="col-12 title2 text-center">
              内容をレビューしたら保存してください。
            </div>
            <div class="col-12 row justify-center q-mt-md">
              <q-img src="@/assets/img/aiVetty/verify_confirm.png" width="46px" height="48px" />
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
        <q-btn unelevated color="primary" class="q-ml-md" @click="verifyConfirm">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped>
.title {
  padding: 16px !important;
}
</style>