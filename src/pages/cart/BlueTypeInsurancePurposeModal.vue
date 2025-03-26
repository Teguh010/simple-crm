<script lang="ts" setup>

import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { calculateDays } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { ref } from 'vue'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import useCartDetailStore from '@/stores/cart-details'

const cartStore = useCartStore()
const { getCart } = storeToRefs(cartStore)

const emits = defineEmits(['close'])
const props = defineProps({ callBack: Function, pet: Object })

const dateEndOptions = (date) => {
  return date >= processData.value.date_ins_type3_start
}

const processData = ref({})

const closeModal = () => {
  emits('close')
}


const calculateDays1 = (date_start, date_end) => {
  return calculateDays(date_start, date_end)
}

const handleCheckbox = async () => {

  const pet = props.pet
  

  if (!processData.value.type_insurance_purpose) {
    await mtUtils.alert('保険区分を選択してください。')
    return
  }

  if (!processData.value.days_ins_type2 && !processData.value.days_ins_type3 && !processData.value.total_ins_type4) {

    await mtUtils.alert('保険期間を選択してください。')

    return
  }

  let formattedData = []

  for (const date in pet.dates) {
    if (pet.dates.hasOwnProperty(date)) {
      pet.dates[date].filter((cd) => cd.checked).forEach((cartDetail) => {

        const disease_insurer = null

        let temp_disease_out_list = []
        // console log
        if (getCart?.value.pet_insurance) {
          if (getCart?.value.pet_insurance.id_disease_insurer_out1) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out1
            )
          }

          if (getCart?.value.pet_insurance.id_disease_insurer_out2) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out2
            )
          }

          if (getCart?.value.pet_insurance.id_disease_insurer_out3) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out3
            )
          }
        }

        if (cartDetail.type_tax == 1) {
          cartDetail.flg_pet_insurance = true
          cartDetail.type_insurance_purpose = 1
        }

        const tempObj = {
          id_cart_detail: cartDetail.id_cart_detail,
          flg_pet_insurance: cartDetail.flg_pet_insurance,
          id_cart: cartDetail.id_cart,
          type_insurance_purpose: processData.value.type_insurance_purpose,
          date_order_start: cartDetail.date_order_start,
          date_order_end: cartDetail.date_order_end,
          flg_disease_out: false,
          name_ins1: null,
          name_ins2: null,
          flg_group_title: cartDetail.flg_group_title,
          type_tax: cartDetail.type_tax
        }

        if (cartDetail?.id_disease) {
          const insuredDiseaseByTypeInsurer =
            cartDetail?.disease?.disease_insurer_list.filter(
              (v: any) =>
                v.code_func1 == getCart?.value?.pet_insurance?.code_insurer
            )

          if (
            insuredDiseaseByTypeInsurer &&
            insuredDiseaseByTypeInsurer.length > 0
          ) {
            const tempDiseaseInsured = insuredDiseaseByTypeInsurer[0]
            tempObj.name_ins1 = tempDiseaseInsured.text1
            tempObj.name_ins2 = tempDiseaseInsured.name_common
          }
        }


        const diseaseOutList = temp_disease_out_list.filter((disease) =>
          cartDetail?.disease?.id_disease_insurer.includes(disease)
        )

        if (diseaseOutList && diseaseOutList.length > 0) {
          tempObj.type_insurance_purpose = 1
          tempObj.flg_pet_insurance = false
          tempObj.flg_disease_out = true
        }

        formattedData.push(tempObj)
      })
    }
  }


  await cartStore.updateCartInsurance(getCart.value.id_cart, {
    date_ins_type2: processData.value.date_ins_type2,
    days_ins_type2: processData.value.days_ins_type2,
    date_ins_type3_start: processData.value.date_ins_type3_start,
    date_ins_type3_end: processData.value.date_ins_type3_end,
    days_ins_type3: processData.value.days_ins_type3,
    date_ins_type4: processData.value.date_ins_type4,
    total_ins_type4: processData.value.total_ins_type4
  })

  await useCartDetailStore().bulkUpdateFlgPetInsurance(formattedData)
  closeModal()
}


</script>

<template>
  <q-card class="mt-small-popup">
    <MtModalHeader class="bg-light-blus" @close-modal="closeModal">
      <div class="full-width">保険区分の調整</div>
    </MtModalHeader>
    <div class="flex columns q-pb-md justify-around">
      <MtFormRadiobtn v-model:selected="processData.type_insurance_purpose" label="通院" val="2" @update:selected="()=>{
        const tempDays = getCart.cart_details.find((v) => v?.flg_pet_custody)
        if(tempDays){
          processData.date_ins_type2 = tempDays.date_order_start
          processData.days_ins_type2 = 1
        }
      }" />
      <MtFormRadiobtn v-model:selected="processData.type_insurance_purpose" label="入院" val="3" @update:selected="async ()=>{
          const tempDays = getCart.cart_details.find((v) => v?.flg_pet_custody)
          if (!tempDays) {
            await mtUtils.alert('保険入院の会計には「預り管理」にチェックが入っている治療サービス（入院オーダー）を1明細のみ含めてください。\n該当する明細の開始日・終了日は入院開始/終了日を設定してください。')
            processData.type_insurance_purpose = null
            return
          }
          if (tempDays) {
            processData.days_ins_type2 = null
            processData.date_ins_type3_start = tempDays.date_order_start
            processData.date_ins_type3_end = tempDays.date_order_end
            processData.days_ins_type3 = calculateDays1(tempDays.date_order_start, tempDays.date_order_end)
            
            getCart.date_ins_type3_start = tempDays.date_order_start
            getCart.date_ins_type3_end = tempDays.date_order_end
            getCart.days_ins_type3 = calculateDays1(tempDays.date_order_start, tempDays.date_order_end)
          }
      }" />
      <MtFormRadiobtn v-model:selected="processData.type_insurance_purpose" label="手術" val="4" @update:selected="()=>{
        processData.days_ins_type2 = null
      }" />
    </div>

    <div class="q-ma-md">
      <div v-if="processData.type_insurance_purpose == 2" class="col-lg-12 col-md-12 col-sm-12">
        <div class="flex row justify-center  ">
          <MtFormInputDate
            v-model:date="processData.date_ins_type2"
            autofocus
            class="q-mr-md col-4"
            label="予定日：Start"
            outlined
            type="date"
            @clear="()=> processData.days_ins_type2 = null"
            @select-date="()=>{
              processData.days_ins_type2 = 1
            }"
          />
          <span class="flex content-center justify-center">  </span>
          <MtInputForm
            v-model="processData.days_ins_type2"
            :disable="!processData.date_ins_type2"
            class="q-ml-md col-4"
            label="通院日数"
            outlined
            type="number"
          />
        </div>
      </div>
      <div v-if="processData.type_insurance_purpose == 3" class="col-lg-12 col-md-12 col-sm-12">
        <div class="grid q-mb-md">
          <MtFormInputDate
            v-model:date="processData.date_ins_type3_start"
            label="入院日"
            outlined
            @update:date="
                  (value) => {
                    if (!value){ 
                      processData.date_ins_type3_end = null; 
                      processData.days_ins_type3 = '' 
                      return
                    }
                    processData.date_ins_type3_end = processData.date_ins_type3_start
                    processData.days_ins_type3 = calculateDays(
                      processData.date_ins_type3_start,
                      processData.date_ins_type3_end,
                      1
                    )
                  }
                "

          >
          </MtFormInputDate>
          <span class="flex content-center justify-center">
             〜
          </span>
          <MtFormInputDate
            v-model:date="processData.date_ins_type3_end"
            :options="dateEndOptions"
            class="q-mr-md"
            label="退院日"
            outlined
            @update:date="
                  () => {
                    processData.days_ins_type3 = calculateDays(
                      processData.date_ins_type3_start,
                      processData.date_ins_type3_end,
                      1
                    )
                  }
                "
          >
          </MtFormInputDate>
          <MtInputForm
            v-model="processData.days_ins_type3"
            :disable="true"
            label="通院日数"
            outlined
            type="number"
          />
        </div>
      </div>
      <div v-if="processData.type_insurance_purpose == 4" class="flex justify-center q-mb-md">
        <div>
          <MtFormInputDate
            v-model:date="processData.date_ins_type4"
            autofocus
            class="q-mr-md"
            label="予定日：Start"
            outlined
            type="date"
          />
        </div>
        <span class="flex content-center justify-center">
           
        </span>
        <div>
          <MtInputForm
            v-model="processData.total_ins_type4"
            :disable="!processData.date_ins_type4"
            class="q-ml-md"
            label="手術回数"
            outlined
            type="number"
          />
        </div>
      </div>
    </div>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="handleCheckbox">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 35% 6% 35% 24%;
  justify-content: center;
}

.grid-check {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px
}

</style>