<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
// Stores
import useFoodPrepStore from '@/stores/food-prep'
import useItemStore from '@/stores/items'
// Components
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import UploadFile from '@/components/UploadFile.vue'
// Utils
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { typeFoodPrep } from '@/utils/enum'

type FoodPrepDataType = {
  code_food_prep: null | string
  datetime_insert: string
  datetime_update: string
  display_order: null | number
  file_path1: undefined | string | Blob
  file_path2: undefined | string | Blob
  file_path3: undefined | string | Blob
  flg_delete: boolean
  id_clinic: number
  id_employee_insert: number
  id_employee_update: number
  id_food_prep: number
  id_item_service1: undefined | number | string
  id_item_service2: undefined | number | string
  id_item_service3: undefined | number | string
  memo_feeding: null | string
  memo_food_prep: null | string
  name_food_prep: null | string
  type_food_prep: undefined | number
}

type FileStatusEnum = 'changed' | 'unchanged' | 'removed'

type FoodPrepFormDataType = Partial<
  Pick<
    FoodPrepDataType,
    | 'code_food_prep'
    | 'display_order'
    | 'file_path1'
    | 'file_path2'
    | 'file_path3'
    | 'id_clinic'
    | 'id_item_service1'
    | 'id_item_service2'
    | 'id_item_service3'
    | 'memo_food_prep'
    | 'memo_feeding'
    | 'name_food_prep'
    | 'type_food_prep'
  >
>

const foodPrepStore = useFoodPrepStore()
const emits = defineEmits(['close'])
const props = defineProps<{
  data?: FoodPrepDataType
}>()

const isEdit = ref(false)

const itemServiceStore = useItemStore()
const f1_status = ref<FileStatusEnum>('unchanged')
const f2_status = ref<FileStatusEnum>('unchanged')
const f3_status = ref<FileStatusEnum>('unchanged')
const foodPreparation = ref<any>([])
const foodPreparationDefault = reactive<any>([])
const serviceItemsList = ref<any>([])
const serviceItemsListDefault = reactive<any>([])
const foodPrepFormData = ref<FoodPrepFormDataType>({
  code_food_prep: null,
  display_order: null,
  file_path1: undefined,
  file_path2: undefined,
  file_path3: undefined,
  id_item_service1: '',
  id_item_service2: '',
  id_item_service3: '',
  memo_food_prep: null,
  memo_feeding: null,
  name_food_prep: null,
  type_food_prep: undefined
})

const fileUploadKeys = ref({
  file1_key: 0,
  file2_key: 0,
  file3_key: 0
})

const closeModal = () => {
  emits('close')
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
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
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            foodPrepStore
              .destroyFoodPrep(props.data?.id_food_prep as number)
              .then(() => {
                foodPrepStore.fetchFoodPreps()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

// ========= 1. Form Module =========
// Function to add optional fields for services and display order
const addOptionalFields = (formDataPayload: FormData) => {
  formDataPayload.append(
    'id_item_service1',
    foodPrepFormData.value.id_item_service1 as string
  )
  formDataPayload.append(
    'id_item_service2',
    foodPrepFormData.value.id_item_service2 as string
  )
  formDataPayload.append(
    'id_item_service3',
    foodPrepFormData.value.id_item_service3 as string
  )
  formDataPayload.append(
    'display_order',
    foodPrepFormData.value.display_order?.toString() as string
  )
}
const onFileUploaded = (file: File) => {
  foodPrepFormData.value.file_path3 = file
  f3_status.value = 'changed'
}

// ========= 1.a Create Form Module =========
// Handle file attachments for new records
const handleFileAttachments = (
  formDataPayload: FormData,
  filePathKey: 'file_path1' | 'file_path2' | 'file_path3'
) => {
  if (foodPrepFormData.value[filePathKey]) {
    formDataPayload.append(filePathKey, foodPrepFormData.value[filePathKey])
  }
}
// API request for create new records
const createFoodPrep = async (formDataPayload: FormData) => {
  await foodPrepStore.submitFoodPrep(formDataPayload)
}
// ========= 1.b Update Form Module =========
// Handle files for updating, checking if they were changed or removed
function handleFileStatuses(
  formDataPayload: FormData,
  status: FileStatusEnum,
  filePathKey: 'file_path1' | 'file_path2' | 'file_path3'
) {
  if (status === 'changed') {
    formDataPayload.append(
      filePathKey,
      foodPrepFormData.value[filePathKey] as Blob
    )
  } else if (status === 'removed') {
    formDataPayload.append(filePathKey, 'null')
  }
}
// API request for update records
async function updateFoodPrep(formDataPayload: FormData) {
  if (props.data && props.data.id_food_prep) {
    await foodPrepStore.updateFoodPrep(props.data.id_food_prep, formDataPayload)
  }
}

const buildPayload = () => {
  const formDataPayload = new FormData()

  if (isEdit) {
    addOptionalFields(formDataPayload)
    handleFileStatuses(formDataPayload, f1_status.value, 'file_path1')
    handleFileStatuses(formDataPayload, f2_status.value, 'file_path2')
    handleFileStatuses(formDataPayload, f3_status.value, 'file_path3')
    formDataPayload.append(
      'code_food_prep',
      foodPrepFormData.value.code_food_prep as string
    )
  } else {
    addOptionalFields(formDataPayload)
    handleFileAttachments(formDataPayload, 'file_path1')
    handleFileAttachments(formDataPayload, 'file_path2')
    handleFileAttachments(formDataPayload, 'file_path3')
  }

  formDataPayload.append(
    'name_food_prep',
    foodPrepFormData.value.name_food_prep as string
  )
  formDataPayload.append(
    'type_food_prep',
    foodPrepFormData.value.type_food_prep?.toString() as string
  )
  formDataPayload.append(
    'memo_food_prep',
    foodPrepFormData.value.memo_food_prep as string
  )
  formDataPayload.append(
    'memo_feeding',
    foodPrepFormData.value.memo_feeding as string
  )
  if (foodPrepFormData.value.id_clinic)
    formDataPayload.append(
      'id_clinic',
      foodPrepFormData.value.id_clinic.toString()
    )

  return formDataPayload
}
const submit = async () => {
  const formDataPayload = buildPayload()

  if (props.data?.id_food_prep) {
    await updateFoodPrep(formDataPayload)
  } else {
    await createFoodPrep(formDataPayload)
  }

  emits('close')
  mtUtils.autoCloseAlert(aahMessages.success)
}
const updateFileUploadKeys = () => {
  for (const key in fileUploadKeys.value) {
    ++fileUploadKeys.value[key as keyof typeof fileUploadKeys.value]
  }
}
onMounted(async () => {
  foodPreparation.value.length = 0
  foodPreparationDefault.length = 0
  foodPreparation.value = [...typeFoodPrep]
  foodPreparationDefault.push(...typeFoodPrep)
  serviceItemsList.value.length = 0
  serviceItemsListDefault.length = 0

  const listIS = itemServiceStore.getAllServiceItems?.filter(
    (itemService: { flg_service: boolean; type_item: number }) => {
      console.log('itemService:', itemService)
      return !itemService.flg_service && itemService.type_item === 2
    }
  )
  serviceItemsList.value = [...listIS]
  serviceItemsListDefault.push(...serviceItemsList.value)

  if (props.data?.code_food_prep) {
    // Update case
    isEdit.value = true
    foodPrepFormData.value = {
      ...props.data,
      id_item_service1:
        props.data.id_item_service1 === null ? '' : props.data.id_item_service1,
      id_item_service2:
        props.data.id_item_service2 === null ? '' : props.data.id_item_service2,
      id_item_service3:
        props.data.id_item_service3 === null ? '' : props.data.id_item_service3
    }
    updateFileUploadKeys()
  } else {
    // Create case
    isEdit.value = false
    foodPrepFormData.value = foodPrepFormData.value
    const idClinic = localStorage.getItem('id_clinic')
    foodPrepFormData.value.id_clinic = idClinic ? JSON.parse(idClinic) : null
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        フード準備マスタ
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div
          v-if="foodPrepFormData.code_food_prep"
          class="col-lg-4 col-md-4 col-sm-12"
        >
          <MtInputForm
            type="text"
            v-model="foodPrepFormData.code_food_prep"
            label="フード準備CD *"
            class="bg-grey-100"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            v-model="foodPrepFormData.name_food_prep"
            label="フード名*"
            type="text"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFilterSelect
            v-model:selecting="foodPrepFormData.type_food_prep"
            :options-default="foodPreparationDefault"
            :options="foodPreparation"
            label="フード準備区分 *"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-2 col-md-3 col-sm-4">
          <div class="text-center body1 regular text-grey-700 q-mb-sm">
            フード画像1 *
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="foodPrepFormData.file_path1 as string"
            @fileUploaded="(file: File) => { foodPrepFormData.file_path1 = file; f1_status = 'changed'} "
            @fileRemoved="
              () => {
                foodPrepFormData.file_path1 = undefined
                f1_status = 'removed'
              }
            "
            :key="fileUploadKeys.file1_key"
            :rules="[aahValidations.validationRequired]"
          />
          <MtFilterSelect
            class="q-mt-md"
            v-model:selecting="foodPrepFormData.id_item_service1"
            :options-default="serviceItemsListDefault"
            :options="serviceItemsList"
            label="優先使用フード1"
          />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-4">
          <div class="text-center body1 regular text-grey-700 q-mb-sm">
            フード画像2
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="foodPrepFormData.file_path2"
            @fileUploaded="(file: File) => { foodPrepFormData.file_path2 = file; f2_status = 'changed'} "
            @fileRemoved="
              () => {
                foodPrepFormData.file_path2 = undefined
                f2_status = 'removed'
              }
            "
            :key="fileUploadKeys.file2_key"
          />
          <MtFilterSelect
            v-model:selecting="foodPrepFormData.id_item_service2"
            class="q-mt-md"
            label="優先使用フード2"
            :options-default="serviceItemsListDefault"
            :options="serviceItemsList"
          />
        </div>
        <div class="col-lg-2 col-md-3 col-sm-4">
          <div class="text-center body1 regular text-grey-700 q-mb-sm">
            フード画像3
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="foodPrepFormData.file_path3"
            @fileUploaded="(file: File) => { foodPrepFormData.file_path3 = file; f3_status = 'changed' }"
            @fileRemoved="
              () => {
                foodPrepFormData.file_path3 = undefined
                f3_status = 'removed'
              }
            "
            :key="fileUploadKeys.file3_key"
          />
          <MtFilterSelect
            v-model:selecting="foodPrepFormData.id_item_service3"
            class="q-mt-md"
            label="優先使用フード3"
            :options-default="serviceItemsListDefault"
            :options="serviceItemsList"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="foodPrepFormData.memo_food_prep"
            label="準備方法・フード選択方法"
            autogrow
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="foodPrepFormData.memo_feeding"
            label="給餌方法"
            autogrow
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="text"
            v-model="foodPrepFormData.display_order"
            label="表示順序（0~999; 小を上位表示）"
            :rules="[aahValidations.validationNumber]"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
