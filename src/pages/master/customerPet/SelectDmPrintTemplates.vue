<script setup lang="ts">
import { onMounted, ref, computed, PropType } from 'vue'
import usePrintStore from '@/stores/prints'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { regularAttributes } from '@/utils/pdfAttributes/regular'
import useClinicStore from '@/stores/clinics';
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

const printStore = usePrintStore()
const clinicStore = useClinicStore()
const props = defineProps({ 
	callBack: Function,
	type_prints: Array,
	mode: {
		type: String as PropType<'auto' | 'csv'>,
		default: 'auto',
		validator: (value: string) => ['auto', 'csv'].includes(value)
	}
})
const emits = defineEmits(['close'])
const data = ref({
	front_side_id_print: "",
	back_side_id_print: "",
})
const hasBackground = ref<{ all:number, front:number, back:number }>({ all:0, front:0, back:0 })
const mappableFront =  ref<string[]>([])
const mappableBack = ref<string[]>([])
const frontCsvColumns = ref<string>('')
const backCsvColumns = ref<string>('')
const exportIsDirty = ref<boolean>(false)
const csvData = ref<{data: any[], headers: string[]}>({ data: [], headers: [] })
const customerCsvData = ref<{csv: { front: Record<string, any>, back: Record<string, any> }}[]>([{csv: { front: {}, back: {} }}])
const uploadedFile = ref<File | undefined>()
const csvRowCount = ref<number>(0)
const isLoading = ref<boolean>(false)

const mappableFrontText = computed(() => mappableFront.value.join(', ') || '一致するものがありません')
const mappableBackText = computed(() => mappableBack.value.join(', ') || '一致するものがありません')
const canExport = computed(() => {
	if (isLoading.value) return false
	if (props.mode !== 'csv') {
		return !!data.value.front_side_id_print || !!data.value.back_side_id_print;
	}
	
	const frontValid = !data.value.front_side_id_print || !isFrontMappable.value || !frontMappingValidation.value;
	const backValid = !data.value.back_side_id_print || !isBackMappable.value || !backMappingValidation.value;
	
	return (!!data.value.front_side_id_print || !!data.value.back_side_id_print) && frontValid && backValid;
})
const frontMappingValidation = computed(() => generateMappingRules('front'))
const backMappingValidation = computed(() => generateMappingRules('back'))
const isFrontMappable = computed(() => mappableFront.value.length > 0)
const isBackMappable = computed(() => mappableBack.value.length > 0)

const closeModal = () => {
	emits('close');
}

const front_print_templates = computed(() => {
	const prints = printStore.getAllPrints.filter(item => item.type_print == 1)
	return prints.map((print: any) => {
		return {
			label: print.name_print,
			value: print.id_print
		}
	})
})


const back_print_templates = computed(() => {
	const prints = printStore.getAllPrints.filter(item => item.type_print == 2)
	return prints.map((print: any) => {
		return {
			label: print.name_print,
			value: print.id_print
		}
	})
})

const generate = async () => {
	exportIsDirty.value = true
	if (!canExport.value) return
	if (!props.callBack) return
	const requestPages = [data.value.front_side_id_print, data.value.back_side_id_print].filter( (request => !!request))
	const isOneSide = requestPages.length === 1
	const options = {
		hasBackground: hasBackground.value.all === 0 ? 0 : 2
	}
	if (props.mode === 'csv') {
		isLoading.value = true
		const data = {
			has_bg: options?.hasBackground ?? 0,
			customers: customerCsvData.value.map(ccData => ({
				...ccData,
				id_clinic: clinicStore.getClinic,
				_csv: Object.assign(
					{},
					// if one side, always use front for BE to map it
					...Object.keys(ccData.csv.front).map(key => ({
						[`${key}__${isOneSide ? 'front' : 'front'}`]: ccData.csv.front[key]
					})),
					...Object.keys(ccData.csv.back).map(key => ({
						[`${key}__${isOneSide ? 'front' : 'back'}`]: ccData.csv.back[key]
					}))
				)
			})),
			id_print: isOneSide ? requestPages[0] : requestPages,
			mapped_attributes: (() => {
				// Create array of mapped attributes from CSV
				const mappedAttributes = mappableFront.value.map(item => ({
					text: `${item}`,
					value: `_csv.__csv${item}`
				})).concat(mappableBack.value.map(item => ({
					text: `${item}`,
					value: `_csv.__csv${item}`
				})))
				
				// Add regular attributes that aren't already mapped
				const mappedTexts = mappedAttributes.map(attr => attr.text)
				const additionalAttributes = regularAttributes.filter(attr => 
					!mappedTexts.includes(attr.text)
				)
				
				return [...mappedAttributes, ...additionalAttributes]
			})() 
		}

		try {
			const response = await mtUtils.callApi(
			  selectOptions.reqMethod.POST,
			  'mst/generateDmCustomerPdf',
			  data
			)
			isLoading.value = false
			if (response) {
				const base64Pdf = response.pdf
				const blob = base64ToBlob(base64Pdf)
				const pdfUrl = URL.createObjectURL(blob)

				// Create a temporary anchor element
				const a = document.createElement('a')
				a.href = pdfUrl
				a.download = 'customer_report.pdf' // Specify the desired file name
				document.body.appendChild(a) // Append the anchor to the body
				a.click() // Programmatically click the anchor to trigger the download
				document.body.removeChild(a) // Remove the anchor from the document

				// Revoke the object URL to free up memory
				URL.revokeObjectURL(pdfUrl)
			}
			closeModal()
		} catch (error) {
			isLoading.value = false
		}
		
		
	} else {
		closeModal()
		if (requestPages.length === 1) {
			props.callBack(...requestPages, options)
		} else {
			props.callBack(requestPages, options)
		}
	}
}

const getMappableAttributes = (side: 'front' | 'back', id_print: string, mappable: Record<string, any>[] = regularAttributes) => {
	resetCsvUi(side)
	if (props.mode !== 'csv') return
	const printData = printStore.getAllPrints.find(item => item.id_print === (id_print ?? -1).toString())
	if (printData) {
		const filteredMappable = mappable.filter((m: any) => !['ペット写真', '病院ロゴ', 'ペット写真/病院'].includes(m.text))
		if (side === 'front') {
			mappableFront.value = Array.from({length:20}, (_, index) => {
				const key = `item${index + 1}` as keyof typeof printData
				return printData[key].toString()
			}).filter(item => !!item && filteredMappable.find(m => m.text === item))
			csvSmartMapping('front')
		} else {
			mappableBack.value = Array.from({length:20}, (_, index) => {
				const key = `item${index + 1}` as keyof typeof printData
				return printData[key].toString()
			}).filter(item => !!item && filteredMappable.find(m => m.text === item))
			csvSmartMapping('back')
		}
	}
}

const generateMappingRules = (side: 'front' | 'back') => {
	if(props.mode !== 'csv') return ''
	let validation = false
		if (side === 'front') {
		validation = frontCsvColumns.value.split(',').length !== mappableFront.value.length
	} else {
		validation = backCsvColumns.value.split(',').length !== mappableBack.value.length
	}
	return validation ?
		'CSVから抽出する列が一致しません' : ''
}

const csvSmartMapping = (side: 'front' | 'back') => {
	if(props.mode !== 'csv') return
	
	// Get the mappable fields for the selected side
	const mappableFields = side === 'front' ? mappableFront.value : mappableBack.value
	if (!mappableFields.length) return
	
	// Get headers from the parsed CSV
	const headers = csvData.value.headers
	if (!headers.length) return
	
	// Create a mapping based on similarity
	const columnMapping: string[] = []
	// For each mappable field, find the best matching header
	mappableFields.forEach(field => {
		// First try exact match (case insensitive)
		const exactMatch = headers.findIndex(h => 
			h.toLowerCase() === field.toLowerCase()
		)
		
		if (exactMatch >= 0) {
			// Use column letter for simplicity
			columnMapping.push(field)
			return
		}
		
		// Try partial match (contains)
		const partialMatches = headers.map((h, index) => ({
			index,
			header: h,
			similarity: calculateSimilarity(h, field)
		})).sort((a, b) => b.similarity - a.similarity)
		
		if (partialMatches.length && partialMatches[0].similarity > 0.3) {
			// Use column letter for the best partial match
			columnMapping.push(String.fromCharCode(65 + partialMatches[0].index))
			return
		}
		
		// If no good match, use sequential columns instead of all A
		columnMapping.push(String.fromCharCode(65 + columnMapping.length % headers.length))
	})
	
	// Update the appropriate column input
	if (side === 'front') {
		frontCsvColumns.value = columnMapping.join(',')
		handleMappingFieldChange('front')
	} else {
		backCsvColumns.value = columnMapping.join(',')
		handleMappingFieldChange('back')
	}
}

// Helper function to calculate string similarity (Levenshtein distance based)
const calculateSimilarity = (str1: string, str2: string): number => {
	const s1 = str1.toLowerCase()
	const s2 = str2.toLowerCase()
	
	// Check if one contains the other
	if (s1.includes(s2) || s2.includes(s1)) {
		return 0.8
	}
	
	// Check for word matches
	const words1 = s1.split(/\s+/)
	const words2 = s2.split(/\s+/)
	
	for (const word1 of words1) {
		if (word1.length > 2) { // Only consider words with more than 2 chars
			for (const word2 of words2) {
				if (word2.length > 2 && (word1.includes(word2) || word2.includes(word1))) {
					return 0.6
				}
			}
		}
	}
	
	// Calculate Levenshtein distance for more complex similarity
	const maxLen = Math.max(s1.length, s2.length)
	if (maxLen === 0) return 1.0
	
	// Simple character-based similarity
	let matches = 0
	const minLen = Math.min(s1.length, s2.length)
	
	for (let i = 0; i < minLen; i++) {
		if (s1[i] === s2[i]) matches++
	}
	
	return matches / maxLen
}

function base64ToBlob(base64: string, type = 'application/pdf') {
  const base64String = base64.split(',')[1] || base64
  const byteCharacters = atob(base64String)
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type })
}

const resetCsvUi = (...sides: ('front' | 'back')[]) => {
	if(props.mode !== 'csv') return
	
	// If no sides specified, reset all
	if (sides.length === 0) {
		frontCsvColumns.value = ''
		backCsvColumns.value = ''
		mappableFront.value = []
		mappableBack.value = []
		customerCsvData.value.forEach(ccData => {
			ccData.csv.front = {}
			ccData.csv.back = {}
		})
		return
	}
	
	// Otherwise reset only specified sides
	if (sides.includes('front')) {
		frontCsvColumns.value = ''
		mappableFront.value = []
		customerCsvData.value.forEach(ccData => {
			ccData.csv.front = {}
		})
	}
	
	if (sides.includes('back')) {
		backCsvColumns.value = ''
		mappableBack.value = []
		customerCsvData.value.forEach(ccData => {
			ccData.csv.back = {}
		})
	}
}

const initScript = () => {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
      integrity: ''
    },
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

const handleToggleBackground = (side: 'all' | 'front' | 'back') => {
	hasBackground.value[side] = hasBackground.value[side] ? 0 : 1
}

const handleMappingFieldChange = (side: 'front' | 'back') => {
	if (props.mode !== 'csv') return
	if(!!generateMappingRules(side)) return
	exportIsDirty.value = true
	
	// Get headers and data rows from the parsed CSV
	const headers = csvData.value.headers.map(h => h.trim().toLowerCase())
	const dataRows = csvData.value.data
	
	// Get selected columns - handle various formats and make case insensitive
	const selectedColumns = (side === 'front' ? frontCsvColumns.value : backCsvColumns.value)
		.split(',')
		.map(col => col.trim().toLowerCase())
	
	// Get mappable fields
	const mappableFields = side === 'front' ? mappableFront.value : mappableBack.value
	
	// Skip if column count doesn't match mappable fields
	if (selectedColumns.length !== mappableFields.length) return
	
	// Map CSV data to fields
	const mappedData = dataRows.map(row => {
		const result: Record<string, any> = {}
		
		selectedColumns.forEach((colName, index) => {
			// Check if this is a combined column request (with spaces)
			if (colName.includes(' ')) {
				// Split by space
				const colParts = colName.split(' ').filter(p => p.trim())
				
				// Find indices for all parts
				const colIndices = colParts.map(part => {
					// Check if part is a number (index)
					if (/^\d+$/.test(part)) {
						return parseInt(part) - 1; // Convert to 0-based index
					}
					// Check if part is a letter (A-Z)
					else if (/^[a-z]$/i.test(part)) {
						return part.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
					}
					// Otherwise treat as column name
					else {
						return headers.findIndex(h => h === part);
					}
				})
				
				// If all parts are found, combine their values
				if (colIndices.every(idx => idx >= 0 && idx < headers.length)) {
					const combinedValue = colIndices.map(idx => {
						const headerName = headers[idx]
						return row[headerName] || ''
					}).join(' ')
					result[mappableFields[index]] = combinedValue
				}
			} else {
				// Regular single column
				let colIndex = -1;
				
				// Check if colName is a number (index)
				if (/^\d+$/.test(colName)) {
					colIndex = parseInt(colName) - 1; // Convert to 0-based index
				}
				// Check if colName is a letter (A-Z)
				else if (/^[a-z]$/i.test(colName)) {
					colIndex = colName.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
				}
				// Otherwise treat as column name
				else {
					colIndex = headers.findIndex(h => h === colName);
				}
				
				if (colIndex >= 0 && colIndex < headers.length) {
					const headerName = headers[colIndex]
					result[mappableFields[index]] = row[headerName] || ''
				}
			}
		})
		
		return result
	})
	
	// Ensure customerCsvData has enough entries for all mapped data
	while (customerCsvData.value.length < mappedData.length) {
		customerCsvData.value.push({csv: { front: {}, back: {} }})
	}
	
	// Update customerCsvData - one mapped data per customer
	mappedData.forEach((data, index) => {
		if (side === 'front') {
			customerCsvData.value[index].csv.front = data
		} else {
			customerCsvData.value[index].csv.back = data
		}
	})
}

const handleUploaderClick = () => {
	document.getElementById('csvuploader')?.click()
}

const handleCsvFileUpload = async (event: any) => {
	const limit = 500
	const file = event.target.files[0]
	if (!file) return
	uploadedFile.value = file
	// @ts-ignore - inject Papaparse library
	Papa?.parse(file, {
		header: true,
		worker: true,
		complete: function (results: any) {
			const csvRows = results.data
			if (csvRows.length > limit) {
				mtUtils.autoCloseAlert(
					`CSVに${limit}行以上のデータが登録されています。\n${limit}件未満で利用してください。`
				)
				return
			} else {
				csvRowCount.value = csvRows.length
				
				// Store the parsed data and headers
				csvData.value = {
					data: results.data,
					headers: results.meta.fields || []
				}
				
				// Reset and re-apply mappings if templates are selected
				if (data.value.front_side_id_print) {
					csvSmartMapping('front')
				}
				if (data.value.back_side_id_print) {
					csvSmartMapping('back')
				}
			}
		}
	})
}

onMounted(async () => {
	await printStore.fetchPrints()
	if(props.mode === 'csv') {
		initScript()
	}
})

</script>

<template>
  <q-form @submit="generate">
	<MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        (調整中)DMハガキの選択
      </q-toolbar-title>
    </MtModalHeader>
	<q-card-section class="q-pa-none">
		<div class="column full-width q-px-lg q-py-md" style="row-gap: 10px;">
			<div class="row items-end" style="column-gap: 10px;" v-if="mode === 'csv'">
				<div class="col-auto">
					<input
						type="file"
					id="csvuploader"
					accept=".csv"
					@change="handleCsvFileUpload"
					style="display: none"
				/>
					<q-btn class="bg-grey-300 text-grey-800" @click="handleUploaderClick" flat :disable="isLoading" >
						<q-icon class="q-pr-sm" size="sm" name="upload_file" />CSV を選択
					</q-btn>
				</div>
				<span class="text-grey-800 text-caption" v-if="uploadedFile">
				{{ `${uploadedFile.name} (${csvRowCount}行)` }}
				</span>	
			</div>
			<small style="color: #cc0000;" 
				v-if="!data.front_side_id_print && !data.back_side_id_print && exportIsDirty"
			>
				(表面または裏面を選択してください)
			</small>
			<div class="row" style="column-gap: 10px;">
				<div class="column col">
					<MtFormPullDown
						v-model:options="front_print_templates"
						v-model:selected="data.front_side_id_print"
						@update:selected="getMappableAttributes('front', data.front_side_id_print)"
						label="表面"
						outlined
						:disable="isLoading"
					/>
				</div>
				<div class="column col">
					<MtFormPullDown
						v-model:options="back_print_templates"
						v-model:selected="data.back_side_id_print"
						@update:selected="getMappableAttributes('back', data.back_side_id_print)"
						label="裏面"
						outlined
						:disable="isLoading"
					/>
				</div>
			</div>
			<template v-if="mode === 'csv'">
				<span>CSVからデータを一致させる</span>
				<div class="column" v-if="data.front_side_id_print">
					<span style="font-size: 12px;">表面: {{ mappableFrontText }}</span>
					<template v-if="isFrontMappable">
						<MtInputForm
							type="text"
							v-model="frontCsvColumns"
							label="CSVから抽出する列"
							class="col-12"
							placeholder="カンマ区切りで入力: A, B, C"
							@update:model-value="() => handleMappingFieldChange('front')"
							:disable="isLoading"
						/>
						<small style="color: #cc0000; font-size: 10px;" 
							v-if="frontMappingValidation"
						>
							{{ frontMappingValidation }}
						</small>
					</template>
				</div>
				<div class="column" v-if="data.back_side_id_print">
					<span style="font-size: 12px;">裏面: {{ mappableBackText }}</span>
					<template v-if="isBackMappable">
						<MtInputForm
							type="text"
							v-model="backCsvColumns"
							label="CSVから抽出する列"
							class="col-12"
							placeholder="カンマ区切りで入力: A, B, C"
							@update:model-value="() => handleMappingFieldChange('back')"
							:disable="isLoading"
						/>
						<small style="color: #cc0000; font-size: 10px;" 
							v-if="backMappingValidation"
						>
							{{ backMappingValidation }}
						</small>
					</template>
				</div>
			</template>
			<div class="row items-center" style="row-gap: 10px;">
				<MtFormCheckBox label="背景を含める" :checked="!!hasBackground.all" @update:checked="() => handleToggleBackground('all')" :disable="isLoading"/>
			</div>
		</div>
	</q-card-section>
	<q-card-section class="q-bt bg-white" >
		<div class="text-center modal-btn">
			<q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
				<span>キャンセル</span>
			</q-btn>
			<q-btn unelevated color="primary" type="submit" class="q-ml-md" :disable="!canExport" :loading="isLoading" >
				<span>生成する</span>
			</q-btn>
		</div>
	</q-card-section>
  </q-form>
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
