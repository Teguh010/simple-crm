<script setup lang="ts">

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const emits = defineEmits(['close'])

const closeModal = () => { emits('close') }

const deleteRecording = () => {
  props.popup.isConfirmed = true
  closeModal()
}

</script>

<template>
  <div>
    <q-toolbar-title class="text-grey-900 title2 bold title">
      録音記録の破棄
    </q-toolbar-title>
    <q-card-section class="q-px-xl">
      <div class="q-mb-md">
        <div class="q-gutter-md">
          <div class="row">
            <div class="col-12 title2 text-center">
              現在の記録を破棄しますか？
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
        <q-btn unelevated color="primary" class="q-ml-md" @click="deleteRecording">
          <span>破棄</span>
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