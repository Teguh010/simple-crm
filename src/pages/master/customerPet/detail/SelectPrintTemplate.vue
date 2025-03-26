<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import usePrintStore from '@/stores/prints'
import PdfEditor from '@/pages/master/print/PdfEditor.vue';
import useCommonStore from "@/stores/common";
import mtUtils from '@/utils/mtUtils'
import CustomerCertificateModal from './CustomerCertificateModal.vue';
import { regularAttributes } from '@/utils/pdfAttributes/regular'

const commonStore = useCommonStore()
const printStore = usePrintStore()
const props = defineProps({ 
	customerData: Object, 
	callBack: Function,
	type_print: Number 
})
const emits = defineEmits(['close'])
const selectedPrintTemplate = ref(null)
const pdfEditorRef = ref(null)
const pdfParentDivWidth = ref(null)
const pdfParentDivHeight = ref(null)
const basePdf = ref(null)

const closeModal = () => {
	emits('close');
}
const initScripts = async () => {
	try {
		fabric = null;
	} catch (error) {
	}
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


const print_template = computed(() => {
	return printStore.getAllPrints.map((print: any) => {
		return {
			label: print.name_print,
			value: print.id_print
		}
	})
})

const selectedPrintTemplateChanged = async (val: any) => {
	closeModal()
	if(props.callBack){
		props.callBack(val)
	}else{
		mtUtils.popup(CustomerCertificateModal, { selectedPrintTemplate: val, customerData: props.customerData })
	}
}

const insertFreeText = (textString: String) => {
	pdfEditorRef.value.enableAddText(textString, window.event)
}

const print_certificate = () => {
	pdfEditorRef.value.printPdf()
}

const download_pdf = () => {
	pdfEditorRef.value.downloadPdf()
}

onMounted(async () => {
	initScripts();
	initStylesheets();
	await commonStore.fetchPreparationCommonList({ code_common: [28] }, true)
	if (props.type_print > 0){
		await printStore.fetchPrints({type_print: props.type_print})
	}else{
		await printStore.fetchPrints()
	}
})

</script>

<template>
	<MtHeader @closeModal="closeModal" >
		<div ref="headerContent">
			<q-toolbar class="justify-between no-wrap">
				<q-toolbar-title class="text-grey-900 title2 bold q-pt-lg q-pl-lg">
					DMハガキ生成
				</q-toolbar-title>
			</q-toolbar>
		</div>
	</MtHeader>
	<q-card-section class="q-px-sm q-py-sm ">
		<div style="">
			<div class="row full-width q-py-lg justify-center">
				<div class="col-10 row justify-center">
						<div v-for="template in print_template" :key="template.id_print">
							<div class="q-ml-md q-py-sm">
								<q-btn 
									color="primary" 
									@click="selectedPrintTemplateChanged(template.value)"
									:style="{width: '200px'}"
									:disabled="selectedPrintTemplate && selectedPrintTemplate.value !== template.value"
								>
									{{template.label}}
								</q-btn>
							</div>
						</div>
				</div>

			</div>
		</div>
		<div class="row" v-if="selectedPrintTemplate">
			<div class="col-8 q-px-lg q-py-lg">
				<div class="left-canvas" :style="{ width: pdfParentDivWidth + 'mm', height: pdfParentDivHeight + 'mm' }">
					<PdfEditor v-if="basePdf" 
						:pdfFile="basePdf"
						:pdfAttributes=regularAttributes
						ref="pdfEditorRef"
						:style="{ width: pdfParentDivWidth + 'mm', height: pdfParentDivHeight + 'mm' }" />
				</div>
			</div>
			<div class="col-4 q-px-lg q-py-lg">
				<div class="right-canvas">
					<div class="q-px-sm q-py-xl text-center text-weight-bold">
						追加
					</div>
					<hr>
					<div class="q-px-sm q-py-sm text-center">
						<div class="customBtn" @click="insertFreeText('{ Add Free text }')">
							{{ '<フリーテキストをここに挿入>' }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</q-card-section>
	<q-card-section class="q-bt bg-white" v-if="selectedPrintTemplate">
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

		</div>
	</q-card-section>

</template>

<style lang="scss" scoped>
.left-canvas {
	// width: 100%;
	height: auto;
	background-color: white;
	border: 1px solid #ABB2B9;
}

.right-canvas {
	width: 100%;
	height: 70rem;
	background-color: white;
	border: 1px solid #ABB2B9;
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
</style>
