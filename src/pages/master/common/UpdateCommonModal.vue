<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore, isDateOutOfToday } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import selectOptions from '@/utils/selectOptions'
import { useRouter } from 'vue-router'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import useCommonStore from '@/stores/common'
import aahValidations from '@/utils/aahValidations'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelectOptionAndIcon from '@/components/MtFilterSelectOptionAndIcon.vue'
import { codeCommonList, typeUnitBit } from '@/utils/enum'
import { colorPaletteList } from '@/utils/color-palette'
import useIdexxStore from '@/stores/idexx'
import { IDEXX_BREED_LIST } from '@/utils/const/constIdexxBreed'
import MtFilterSelect from '@/components/MtFilterSelect.vue'

const CODE_COMMON_TO_APPLY = [1, 10, 11, 17, 18, 19, 20, 21, 22, 23, 24, 25]
const commonStore = useCommonStore()
const idexxStore = useIdexxStore()

const emits = defineEmits(['close'])
const router = useRouter()
const props = defineProps({ commonObj: Object, code_common: Object })
const commonFormCheckBox = ref([])
const commonForm = reactive({
  id_common: null,
  date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_common: props.code_common,
  name_common: '',
  // code_func1: {
  //   default: null,
  //   type: String | Number
  // },
  code_func1: '',
  code_func2: '',
  flg_func1: false,
  flg_func2: false,
  flg_etc1: false,
  flg_etc2: false,
  flg_etc3: false,
  memo_etc1: '',
  memo_etc2: '',
  memo_etc3: '',
  comment: '',
  text1: '',
  text2: '',
  code_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  display_order: 9999
})
const isEdit = ref(false)
const vetShowOptions = ref([
  {
    value: 1,
    label: 'My Vetty 本日の勤務医表示'
  },
  {
    value: 2,
    label: 'My Vetty 本日の勤務医非表示'
  }
])
const ivetBreedList = ref([])
const ivetBreedListDefault = reactive([])

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        await commonStore.destroyCommon(commonForm.id_common)
        emits('close')
        await mtUtils.autoCloseAlert(aahMessages.success)
      }
    }
  }
}

async function checkedFlg(event: any, checkbox: any) {
  if (event) {
    commonForm.code_func1 =
      parseInt(commonForm.code_func1) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(commonForm.code_func1, checkbox.value)) {
    commonForm.code_func1 =
      parseInt(commonForm.code_func1) - parseInt(checkbox.value)
  }
}

function assignPageData(newData: any) {
  if (newData?.id_common) {
    for (let key in commonForm) {
      commonForm[key] = newData[key]
    }
  }
}

const closeModal = () => {
  emits('close')
}
const model = ref('')
async function save() {
  if (commonForm.code_common == '11' && commonForm.flg_etc1 == false) {
    await mtUtils.autoCloseAlert(
      '予備1 は「治療サービス区分」の場合にチェックする必要があります。'
    )
    return
  } else if (
    commonForm.code_common == '11' &&
    commonForm.flg_etc1 == true &&
    commonForm.memo_etc1.length > 1
  ) {
    await mtUtils.autoCloseAlert('1文字のみで入力してください。')
    return
  }

  if (commonForm.flg_func2) {
    commonForm.date_end = formatDate(new Date(9999, 11, 31))
  }

  if (!commonForm.flg_func2) {
    commonForm.date_end = getDaysBefore(1)
  }

  // create case
  if (isEdit.value) {
    const res = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `mst/common/${commonForm.id_common}`,
      { ...commonForm }
    )
    if (res) {
      emits('close')
      await mtUtils.autoCloseAlert(aahMessages.success)
    }

    return
  }
  const res = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'mst/common',
    { ...commonForm }
  )
  if (res) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    emits('close')
  }
}

function isBitSet(number: any, bitValue: any) {
  return (number & bitValue) === bitValue
}

const colorPalettes = computed(() => {
  return colorPaletteList
})

const getIdexxBreedList = async () => {
  if (commonForm.code_func1) {
    commonForm.flg_func1 = true
    commonForm.flg_func2 = true
    if (
      !idexxStore.getIdexxBreedList ||
      idexxStore.getIdexxBreedList?.length == 0
    )
      await idexxStore.fetchIdexxBreedList()
    const selectedCommon = IDEXX_BREED_LIST.find(
      (i) => i.code_func1 == commonForm.code_func1
    )?.idexx_value
    let filteredIdexxBreedList = idexxStore.getIdexxBreedList?.list?.filter(
      (v) => v.speciesCode == selectedCommon
    )

    if (filteredIdexxBreedList.length == 0)
      filteredIdexxBreedList = idexxStore.getIdexxBreedList?.list?.filter(
        (v) => v.speciesCode == 'OTHER'
      )

    ivetBreedList.value = filteredIdexxBreedList?.map((v) => ({
      label: v.name + ' / ' + v.code,
      value: v.code
    }))
    ivetBreedListDefault.push(...ivetBreedList.value)
  }
}

const checkIdexxBreed = async () => {
  if (commonForm.code_common == '2') {
    await getIdexxBreedList()
  }
}

const updateDateEnd = (value: boolean) => {
  if (value) {
    commonForm.date_end = formatDate(new Date(9999, 11, 31))
    return
  }
  commonForm.date_end = getDaysBefore(1)
  return
}

onMounted(async () => {
  commonFormCheckBox.value = [...typeUnitBit]
  if (props.commonObj && props.commonObj.id_common) {
    assignPageData(props.commonObj)
    isEdit.value = true
    if (props.commonObj.code_common == 4) {
      commonFormCheckBox.value = commonFormCheckBox.value.map((o: any) => ({
        ...o,
        checked: isBitSet(props.commonObj.code_func1, o.value)
      }))
    }
  }
  if (props?.commonObj?.code_common == '11') {
    commonForm.flg_etc1 = true
  }

  if (commonForm.code_common == '2') {
    await getIdexxBreedList()
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader
      @closeModal="closeModal"
      :class="{
        outOfDateBG: isDateOutOfToday(
          props.commonObj?.date_start,
          props.commonObj?.date_end
        )
      }"
    >
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{
          isDateOutOfToday(
            props.commonObj?.date_start,
            props.commonObj?.date_end
          )
            ? '期間外レコード'
            : ''
        }}
        主要マスタ
      </q-toolbar-title>
      <q-btn v-if="isEdit" class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-scroll-area class="modal-content">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormPullDown
              :disable="isEdit"
              v-model:selected="commonForm.code_common"
              :options="codeCommonList"
              @update:selected="checkIdexxBreed"
              :rules="[aahValidations.validationRequired]"
              label="共通CD"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="commonForm.name_common"
              label="名称"
              type="text"
              :rules="[aahValidations.validationRequired]"
              autofocus
              tabindex="1"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-auto">
            <MtInputForm
              v-model="commonForm.flg_func1"
              :items="[{ label: '機能1' }]"
              type="checkbox"
            />
          </div>
          <div
            v-if="![4, 5, '4', '5'].includes(commonForm.code_common)"
            class="col-lg-3 col-md-3 col-sm-6"
          >
            <MtInputForm
              v-model="commonForm.code_func1"
              @update:model-value="checkIdexxBreed"
              autogrow
              label="機能CD1"
              type="text"
              tabindex="2"
            />
          </div>
          <div
            v-if="
              commonForm.flg_func1 && [5, '5'].includes(commonForm.code_common)
            "
            class="col-lg-3 col-md-3 col-sm-6"
          >
            <MtInputForm
              v-model="commonForm.code_func1"
              :rules="[aahValidations.validationRequired]"
              label="錠剤処理値"
              type="number"
              tabindex="3"
            />
          </div>
          <div
            v-if="
              commonForm.flg_func1 && [4, '4'].includes(commonForm.code_common)
            "
            class="row full-width"
          >
            <MtFormCheckBox
              v-for="(checkbox, index) in commonFormCheckBox"
              :key="index"
              v-model:checked="checkbox.checked"
              :label="checkbox.label"
              class="col-lg-3 col-md-3 col-sm-6"
              @update:checked="checkedFlg($event, checkbox)"
              tabindex="4"
            >
            </MtFormCheckBox>
          </div>
          <div
            class="col-lg-3 col-md-3 col-sm-6"
            v-if="CODE_COMMON_TO_APPLY.includes(props.code_common)"
          >
            <!-- <MtInputForm v-model="commonForm.text1" autogrow label="機能名1" type="text" /> -->
            <MtFilterSelectOptionAndIcon
              v-model:selecting="commonForm.text1"
              :options-default="[...colorPaletteList]"
              :options="colorPaletteList"
              label="機能名1"
              tabindex="5"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-auto">
            <MtInputForm
              v-model="commonForm.flg_func2"
              :items="[{ label: '機能2' }]"
              type="checkbox"
            />
          </div>
          <div
            class="col-lg-3 col-md-3 col-sm-6"
            v-if="commonForm.code_common == 13"
          >
            <MtFormPullDown
              v-model:selected="commonForm.code_func2"
              :options="vetShowOptions"
              :rules="[aahValidations.validationRequired]"
              label="機能CD2"
              tabindex="7"
            />
          </div>
          <div
            class="col-lg-3 col-md-3 col-sm-6"
            v-else-if="commonForm.code_common == 2"
          >
            <MtFilterSelect
              v-model:selecting="commonForm.code_func2"
              v-model:options="ivetBreedList"
              :options-default="ivetBreedListDefault"
              label="機能CD2"
              tabindex="8"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6" v-else>
            <MtInputForm
              v-model="commonForm.code_func2"
              autogrow
              label="機能CD2"
              type="text"
              tabindex="9"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="commonForm.text2"
              autogrow
              label="機能名2"
              type="text"
              tabindex="10"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="commonForm.comment"
              autogrow
              label="機能説明"
              type="text"
              tabindex="20"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-auto">
            <MtInputForm
              v-model="commonForm.flg_etc1"
              :items="[{ label: '予備1' }]"
              type="checkbox"
              tabindex="21"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-3" v-if="commonForm.flg_etc1">
            <MtInputForm
              v-model="commonForm.memo_etc1"
              label="予備名1"
              type="text"
              tabindex="22"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md" v-if="commonForm.flg_etc1">
          <div class="col-auto">
            <MtInputForm
              v-model="commonForm.flg_etc2"
              :items="[{ label: '予備2' }]"
              type="checkbox"
              tabindex="23"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-3" v-if="commonForm.flg_etc2">
            <MtInputForm
              v-model="commonForm.memo_etc2"
              label="予備名2"
              type="text"
              tabindex="24"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md" v-if="commonForm.flg_etc2">
          <div class="col-auto">
            <MtInputForm
              v-model="commonForm.flg_etc3"
              :items="[{ label: '予備3' }]"
              type="checkbox"
              tabindex="26"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-3" v-if="commonForm.flg_etc3">
            <MtInputForm
              v-model="commonForm.memo_etc3"
              label="予備名3"
              type="text"
              tabindex="27"
            />
          </div>
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
          <q-toggle
            v-model="commonForm.flg_func2"
            color="blue"
            :label="commonForm.flg_func2 ? '使用' : '不使用'"
            @update:model-value="updateDateEnd"
          />
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="commonForm.date_start"
              label="有効開始日"
              tabindex="28"
            ></MtFormInputDate>
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="commonForm.date_end"
              label="有効終了日"
              tabindex="29"
            ></MtFormInputDate>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="commonForm.display_order"
              label="表示順序（0~999; 小を上位表示）"
              type="text"
              tabindex="30"
            />
          </div>
        </div>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn
            class="q-ml-md"
            tabindex="35"
            color="primary"
            type="submit"
            unelevated
          >
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.c-grid {
  display: grid;
  grid-template-columns: 120px auto 120px;
  flex-direction: column;
}

.first-item {
  max-width: 100px;
}

.q-item {
  min-height: auto !important;
  padding: 2px 0 !important;
}

.modal-content {
  height: 45vh;
}
</style>
