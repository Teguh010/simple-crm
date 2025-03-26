<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtInputColorPicker from '@/components/form/MtInputColorPicker.vue'
import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { colorPaletteList } from '@/utils/color-palette'
import { formatDate, getDaysBefore } from '@/utils/aahUtils'

const emits = defineEmits(['close'])
const props = defineProps({ commonObj: Object, code_common: Object })
const closeModal = () => {
  emits('close')
}

const commonForm = reactive({
  id_common: null,
  name_common: '',
  text1: '',
  flg_func2: false,
  date_end: '',
  display_order: 999
})

function assignPageData(commonData: any) {
  for (let key in commonForm) {
    commonForm[key] = commonData[key]
  }
}

const submit = async () => {
  if (commonForm.flg_func2) {
    commonForm.date_end = formatDate(new Date(9999, 11, 31))
  }

  if (!commonForm.flg_func2) {
    commonForm.date_end = getDaysBefore(1)
  }

  const res = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `mst/common/${commonForm.id_common}`,
      { ...commonForm }
    )
  if (res) {
    closeModal()
    await mtUtils.autoCloseAlert(aahMessages.success)
  }  
}

onMounted(() => {
  if (props.commonObj && props.commonObj.id_common) {
    assignPageData(props.commonObj)
  }  
})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        動物種管理
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content">
       <div class="row q-col-gutter-md">
         <div class="col">
           <MtInputForm
            v-model="commonForm.name_common"
            label="名称"
            type="text"
            :rules="[aahValidations.validationRequired]"
          />
         </div>
       </div>
       <div class="row q-col-gutter-md">
         <div class="col">
           <MtInputColorPicker
            v-model="commonForm.text1"
            label="機能名1"
          />
         </div>
       </div>
       <div class="col-lg-12 col-md-12 col-sm-12">
          <q-toggle
            v-model="commonForm.flg_func2"
            color="blue"
            :label="commonForm.flg_func2 ? '使用' : '不使用'"
          />
        </div>
       <div class="row q-col-gutter-md">
         <div class="col">
           <MtInputForm
            v-model="commonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
          />
         </div>
       </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>  
</template>