<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCustomerStore from '@/stores/customers'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { storeToRefs } from 'pinia'
import useHairColorStore from '@/stores/hair-colors'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useBreedStore from '@/stores/breeds'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCommonStore from '@/stores/common'
import dayjs from 'dayjs'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const emits = defineEmits(['close'])
const commonStore = useCommonStore()
const hairColorStore = useHairColorStore()
const customerStore = useCustomerStore()
const breedStore = useBreedStore()
const { getCommonBreedOptionList } = storeToRefs(commonStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getCustomerPetSearchParams } = storeToRefs(customerStore)
const breedList = ref<any>([])
const breedDefaultList = reactive<any>([])
const hairColorList = ref<any>([])
const showBreedOptions = ref(false)

const statusSelection = ref([
  { label: 'マイクロチップ登録済', value: 'flg_microchip', checked: false },
  { label: '死亡', value: 'flg_deceased', checked: false },
  { label: 'システム除外', value: 'flg_unlist', checked: false }
])

const search = ref({
  status: [],
  id_cm_animal: null,
  id_breed: null,
  id_hair_color: null,
  date_last_visit_start: null,
  date_last_visit_end: null
})

const closeModal = () => {
  emits('close')
}

const submitFilter = () => {
  let count = 0
  Object.keys(search.value).forEach((key) => {
    if (
      (['number', 'string'].includes(typeof search.value[key]) &&
        search.value[key] !== '') ||
      search.value[key]?.length > 0
    ) {
      count += 1
    }
  })
  customerStore.setCustomerPetSearchParams(search.value, count)
  closeModal()
}

const updateStartDate = (val: string) => {
  search.value.date_last_visit_end = dayjs(val)
    .add(30, 'days')
    .format('YYYY/MM/DD')
}

const setSelectedAnimal = (val: string) => {

  if (!val) {
    showBreedOptions.value = false
    breedDefaultList.length = 0
    breedList.value.length = 0
    return false
  }

  showBreedOptions.value = true
  breedDefaultList.length = 0

  breedList.value.length = 0
  search.value.id_breed = null

  const codeFunc = getCommonTypeAnimalOptionList.value.find((item) => {
    return item.id_common === val
  }).code_func1

  breedDefaultList.push(
    ...getCommonBreedOptionList.value.filter(
      (common: any) => common.code_func1 == codeFunc
    )
  )

  breedList.value = [...breedDefaultList]
  showBreedOptions.value = true
}

onMounted(() => {
  breedDefaultList.length = 0
  breedList.value.length = 0
  hairColorList.value.length = 0

  getCommonBreedOptionList.value.forEach((breedObj: any) => {
    breedDefaultList.push(breedObj)
  })
  breedList.value = [...getCommonBreedOptionList.value]
  hairColorList.value = [...hairColorStore.getAllHairColors]

  if (getCustomerPetSearchParams.value) {
    search.value = getCustomerPetSearchParams.value
    if (search.value && search.value.id_cm_animal) {
      showBreedOptions.value = true
    }

    if (getCustomerPetSearchParams.value.status) {
      getCustomerPetSearchParams.value.status.forEach((status: any) => {

        statusSelection.value.map((item: any) => {
          if (item.value == Object.keys(status)[0]) {
            if (status[Object.keys(status)[0]]) {
              item.checked = true
              return
            }
            item.checked = false
          }
        })

      })

    }
  }


})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索 / オーナー・ペット
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-pa-lg">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-lg-6 col-md-6 col-sm-6">
            <MtFormPullDown
              v-model:selected="search.id_cm_animal"
              :options="getCommonTypeAnimalOptionList"
              label="動物種"
              autofocus
              :tabindex="1"
              @update:selected="setSelectedAnimal"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-6">
            <MtFilterSelect
              v-if="showBreedOptions"
              v-model:options="breedList"
              v-model:selecting="search.id_breed"
              label="品種"
              :options-default="breedDefaultList"
              :tabindex="2"
            />
          </div>
        </div>
      </div>
      <div class="col-6">
        <MtFormInputDate
          v-model:date="search.date_last_visit_start"
          label="最終来院日：Start"
          :tabindex="3"
          type="date"
          @update:date="updateStartDate"
        />
      </div>
      <div class="col-6">
        <MtFormInputDate
          v-model:date="search.date_last_visit_end"
          label="最終来院日：End"
          :tabindex="4"
          type="date"
        />
      </div>
      <div
        v-for="checkbox in statusSelection"
        :key="checkbox.label"
        class="flex items-center q-mt-md"
      >
        <MtFormCheckBox
          v-model:checked="checkbox.checked"
          :label="checkbox.label"
          @update:checked="(value)=> {
            search.status = []  // reset all status
            const  temp = checkbox.value
            statusSelection.map((item)=> {
              if(item.value == temp ){
                search.status.push({  [item.value] :  value ? 1 : 0 })
              }else{
                search.status.push({  [item.value] :  item.checked ? 1 : 0  })
              } 
            }) 
          }"
        />
      </div>
    </div>
    <div class="flex justify-end q-mb-xs">
      <q-btn
        outline
        size="sm" 
        unelevated
        @click="search = { };
          statusSelection.map((item)=> {
                  item.checked = false
                }) "
      >
        クリア
      </q-btn>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn
        @click="submitFilter()"
        color="primary"
        :tabindex="10"
        class="q-ml-md"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
