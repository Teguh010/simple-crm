<script setup lang="ts">
import MtHeader from '@/components/layouts/MtHeader.vue'
import useDownloadCenterStore from '@/stores/download-center'
import { onMounted, ref } from 'vue';
import mtUtils from '@/utils/mtUtils'

const downloadCenterStore = useDownloadCenterStore()
const pdfs = ref([])

const fetch_pdf = async (url: string) =>{
  try {
    if (!url) return null
    const response = await fetch(url)
    let blob: any = await response.blob()
    return URL.createObjectURL(blob)
  } catch (err) {
    return null
  }
}

const downloadFile = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
};


const download_pdf = async (pdf: object) => {
  await mtUtils
  .confirm('出力モードを選択してください。\n印刷時は用紙サイズに注意してください。', '確認', '印刷', 'PDFダウンロード')
  .then(async (confirmation) => {
    if (confirmation == 'edit') { // pdf download
      let url = pdf?.url
      const local_url = await fetch_pdf(url)
      downloadFile(local_url, pdf.key)
    } else if( confirmation == 'send') { // pdf print
      let url = pdf?.url
      const local_url = await fetch_pdf(url)
      // downloadFile(local_url, pdf.key)
      const iframe = document.createElement('iframe');
      iframe.src = local_url
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe)
      },30000)
    } else{ // abort

    }
  })
  
}

onMounted(async ()=>{
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await downloadCenterStore.fetchDownloadCenterFiles(id_clinic)
  pdfs.value = downloadCenterStore.getDownloadCenterFiles
})


</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          ダウンロードセンター
        </q-toolbar-title>
      </q-toolbar>
    </MtHeader>
    <q-card-section class="q-px-xl q-mt-md">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-4">
          <div class="q-mb-md">
            <h4 class="text-white bg-grey-600 title4">
              帳票PDF
            </h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              クリックでダウンロードできます。
            </span>
          </div>
          <!-- loop -->
          <ol class="download-list-1">
            <template
              v-for="(pdf, index) in pdfs"
              :key="index"
            >
              <li>
                <span @click="download_pdf(pdf)" class="text-blue cursor-pointer">{{pdf.key}}</span>
              </li>
            </template>
          </ol>
        </div>
        <div class="col-4">
          
        </div>
        <div class="col-4">
          
        </div>
      </div>
    </q-card-section>
  </q-page>
</template>

<style lang="scss">
ol.download-list-1 > li {
  margin-bottom: 5px;
}

</style>
