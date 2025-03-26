<script setup lang="ts">
import { onMounted, ref, computed, defineAsyncComponent } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import usePetBioStore from '@/stores/pet-bios'
import { aahTruncate, dateFormat, formatDate, getCurrentPetAge, getCustomerKanaNameHonorific, getCustomerName, getDateToday, getFullPetNameWithoutHonorific, getPetImageUrl, handleImageError } from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import useHairColorStore from '@/stores/hair-colors'
import useBreedStore from '@/stores/breeds'
import useInsuranceStore from '@/stores/insurances'
import useServiceDetailStore from '@/stores/service-details'
import CreatePrescriptionListModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import { useRouter } from 'vue-router'
import { groupBy, mapValues, orderBy } from 'lodash'
import useCategoryStore from '@/stores/categories'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import useActionStore from '@/stores/action'
import ServiceDetailPetDetail from './ServiceDetailPetDetail.vue'
import MemoCartePetDetail from './MemoCartePetDetail.vue'
import PetBioInfoPetDetail from './PetBioInfoPetDetail.vue'
import PetBioConditionPetDetail from './PetBioConditionPetDetail.vue'
import usePetStore from '@/stores/pets'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import LabResultPetDetail from '@/components/lab/LabResultPetDetail.vue'
import UpdateCustomerModal from '../UpdateCustomerModal.vue'
import { date } from 'quasar'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useCommonStore from "@/stores/common";
import useMessageStore from '@/stores/message-clinic'
import SelectPrintTemplate from './SelectPrintTemplate.vue'
import {
  typePrevention, typeYearPeriod, typePetGender, typeTitlePetCustomerUpdated
} from '@/utils/enum'
import useCliCommonStore from '@/stores/cli-common'

const IllnessHistoryPetDetail = defineAsyncComponent(() => import('./IllnessHistoryPetDetail.vue'))
const UpdateCustomerPetMemoModal = defineAsyncComponent(() => import('../UpdateCustomerPetMemoModal.vue'))
const UpdatePetModal = defineAsyncComponent(() => import('../UpdatePetModal.vue'))
const TaskPetDetail = defineAsyncComponent(() => import('./TaskPetDetail.vue'))
const PetDiagonsticDetail = defineAsyncComponent(() => import('./PetDiagonsticDetail.vue'))
const ServiceDetailSurgeryPetDetail = defineAsyncComponent(() => import('./ServiceDetailSurgeryPetDetail.vue'))
const PrescriptionHistoryPetDetail = defineAsyncComponent(() => import('./PrescriptionHistoryPetDetail.vue'))
const UpdateMessageThreadModal = defineAsyncComponent(() => import('@/pages/message/UpdateMessageThreadModal.vue'))

const menuOptions = [
  { title: 'URLコピー', name: 'url_copy' },
  { title: '編集', name: 'edit' },
  { title: '印刷', name: 'certificate_issuance'},
  { title: 'リクエストを検索', name: 'search_request' },
  { title: 'スレッド作成', name: 'create_thread' },
  { title: 'スレッド検索', name: 'search_thread' },
  { title: '削除', name: 'close' }
]

const props = defineProps({ id_customer: String, id_pet: String })
const petBioStore = usePetBioStore()
const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const hairColorStore = useHairColorStore()
const breedStore = useBreedStore()
const insuranceStore = useInsuranceStore()
const serviceDetailStore = useServiceDetailStore()
const categoryStore = useCategoryStore()
const actionStore = useActionStore()
const petStore = usePetStore()
const petInsuranceStore = usePetInsuranceStore()
const messageStore = useMessageStore()
const cliCommonStore = useCliCommonStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)
const { getPetInsurances } = storeToRefs(petInsuranceStore)
const { getPet, getCustomer } = storeToRefs(customerStore)
const { getPetPreventativeDetail } = storeToRefs(petStore)
const router = useRouter()
const tab2 = ref('予防')
const yearPeriod = ref(1)
const expanded = ref(true)
const headerContent = ref(null)
const typePetAlertNames = ref<any>([])
const typeAnimal = ref<any>(Object)

const headerContentHeight = computed(() => {
  return headerContent.value?.offsetHeight ?? 0
})

const hairColorName = (value: number) =>
  hairColorStore.getAllHairColors.find((v) => v.value === value)?.label

const getTypePetAlertNames = async () => {
  typePetAlertNames.value = [];
  [...(getPet.value?.pet_alert ?? [])].forEach((v, index) => {
    if (v === '1') typePetAlertNames.value.push(useCommonStore().getCommonTypePetAlertOptionList[index])
  })
}

const getTypeAnimal = async (value: number) => useCommonStore().getCommonTypeAnimalOptionList.find((v) => v.id_common == value);

const breedName = (value: number) =>
  breedStore.getAllBreeds.find((v) => v.value === value)?.label
const typeGenderName = (value: number) =>
  typePetGender.find((v) => v.value === value)?.label
const getInsurance = (value: number) =>
  insuranceStore.getInsurances.find((v) => v.id_insurance_plan === value)
const categoryName = (value: number) =>
  categoryStore.getAllCategories.find((v) => v.value === value)
const typeTitlePetCustomerUpdatedName = (value) =>
  typeTitlePetCustomerUpdated.find(
    (item) => item.value === value
  )
const labelColor = (type_customer_color) => {
  getCliCommonCustomerColorList.value.find(
    (v) => v.code_func1 == type_customer_color
  )?.name_cli_common
}

const memoCustomerPetModal = async () => {
  await mtUtils.mediumPopup(UpdateCustomerPetMemoModal, {
    id_pet: getPet.value?.id_pet,
    is_pet_detail: true
  })
}
const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'edit') {
      await mtUtils.popup(UpdatePetModal)
      init()
    } else if (selectedOption.name == 'url_copy') {
      try {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    } else if (selectedOption.name == 'search_request') {
      router.push({ name: 'SearchRequestList', query: { id_customer: getCustomer.value?.id_customer, id_pet: getPet.value?.id_pet } })
    }else if (selectedOption.name == 'create_thread') {
      await mtUtils.popup(UpdateMessageThreadModal, {
        id_customer: getCustomer.value?.id_customer,
        id_pet: getPet.value?.id_pet
      })
      const recentThread = messageStore.getRecentThreadMessage
      if (recentThread && Object.keys(recentThread).length > 0) {
        messageStore.setRecentMessageThread(null)
        const confirmation = await mtUtils.confirm(
          '院内スレッドを作成しました。スレッドを開きますか？',
          '確認',
          'スレッドを開く'
        )
        if (confirmation) {
          const route = router.resolve({ name: 'MessageClinic' })?.href
          window.open(route, '_blank')
        }
      }
    }else if (selectedOption.name == 'certificate_issuance') {
      // return
      mtUtils.smallPopup(SelectPrintTemplate, { customerData: getCustomer.value })
    }
  }
}

const openAddModal = async () => {
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateRequestModal, {
    id_customer: getCustomer.value?.id_customer,
    id_pet: getPet.value?.id_pet,
    updatedFlg
  })
  if(updatedFlg.value){
    router.push(`/SearchRequestList/${updatedFlg.value}`)
  }
}
const openModal = async (preventative: any) => {
  if (preventative.id_service_detail) {
    await serviceDetailStore.fetchServiceDetailById(preventative.id_service_detail)
    await mtUtils.mediumPopup(UpdateServiceDetailModal, {})
  } else if (preventative.id_prescription) {
    const requestDetailPage = {
      id_customer: props.id_customer,
      // id_request: preventative.id_request, // TO DO : NEED TO FIND MORE COOL WAY TO OPEN THE PRESCRIPTION MODAL, BECAUSE IT REQUIRED TO SEND ID_REQUEST FROM PARENT
      id_pet: props.id_pet,
    }
    await mtUtils.mediumPopup(CreatePrescriptionListModal, { prescriptionObj: preventative, id_pet: preventative.id_pet, fromPD:true, id_customer: props.id_customer }, true)
  }
}
const openCustomerDetail = async (data:any) => {
  await customerStore.selectCustomer(data?.id_customer)
  await mtUtils.popup(UpdateCustomerModal, {data})
  await customerStore.selectCustomer(data.id_customer, true)
  customerStore.selectPet(props.id_pet)
  insuranceStore.fetchInsurances()
  filterYearPeriod()
  // localStorage.setItem('pageAction', 'updateCustomer')
  // localStorage.setItem('pageActionParam', getCustomer.value.id_customer)

  // const link = router.resolve({ name: 'SearchCustomerList' }).href
  // window.open(link)
}
const petPreventativeDetail = computed(() =>
  mapValues(
    groupBy(getPetPreventativeDetail.value?.preventative_detail_list, 'type_prevention'),
    items => orderBy(items, [
      item => item.datetime_service_start ? new Date(item.datetime_service_start) : new Date(item.date_start)
    ], ['desc'])
  )
)
const filterYearPeriod = () => {
  let startDate, endDate, currentDate
  if(yearPeriod.value === 1) {
    // set start date as first date of current year, end date as today
   endDate = getDateToday()
   startDate = dateFormat(date.adjustDate(new Date(endDate), {year: new Date(endDate).getFullYear(), month: 1, day: 1}))
  }
  else if(yearPeriod.value === 2) {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 1, day: 1}))
    endDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 12, day: 31}))
  }
  let dateRange = {}
  if (startDate && endDate) dateRange = {'date_start':  startDate, 'date_end': endDate}

  petStore.fetchPetPreventativeDetail(props.id_customer, props.id_pet, dateRange)
}
const init = async () => {
  await Promise.all([
    petInsuranceStore.fetchPetInsurances({ id_pet: props.id_pet, active_insurance_only: true }),
    customerStore.selectCustomer(props.id_customer, true),
    commonStore.fetchPreparationCommonList({code_common: [10, 25]}),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_commong: [3] })
  ])

  await getTypePetAlertNames();
  typeAnimal.value = await getTypeAnimal(getPet.value?.id_cm_animal);
}
onMounted(async () => {
  await init()
  customerStore.selectPet(props.id_pet)
  insuranceStore.fetchInsurances()
  filterYearPeriod()
})

</script>

<template>
  <MtHeader style="border-bottom:none;">
    <div ref="headerContent">
    <q-toolbar class="justify-between no-wrap">
      <div class="flex q-gutter-md q-pt-xs items-center">
        <div>
          <div class="caption1 regular text-grey-900 q-mb-xs">
            {{ 
              getCustomer?.name_kana_family
            }}
            <span class="q-ml-md">{{ getPet?.name_kana_pet }}</span>
          </div>
          <div class="title2 bold text-grey-900 q-mb-xs">
            {{ getFullPetNameWithoutHonorific(getPet, getCustomer) }}
            <span class="q-ml-xs caption2 regular">{{
              typeTitlePetCustomerUpdatedName(
                getPet?.type_title_pet_customer_updated
              )?.label
            }}</span>
          </div>
        </div>
        <div class="caption2 regular text-grey-700 q-mb-xs">
          <span>性別</span>
          <p class="title2 bold">
            {{ typeGenderName(getPet?.type_pet_gender) }}
          </p>
        </div>
        <div class="caption2 regular text-grey-700 q-mb-xs">
          <span>品種名</span>
          <p class="title2 bold">{{ breedName(getPet?.id_breed) }}</p>
        </div>
        <div v-if="getPet" class="caption2 regular text-grey-700 q-mb-xs">
          <span>生年月日</span>
          <p class="title2 bold">
            {{ formatDate(getPet?.date_birth) }}
            {{ getPet?.flg_unknown_dob ? '推定' : '' }}
            <span class="q-ml-md">
              ( {{ getCurrentPetAge(getPet) }} )
            </span>
          </p>
        </div>
        <div>
          <q-btn
            v-if="getPet && getPet.flg_existence"
            unelevated
            padding="7px 12px"
            color="accent-800"
            text-color="grey-500"
            class="body2 regular border-btn q-ml-sm"
          >
            平均寿命以上
          </q-btn>
        </div>
        <div class="flex q-mb-sm memo-textarea">
          <q-btn
            @click="memoCustomerPetModal"
            class="bg-grey-300 btn-memo"
            unelevated
          >
            <div
              class="text-left"
              v-html="
                aahTruncate(
                  customerStore?.getPet?.memo_pet || 'メモ入力',
                  50
                )
              "
            ></div>
          </q-btn>
        </div>
      </div>
      <div class="flex">
        <q-btn
          unelevated
          @click="openAddModal"
          color="grey-800"
          text-color="white"
        >
          <q-icon size="15px" name="add" class="q-mr-md" /> リクエスト
        </q-btn>
        <q-btn unelevated round @click="expanded = !expanded" class="q-mx-md">
          <q-icon
            size="15px"
            :name="expanded ? 'expand_less' : 'expand_more'"
            class="q-mr-xs"
          />
        </q-btn>
        <q-btn unelevated round @click="openMenu" class="q-mx-sm">
          <q-icon size="15px" name="more_horiz" class="q-mr-xs" />
        </q-btn>
      </div>
    </q-toolbar>
    </div>
  </MtHeader>
  <q-page>
    <div class="round-section-free-bg-top-margin bg-grey-200">
      <div class="row">
        <div class="col-grow">
          <q-slide-transition>
            <div v-show="expanded">
              <div class="row q-mb-md">
                <div class="col-auto q-mr-md">
                  <img
                    v-if="getPet"
                    :alt="getPet?.name_kana_pet"
                    :src="getPetImageUrl(getPet)"
                    @error="handleImageError($event, getPet)"
                    :style=" getPet?.image_path1 || getPet?.image_path2 ? 'width: 160px; height: 160px;' : 'width: 100px; height: 100px;'"
                    class="q-mb-sm roundedImage image-responsive"
                  />
                  <div v-else class="default bg-grey-300" />
                  <small class="flex text-grey-700 q-mb-xs">
                    <template v-if="getPet">
                      オーナーペット名：{{ getPet?.name_pet }}
                    </template>
                    <template v-else>
                      <q-skeleton type="text" height="100px" />
                    </template>
                  </small>
                  <small class="flex text-grey-700 q-mb-xs">
                    <span>初診日：</span>
                    <span>{{ getPet?.date_register || '-' }}</span>
                  </small>
                  <small class="flex text-grey-700 q-mb-sm">
                    <span>最終来院：</span>
                    <span>{{ getPet?.date_last_visit || '-' }}</span>
                  </small>
                  <!--TODO<q-btn
                    unelevated
                    outline
                    padding="4px 10px"
                    label="疾患相関"
                    class="body1 q-mt-md text-grey-800"
                  />-->
                </div>
                <div class="col-8 q-ml-lg q-mt-md">
                  <div class="row">
                    <div class="col-5 q-mr-md">
                      <div class="flex">
                        <div>
                          <span class="caption2 regular text-grey-700">ペットコード</span>
                          <p class="text-grey-700">
                            {{ getPet?.code_pet }}
                          </p>
                        </div>
                        <div class="q-ml-lg">
                          <span class="caption2 regular text-grey-700">動物種別</span>
                          <p class="text-grey-700">
                            {{ typeAnimal?.name_common }}
                            <q-icon
                              v-if="typeAnimal?.text1 && typeAnimal?.text1 != ''"
                              size="20px"
                              name="circle"
                              class="q-ml-xs"
                              :color= "typeAnimal?.text1 || ''"
                            />
                          </p>
                        </div>
                        <div class="q-ml-lg">
                          <span class="caption2 regular text-grey-700">毛色</span>
                          <p class="text-grey-700">
                            {{ hairColorName(getPet?.id_hair_color) }}
                          </p>
                        </div>
                      </div>
                      <div v-if="getPet?.flg_microchip">
                        <span class="caption2 regular text-grey-700">マイクロチップ登録番号</span>
                        <p class="text-grey-700">
                          {{ getPet.microchip_id }}
                        </p>
                      </div>
                      <div v-if="getCustomer && getCustomer.memo_customer">
                        <span class="caption2 regular text-grey-700">オーナーメモ</span>
                        <p class="text-grey-700">
                          {{ getCustomer.memo_customer || '-' }}
                        </p>
                      </div>
                      <div v-if="getPet?.pet_alert">
                        <span class="caption2 regular text-grey-700">注意事項</span>
                        <div class="flex">
                          <div class="body1 regular text-grey-700">
                            <template v-for="(common, index) in  typePetAlertNames">
                              <span> {{ common?.name_common || "" }} </span>
                              <q-icon
                                v-if="common?.text1 && common?.text1 != ''"
                                size="20px"
                                name="circle"
                                class="q-ml-xs"
                                :color="common?.text1 || ''"
                              />
                              <span v-if="index != typePetAlertNames.length-1">, </span>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col">
                      <div v-if="getPet?.flg_insurance_plan" >
                        <span class="caption2 regular text-grey-700">ペット保険</span>
                        <p class="text-grey-700">
                          加入
                        </p>

                        <span class="caption2 regular text-grey-700">現在有効なペット保険</span>
                        <div v-if="getPet?.flg_insurance_plan && getPetInsurances && getPetInsurances.length > 0" v-for="pet_insurance in getPetInsurances">
                          <span class="q-mr-md text-blue">{{ pet_insurance.insurer?.name_insurer }}</span>
                          <span class="q-mr-md">{{ pet_insurance.insurance_plan?.name_insurance_plan }}</span>
                          <span class="q-mr-md">{{ pet_insurance.date_insurance_start }} ~ {{ pet_insurance.date_insurance_end }}</span>
                        </div>
                        <div v-else>
                          登録なし
                        </div>
                      </div>
                      <div v-if="getPet && getPet.flg_deceased" class="q-mb-sm">
                        <span class="caption2 regular text-grey-700">亡くなった日</span>
                        <div class="body1 regular text-grey-700">
                          {{ getPet.datetime_deceased }}
                        </div>
                      </div>
                      <div v-if="getPet && getPet.flg_send_flower" class="q-mb-sm">
                        <span class="caption2 regular text-grey-700">花送付日</span>
                        <div class="body1 regular text-grey-700">
                          {{ getPet.datetime_send_flower }}
                        </div>
                      </div>
                      <div v-if="getPet && getPet.flg_send_flower" class="q-mb-sm">
                        <span class="caption2 regular text-grey-700">花送付メモ</span>
                        <p class="body1 regular text-grey-700">
                          {{ getPet.memo_send_flower || '-' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-2">
                  <span v-if="getPet && getPet.flg_unlist" class="exclude-data2 q-ml-sm" >
                    システム除外
                  </span>
                  <span v-if="getPet && getPet.flg_pet_excluded" class="exclude-data2 q-ml-sm" >
                    病院除外
                  </span>
                  <span v-if="getPet && getPet.flg_delete_by_customer" class="exclude-data2 q-ml-sm" >
                    オーナーによる除外
                  </span>
                </div>
              </div>
              <q-separator />
              <div class="flex q-mt-md items-center">
                <span class="body2 q-mr-md bold text-grey-900">オーナー情報</span>
                <div class="col-auto">
                  <div class="caption2 regular text-grey-700">
                    {{ getCustomerKanaNameHonorific(getCustomer) }}
                  </div>
                  <p
                    @click="openCustomerDetail(getCustomer)"
                    class="body1 cursor-pointer text-blue text-underline regular q-ma-none"
                  >
                    {{ getCustomerName(getCustomer) }}
                    <q-icon
                      size="13px"
                      name="circle"
                      :color="labelColor(getCustomer?.type_customer_color)"
                    />
                  </p>
                </div>
              </div>
            </div>
          </q-slide-transition>
        </div>
      </div>
    </div>
    <q-tabs
      v-model="tab2"
      dense
      align="left"
      indicator-color="transparent"
      class="q-mx-md q-mb-xs bottom-tab"
    >
      <q-tab name="予防" label="予防" />
      <q-tab name="現疾患・既往歴" :label="`現疾患・既往歴`" />
      <q-tab name="手術・麻酔" label="手術・麻酔" />
      <q-tab name="治療・サービス" label="治療・サービス" />
      <q-tab name="処方箋" label="処方箋" />
      <q-tab name="タスク" label="タスク" />
      <q-tab name="メモカルテ" label="メモカルテ" />
      <q-tab name="検査結果" label="検査結果" />
      <q-tab name="生体情報" label="生体情報" />
      <q-tab name="状態管理" label="状態管理" />
      <q-tab name="関連資料" label="関連資料" />
      <q-tab name="共有写真" label="共有写真" />
    </q-tabs>
    <q-tab-panels v-model="tab2" animated>
      <q-tab-panel name="予防" class="bg-grey-050 q-px-xl q-py-md">
        <div class="bg-white q-px-md q-py-xs">
          <div class="q-mb-sm">
            <MtInputForm
              type="radio"
              v-model="yearPeriod"
              :items="typeYearPeriod"
              @click="filterYearPeriod"
            />
          </div>
          <q-scroll-area style="height: 590px">
            <div class="row">
              <template v-for="item in typePrevention">
                <div class="col-3">
                  <div class="q-mb-xs">
                    <div class="title2 bold text-grey-900 text-center q-mb-sm">
                      {{ item.label }}
                    </div>
                  </div>
                  <div
                    v-if="
                      petPreventativeDetail &&
                      petPreventativeDetail[item.value] &&
                      petPreventativeDetail[item.value].length > 0
                    "
                    v-for="preventative in petPreventativeDetail[item.value]"
                    @click="openModal(preventative)"
                    class="q-mb-xs cursor-pointer"
                  >
                    <div
                      class="bg-grey-050 q-py-md q-px-md q-mb-xs border pink"
                    >
                      <div class="flex items-center q-mb-xs">
                        <span class="body2 bold text-grey-900">
                          <template v-if="preventative.datetime_service_start">
                            {{ formatDate(preventative.datetime_service_start) }}
                            {{ preventative.datetime_service_end ? ' - ' + formatDate(preventative.datetime_service_end) : '' }}
                          </template>
                          <template v-else>
                            {{ formatDate(preventative.date_start) }}
                            {{ preventative.date_end ? ' - ' + formatDate(preventative.date_end) : '' }}
                          </template>
                        </span>
                        <div class="q-ml-md">
                          <span class="caption2 regular text-grey-700">{{
                            categoryName(preventative.id_category1)?.label
                          }}</span>
                          <q-icon
                            name="arrow_right"
                            color="grey-700"
                            class="q-px-xs"
                          />
                          <span class="caption2 regular text-grey-700">{{
                            categoryName(preventative.id_category2)?.label
                          }}</span>
                        </div>
                      </div>
                      <span class="body1 regular text-grey-900">{{
                        preventative.name_item_service || preventative.name_prescription_display
                      }}</span>
                      <div>
                        <p
                          class="caption2 regular text-grey-700 q-pt-xs q-mb-none ellipsis-2-lines"
                        >
                          {{ preventative.memo_service || '' }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <p class="q-pl-md text-grey-500">
                      {{ item.label }}はありません。
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </q-scroll-area>
        </div>
      </q-tab-panel>
      <q-tab-panel name="現疾患・既往歴" class="bg-grey-050 q-px-xl q-py-md">
        <IllnessHistoryPetDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="手術・麻酔" class="bg-grey-050 q-px-xl q-py-md">
        <ServiceDetailSurgeryPetDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="治療・サービス" class="bg-grey-050 q-px-xl q-py-md">
        <ServiceDetailPetDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="処方箋" class="bg-grey-050 q-px-xl q-py-md">
        <PrescriptionHistoryPetDetail :id_pet="props.id_pet" />
      </q-tab-panel>
      <q-tab-panel name="タスク" class="bg-grey-050 q-px-xl q-py-md">
        <TaskPetDetail :id_pet="props.id_pet" />
      </q-tab-panel>
      <q-tab-panel name="メモカルテ" class="bg-grey-050 q-px-xl q-py-md">
        <MemoCartePetDetail :id_pet="props.id_pet" :id_customer="props.id_customer" />
      </q-tab-panel>
      <q-tab-panel name="検査結果" class="bg-grey-050 q-px-xl q-py-md">
        <LabResultPetDetail :id_pet="props.id_pet" :id_customer="props.id_customer" />
      </q-tab-panel>
      <q-tab-panel name="生体情報" class="bg-grey-050 q-px-xl q-py-md">
        <PetBioInfoPetDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="状態管理" class="bg-grey-050 q-px-xl q-py-md">
        <PetBioConditionPetDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="関連資料" class="bg-grey-050 q-px-xl q-py-md">
        <PetDiagonsticDetail
          :id_pet="props.id_pet"
          :id_customer="props.id_customer"
        />
      </q-tab-panel>
      <q-tab-panel name="共有写真" class="bg-grey-050 q-px-xl q-py-md">
        <p class="q-pl-md text-grey-500">共有写真はありません。</p>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<style lang="scss" scoped>
.top-tab {
  .q-tab {
    background-color: $grey-200;
    border-radius: 5px 5px 0px 0px;
    margin: 0 2px;
    padding: 0 4px 0 10px;
  }
  :deep(.q-tab__label) {
    font-weight: 700;
    font-size: 15px;
    line-height: 20px;
    color: $grey-600;
  }
  :deep(.q-tab__content) {
    flex-direction: row-reverse;
    .q-icon {
      opacity: 0;
      visibility: hidden;
    }

    &:hover {
      .q-icon {
        opacity: 1;
        visibility: visible;
      }
    }
  }
  .q-tab--active {
    background-color: $grey-400;

    :deep(.q-icon) {
      color: $grey-100;
      opacity: 1;
      visibility: visible;
    }
    :deep(.q-tab__label) {
      color: $grey-100;
    }
  }
}
.bottom-tab {
  :deep(.q-tabs__content) {
    padding: 1rem 0 0;
  }
  .q-tab {
    background-color: $grey-200;
    border-radius: 5px 5px 0px 0px;
    margin: 0 2px;
    padding: 0 24px;
  }
  :deep(.q-tab__label) {
    font-weight: 700;
    font-size: 15px;
    line-height: 20px;
    color: $grey-900;
  }
  .q-tab--active {
    background-color: $accent-600;
  }
  .q-badge {
    top: -10px;
    right: -17px;
    font-size: 16px;
    line-height: 18px;
    min-height: 20px;
    width: 20px;
    padding: initial;
    justify-content: center;
  }
}

.border {
  border-left: 3px solid transparent;

  &.pink {
    border-color: #eebedb;
  }
  &.blue {
    border-color: #beccee;
  }
}
.border-btn {
  border: 1px solid #b2a9a9;
  border-radius: 10px;
}
</style>
