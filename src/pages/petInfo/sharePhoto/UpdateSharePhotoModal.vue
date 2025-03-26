<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { getDateToday } from '@/utils/aahUtils';

const emits = defineEmits(['close'])

const data = ref({
  id_pet: null,
  id_customer: null,
  id_file: null,
  memo: null,
  datetime_recorded:getDateToday(),
  name_employee_upload:null,
  type_status_sharing:false,
})

const submit = () => {}

const closeModal = () => {
  emits('close')
}

</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        共有写真
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content">
        <div class="row items-center q-col-gutter-md q-mb-lg">
            <div class="col title2 bold text-grey-900">共有写真</div>
            <div class="text-grey-900 caption1 bold">対象ペット</div>
            <div class="col-2">
                <MtInputForm
                    type="selection"
                    v-model="data.id_customer"
                    class="bg-accent-100"
                    outlined
                    label="XXX TODO"
                />
            </div>
        </div>
        <div class="row items-center q-my-lg text-negative body2 bold">
            ※ オーナーへ共有するにチェックを入れて保存すると、写真・撮影日時・コメントは飼い主さまへ共有されます。
        </div>
        <div class="row q-col-gutter-md q-mb-lg q-py-sm q-px-md">
            <div class="col-3 q-pl-0">
                <div class="relative-position" style="width: 150px">
                    <q-img
                        src="@/assets/img/petdetail/dog.png"
                        height="97px"
                        class="border-radius-10"
                        style="max-width: 150px;"
                        v-model="data.id_pet" 
                        >
                    </q-img>
                    <q-btn
                        padding="none"
                        unelevated
                        class="absolute-top-right"
                        style="margin-top: -8px; margin-right: -8px"
                        >
                        <q-icon name="cancel" />
                    </q-btn>
                    <p class="text-center q-mt-md q-mb-none caption1 bold text-grey-500">写真を撮り直す</p>
                </div>
            </div>
            <div class="col-8">
                <div class="flex items-center justify-between q-mb-md">
                    <div class="col">
                        <MtInputForm
                            type="date"
                            v-model="data.datetime_recorded"
                            class=""
                            label="撮影日時*"
                            required
                        />
                    </div>
                    <div class="col q-ml-sm">
                        <MtInputForm
                            type="selection"
                            v-model="data.name_employee_upload"
                            class=""
                            label="投稿者名*"
                            required
                        />
                    </div>
                </div>
                <div class="col q-mb-md">
                    <MtInputForm
                        type="text"
                        v-model="data.memo"
                        class=""
                        label="コメント*"
                    />
                </div>
                <div class="col q-mb-md">
                    <MtInputForm
                        type="checkbox"
                        v-model="data.type_status_sharing"
                        class=""
                        :items="[{ label: 'オーナーへ共有する' }]"
                    />
                </div>

            </div>
        </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>