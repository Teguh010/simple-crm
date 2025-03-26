<script setup lang="ts">
import { computed, ref, withDefaults } from "vue";
import CustomerCardOutput from "./CustomerCardOutput.vue";
import mtUtils from '@/utils/mtUtils'
import { getImage } from '@/utils/aahUtils';
import { ClinicType, CustomerType } from "@/types/types";

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    qrImage: string
    code_customer: string
    name_customer_display: string
    name_family: string
    name_first: string
    clinic_data: ClinicType
    customer_data: CustomerType,
    callback: Function
  }>(),
  {
    qrImage: '',
    code_customer: '',
    name_customer_display: '',
    name_family: '',
    name_first: '',
    clinic_data: () => {
      return {} as ClinicType
    },
    customer_data: () => {
      return {} as CustomerType
    },
  }
)

const buttons = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const clinic_member_card_bg = ref('');

const rows = computed(() => {
  return buttons.value.reduce((acc, _, i) => {
    if (i % 2 === 0) {
      acc.push({ index: i / 2, items: buttons.value.slice(i, i + 2) });
    }
    return acc;
  }, [] as Array<{index: number, items: number[]}>);
});

async function loadClinicMemberCardBg() {
  clinic_member_card_bg.value = await getImage(props.clinic_data?.img_member_card_url);
}

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

const submit = async (cellNumber: number) => {
  if(props.callback) {
    emits('close')
    await props.callback(cellNumber)
  }else{
    // if (!props.clinic_data?.img_member_card_url) {
    //   await loadClinicMemberCardBg();
    // }
    // customer_card_file_path
    clinic_member_card_bg.value = getLocalUrl(props.clinic_data?.img_member_card_base64)
    let qrImage = getLocalUrl(props.qrImage)
    await mtUtils.pdfRender(CustomerCardOutput, { 
      cellNumber,
      qrImage: qrImage,
      code_customer: props.code_customer,
      name_customer_display: props.name_customer_display,
      name_family: props.name_family,
      name_first: props.name_first,
      clinic_member_card_bg: clinic_member_card_bg.value || props.clinic_data?.img_member_card_url
    });
  }

}

const generate_csv_file = () => {
  const csv_file_name = `オーナー情報_${props.name_customer_display}様.csv`;
  const headers = ["病院CD", "病院CD", "オーナー名"];
  const rows = [props.clinic_data?.code_clinic, props.customer_data?.code_customer, props.customer_data?.name_family];
  const csvContent = `${headers.join(",")}\n${rows.join(",")}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = csv_file_name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const download_customer_qr_image = async () => {
  const qr_image_file_name = `${props.name_customer_display}-QR.png`;
  let url = getLocalUrl(props.qrImage)
  // const response = await fetch(localUrl);
  // const blob = await response.blob();
  // const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = qr_image_file_name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <MtModalHeader @closeModal="emits('close')">
    <q-toolbar-title></q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-md">
    <div class="buttons-container">
      <div class="card-selector-title">
        <span class="body1 bold">診察券の印刷</span><br/>
        <span>出力対象枠を選択してください。</span>
      </div>
      <div class="button-row" v-for="row in rows" :key="row.index">
        <q-btn
          v-for="item in row.items" 
          :key="item" 
          class="customButton"
          @click="submit(item)"
        >
          {{ item }}
        </q-btn>
      </div>
      <div class="card-explanation">
        (※<a href="https://www.a-one.co.jp/product/search/detail.php?id=51677" target="_blank">指定A-ONE</a>, A4サイズ, 背面手差し, 余白なし)
      </div>
      <div class="card-explanation q-mt-sm">
        <span @click="generate_csv_file" class="link-color cursor-pointer">CSV</span>
        <span @click="download_customer_qr_image" class="link-color cursor-pointer q-ml-md">QRコード画像のみ出力</span>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="emits('close')">
        <span>キャンセル</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.buttons-container {
  display: flex;
  flex-direction: column;
}
.button-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
}
.customButton {
  flex: 1;
  margin: 6px;
  color: #a3a3a3;
  line-height: 20px;
  font-weight: 800;
  font-size: 20px;
  padding: 0px 10px;
  border: 1px solid #ccc;
}
.card-selector-title {
  margin-bottom: 20px;
  text-align: center;
}
.card-explanation {
  font-size: 12px;
  line-height: 1.5; 
  text-align: center;
}
.link-color {
  color: -webkit-link;
  text-decoration: underline;
}
</style>
