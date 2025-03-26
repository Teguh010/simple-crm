<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MtUtilsConfirm',
  methods: {
    cancel() {
      this.$emit('close', false)
    },
    ok() {
      this.$emit('close', true)
    },
    sendOk() {
      this.$emit('close', 'send')
    },
    editOk() {
      this.$emit('close', 'edit')
    },
    customAction() {
      this.$emit('close', this.newBtn.action)
    }
  }
})
</script>

<script setup lang="ts">
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'

const props = defineProps<{
  title: string
  message: string
  detailedMessage?: string
  okLabel: string
  editLabel?: string
  newBtn: {
    label: null
    show: false
    action: null
  }
  isEmployeeList: Object
  cancelBtn: true
  cancelBtnLabel: string
  persistent: false
}>()

const flgShow = ref(true)
const isSectionVisible = ref(true)
const closeModal = () => {
  isSectionVisible.value = false
}
const id_employee = ref(JSON.parse(localStorage.getItem('id_employee')))
</script>

<template>
  <q-dialog v-model="flgShow"  v-if="isSectionVisible" @hide="cancel()" :persistent="persistent">
    <q-card class="q-pa-lg" :confirmation-modal="true">
      <!-- Close Button -->
      <q-btn
        flat
        round
        dense
        class="close-btn"
        @click="closeModal"
        icon="close"
      />
      <q-card-section v-if="props.title" class="q-relative">
        <div class="text-h6">
          <q-icon size="25px" name="error_outline" /> {{ props.title }}
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none message q-mb-md">
        {{ props.message }}
        <p v-if="props.detailedMessage">{{ props.detailedMessage }}</p>
        <div v-if="props.isEmployeeList.show" class="row q-pt-md">
          <InputEmployeeOptGroup
            v-model:selected="id_employee"
            class="col-12"
            label="デフォルト 主担当者"
            @update:selected="props.isEmployeeList.callBackFun"
          />
        </div>
      </q-card-section>
      <q-card-actions :class="selectedTreat ? 'justify-center' : 'justify-end'">
        <q-btn
          v-if="cancelBtn"
          :label="cancelBtnLabel ?? 'キャンセル'"
          text-color="primary"
          class="q-mr-md"
          outline
          color="white"
          @click="cancel"
          v-close-popup
        />
        <q-btn
          v-if="!editLabel"
          :label="okLabel"
          color="primary"
          class=""
          no-caps
          @click="ok"
          v-close-popup
        />
        <q-btn
          v-if="editLabel"
          :label="okLabel"
          color="primary"
          @click="sendOk"
          no-caps
          v-close-popup
        />
        <q-btn
          v-if="editLabel"
          :label="editLabel"
          class=""
          color="primary"
          @click="editOk"
          v-close-popup
        />
        <q-btn
          v-if="newBtn?.show"
          v-close-popup
          :label="newBtn.label"
          class=""
          color="primary"
          @click="customAction"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
.message {
  white-space: pre-wrap;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #666;
  z-index: 1;
  &:hover {
    color: #000;
  }
}
</style>
