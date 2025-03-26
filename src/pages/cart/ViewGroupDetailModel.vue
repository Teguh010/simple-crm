<script lang="ts" setup>

import { setPageTitle } from '@/utils/pageTitleHelper'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { isBitSet } from '@/utils/aahUtils'
import { typeInsurancePurpose } from '@/utils/enum'
import aahValidations from '@/utils/aahValidations'
import { formatDecimalNumber, formatNumber } from '@/utils/helper'
import useCommonStore from '@/stores/common'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import UpdateCartDetailModal from '@/pages/cart/UpdateCartDetailModal.vue'
import selectOptions from '@/utils/selectOptions'
import { computed } from 'vue'
import useCartDetailStore from '@/stores/cart-details'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

const props = defineProps({
  cartDetail: Object,
  pet: Object,
  handleCallBackCheck: Function,
  handleCallBackSelection: Function
})

const emits = defineEmits(['close'])

const cartStore = useCartStore()

const { getCart } = storeToRefs(cartStore)


const openCartDetailModal = async (cartDetail) => {
  await mtUtils.mediumPopup(UpdateCartDetailModal, {
    data: getCart.value,
    cartDetail: cartDetail,
    allData: getCart.value?.cart_details
  })
}


const getCartBillingData = (isSpecialCase: any = false) => {
  return {
    special_case: isSpecialCase,
    ch_disc_rate: getCart.value.ch_disc_rate,
    cart_payment_this_time: getCart.value.cart_payment_this_time,
    type_price_adjustment: getCart.value.type_price_adjustment,
    total_adjustment_intax: getCart.value.total_adjustment_intax,
    date_ins_type2: getCart.value.date_ins_type2,
    days_ins_type2: getCart.value.days_ins_type2,
    date_ins_type3_start: getCart.value.date_ins_type3_start,
    date_ins_type3_end: getCart.value.date_ins_type3_end,
    days_ins_type3: getCart.value.days_ins_type3,
    date_ins_type4: getCart.value.date_ins_type4,
    total_ins_type4: getCart.value.total_ins_type4
  }
}

async function removeDetail(v: any = null) {

  const responseMerge = await mtUtils.callApi(selectOptions.reqMethod.POST, 'merge_cart_details/remove-cart-detail', {
    id_cart_detail_parent: props.cartDetail.id_cart_detail,
    id_cart_detail: v.id_cart_detail
  })

  if (responseMerge) {
    props.cartDetail.group_detail.id_cart_detail_list = props.cartDetail.group_detail.id_cart_detail_list.filter(cd => cd != v.id_cart_detail)
  }

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value?.id_cart, getCartBillingData())
  ])
}

const updateCartDetail = async (cartDetail) => {
  await useCartDetailStore().updateCartDetail(cartDetail.id_cart_detail, {
    date_order_start: cartDetail.date_order_start,
    name_cart_item_display: cartDetail.name_cart_item_display
  }, true)
  closeModal()
}

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

const closeModal = () => {
  emits('close')
  setPageTitle('会計一覧')
}

</script>

<template>
  <q-form @submit="updateCartDetail(cartDetail)">
    <MtModalHeader @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none col-auto">
        統合した明細
      </q-toolbar-title>
      <q-space />
    </MtModalHeader>
    <q-card-section class="content q-px-lg">
      <div class="q-ml-md q-mb-md">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="cartDetail.date_order_start"
              :disable="disable"
              :options="dateStartOptions"
              :readonly="UiDisable"
              :rules="[aahValidations.validationRequired]"
              :tabindex="100"
              autofocus
              label="サービス開始日 *"
              required
              type="date"
            />
          </div>
          <div class="col-9">
            <MtInputForm
              v-model="cartDetail.name_cart_item_display"
              :rules="[aahValidations.validationRequired, maxTwentyCharacters]"
              autofocus
              input-class="cart-item-title bg-accent-100"
              label="明細表示名 *"
              placeholder="帳票表示の名称"
              required
              tabindex="410"
              type="text"
            />
          </div>
        </div>
        <span class="caption1 regular text-grey-800 q-my-md">
          X ボタン押下で個別明細を統合から解除します。
        </span>
      </div>
      <div
        v-for="(v, cartIndex) in getCart.cart_details?.filter((cd) => props.cartDetail.group_detail.id_cart_detail_list.includes(cd.id_cart_detail))"
        :key="v.id_cart_detail">
        <q-list>
          <q-item class="text-grey-800 q-py-xs" tag="cartDetail">
            <q-item-section>
              <!-- Service detail block here -->
              <div
                v-if="v.id_service_detail"
                class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                style="border-left: 6px solid #eebedb"
              >
                <div class="row items-center full-width">
                  <div
                    class="col-5 text-left"
                    @click="openCartDetailModal(v)"
                  >
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                    <div class="caption1 regular q-mt-sm">
                      {{ v.memo_cart_detail }}
                    </div>
                    <div class="caption1 regular q-mt-sm flex items-center">
                      {{ v.flg_discount == true ? '割引対象' : '' }}
                      {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                      {{ v.type_tax == 3 ? '非課税' : '' }}
                    </div>
                  </div>
                  <div v-show="!v.flg_group_title"
                       class="col-2 text-right"
                       @click="openCartDetailModal(v)"
                  >
                    <div v-if="!v.flg_merged">
                          <span class="body2 regular">
                            ¥
                            {{ formatNumber(v.unit_sales) }}
                          </span>
                      <span class="caption2"> x </span>
                      {{ formatDecimalNumber(v.quantity) }}
                    </div>
                    <div class="title1 bold">
                      ¥
                      {{
                        formatNumber(
                          v.type_tax == 1
                            ? v.vat10_amount_sales
                            : v.type_tax == 2
                              ? v.vat08_amount_sales
                              : v.type_tax == 3
                                ? v.tax_exempt_amount_sales
                                : ''
                        )
                      }}
                    </div>
                  </div>
                  <div
                    v-if="false"
                    class="col-2 text-center"
                  >
                    <div
                      v-if="
                            getCart.id_pet_insurance &&
                            !isBitSet(
                              v.type_insurer,
                              getCart?.pet_insurance?.code_insurer
                            )
                          "
                      class="caption2 regular flex items-center"
                    >
                      {{
                        useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                          (item) =>
                            item.code_func1 ==
                            getCart?.pet_insurance?.code_insurer
                        )?.name_common
                      }}
                      <br />
                      <span class="text-danger q-pt-xs"
                      >※ 保険対象外</span
                      >
                    </div>
                    <template v-else>
                      <div
                        v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                      >
                        <MtFormCheckBox
                          v-if="v.type_tax == 1"
                          v-model:checked="v.flg_pet_insurance"
                          label="保険適用"
                          @update:checked="
                            (newVal) =>
                              handleCallBackCheck(
                                newVal,
                                pet,
                                v,
                                'RQ_SD'
                              )
                          "
                          :disable="true"
                        />
                        <small v-else class="flex">
                          ※ 保険適用は10% 商品のみ
                        </small>
                      </div>
                    </template>
                  </div>
                  <div
                    v-if="v.flg_disease_out"
                    class="col-2 text-center text-red"
                  >
                    除外傷病の項目のため保険適用できません
                  </div>
                  <div v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                       class="col-2 q-pl-md"
                  >
                    <MtFormCheckBox
                      v-if="v.type_tax == 1"
                      v-model:checked="v.flg_pet_insurance"
                      :disable="true"
                      label="保険適用"
                      @update:checked="
                                (newVal) =>
                                  handleCallBackCheck(newVal, pet, v, 'RQ_SD')
                              "
                    />
                    <small v-else class="flex">
                      ※ 保険適用は10% 商品のみ
                    </small>
                  </div>
                  <div v-if="v.flg_pet_insurance" class="col-2">
                    <div>
                      <MtFormPullDown
                        v-model:selected="v.type_insurance_purpose"
                        :options="typeInsurancePurpose"
                        :readonly="true"
                        :rules="[aahValidations.validationSelection]"
                        class="bg-grey-100"
                        label=""
                        outlined
                        required
                        @update:selected="
                              (newVal) => handleCallBackSelection(newVal, pet, v)
                            "
                      />
                    </div>
                  </div>
                  <div v-if="!v.flg_pet_insurance" class="col-2"></div>
                  <div class="col-1 flex justify-end">
                    <q-icon name="close" size="xs" @click="removeDetail(v)" />
                  </div>
                </div>
              </div>
              <!-- Prescription block here -->
              <div
                v-else-if="v.id_prescription_detail"
                class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                style="border-left: 6px solid #beccee"
              >
                <div class="row items-center full-width">
                  <div class="col-4 text-left"
                    @click="openCartDetailModal(v)"
                  >
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                    <div class="caption1 regular q-mt-sm">
                          <span v-if="v.id_prescription_detail.total_days_dose">
                            総服用日数：
                            {{
                              formatDecimalNumber(
                                v.id_prescription_detail.total_days_dose
                              )
                            }}日間</span
                          >
                      <span
                        v-if="v.id_prescription_detail.total_amount_dose"
                        class="q-px-md"
                      >
                            総服用回数：
                            {{
                          formatDecimalNumber(
                            v.id_prescription_detail.total_amount_dose
                          )
                        }}回</span
                      >
                    </div>
                    <div class="caption1 regular q-my-sm flex items-center">
                      {{ v.flg_discount == true ? '割引対象' : '' }}
                      {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                      {{ v.type_tax == 3 ? '非課税' : '' }}
                    </div>
                    <div
                      v-if="v.memo_cart_detail"
                      class="caption1 regular q-mt-sm"
                    >
                      {{ v.memo_cart_detail }}
                    </div>
                  </div>
                  <div class="col-2 text-right"
                    @click="openCartDetailModal(v)"
                  >
                    <div class="title1 bold">
                      ¥
                      {{
                        formatNumber(
                          v.type_tax == 1
                            ? v.vat10_amount_sales
                            : v.type_tax == 2
                              ? v.vat08_amount_sales
                              : v.type_tax == 3
                                ? v.tax_exempt_amount_sales
                                : ''
                        )
                      }}
                    </div>
                  </div>
                  <div class="col-1"></div>
                  <div v-if="v.flg_disease_out" class="col-2 text-center text-red">
                    除外傷病の項目のため保険適用できません
                  </div>
                  <div class="col-2">
                    <MtFormCheckBox
                      v-model:checked="v.flg_pet_insurance"
                      :disable="true"
                      label="保険適用"
                      @update:checked="(newVal) => handleCallBackCheck(
                          newVal, pet, v, 'RQ_PD')"
                    />
                  </div>
                  <div v-if="v.flg_pet_insurance" class="col-2">
                    <div>
                      <MtFormPullDown
                        v-model:selected="v.type_insurance_purpose"
                        :options="typeInsurancePurpose"
                        :readonly="true"
                        :rules="[aahValidations.validationSelection]"
                        class="bg-grey-100"
                        label=""
                        outlined
                        required
                        @update:selected="
                              (newVal) => handleCallBackSelection(newVal, pet, v)
                            "
                      />
                    </div>
                  </div>
                  <div class="col-1 flex justify-center">
                    <q-icon name="close" size="xs" @click="removeDetail(v)" />
                  </div>
                </div>
              </div>
              <!-- Not linked to Requet Cart details here -->
              <div
                v-else
                class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                style="border-left: 6px solid #9e9e9e"
              >
                <div v-if="v.flg_group_title" class="row items-center full-width">
                  <div class="col-5 text-left">
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                  </div>
                  <div class="col-1 flex justify-end">
                    <q-icon name="close" size="xs" @click="removeDetail(v)" />
                  </div>
                </div>
                <div v-else class="row items-center full-width">
                  <div class="col-5 text-left" @click="openCartDetailModal(v)">
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                    <div class="caption1 regular q-mt-sm">
                      {{ v.memo_cart_detail }}
                    </div>
                    <div class="caption1 regular q-mt-sm flex items-center">
                      {{ v.flg_discount == true ? '割引対象' : '' }}
                      {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                      {{ v.type_tax == 3 ? '非課税' : '' }}
                    </div>
                  </div>
                  <div class="col-2 text-right">
                        <span class="body2 regular">
                          ¥
                          {{ formatNumber(v.unit_sales) }}
                        </span>
                    <span class="caption2"> x </span>
                    {{ formatDecimalNumber(v.quantity) }}
                    <div class="title1 bold">
                      ¥
                      {{
                        formatNumber(
                          v.type_tax == 1
                            ? v.vat10_amount_sales
                            : v.type_tax == 2
                              ? v.vat08_amount_sales
                              : v.type_tax == 3
                                ? v.tax_exempt_amount_sales
                                : ''
                        )
                      }}
                    </div>
                  </div>
                  <div v-if="!v.flg_pet_insurance" class="col-1"></div>
                  <div v-if="false" class="col-2 text-center">
                    <div v-if="getCart.id_pet_insurance &&
                            !isBitSet(
                              v.type_insurer,
                              getCart?.pet_insurance?.code_insurer
                            )
                          "
                      class="caption2 regular text-grey-700 flex items-center"
                    >
                      {{
                        useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                          (item) =>
                            item.code_func1 ==
                            getCart?.pet_insurance?.code_insurer
                        )?.memo_etc1
                      }}
                      <br />
                      <span class="text-danger q-pt-xs">※ 保険対象外</span>
                    </div>
                    <template v-else>
                      <div
                        v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                        class="col-2 q-pl-md"
                      >
                        <MtFormCheckBox
                          v-if="v.type_tax == 1"
                          v-model:checked="v.flg_pet_insurance"
                          :disable="true"
                          label="保険適用"
                          @update:checked="
                                (newVal) =>
                                  handleCallBackCheck(newVal, pet, v, 'RQ_PD')
                              "
                        />
                        <small v-else class="flex">
                          ※ 保険適用は10% 商品のみ
                        </small>
                      </div>
                    </template>
                  </div>
                  <div v-if="pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                       class="col-2 q-pl-md"
                  >
                    <MtFormCheckBox
                      v-if="v.type_tax == 1"
                      v-model:checked="v.flg_pet_insurance"
                      :disable="true"
                      label="保険適用"
                      @update:checked="
                                (newVal) =>
                                  handleCallBackCheck(newVal, pet, v, 'RQ_PD')
                              "
                    />
                    <small v-else class="flex">
                      ※ 保険適用は10% 商品のみ
                    </small>
                  </div>
                  <div
                    v-if="v.flg_disease_out"
                    class="col-2 text-center text-red"
                  >
                    除外傷病の項目のため保険適用できません
                  </div>
                  <div v-if="v.flg_pet_insurance" class="col-2">
                    <div>
                      <MtFormPullDown
                        v-model:selected="v.type_insurance_purpose"
                        :options="typeInsurancePurpose"
                        :readonly="true"
                        :rules="[aahValidations.validationSelection]"
                        class="bg-grey-100"
                        label=""
                        outlined
                        required
                        @update:selected="
                              (newVal) => handleCallBackSelection(newVal, pet, v)
                            "
                      />
                    </div>
                  </div>
                  <div class="col-1 flex justify-end">
                    <q-icon name="close" size="xs" @click.prevent="removeDetail(v)" />
                  </div>
                </div>
              </div>
              <div
                v-else
                class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                style="border-left: 6px solid #9e9e9e"
                @click="openCartDetailModal(v)"
              >
                <div v-if="v.flg_group_title" class="row items-center full-width">

                  <div class="col-10 text-left">
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                  </div>
                  <div class="col-1 flex justify-end">
                    <q-icon name="close" size="xs" @click="removeDetail(v)" />
                  </div>
                </div>
                <div v-else class="row items-center full-width">
                  <div class="col-5 text-left">
                    <div class="title2 bold">
                      {{ v.name_cart_item_display }}
                    </div>
                    <div class="caption1 regular q-mt-sm">
                      {{ v.memo_cart_detail }}
                    </div>
                    <div class="caption1 regular q-mt-sm flex items-center">
                      {{ v.flg_discount == true ? '割引対象' : '' }}
                      {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                      {{ v.type_tax == 3 ? '非課税' : '' }}
                    </div>
                  </div>
                  <div class="col-2 text-right">
                        <span class="body2 regular">
                          ¥
                          {{ formatNumber(v.unit_sales) }}
                        </span>
                    <span class="caption2"> x </span>
                    {{ formatDecimalNumber(v.quantity) }}
                    <div class="title1 bold">
                      ¥
                      {{
                        formatNumber(
                          v.type_tax == 1
                            ? v.vat10_amount_sales
                            : v.type_tax == 2
                              ? v.vat08_amount_sales
                              : v.type_tax == 3
                                ? v.tax_exempt_amount_sales
                                : ''
                        )
                      }}
                    </div>
                  </div>
                  <div v-if="false" class="col-2 text-center">
                    <div
                      v-if="
                            getCart.id_pet_insurance &&
                            !isBitSet(
                              v.type_insurer,
                              getCart?.pet_insurance?.code_insurer
                            )
                          "
                      class="caption2 regular text-grey-700 flex items-center"
                    >
                      {{
                        useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                          (item) =>
                            item.code_func1 ==
                            getCart?.pet_insurance?.code_insurer
                        )?.memo_etc1
                      }}
                      <br />
                      <span class="text-danger q-pt-xs">※ 保険対象外</span>
                    </div>
                    <template v-else>
                      <div
                        v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                      >
                        <MtFormCheckBox
                          v-if="v.type_tax == 1"
                          v-model:checked="v.flg_pet_insurance"
                          :disable="true"
                          label="保険適用"
                          @update:checked="
                                (newVal) =>
                                  handleCallBackCheck(newVal, pet, v, 'RQ_PD')
                              "
                        />
                        <small v-else class="flex">
                          ※ 保険適用は10% 商品のみ
                        </small>
                      </div>
                    </template>
                  </div>
                  <div
                    v-if="v.flg_disease_out"
                    class="col-2 text-center text-red"
                  >
                    除外傷病の項目のため保険適用できません
                  </div>
                  <div v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                       class="col-2 q-pl-md"
                  >
                    <MtFormCheckBox
                      v-if="v.type_tax == 1"
                      v-model:checked="v.flg_pet_insurance"
                      :disable="true"
                      label="保険適用"
                      @update:checked="
                                (newVal) =>
                                  handleCallBackCheck(newVal, pet, v, 'RQ_PD')
                              "
                    />
                    <small v-else class="flex">
                      ※ 保険適用は10% 商品のみ
                    </small>
                  </div>
                  <div v-if="v.flg_pet_insurance" class="col-2">
                    <div>
                      <MtFormPullDown
                        v-model:selected="v.type_insurance_purpose"
                        :options="typeInsurancePurpose"
                        :readonly="true"
                        :rules="[aahValidations.validationSelection]"
                        class="bg-grey-100"
                        label=""
                        outlined
                        required
                        @update:selected="
                              (newVal) => handleCallBackSelection(newVal, pet, v)
                            "
                      />
                    </div>
                  </div>
                  <div v-if="!v.flg_pet_insurance" class="col-2"></div>
                  <div class="col-1 flex justify-end">
                    <q-icon name="close" size="xs" @click="removeDetail(v)" />
                  </div>
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>

</style>