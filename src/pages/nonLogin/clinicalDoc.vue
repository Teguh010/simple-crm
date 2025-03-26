<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Screen } from 'quasar'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useNlClinicalFilesStore from "@/stores/nl-clinical-files"
import mtUtils from '@/utils/mtUtils'
import UploadNlClinicalFileModal from './UploadNlClinicalFileModal.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import usePetStore from "@/stores/pets"
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'


const nlClinicalFilesStore = useNlClinicalFilesStore()
const currentnlClinicalFileUploader = ref({})
const illnessHistoryStore = useIllnessHistoryStore()
const petStore = usePetStore()
const childModelClosedInt = ref(0)
const token = ref(null)
const is_valid_token = ref(false)
const error = ref("")
const id_clinic = ref("")
const mobileView = ref(false)
const pcView = ref(false)
const all_new_files = ref([])


const columns = [
	{
		name: '#',
		label: '#',
		field: "_",
		align: 'left',
		style: 'width: 10%'
	},
	{
		name: 'file_name',
		label: 'ファイル',
		field: 'file_name',
		align: 'left',
		style: 'width:10%'
	},
	{
		name: 'size',
		label: 'サイズ',
		field: 'size',
		align: 'left',
		style: 'width: 10%'
	},
	{
		name: 'タイプ_1',
		label: 'タイプ_1',
		field: 'type_1',
		align: 'left',
		style: 'width: 10%'
	},
	{
		name: 'タイプ_2',
		label: 'タイプ_2',
		field: 'type_2',
		align: 'left',
		style: 'width: 10%'
	},

	{
		name: 'タイプ_3',
		label: 'タイプ_3',
		field: 'type_3',
		align: 'left',
		style: 'width: 10%'
	},
	{
		name: 'アクション',
		label: ' ',
		field: 'action',
		align: 'left',
		style: 'width: 20%'
	},
]

const mobileColumns = [
	{
		name: '#',
		label: '#',
		field: "_",
		align: 'left',
		style: 'width: 10%'
	},
	{
		name: 'file_name',
		label: 'ファイル',
		field: 'file_name',
		align: 'left',
		style: 'width:10%'
	},
	{
		name: 'アクション',
		label: ' ',
		field: 'action',
		align: 'left',
		style: 'width: 20%'
	},
]

const rows = computed(() => {
	childModelClosedInt.value
	return nlClinicalFilesStore.getAllNlClinicalFiles.map((nlClinicalFile) => {
		return nlClinicalFile.data
	})
})

const all_new_files_rows = computed(() => {
	childModelClosedInt.value
	return all_new_files.value.map((nlClinicalFile) => {
		return nlClinicalFile
	})
})

async function tokenIsValid() {
	const res = await nlClinicalFilesStore.checkNlClinicalFileUploaderToken(token.value)
	if (Boolean(res.data.error)) {
		error.value = 'このアップロードリンクは有効期限切れです。<br /> 追加で画像のアップロードが必要な場合は、<br /> 病院に新しいリンクの発行をご依頼ください。'
		is_valid_token.value = false
	} else {
		currentnlClinicalFileUploader.value = res.data.data
		is_valid_token.value = true
	}
}

function childModelClosed(data: any) {
	childModelClosedInt.value += 1
	if (!Boolean(data)) {
		return
	} else {
		all_new_files.value.push(data)
	}
}

async function uploadFile() {
	if (all_new_files.value.length >= 10) {
		mtUtils.alert("添付は最大10点までです。", "送信できません")
		return
	}
	if (Screen.name == 'xs' || true) {
		await mtUtils.smallPopup(UploadNlClinicalFileModal, { data: currentnlClinicalFileUploader.value, onModelClosed: childModelClosed })
	} else {
		await mtUtils.mediumPopup(UploadNlClinicalFileModal, { data: data, onModelClosed: childModelClosed })
	}
}

async function deletnlClinicalFile(nlClinicalFile: any) {
	const updatedList = all_new_files_rows.value.filter(
		(item) => item.name_file !== nlClinicalFile.name_file
	);
	all_new_files.value = updatedList
	childModelClosedInt.value += 1
	mtUtils.autoCloseAlert(aahMessages.success)
}

async function completeAction() {
	let menuOptions = [
		{
			title: '添付ファイルを送信しますか ？',
			name: 'complete',
			isChanged: false,
			attr: {
				class: null,
				clickable: true
			}
		}
	]
	await mtUtils.littlePopup(OptionModal, { options: menuOptions })

	let selectedOption = menuOptions.find((i) => i.isChanged == true)

	if (selectedOption) {
		if (selectedOption.name == 'complete') {
		  await Promise.all(all_new_files.value.map((file: File) => nlClinicalFilesStore.submitNlClinicalFile(currentnlClinicalFileUploader.value.token, file)))
		    .then(async () => {
			  const res = await nlClinicalFilesStore.destroyNlClinicalFileUploader(currentnlClinicalFileUploader.value.id_clinic_files_uploder_url, currentnlClinicalFileUploader.value.token)
			  if (res.status == 200) {
				is_valid_token.value = false
				error.value = "関連資料をアップロードしました。"
		      } else {
				mtUtils.autoCloseAlert(aahMessages.failed)
			  }  		
			})
			.catch(() => {
			  mtUtils.autoCloseAlert(aahMessages.failed)
			})
		}
	}
}

function decodeBase64ToString(encodedStr: any) {
	return atob(encodedStr);
}

onMounted(async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const tokenParam = urlParams.get('token');
	const id_clinic_ = urlParams.get('cli');
	token.value = tokenParam
	id_clinic.value = decodeBase64ToString(id_clinic_)
	await tokenIsValid()
	try {
		await illnessHistoryStore.fetchIllnessHistorys({
			id_pet: currentnlClinicalFileUploader.value.id_pet,
			id_customer: currentnlClinicalFileUploader.value.id_customer
		})
	} catch (error) {
	}
	try {
		await petStore.fetchPetByCustomer(currentnlClinicalFileUploader.value.id_pet, currentnlClinicalFileUploader.value.id_customer)
	} catch (error) {
	}

	if (Screen.name == 'xs' || Screen.name == 'sm' || Screen.name == 'md' || true) {
		mobileView.value = true
		pcView.value = false
	} else {
		mobileView.value = false
		pcView.value = true
	}
})

</script>

<template>
	<MtHeader>
		<q-toolbar class="text-primary q-pa-none">
			<q-toolbar-title class="title2 bold text-grey-900">
				資料アップロード
			</q-toolbar-title>
		</q-toolbar>
	</MtHeader>
	<div class="row justify-center items-center q-mt-xl q-pt-xl">
		<div class="col-sm-10 col-lg-10 justify-center items-center q-pa-xl shadow-5" v-if="is_valid_token && pcView">
			<div class="col-sm-6">
				<MtTable2 :columns="columns" :rows="rows" :show-filter="false" row-key="name" :rowsBg="true" flat
					style="height: 35rem;overflow:auto">
					<template v-slot:row="{ row, index }">
						<td class="cursor-pointer" v-for="(col, colIndex) in columns" :key="colIndex">
							<div v-if="col.field == '_'" auto-width key="_">
								<div class="body1 regular text-grey-900">
									{{ index + 1 }}
								</div>
							</div>
							<div v-if="col.field == 'file_name'" auto-width key="file_name">
								<div class="body1 regular text-grey-900">
									{{ row["name_file"] }}
								</div>
							</div>
							<div v-if="col.field == 'size'" auto-width key="size">
								<div class="body1 regular text-grey-900">
									{{ dIndex }}
								</div>
							</div>
							<div v-if="col.field == 'type_1'" auto-width key="type_1">
								<div class="body1 regular text-grey-900">
									{{ row['type_file'] == 1 ? "Yes" : "No" }}
								</div>
							</div>
							<div v-if="col.field == 'type_2'" auto-width key="type_2">
								<div class="body1 regular text-grey-900">
									{{ row['type_file'] == 2 ? "Yes" : "No" }}
								</div>
							</div>
							<div v-if="col.field == 'type_3'" auto-width key="type_3">
								<div class="body1 regular text-grey-900">
									{{ row['type_file'] == 32 ? "Yes" : "No" }}
								</div>
							</div>
							<div v-if="col.field == 'action'" auto-width key="action">
								<q-btn color="danger" @click="deletnlClinicalFile(row)">
									<q-icon name="delete" />
									<span>削除</span>
								</q-btn>
							</div>

						</td>
					</template>
				</MtTable2>
			</div>
			<div class="row q-mt-lg text-center justify-center">
				<div class="col-4">
					<q-btn unelevated padding="6px 14px" color="white" text-color="black" @click="uploadFile"
						class="import-file-btn">
						<q-icon size="24px" name="add" class="q-mr-xs" />
					</q-btn>
				</div>
				<div class="col-4">
					<q-btn unelevated padding="6px 14px" color="primary" text-color="white" @click="completeAction"
						class="submit-btn">
						<q-icon size="24px" name="check" class="q-mr-xs" />送信する
					</q-btn>
				</div>
			</div>
		</div>

		<div class="col-sm-10 col-lg-4 justify-center items-center shadow-5 tableContainerParent" v-if="is_valid_token && mobileView">
			<div class="col-sm-4 tableContainer">
				<MtTable2 :columns="mobileColumns" :rows="all_new_files_rows" :show-filter="false" row-key="name" :rowsBg="true"
					flat style="height: 35rem;overflow:auto">
					<template v-slot:row="{ row, index }">
						<td class="cursor-pointer" v-for="(col, colIndex) in mobileColumns" :key="colIndex">
							<div v-if="col.field == '_'" auto-width key="_">
								<div class="body1 regular text-grey-900">
									{{ index + 1 }}
								</div>
							</div>
							<div v-if="col.field == 'file_name'" auto-width key="file_name">
								<div class="body1 regular text-grey-900">
									{{ row["name_file"] }}
								</div>
							</div>
							<div v-if="col.field == 'action'" auto-width key="action">
								<q-btn color="danger" @click="deletnlClinicalFile(row)">
									<q-icon name="delete" />
								</q-btn>
							</div>

						</td>
					</template>
				</MtTable2>
			</div>
			<div class="q-mt-lg text-center justify-center btnContainer">
				<div class="">
					<q-btn unelevated padding="6px 14px" color="white" text-color="black" @click="uploadFile"
						class="import-file-btn">
						<q-icon size="24px" name="add" class="q-mr-xs" />
					</q-btn>
				</div>
				<div class="q-mt-sm">
					<q-btn unelevated padding="6px 14px" color="primary" text-color="white" @click="completeAction"
						class="submit-btn">
						<q-icon size="24px" name="check" class="q-mr-xs" />送信する
					</q-btn>
				</div>
			</div>

		</div>


		<div class="col-sm-6 col-lg-6 justify-center items-center q-pa-xl shadow-5 error bg-accent-050"
			v-if="!is_valid_token">
			<div class="row q-mt-lg text-center justify-center">
				<div class="col-10">
					<p id="error-text" v-html="error" />
				</div>
			</div>
		</div>

	</div>
</template>

<style lang="scss" scoped>
.import-file-btn {
	width: 90%;
	border: 1px solid black;
}

.submit-btn {
	width: 90%;
}

.error {
	margin-top: 10rem
}

#error-text {
	color: #424242;
	font-weight: bold;
	font-size: 1.5rem;
	font-family: monospace;
}

.tableContainerParent{
	width: 85%;
	padding-top: 1rem;
	padding-bottom: 1rem;
}

.tableContainer{
	width: 90%;
	margin: 0 auto;
}
.btnContainer{
	width: 80%;
    margin: 0 auto;
}

//media query when screen is medium or large
@media screen and (min-width: 768px) {
    .btnContainer{
        width: 30%;
        margin: 0 auto;
    }
}

</style>
