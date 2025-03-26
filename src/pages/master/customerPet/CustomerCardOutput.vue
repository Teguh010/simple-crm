<script lang="ts" setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import { getImage } from '@/utils/aahUtils'
import html2pdf from 'html2pdf.js'

const emits = defineEmits(['close'])
const props = defineProps({
  cellNumber: Number,
  qrImage: String,
  code_customer: String,
  name_customer_display: String,
  name_family: String,
  name_first: String,
  clinic_member_card_bg: String
})

const centralWidth = 4
const verticalCardGap = 2
const cardWidth = ref(91)
const cardHeight = ref(55.45)
const filledCardPosition = ref(props.cellNumber)
const totalCards = ref(10)
const columnsPerRow = ref(2)
const qrImage = ref(props.qrImage)

const exportPdf = ref()

function close() {
  emits('close')
}

const isIpad = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPad =
    /ipad/.test(userAgent) ||
    (/macintosh/.test(userAgent) && 'ontouchend' in document)
  if (isIPad) {
    return true
  }
  return false
})

const cardStyle = computed(() => (index: number) => {
  return {
    width: `${cardWidth.value}mm`,
    height: `${cardHeight.value}mm`,
    boxSizing: 'border-box',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flex: '1',
    // backgroundImage: index === filledCardPosition.value ? `url(${props.clinic_member_card_bg})` : ''
  }
})

async function init() {
  // await nextTick()
  setTimeout(function(){
    generateAndPrintPDF()
    close()
  },3000)
}

function generateFileName() {
  return `診察券_${props.code_customer}_${props.name_customer_display}.pdf`
}

function generateAndPrintPDF() {
  const element = document.getElementById('element-to-print')
  const options = {
    margin: [7, 11, 0, 12], //top, left, buttom, right
    filename: getFileName(),
    image: { type: 'jpeg', quality: 1 },
    UsePrintMediaType: 1,
    html2canvas: { letterRendering: true, scale: 2, dpi: 192, useCORS: true, quality: 4 },
    jsPDF: {
      unit: 'mm',
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      compressPdf: true,
      orientation: 'portrait',
      format: 'a4',
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      avoid: 'image',
      after: 'section'
    }
  }

  const iframePdf = document.querySelector(`[invoicePdf="${true}"]`)
  if (iframePdf) iframePdf.remove()
  html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .get('pdf')
    .then(function (pdf) {
      // openPrintModal(pdf.output('bloburl'))
      pdf.save(generateFileName())
    })
}

const openPrintModal = (bloburl: any)=>{
  var iframe = document.createElement('iframe')
  iframe.setAttribute('invoicePdf', true)
  iframe.style.visibility = 'hidden'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  document.body.appendChild(iframe)
  iframe.src = bloburl
  iframe.onload = function () {
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    }, 300)
  }
  setTimeout(() => {
    document.body.removeChild(iframe)
    URL.revokeObjectURL(iframe.src)
  }, 30000)
}

function getFileName() {
  return `診察券印刷_${props.name_customer_display}_様`
}

const get_final_customer_name = (name_family: any, name_first: any) => {
  let name_customer_ = name_family + ' ' + name_first + ' '
  if(name_customer_.length >= 1 && name_customer_.length <= 10){
    return name_customer_ + '様'
  }else{
    return name_family + '様'
  }
}

const get_final_customer_font_size = (name_family: any, name_first: any) => {
  let name_customer_display = name_family + name_first
  if(name_customer_display.length >= 1 && name_customer_display.length <= 7){
    return { fontSize: '14px'}
  }else if(name_customer_display.length >= 8 && name_customer_display.length <= 10){
    return { fontSize: '12px'}
  }else{
    return { fontSize: '14px'}
  }
}

onMounted(async () => {
  qrImage.value = await getImage(qrImage.value)
  await nextTick() // Ensure QR image is loaded
  await init()
})
</script>

<template>
  <div>
    <PdfExport ref="exportPdf" />
    <div class="q-pa-md page-inner-body text-grey-900">
      <q-card
        id="element-to-print"
        class="bg-white q-pa-none"
        square
        style="width: 186mm;"
      >
        <template
          v-for="(rows, rowIndex) in Math.ceil(totalCards / columnsPerRow)"
          :key="rowIndex"
        >
          <div
            class="flex"
            :style="{
              gap: `${centralWidth}mm`,
              'margin-top': rowIndex !== 0 ? `${verticalCardGap}mm` : '0'
            }"
          >
            <template
              v-for="(card, cardIndex) in columnsPerRow"
              :key="`${rowIndex * columnsPerRow + cardIndex}`"
            >
              <div
                v-if="
                  rowIndex * columnsPerRow + cardIndex + 1 ===
                  Number(filledCardPosition)
                "
                class="relative-position"
                :style="cardStyle(rowIndex * columnsPerRow + cardIndex + 1)"
              >
                <img :src="props.clinic_member_card_bg" alt="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;">
                <div class="card-content">
                  <div class="left">
                    <div style="margin: 0; display: flex; line-height: 30px; justify-content: space-between;">
                      <p style="font-size: 12px; color: #7b7b7b">
                        診察券番号
                      </p>
                      <p style="">
                        {{ code_customer }}
                      </p>
                    </div>
                    <p :style="{... get_final_customer_font_size(name_family, name_first), margin: 0, lineHeight: '30px', }">
                      {{ get_final_customer_name(name_family, name_first) }}
                    </p>
                  </div>
                  <div class="right">
                    <img :style="{ width: '85px' }" :src="qrImage" alt="" />
                  </div>
                </div>
              </div>
              <div
                v-else
                :style="cardStyle(rowIndex * columnsPerRow + cardIndex + 1)"
              >
              </div>
            </template>
          </div>
        </template>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
@page {
  size: A4;
  margin: 0;
}


@media print {
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }
  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
}


body {
  margin: 0;
  padding: 0;
}

#element-to-print {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
  width: 100%;
  height: 100%;
}

.flex {
  display: flex;
}


.card-content {
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  transform: translate(-50%, -50%);
}
.left {
  width: 50%;
  align-content: center;
  text-align: end;
  font-size: 16px;
}
.right {
  width: 40%;
  align-content: center;
  text-align: end;
}

.margin-top{
}



</style>
