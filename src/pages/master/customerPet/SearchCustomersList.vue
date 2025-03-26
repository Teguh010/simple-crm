<script lang="ts" setup>
import { computed, onMounted, defineAsyncComponent, ref, reactive } from 'vue'
import { Loading } from 'quasar'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
const BulkCustomersCardOutput = defineAsyncComponent(() => import('@/pages/master/customerPet/BulkCustomersCardOutput.vue'))
const GetCustomerCardSlotModal = defineAsyncComponent(() => import('@/pages/master/customerPet/GetCustomerCardSlotModal.vue'))


// Stores
import useCustomerStore from '@/stores/customers'
import useClinicStore from '@/stores/clinics'

// Utilities
import mtUtils from '@/utils/mtUtils'
import {
  getImage
} from '@/utils/aahUtils'

// Images
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue';

 
const customerStore = useCustomerStore()
const clinicStore = useClinicStore()

const customerOptionList = ref([])
const customerOptionListDefault = reactive([])
const customerList = ref([])
const clinic_member_card_bg = ref(null)
const tableElement = ref(null)
const finalSelectedCustomers = ref([])

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    style: 'width:1%',
    overLoad: true
  },
  {
    name: 'code_customer',
    label: '診察券番号',
    field: 'code_customer',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: 'name_family',
    label: '姓',
    field: 'name_family',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: 'name_first',
    label: '名',
    field: 'name_first',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: 'name_kana_family',
    label: 'セイ',
    field: 'name_kana_family',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: 'name_kana_first', 
    label: 'メイ',
    field: 'name_kana_first',
    align: 'left',
    style: 'width: 7%'
  },
  {
    name: '',
    label: '',
    field: '',
    align: 'left',
    style: 'width: 60%'
  }
]

const search = ref({
  id_customer: null,
})

const initScript = () => {
  const scripts = [
		{
			src: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
			integrity: ''
		},
    {
			src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
			integrity: ''
		}
	]
	scripts.forEach((scriptObj) => {
		let script = document.createElement('script');
		script.src = scriptObj.src;
		if (scriptObj.integrity !== '') {
			script.integrity = scriptObj.integrity;
		}
		script.crossOrigin = 'anonymous';
		script.referrerPolicy = 'no-referrer';
		document.body.appendChild(script);
	})
}

function checkedRowList(value: any) {
  customerList.value = customerList.value.map((r: any) => ({
    ...r,
    checked: value
  }))
}

const totalData = computed(() => {
  return customerList.value.length
})

const checkedData = computed(() => {
  return customerList.value.filter((r: any) => r.checked).length
})

const customerSelectedFromSearch = (id_customer: number) => {
  const customer = customerStore.getCustomerListOptions.find((v) => v.value == id_customer)
  const checkCustomer = customerList.value.find((v) => v.value == id_customer)
  if (customer && !checkCustomer) customerList.value.push({...customer, checked: true})
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

async function loadClinicMemberCardBg(clinic: any) {
  clinic_member_card_bg.value = await getImage(clinic?.img_member_card_url);
}

const exportCustomerCardsPdf = async () => {
  const checked_data = customerList.value.filter((r: any) => r.checked)
  if(checked_data.length == 0){
    mtUtils.autoCloseAlert("オーナーを選択してください")
    return
  }else{
    Loading.show({
      backgroundColor: 'transparent',
      spinnerColor: 'black',
      message: 'メールを送信する...',
      messageColor: 'black'
    })
    const selectedCustomerIds = checked_data.map((item) => item.value)
    let data = { ids : selectedCustomerIds.join(','), with_customer_logo: true, fetch_clinic_bg_img: true }
    const resp_ = await customerStore.fetchCustomersWithAdressesAndTel(data)
    Loading.hide()
    if(Boolean(resp_.data?.clinic_bg_img)){
      clinic_member_card_bg.value = getLocalUrl(resp_.data?.clinic_bg_img)
    }
    finalSelectedCustomers.value = resp_.data?.customers
    await mtUtils.littlePopup(GetCustomerCardSlotModal, {
      callback: onCustomerCardSlotSelect
    })
  }
}

const importCustomerCardsCsv = async () => {
  document.getElementById('csvuploader')?.click()
}

const getZipFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const fileName = `${year}${month}${day}_まとめてQR.zip`;
  return fileName
}

async function generateAndDownloadZip(customersData: any) {
    const zip = new JSZip();
    let done = [];
    let failed = [];
    for (const customer of customersData) {
      try {
        const base64Data = customer.customer_card_file_path;
        const binaryData = atob(base64Data);
        const byteArray = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            byteArray[i] = binaryData.charCodeAt(i);
        }
        const fileName = `${customer.code_customer}.png`;
        zip.file(fileName, byteArray, { binary: true });
        done.push(customer)
      } catch (error) {
        failed.push(customer)
      }
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = getZipFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if(failed.length > 0){
      mtUtils.confirm(`${failed.length} 件のオーナーQRコードの取得に失敗しました`, "失敗した", "わかりました")
    }else{
      mtUtils.confirm(`${done.length} 件のオーナーQRコードをダウンロードしました`, "成功する", "わかりました")
    }

}



const exportPngZip = async () => {
  const checked_data = customerList.value.filter((r: any) => r.checked)
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: 'メールを送信する...',
    messageColor: 'black'
  })
  const selectedCustomerIds = checked_data.map((item) => item.value)
  let data = { ids : selectedCustomerIds.join(','), with_customer_logo: true, fetch_clinic_bg_img: false }
  const resp_ = await customerStore.fetchCustomersWithAdressesAndTel(data)
  Loading.hide()
  let customersData = resp_.data?.customers
  generateAndDownloadZip(customersData);
}

// Mode Print
const csvUploaded = async (event: any) => {
  const file = event.target.files[0];
  var fileReader = new FileReader();
  fileReader.onload = function (e) {
    Papa?.parse(file, {
      header: true,
      complete: function (results:any) {
        let csvRows = results.data
        csvRows = csvRows.reduce((acc:any, current:any) => {
          const existing = acc.find(cust => cust["診察券番号"] === current["診察券番号"]);
          if (!existing || current["診察券番号"] === "") {
            acc.push(current);
          }
          return acc;
        }, []);

        if(!Boolean(csvRows[0]['診察券番号']) || !Boolean(csvRows[0]['オーナー名'])){
          mtUtils.alert("診察券番号, オーナー名 columns not found", "エラー")
          return;
        }
        let customers_:any = []
        let failed_customers:any = []
        csvRows.forEach((row:any) => {
          let cus = customerStore.getCustomerListOptions.find((v) => v.code_customer == Number(row['診察券番号']) && (row['オーナー名'] == v.name_family + v.name_first || row['オーナー名']?.includes(v.name_family) ))
          if(cus){
            cus.checked = true;
            customers_.push(cus)
          }else{
            if(Object.keys(row).length > 1){
              failed_customers.push(row)
            }
          }
        })
        customerList.value = customers_
        if(failed_customers.length > 0 ){
          let errorMessage = failed_customers?.map((customer) => {
            return `${customer['診察券番号'] ? customer['診察券番号'] : ''}, ${customer['オーナー名'] ? customer['オーナー名'] : ''}`
          }).join('\n');
          errorMessage += '\n\nこれらの顧客をインポートできませんでした';
          mtUtils.alert(errorMessage, "エラー")
        }else{
          mtUtils.autoCloseAlert("インポート成功", "成功")
        }
      }
    });
  };
  fileReader.readAsArrayBuffer(file);
}

const onCustomerCardSlotSelect = async (slot_number: any) => {
  let checked_data = finalSelectedCustomers.value;
  if(!Boolean(clinic_member_card_bg.value)){
    const id_clinic = localStorage.getItem('id_clinic') ? JSON.parse(localStorage.getItem('id_clinic')!) : null
    const clinic = clinicStore.getClinics.find( (i) => i.id_clinic === id_clinic )
    if (!clinic_member_card_bg.value) {
      await loadClinicMemberCardBg(clinic);
    }
  }
  let customersData = checked_data.map((c) => {
    return {
      filledCardPosition: slot_number,
      qrImage: c.customer_card_file_path,
      code_customer: c.code_customer,
      name_customer_display: c.name_customer_display,
      name_family: c.name_family,
      name_first: c.name_first,
    }
  })
  // await mtUtils.mediumPopup(BulkCustomersCardOutput, {
  //   customersData: customersData,
  //   clinic_member_card_bg: clinic_member_card_bg,
  //   startingSlot: slot_number
  // }) 
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: 'メールを送信する...',
    messageColor: 'black'
  })
  await mtUtils.pdfRender(BulkCustomersCardOutput, {
    customersData: customersData,
    clinic_member_card_bg: clinic_member_card_bg,
    startingSlot: slot_number
  }) 
  Loading.hide()
}

onMounted(async () => {
  initScript()
  if(customerStore.getCustomerListOptions.length == 0) {
    await customerStore.fetchPreparationCustomers()
  }
  customerOptionList.value.length = 0
  customerOptionListDefault.length = 0
  customerOptionList.value = [...customerStore.getCustomerListOptions]
  customerOptionListDefault.push(...customerStore.getCustomerListOptions)
})

</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar
        class="text-primary q-pa-none flex item-center justify-between"
      >
        <div class="flex items-center">
          <q-toolbar-title class="title2 bold text-grey-900">
            診察券印刷
          </q-toolbar-title>
        </div>
        <div class="flex items-center gap-6">
          <MtFilterSelect
            label="診察券番号"
            v-model:selecting="search.id_customer"
            v-model:options="customerOptionList"
            :options-default="customerOptionListDefault"
            autofocus
            custom-option
            @update:selecting="customerSelectedFromSearch"
          >
            <template #selectedCustomOption="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon
                      v-if="slotProps.opt.icon"
                      name="circle"
                      size="16px"
                      :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="q-mt-sm">
      <div class="flex justify-between items-center q-pt-sm q-mb-xs q-px-md">
        <div class="">
          検索結果 {{ totalData }} 件 / {{ checkedData }} 件 選択中
        </div>
        <div class="flex justify-end">
          <q-btn outline unelevated class="q-mx-sm" @click="importCustomerCardsCsv">
            <q-icon name="upload" class="text-grey-700 q-mr-xs" size="16px" />
            CSV取込
          </q-btn>
          <q-btn outline unelevated class="q-mx-sm" @click="exportPngZip">
            <q-icon name="download" class="text-grey-700 q-mr-xs" size="16px" />
            QR画像のみ
          </q-btn>
          <q-btn outline unelevated class="q-mx-sm" @click="exportCustomerCardsPdf">
            <q-icon name="download" class="text-grey-700 q-mr-xs" size="16px" />
            診察券印刷
          </q-btn>
          <input type="file" id='csvuploader' accept=".csv" @change="csvUploaded" style="display: none;">
        </div>
      </div>
      <span ref="tableElement">
        <MtTable2
          :columns="columns"
          :rows="customerList"
          :rowsBg="true"
          :style="{ boxShadow: 'none', height: 'calc(100vh - 70px)' }"
          class="custody-table"
          @checked="checkedRowList"
        >
          <template v-slot:row="{ row }">
            <td
              v-for="(col, index) in columns"
              :key="index"
              class="small-table-font"
            >
              <div v-if="col.field == 'checkbox'">
                <MtFormCheckBox v-model:checked="row.checked" />
              </div>
              <div v-else-if="col.field == 'code_customer'">
                {{ row['code_customer'] }}
              </div>
              <div v-else-if="col.field == 'name_family'">
                {{ row['name_family_original'] }}
              </div>
              <div v-else-if="col.field == 'name_first'">
                {{ row['name_first'] }}
              </div>
              <div v-else-if="col.field == 'name_kana_family'">
                {{ row['name_kana_family'] }}
              </div>
              <div v-else-if="col.field == 'name_kana_first'">
                {{ row['name_kana_first'] }}
              </div>
              <div v-else>
                {{ row[col.field] }}
              </div>
            </td>
          </template>
        </MtTable2>
      </span>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}

.small-table-font {
  font-size: 14px !important;
  color: #000;
}
</style>
