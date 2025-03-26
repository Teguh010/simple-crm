<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { concatenate, formatDateWithTime, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import useServiceDetailStore from '@/stores/service-details'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import UpdateServiceDetailModal from '../request/serviceDetail/UpdateServiceDetailModal.vue'
import mtUtils from '@/utils/mtUtils'
import { CustomerType, EmployeeType, PetType, ServiceDetailType } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import { typeLabProcess } from '@/utils/enum'
import useLabResultStore from '@/stores/lab-results'
import { orderBy, sortBy } from 'lodash'
import MtTable2 from '@/components/MtTable2.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import useCategoryStore from '@/stores/categories'
import useItemStore from '@/stores/items'
import { storeToRefs } from 'pinia'

const UpdateCustomerModal = defineAsyncComponent(
  () => import('../master/customerPet/UpdateCustomerModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('../master/customerPet/ViewPetDetailModal.vue')
)

const emits = defineEmits(['close'])
const props = defineProps({ 'callback': Function, row: Object, auto_update: {type: Boolean, default: false }})
const closeModal = () => {emits('close')}

const columns = [
  { name: 'radio', label: '', field: 'radio', align: 'center', style: 'width: 2%', headerStyle: 'width: 2%' },
  { name: 'date_service_start', label: '検査依頼日', field: 'date_service_start', align: 'center', style: 'width: 15%' },
  { name: 'name_customer', label: 'オーナー', field: 'name_customer', align: 'center', style: 'width: 20px' },
  { name: 'name_pet', label: 'ペット', field: 'name_pet', align: 'center', style: 'width: 25px' },
  { name: 'id_employee_registered', label: '担当者', field: 'id_employee_registered', align: 'center', style: 'width: 20px' },
  { name: 'name_item_service', label: '検査名称', field: 'name_item_service', align: 'center', style: 'width: 20px' },
  { name: 'number_service_detail', label: '', field: 'number_service_detail', align: 'center', style: 'width: 8px' }
]

const labResultStore = useLabResultStore()
const serviceDetailStore = useServiceDetailStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const categoryStore = useCategoryStore()
const itemStore = useItemStore()
const { getCustomerOption } = storeToRefs(customerStore)
const { getCommonTypeAnimalOptionList, getCommonTypeServiceOptionList } = storeToRefs(commonStore)


const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])
const showPet = ref(null)
const selectedDetail = ref(null)
const searchData = ref({
  id_customer: '',
  name_pet: '',
  datetime_service_start: getDaysBefore(0),
  datetime_service_start_end: getDateToday(),
  lab: true,
  id_category1: null
})
const parentCategory: any = ref([])
const parentCategoryDefault: any = reactive([])

const search = async () => {
  await serviceDetailStore.fetchAllServiceDetails(searchData.value)
}

const searchedServiceDetails = computed(() => {
  const detailList = orderBy(serviceDetailStore.getAllServiceDetails, 'date_service_start', 'desc')
  const filteredDetailList = detailList.filter((data) => {
    // filter the code_category2 to match case with prefix "ez"
    const category = data?.code_category2?.toLowerCase()
    return category?.includes('ez') || category?.includes('ex')
  })

  return filteredDetailList
})

const openServiceDetail = async (service_detail: ServiceDetailType) => {
  serviceDetailStore.setServiceDetail(service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}
const openCustomer = async (customer: CustomerType) => {
  await mtUtils.popup(UpdateCustomerModal, {
    data: customer,
    fromPage: 'Lab Prep',
    pageTitle: `顧客: ${customer.name_customer_display} 様`
  })
}
const openPet = async (pet: PetType) => {
  await customerStore.selectCustomer(pet.id_customer)
  customerStore.selectPet(pet.id_pet)
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: pet?.id_customer,
    id_pet: pet?.id_pet
  })
}
const getEmployeeName = (employee_id: number) => employeeStore.getAllEmployees.find((employee: EmployeeType) => employee.id === employee_id)?.name_display

const submit = async () => {
  if (props.auto_update) {
    const data = {
      update_sd: true,
      id_service_detail: selectedDetail.value?.id_service_detail,
      id_pet: selectedDetail.value?.pet.id_pet,
      id_pet_illness_history: selectedDetail.value?.id_pet_illness_history[0],
      type_lab_process: 1,
      id_lab_raw: props.row?.id_lab_raw,
      lab_result_prep: props.row?.lab_result_prep?.map((item: any) => {return item.id_lab_result_prep})
    }
    await labResultStore.updateLabResultsPrepBulk(data)
    mtUtils.autoCloseAlert('検査結果を連携しました')
  }
  props.callback(selectedDetail.value)
  closeModal()
}

const selectCustomer = async (value: number) => {
  if (value) {
    await customerStore.selectCustomerOptions(value)
  
    let selectedCustomer = getCustomerOption.value
  
    if (selectedCustomer.pets.length) {
      petListDefault.length = 0
      selectedCustomer.pets.map((petObj: PetType) => {
        if (petObj.flg_unlist || petObj.flg_deceased) return
  
        petListDefault.push({
          ...petObj,
          label: concatenate(
            petObj.code_pet,
            selectedCustomer.name_family,
            petObj.name_pet
          ),
          value: petObj.name_pet,
          icon:
            getCommonTypeAnimalOptionList.value.find((c) => {
              return c.value === petObj.id_cm_animal
            })?.text1 ?? ''
        })
      })
      petList.value = [...petListDefault]
      showPet.value = true
    }
  } else {
    searchData.value.id_customer = ''
    searchData.value.name_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
    showPet.value = false
  }
}

const init = async () => {
  await mtUtils.promiseAllWithLoader([
    useCommonStore().fetchPreparationCommonList({ code_common: [11] }),
    itemStore.fetchItems({})
  ])
  let itemList = (itemStore.getItems.filter(item => item?.flg_service == true))?.map(item => item?.id_cm_type_service)
  const filteredCommons = getCommonTypeServiceOptionList.value.filter(
    (v: any) => (itemList.includes(v.id_common) && (v.code_func2.startsWith('EZ') || v.code_func2.startsWith('EX')))
  )
  let prefixes = filteredCommons.map(c => c.code_func2)
  const sortCategory = sortBy(categoryStore.getAllCategories, [
      'display_order'
    ])
  let activeCategories = sortCategory.filter((c) => {
    return c.flg_active
  })
  let parentCategory_ = []
  activeCategories.forEach((i) => {
    prefixes.forEach((prefix: any) => {
      if (i.code_category.startsWith(prefix)) {
        parentCategory_.push(i)
      }
    });
  })
  parentCategory_ = parentCategory_.map((cat: any) => {
    return { ...cat, label: `${cat.code_category} - ${cat.label}` }
  })
  parentCategory.value.length = 0
  parentCategoryDefault.length = 0
  parentCategory.value = [...parentCategory_]
  parentCategoryDefault.push(...parentCategory.value)
}

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getAllCustomers]
  customerListDefault.push(...customerStore.getAllCustomers)

  await init()
  await search()
})

</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      検査データの結合
    </q-toolbar-title>
    <div class="flex no-wrap items-center">
      <div v-if="props.row?.name_device" class="q-mr-md">
        検査機器：{{ props.row?.name_device }}
      </div>
      <div v-if="props.row?.type_lab_process" class="q-mr-md">
        処理区分：{{ typeLabProcess.find((item)=>item.value === props.row?.type_lab_process)?.label }}
      </div>
      <div v-if="props.row?.datetime_registered" class="q-mr-md text-right">
        <div class="q-mr-md">
          {{ formatDateWithTime(props.row?.datetime_registered) }}
        </div>
      </div>
    </div>
  </MtModalHeader>
  <q-card-section class="q-px-sm content" style="overflow-y: hidden">
    <div>
      <!-- <div class="full-width z-top bg-white fixed q-mb-xl"> -->
        <div class="row items-center">
          <div class="col-3 q-ml-md">
            <MtFormInputDate
              v-model:date="searchData.datetime_service_start"
              outlined
              type="date"
              label="検査依頼日：Start"
              class="q-mr-sm"
              autofocus
              @update:date="($event) => searchData.datetime_service_start_end = $event"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="searchData.datetime_service_start_end"
              outlined
              type="date"
              class="q-ml-sm"
              label="検査依頼日：End"
            />
          </div>
          <div class="col-3 q-ml-md">
            <MtFilterSelect
              v-model:options="parentCategory"
              :options-default="parentCategoryDefault"
              :outlined="true"
              v-model:selecting="searchData.id_category1"
              label="大分類"
              @selected="selectedCategory"
              :disable="false"
            />
          </div>
        </div>
        <div class="row items-center q-mt-md">
          <div class="col-4 q-ml-md">
            <!-- <MtInputForm
              outlined 
              type="text"
              label="オーナー・ペット"
              required
              v-model="searchData.name_pet"
            /> -->
            <MtFilterSelect
              label="オーナー"
              v-model:selecting="searchData.id_customer"
              v-model:options="customerList"
              :options-default="customerListDefault"
              autofocus
              custom-option
              @update:selecting="selectCustomer"
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
          <div class="col-4 q-ml-md">
            <MtFilterSelect
              v-if="showPet"
              label="ペット"
              v-model:selecting="searchData.name_pet"
              v-model:options="petList"
              :options-default="petListDefault"
            />
          </div>
          <div class="col-2 q-ml-auto">
            <q-btn color="primary" class="q-ml-md" @click="search">
              <q-icon  size="xs" name="search" />
              <span class="q-ml-md">検索</span>
            </q-btn>
          </div>
        </div>
      <!-- </div> -->
      <div class="full">
        <q-scroll-area
          class="full-width tableview-scroll"
        >
          <MtTable2
            :columns="columns"
            :rows="searchedServiceDetails"
            :rowsBg="true"
            flat
            :style="{overflow: 'unset '}"
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
              <template v-slot:row="{ row, index }">
                <td
                  class="cursor-pointer items-center"
                  v-for="col in columns"
                  @click="selectedDetail=row"
                >
                  <div v-if="col.field === 'radio'" class="q-py-md q-px-sm">
                    <input type="radio" v-model="selectedDetail" :value="row" :id="'radio-' + index">
                  </div>
                  <div v-else-if="col.field === 'date_service_start'" class="q-py-md q-px-sm">{{ row.date_service_start }}</div>
                  <div v-else-if="col.field === 'name_customer'" class="q-py-md q-px-sm textBlue" @click.stop="openCustomer(row.customer)">
                    {{ row.customer.code_customer }} {{ row.customer.name_customer_display}}
                  </div>
                  <div v-else-if="col.field === 'name_pet'" class="q-py-md q-px-sm textBlue" @click.stop="openPet(row.pet)">
                    {{ row.pet.name_pet }}
                  </div>
                  <div v-else-if="col.field === 'id_employee_registered'" class="q-py-md q-px-sm">
                    {{ getEmployeeName(row.id_employee_registered) }}
                  </div>
                  <div v-else-if="col.field === 'name_item_service'" class="q-py-md q-px-sm">{{ row.name_item_service }}</div>
                  <div v-else-if="col.field === 'number_service_detail'" class="q-py-md q-px-sm textBlue" @click.stop="openServiceDetail(row)">
                    {{ row.number_service_detail }}
                  </div>
                </td>
            </template>
          </MtTable2>
        </q-scroll-area>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn color="primary" class="q-ml-md" @click="submit">
        <span>選択する</span>
      </q-btn>
    </div>
  </q-card-section>
</template>


<style scoped>
.tableview-scroll {
  height: calc(100vh - 350px)
}

@media screen and (min-width: 800px) {
  .tableview-scroll {
    height: calc(100vh - 400px);
  }
}

@media screen and (min-width: 1280px) {
  .tableview-scroll {
    height: calc(100vh - 350px);
  }
}
.textBlue{
  color: #0057FF;
  text-decoration: underline;
}
tr:hover{
  background: #F7F9F9;
}
</style>