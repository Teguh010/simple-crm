<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import usePrintStore from '@/stores/prints'
import UpdatePrintModal from './UpdatePrintModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCommonStore from '@/stores/common'
import { typePrint } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { storeToRefs } from 'pinia'

const printStore = usePrintStore()
const commonStore = useCommonStore()
const { getPrint, getAllPrints } = storeToRefs(printStore)
const pdfPaths = ref<{ [key: string]: string }>({})

const openPrintModal = async () => {
  await mtUtils.mediumPopup(UpdatePrintModal)
}

const handlePrintClick = async (data: any) => {
  await printStore.selectPrint(data.id_print, true)
  const printData = printStore.getPrint
  await mtUtils.mediumPopup(UpdatePrintModal, { data: printData })
}

const search = async () => {
  await printStore.fetchPrints()
}

const renderPdf = async (pdfId: string) => {
  if (pdfId) {
    await printStore.selectPrint(pdfId)
  }
  if (getPrint.value.pdf_path) {
    const binaryString = atob(getPrint.value.pdf_path)
    const arrayBuffer = new ArrayBuffer(binaryString.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    const path = URL.createObjectURL(blob)
    return path
  }
}

const type_print_wise_prints = computed(() => {
  let results = {}
  printStore.getAllPrints.forEach((print) => {
    const typePrintValue = print.type_print
    if (!results[typePrintValue]) {
      results[typePrintValue] = []
    }
    results[typePrintValue].push(print)
  })
  return results
})

const init = async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [28] }, true)
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
    },
    {
      src: '  https://printjs-4de6.kxcdn.com/print.min.js',
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
    script.type = 'text/javascript'
    document.body.appendChild(script)
  })
}

const initStylesheets = async () => {
  const stylesheets = [
    {
      href: 'https://printjs-4de6.kxcdn.com/print.min.css',
      integrity: ''
    }
  ];
  stylesheets.forEach((stylesheetObj) => {
    let link = document.createElement('link');
    link.href = stylesheetObj.href;
    link.rel = 'stylesheet';
    if (stylesheetObj.integrity !== '') {
      link.integrity = stylesheetObj.integrity;
    }
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    document.head.appendChild(link);
  });
};

const deleteOldPdfObjects = () => {
  if (window.fabric) {
    window.fabric = null
  }
}

onMounted(async () => {
  deleteOldPdfObjects()
  search()
  init()
  initScripts()
  initStylesheets()
  // for (const print of getAllPrints.value) {
  //   const path = await renderPdf(print.id_print)
  //   if (path) {
  //     pdfPaths.value[print.id_print] = path
  //   }
  // }
  setPageTitle('証明書・印刷テンプレ')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          証明書・印刷テンプレ
        </q-toolbar-title>

        <q-btn
          unelevated
          color="primary"
          text-color="white"
          class="q-ml-xs"
          @click="openPrintModal"
        >
          <q-icon size="20px" name="add" />
          印刷テンプレ
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div
      v-for="(type_print, index) in Object.keys(type_print_wise_prints)"
      :key="index"
    >
      <div class="q-px-md q-py-md title">
        {{ typePrint.find((item) => item.value === Number(type_print))?.label }}
      </div>
      <div class="print-content">
        <div
          v-for="(print, index_) in type_print_wise_prints[type_print]"
          :key="index_"
        >
          <div
            class="pdf-container"
            @click="handlePrintClick(print)"
          >
            <span v-if="pdfPaths[print.id_print]" class="embed-container">
              <div class="clickable-area"></div>
              <embed
                v-if="pdfPaths[print.id_print]"
                :width="print.flg_landscape ? '225' : '150'"
                :height="print.flg_landscape ? '150' : '225'"
                name="plugin"
                :src="pdfPaths[print.id_print]"
                type="application/pdf"
              />
              <span v-if="pdfPaths[print.id_print]" class="name-print">
                {{ print.name_print }}
              </span>
            </span>
            <span v-if="!pdfPaths[print.id_print]">
              <q-icon name="picture_as_pdf" />
              {{ print.name_print }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.title {
  background: #e5e7e9;
}

.print-content {
  display: flex;
  gap: 48px;
  align-items: flex-end;
  background: #f8f9f9;
  padding: 12px 20px;
  .pdf-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pdf-container:hover {
    background-color: #f0f0f0;
    cursor: pointer;
  }

  .embed-container {
    position: relative;
    .clickable-area {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    .name-print {
      position: absolute;
      bottom: 12px;
      right: 4px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 2px 5px;
      font-size: 12px;
      border-radius: 8px;
    }
  }
}
</style>
