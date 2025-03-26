<script lang="ts" setup>
import { onMounted, ref } from "vue";
import PdfExport from '@/pages/pdfExport/PdfExport.vue'

const emits = defineEmits(['close'])
const props = defineProps({ htmlString: String })
const exportPdf = ref()
const closeUpdDialogFlg = ref(false);

function close() {
  emits('close')
}
const openPrintDialog = () => {
  const prtHtml = document.getElementById('element-to-print').innerHTML;
  let stylesHtml = '';
  for (const node of [...document.querySelectorAll('link[rel="stylesheet"], style')]) {
    stylesHtml += node.outerHTML;
  }
  const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
  WinPrint.document.write(`<!DOCTYPE html>
  <html>
    <head>
      ${stylesHtml}
    </head>
    <body>
      ${prtHtml}
    </body>
  </html>`);
  WinPrint.document.close();
  WinPrint.focus();
  setTimeout(() => {
    WinPrint.print();
    WinPrint.close();
  }, 500);
}
async function init() {
  openPrintDialog()
  close()
}
function generateReport() {
  exportPdf.value.generateReport(`bill`)
}
onMounted(() => {
  document.getElementsByClassName('card-pdf-main')[0].innerHTML += props.htmlString
  init()
})
</script>

<template>
  <div v-close-popup="closeUpdDialogFlg" ref="modelBodyRef" class="">
    <div class="flex justify-between no-wrap q-pa-md">
      <div><!--Title Here--></div>
        <div class="flex no-wrap items-center ">
          <q-btn class="bg-white text-black q-mx-md" @click="generateReport()">PDF生成</q-btn>
          <q-btn @click="close" flat round dense icon="close" />
        </div>
    </div>
    <PdfExport sheetName="診察券発行" ref="exportPdf" />
    <q-card id="element-to-print" style="max-width: 1000px; margin: auto; height: 100vh;" class="bg-white q-pa-none" square>
      <div class="card-pdf-main q-px-md q-pt-xl text-no-wrap">
      </div>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.card-pdf-main {
  // font-family: 'Zen Antique Soft', serif;
  // color: #000;
}
</style>
