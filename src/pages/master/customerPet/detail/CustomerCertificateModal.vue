<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MtInputForm from '@/components/form/MtInputForm.vue'
import usePrintStore from '@/stores/prints'
import PdfEditor from '@/pages/master/print/PdfEditor.vue';
import useCommonStore from "@/stores/common";
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import UpdateInfoListModal from '@/pages/info/UpdateInfoListModal.vue'
import useCustomerStore from '@/stores/customers'
import { regularAttributes } from '@/utils/pdfAttributes/regular'
import useClinicStore from '@/stores/clinics'

const commonStore = useCommonStore()
const printStore = usePrintStore()
const customerStore = useCustomerStore()
const clinicStore = useClinicStore()

const props = defineProps({ selectedPrintTemplate: String, customerData: Object })
const emits = defineEmits(['close'])
const selectedPrintTemplate = ref(null)
const pdfEditorRef = ref(null)
const pdfParentDivWidth = ref(null)
const pdfParentDivHeight = ref(null)
const basePdf = ref(null)
const router = useRouter(), route = useRoute()

const closeModal = () => {
	emits('close');
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

const formBtnPressed = (buttonPressed: any) => {
  const text = `${'' + buttonPressed.text + ''}`
	pdfEditorRef.value.enableAddText(text, window.event)
}

function waitForPdfEditorRef() {
	return new Promise((resolve, reject) => {
		const checkInitialization = () => {
			if (pdfEditorRef.value) {
				setTimeout(resolve, 1000);
			} else {
				setTimeout(checkInitialization, 100);
			}
		};
		checkInitialization();
	});
}

const renderPdfToPrint = (print_template: {}) => {
	const screenSize = commonStore.getCommonOptionList.find((v: any) => v.code_common == 28 && Number(v.code_func1) == print_template.type_print_size).text1
	// const wd = Number(screenSize.split(',')[0])
  // const ht = Number(screenSize.split(',')[1])
	const wd = 210
	const ht = 296

	pdfParentDivWidth.value = print_template.flg_landscape ? ht: wd,
	pdfParentDivHeight.value = print_template.flg_landscape ? wd: ht

	const binaryString = atob(print_template.pdf_path);
	const arrayBuffer = new ArrayBuffer(print_template.pdf_path.length);
	const uint8Array = new Uint8Array(arrayBuffer);
	for (let i = 0; i < binaryString.length; i++) {
		uint8Array[i] = binaryString.charCodeAt(i);
	}
	basePdf.value = new Uint8Array(arrayBuffer);
	waitForPdfEditorRef().then( async () => {
		const left_canvas = document.getElementsByClassName('left-canvas')[0]
		const right_canvas = document.getElementsByClassName('right-canvas')[0]
		if (left_canvas.clientHeight > right_canvas.clientHeight) {
			left_canvas.style.height = right_canvas.clientHeight + 'px'
		}
		// left_canvas.style.width = left_canvas.previousElementSibling?.clientWidth + 'px'
		// let heightToSet = left_canvas.parentElement?.clientHeight
		// left_canvas.parentElement.parentElement.parentElement.style.height = (heightToSet + 50) + 'px'
		const customer_data = props.customerData
		const currentClinic = await clinicStore.fetchClinicById(customer_data.id_clinic)
		const data_to_search_in = { 
			id_customer: customer_data, 
			id_pet: customer_data.pets[0],
			id_clinic: currentClinic
		}
		setTimeout(() => {
			pdfEditorRef.value.setTextInObjectPlace(print_template, data_to_search_in);
		}, 1000)
	});
}

const insertFreeText = (textString: String) => {
	pdfEditorRef.value.enableAddText(textString, window.event)
}

const changeFontSize = (action: String) => {
  pdfEditorRef.value.changeFontSize(action)
}

const deleteSelectedObject = () => {
  const deletedObjectText = pdfEditorRef.value.deleteSelectedObject()
  
}

const print_certificate = () => {

	pdfEditorRef.value.printPdf(pdfParentDivWidth.value,pdfParentDivHeight.value)
}

const download_pdf = () => {
	pdfEditorRef.value.downloadPdf(props.customerData.name_customer_display)
}

const create_t_info = async () => {
	await customerStore.selectCustomer(props.customerData.id_customer, true)
	const blob = pdfEditorRef.value.getPdfBlob()
	await router.replace({path: route.path, query: {...route.query, from: 'requestdetail'}})
  await mtUtils.popup(UpdateInfoListModal, {predefinedFile: blob})
  await router.replace({path: route.path})
}

onMounted(async () => {
	await commonStore.fetchPreparationCommonList({ code_common: [28] }, true)
	await printStore.fetchPrints()
  await printStore.selectPrint(props.selectedPrintTemplate, true)
	renderPdfToPrint(printStore.getPrint)
})

</script>

<template>
	<q-form>
		<MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
						PDF調整・印刷
      </q-toolbar-title>
    </MtModalHeader>
		<q-card-section 
      class="content q-px-xl q-py-none"
      style="background-color: #e5e8e8; max-height: 740px;"
		>
			<div class="row q-py-sm" v-if="props.selectedPrintTemplate">
				<div class="col-9">
					<div class="row">
            <div class="col-6 q-pl-lg q-pt-sm">
            </div>
          </div>
					<div 
						class="left-canvas" 
						:style="{
              overflowX: printStore.getPrint?.flg_landscape ? 'auto' : 'hidden',
              overflowY: 'hidden'
            }"
    
					>
							
							<PdfEditor v-if="basePdf" 
								:pdfFile="basePdf" 
								:pdfAttributes="regularAttributes"
								ref="pdfEditorRef"
								:style="{ 
									width: '100%', 
									height: '100%', 
								}"
							/>
					</div>
				</div>
				<div class="col-3 q-pl-sm q-py-sm">
					<div class="right-canvas">
						<div class="q-px-sm q-py-lg text-center text-weight-bold">
							追加
						</div>
						<hr>
						<div class="row q-pl-sm justify-center">
							<div class="q-pt-sm ">文字サイズ</div>
							<q-btn flat round @click="changeFontSize('small')" class="q-ml-sm">
								<q-icon size="sm" name="arrow_drop_down" />
							</q-btn>
							<q-btn flat round @click="changeFontSize('big')" class="q-ml-sm">
								<q-icon size="sm" name="arrow_drop_up" />
							</q-btn>
							<q-btn flat round @click="deleteSelectedObject()" class="q-ml-sm">
								<q-icon size="sm" name="delete" />
							</q-btn>
						</div>
						<hr>
            <div class="q-px-sm q-py-sm q-pb-md rightBtnsContainer">
							<div
                  class="q-py-lg"
                  style="width: 90%; margin: 0 auto; text-align: center"
                >
                  <div>
                    <div
                      class="customBtn"
                      @click="
                        formBtnPressed({
                          value: '自由入力 テキスト',
                          text: '自由入力 テキスト'
                        })
                      "
                    >
                      {{ '{ ' + '自由入力 テキスト' + ' }' }}
                    </div>
                  </div>
                </div>
						</div>

						<!-- <div class="q-px-sm q-py-sm text-center">
							<div class="customBtn" @click="insertFreeText('{ Add Free text }')">
								{{ '<フリーテキストをここに挿入>' }}
							</div>
						</div> -->
					</div>
				</div>
			</div>
		</q-card-section>
		<q-card-section class="bg-white">
			<div class="text-center modal-btn">
				<q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
					<span>キャンセル</span>
				</q-btn>
				<q-btn unelevated color="primary" class="q-ml-md" @click="print_certificate">
					<span>印刷する</span>
				</q-btn>
				<q-btn unelevated color="primary" class="q-ml-md" @click="download_pdf">
					<span>PDFをダウンロード</span>
				</q-btn>
				<q-btn unelevated color="primary" class="q-ml-md" @click="create_t_info">
					<span>通知を作成する</span>
				</q-btn>

			</div>
		</q-card-section>
	</q-form>

</template>

<style lang="scss" scoped>
.left-canvas {
  width: 100%;
  height: auto;
  overflow-x: hidden;
  overflow-y: hidden;
  // background-color: white;
  // border: 1px solid #ABB2B9;

  background-color: transparent;
  border: 0px;
}



.right-canvas {
  width: 100%;
  height: auto;
  // height: 45rem;
  min-height: 45rem;
  background-color: white;
  border: 1px solid #abb2b9;
}
.customBtn {
	width: 80%;
	margin: 0 auto;
	font-size: 18px;
}

.customBtn:hover {
	cursor: pointer;
	color: #ABB2B9;
}
.rightBtnsContainer {
  height: 30rem;
  overflow: auto;
}

</style>
