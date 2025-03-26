<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtModalHeader from '@/components/MtModalHeader.vue'
import usePrintStore from '@/stores/prints'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import OptionModal from '@/components/OptionModal.vue'
import UpdatePrintCanvasModal from './UpdatePrintCanvasModal.vue'
import useCommonStore from '@/stores/common'
import { typePrint } from '@/utils/enum'
import { regularAttributes } from '@/utils/pdfAttributes/regular'
import { serviceDetailAttributes } from '@/utils/pdfAttributes/serviceDetails'
import { prescriptionDetailAttributes } from '@/utils/pdfAttributes/prescriptionDetails'
import { injectDetailAttributes } from '@/utils/pdfAttributes/injectDetails'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import _ from 'lodash'

const printStore = usePrintStore()
const clinicStore = useClinicStore()
const commonStore = useCommonStore()

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })
const isEdit = ref(false)
const { getClinics } = storeToRefs(clinicStore)
const pdfArrayBuffer = ref(null)
const commonOptionList: any = ref([])
const pdfPreview = ref(null)
const tack_seal_case = ref(false)
const pdfPath = ref('')
const data = ref({
  name_print: '',
  id_clinic: '',
  type_print: '',
  type_print_size: 1,
  flg_landscape: false,
  pdf_path: '',
  item1: '',
  xy_hw1: '',
  type_print_output1: 1,
  font_size1: 0,
  item2: '',
  xy_hw2: '',
  type_print_output2: 1,
  font_size2: 0,
  item3: '',
  xy_hw3: '',
  type_print_output3: 1,
  font_size3: 0,
  item4: '',
  xy_hw4: '',
  type_print_output4: 1,
  font_size4: 0,
  item5: '',
  xy_hw5: '',
  type_print_output5: 1,
  font_size5: 0,
  item6: '',
  xy_hw6: '',
  type_print_output6: 1,
  font_size6: 0,
  item7: '',
  xy_hw7: '',
  type_print_output7: 1,
  font_size7: 0,
  item8: '',
  xy_hw8: '',
  type_print_output8: 1,
  font_size8: 0,
  item9: '',
  xy_hw9: '',
  type_print_output9: 1,
  font_size9: 0,
  item10: '',
  xy_hw10: '',
  type_print_output10: 1,
  font_size10: 0
})

const closeModal = () => {
  emits('close')
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            printStore.destroyPrint(data.value.id_print).then(() => {
              printStore.fetchPrints()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}
const getRightButtons = () => {
  console.log('data.value.type_print', data.value.type_print)
  if (data.value.type_print === 70) {
    return serviceDetailAttributes
  } else if (data.value.type_print === 80) {
    return prescriptionDetailAttributes
  } else if (data.value.type_print === 90) {
    return injectDetailAttributes
  } else {
    return regularAttributes
  }
}
const modalCloseCallback = ()=>{
  closeModal()
  printStore.fetchPrints()
}
const openCanvasMode = async () => {
  if (!data.value.pdf_path) {
    return mtUtils.autoCloseAlert(
      '下地PDFを追加してください。'
    )
  }
  try {
    const binaryString = atob(props.data.pdf_path)
    const arrayBuffer = new ArrayBuffer(props.data.pdf_path.length)
    pdfArrayBuffer.value = arrayBuffer
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
  } catch (e) {}
  const screenSize = commonStore.getCommonOptionList.find(
    (v: any) =>
      v.code_common == 28 &&
      Number(v.code_func1) == data.value.type_print_size.value
  )?.text1
  let wd = "" 
  let ht = ""
  if(Boolean(screenSize)){
    wd = Number(screenSize.split(',')[0])
    ht = Number(screenSize.split(',')[1])
  }else{
    wd = ""
    ht = ""
  }

  const rightBoxButtons = getRightButtons()

  await mtUtils.popup(UpdatePrintCanvasModal, {
    data: data.value,
    pdfData: pdfArrayBuffer.value,
    canvasWidth: data.value.flg_landscape ? ht : wd,
    canvasHeight: data.value.flg_landscape ? wd : ht,
    rightBoxButtons: rightBoxButtons,
    callback: modalCloseCallback
  })
}
const submit = () => {
  if (data.value) {
    // fail safe for json1 - nth validation
    Array.from({ length: 20 }, (_, i) => `json${i + 1}`).forEach((key: string) => {
      if (!_.has(data.value, key) || !data.value[key]) {
        _.set(data.value, key , {})
      }
    })
    printStore.updatePrint(data.value.id_print, data.value).then(async () => {
      printStore.fetchPrints()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    printStore.submitPrint(data.value).then(async () => {
      printStore.fetchPrints()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}
const clinicOptions = computed(() => {
  return getClinics.value
    .filter((v) => !v.flg_facility)
    .map((v) => {
      return {
        value: v.id_clinic,
        label: v.name_clinic_display
      }
    })
})

const imageUploaded = async (event: any) => {
  const file = event.target.files[0]
  var fileReader = new FileReader()
  fileReader.onload = function () {
    // data.value.pdf_path = this.result
    data.value.pdf_path = new Blob([this.result], { type: 'application/pdf' })
    document.getElementById('imageuploader').value = ''
    const screenSize = commonStore.getCommonOptionList.find(
      (v: any) =>
        v.code_common == 28 && v.code_func1 == data.value.type_print_size
    )?.text1
    let wd, ht
    if (screenSize) {
      wd = Number(screenSize.split(',')[0])
      ht = Number(screenSize.split(',')[1])
    } else {
      wd = 210
      ht = 296
    }
    const rightBoxButtons = getRightButtons()
    mtUtils.popup(UpdatePrintCanvasModal, {
      data: data.value,
      pdfData: this.result,
      canvasWidth: data.value.flg_landscape ? ht : wd,
      canvasHeight: data.value.flg_landscape ? wd : ht,
      rightBoxButtons: rightBoxButtons,
      callback: modalCloseCallback,
      pdfUploaded: true
    })
  }
  fileReader.readAsArrayBuffer(file)
}

const uploadPdfTemplate = () => {
  if (!data.value.type_print_size) {
    data.value.type_print_size = 1
  }
  document.getElementById('imageuploader')?.click()
}

const renderPreview = () => {
  const previewDiv = document.querySelector('.preview')
  previewDiv.style.height = 'auto'
  setTimeout(() => {
    pdfjsLib
      .getDocument(URL.createObjectURL(data.value.pdf_path))
      .promise.then((pdf: any) => {
        pdf.getPage(1).then((page: any) => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          const viewport = page.getViewport({ scale: 1 })
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = previewDiv?.clientWidth + 'px'
          canvas.style.height =
            previewDiv?.parentElement?.nextElementSibling.clientHeight + 'px'
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          }
          page.render(renderContext).promise.then(() => {
            previewDiv?.appendChild(canvas)
          })
        })
      })
  }, 500)
}

const re_render_pdf = (m_print_data: any) => {
  if (m_print_data.pdf_path) {
    const binaryString = atob(m_print_data.pdf_path)
    const arrayBuffer = new ArrayBuffer(m_print_data.pdf_path.length)
    pdfArrayBuffer.value = arrayBuffer
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
    data.value.pdf_path = new Blob([uint8Array], { type: 'application/pdf' })
    // renderPreview()
  }
}

const initScripts = async () => {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.3.0/fabric.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.2.0/jspdf.umd.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      integrity: ''
    }
  ]
  scripts.forEach((scriptObj) => {
    let script = document.createElement('script')
    script.src = scriptObj.src
    if (scriptObj.integrity !== '') {
      script.integrity = scriptObj.integrity
    }
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    document.body.appendChild(script)
  })
}

function waitForPdfEditorRef() {
  return new Promise((resolve, reject) => {
    const checkInitialization = () => {
      try {
        if (pdfjsLib) {
          setTimeout(resolve, 1000)
        } else {
          setTimeout(checkInitialization, 100)
        }
      } catch (error) {}
    }
    checkInitialization()
  })
}

function typePrintChanged(val: any) {
  if (val === 60) {
    tack_seal_case.value = true
  } else {
    tack_seal_case.value = false
  }
}



const init = async () => {
  commonOptionList.value = commonStore.getCommonOptionList
    .filter((v: any) => v.code_common == 28)
    .map((v: any) => {
      return {
        value: v.code_func1,
        label: v.name_common
      }
    })
  await waitForPdfEditorRef()
}

const renderPdf = async () => {
  if (props.data.pdf_path) {
    const binaryString = atob(props.data.pdf_path)
    const arrayBuffer = new ArrayBuffer(binaryString.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    const path = URL.createObjectURL(blob)
    console.log(path)
    pdfPath.value = path
  }
}

onMounted(async () => {
  // initScripts()
  await init()
  if (props.data?.id_print) {
    // Update case
    isEdit.value = true
    var copiedData = { ...props.data }
    data.value = copiedData
    await renderPdf()
    if (data.value.type_print_size) {
      try {
        const selectedPrintSize = commonStore.getCommonOptionList.find(
          (v: any) =>
            v.code_common == 28 && data.value.type_print_size == v.code_func1
        )
        data.value.type_print_size = {
          value: selectedPrintSize.code_func1,
          label: selectedPrintSize.name_common
        }
      } catch (error) {}
    }
    if (data.value.type_print === 60) {
      tack_seal_case.value = true
    }
    re_render_pdf(copiedData)
  } else {
    // Create case
    isEdit.value = false
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        印刷テンプレ管理
      </q-toolbar-title>
      <q-space></q-space>
      <div class="col-3">
        <MtFormPullDown
          :options="clinicOptions"
          v-model:selected="data.id_clinic"
          label="施設CD"
          type="selection"
        />
      </div>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section>
      <div class="row q-col-gutter-md">
        <div class="col-4">
          <div class="preview" @click="openCanvasMode">
            <div class="clickable-area"></div>
            <embed
                v-if="pdfPath"
                :width="data.flg_landscape ? '225' : '150'"
                :height="data.flg_landscape ? '150' : '225'"
                name="plugin"
                :src="pdfPath"
                type="application/pdf"
              />
            <q-icon v-else name="picture_as_pdf" />
          </div>
        </div>
        <div class="col-8 q-pl-lg">
          <div class="col-6">
            <MtInputForm
              type="text"
              v-model="data.name_print"
              label="印刷テンプレ名"
              class="col-12 q-mb-md"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="row q-col-gutter-md q-pa-md">
            <div class="col-4 q-mb-md">
              <MtFormPullDown
                v-model="data.type_print"
                :options="typePrint"
                label="用途区分"
                @update:model-value="typePrintChanged"
              />
            </div>
            <div class="col-4 q-mb-md hidden">
              <MtInputForm
                type="selection"
                v-model="data.type_print_size"
                :items="commonOptionList"
                label="出力サイズ"
                class="col-4 q-mb-md"
              />
            </div>
            <div class="col-4 q-mb-md">
              <MtFormCheckBox
                v-if="false"
                type="checkbox"
                label="横向き"
                v-model="data.flg_landscape"
              />
            </div>
          </div>
          <div class="q-pt-lg">
            <input
              type="file"
              id="imageuploader"
              @change="imageUploaded"
              style="display: none"
            />
            <q-btn
              class="q-pl-sm"
              @click="uploadPdfTemplate"
              label="下地PDFファイル"
            >
              <!-- :disabled="(isEdit && data.pdf_path !== '') || tack_seal_case" -->
              <q-icon class="q-pl-sm" size="sm" name="image" />
            </q-btn>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.preview {
  width: 100%;
  border: 1px solid gray;
  border-radius: 5px;
  height: 250px;
  background: lightgray;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  .clickable-area {
    position: absolute;
    width: 100%;
    height: 100%;
  }
}
</style>
