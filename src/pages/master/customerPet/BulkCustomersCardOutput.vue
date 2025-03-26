<script lang="ts" setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import html2pdf from 'html2pdf.js'


const emits = defineEmits(['close'])
const props = defineProps({
  customersData: Array,
  clinic_member_card_bg: String,
  startingSlot: Number
})

const centralWidth = 4
const verticalCardGap = 2
const cardWidth = ref(91)
const cardHeight = ref(55.45)
const columnsPerRow = ref(2)

const exportPdf = ref()

function close() {
  emits('close')
}

const cardStyle = computed(() => (index: number, customerData: any) => {
  return {
    width: `${cardWidth.value}mm`,
    height: `${cardHeight.value}mm`,
    boxSizing: 'border-box',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flex: '1',
    // backgroundImage: index === customerData.filledCardPosition ? "url("+props.clinic_member_card_bg.value+")" : ''
    // backgroundImage: "url("+props.clinic_member_card_bg.value+")"
  }
})

const emptyCardStyle =  computed(() => (index: number) => {
  return {
    width: `${cardWidth.value}mm`,
    height: `${cardHeight.value}mm`,
    boxSizing: 'border-box',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flex: '1',
  }
})

async function init() {
  setTimeout(async function(){
    await generateAndPrintPDF()
    close()
  },3000)
}

const customerData_ = computed(() => {
  // const customerData_ = ref(props.customersData)
  const data_ = [];
  for(let i=1; i<props.startingSlot; i++){
    data_.push({
      do_fill: false
    })
  }
  for(let i=0; i<props.customersData.length; i++){
    props.customersData[i].do_fill = true
    data_.push(props.customersData[i])
  }
  return data_;
})

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

function generateFileName() {
  const now = new Date();
  const yyyymmdd = now.getFullYear().toString() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0');
  const hhmm = String(now.getHours()).padStart(2, '0') + 
                String(now.getMinutes()).padStart(2, '0');
  return `まとめ診察券_${yyyymmdd}_${hhmm}.pdf`;
}

async function generateAndPrintPDF() {
  const pages = Array.from(document.querySelectorAll('section'))
  const pdfOptions = {
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

  await downloadPDF(pages, pdfOptions)
}



const downloadPDF = async (elements, pdfOptions) => {
  let worker = html2pdf()
    .set(pdfOptions)
    .from(elements[0])

  if (elements.length > 1) {
    worker = worker.toPdf() // worker is now a jsPDF instance
    // add each element/page individually to the PDF render process
    elements.slice(1).forEach((element, index) => {
      worker = worker
        .get('pdf')
        .then(pdf => {
          pdf.addPage()
        })
        .from(element)
        .toContainer()
        .toCanvas()
        .toPdf()
    })
  }else{
    worker = worker.toPdf() // worker is now a jsPDF instance
  }
  worker.get('pdf').then(function (pdf) {
    // openPrintModal(pdf.output('bloburl'))
    pdf.save(generateFileName())
  })
}

function getFileName() {
  return `診察券印刷_${props.name_customer_display}_様`
}

const customerIndex = (pageIndex: number, rowIndex: number, cardIndex: number) => {
  return pageIndex * 10 + rowIndex * columnsPerRow.value + cardIndex;
};

const getLocalUrl = (base64: string) => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/png' });
  const blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

const get_final_customer_name = (customerObject: any) => {
  let name_customer_ = customerObject.name_family + customerObject.name_first
  let name_family = customerObject.name_family
  if(name_customer_.length >= 1 && name_customer_.length <= 10){
    return name_customer_ + '様'
  }else{
    return name_family + '様'
  }
}

const get_final_customer_font_size = (customerObject: any) => {
  let name_customer_ = customerObject.name_family + customerObject.name_first
  if(name_customer_.length >= 1 && name_customer_.length <= 7){
    return { fontSize: '14px'}
  }else if(name_customer_.length >= 8 && name_customer_.length <= 10){
    return { fontSize: '12px'}
  }else{
    return { fontSize: '14px'}
  }
}

onMounted(async () => {
  await nextTick() // Ensure QR image is loaded
  await init()
})
</script>

<template>
  <div>
    <PdfExport ref="exportPdf" />
    <div class="q-pa-md page-inner-body text-grey-900">
      <q-card id="element-to-print" class="bg-white q-pa-none" square style="width: 186mm;">
        <section v-for="(page, pageIndex) in Math.ceil(customerData_.length / 10)" :key="pageIndex" :class="{'html2pdf__page-break': pageIndex > 0,}">
          <template v-for="(row, rowIndex) in 5" :key="rowIndex">
            <div class="flex" :style="{ gap: `${centralWidth}mm`, 'margin-top': rowIndex !== 0 ? `${verticalCardGap}mm` : '0'}">
              <template v-for="(card, cardIndex) in columnsPerRow" :key="`${rowIndex * columnsPerRow + cardIndex}`">
                <div
                    v-if="Boolean(customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]) && customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]?.do_fill"
                    :class="{'relative-position': true}"  
                    :style="cardStyle(rowIndex * columnsPerRow + cardIndex + 1, customerData_[customerIndex(pageIndex,rowIndex, cardIndex)])"
                  >
                  <img :src="props.clinic_member_card_bg.value" alt="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;">
                  <div class="card-content">
                    <div class="left">
                      <div style="margin: 0; display: flex; line-height: 30px; justify-content: space-between;">
                        <p style="font-size: 12px; color: #7b7b7b">
                          診察券番号
                        </p>
                        <p style="">
                          {{ customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]?.code_customer }}
                        </p>
                      </div>
                      <p :style="{... get_final_customer_font_size(customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]), margin: 0, lineHeight: '30px', }">
                        {{ get_final_customer_name(customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]) }}
                      </p>
                    </div>
                    <div class="right">
                      <!-- <img :style="{ width: '85px' }" :src="'data:image/png;base64,' + customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]?.qrImage" alt="" /> -->
                      <img :style="{ width: '85px' }" :src="getLocalUrl(customerData_[customerIndex(pageIndex,rowIndex, cardIndex)]?.qrImage)" alt="" />
                    </div>
                  </div>
                </div>
                <div v-else 
                  :class="{'relative-position': true}"  
                  :style="emptyCardStyle(rowIndex * columnsPerRow + cardIndex + 1)"
                ></div>
              </template>
            </div>
          </template>
        </section>
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
