<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, withDefaults } from 'vue'
import {
  concatenate,
  getPetFirstName,
  roundFloat,
  formatDate,
  getDateToday
} from '@/utils/aahUtils'
import { numberFormat } from '@/utils/helper'
import { ClinicType, PaymentReceipt as PaymentReceiptType } from '@/types/types'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import usePetStore from '@/stores/pets'
import useClinicStore from '@/stores/clinics'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'

const props = withDefaults(
  defineProps<{
    data: PaymentReceiptType
  }>(),
  {
    data: () => {
      return {} as PaymentReceiptType
    }
  }
)

const emits = defineEmits(['close'])

const clinicStore = useClinicStore()
const petStore = usePetStore()
const customerStore = useCustomerStore()
const { getPets } = storeToRefs(petStore)
const clinic = ref<ClinicType>()
const exportPdf = ref()

const paymentMethod = computed(() => {
  const methods = []
  if (props.data.flg_cash) {
    methods.push({
      label: '現金',
      breakdown: props.data.breakdown_cash,
      date: props.data.date_publish_cash
    })
  }
  if (props.data.flg_cc) {
    methods.push({
      label: 'クレジットカード',
      breakdown: props.data.breakdown_cc,
      date: props.data.date_publish_cc
    })
  }
  if (props.data.flg_bank_transfer) {
    methods.push({
      label: '振込',
      breakdown: props.data.breakdown_bank_transfer,
      date: props.data.date_publish_bank_transfer
    })
  }
  if (props.data.flg_payment_method) {
    methods.push({
      label: props.data.name_payment_method,
      breakdown: props.data.breakdown_payment_method,
      date: props.data.date_publish_payment_method
    })
  }
  return methods
})

const petData = computed(() => {
  return getPets.value.find((pet) => {
    return pet.id_pet === props.data.id_pet
  })
})

const generateReport = () => {
  let jsPDFOptions = { format: 'a5' }
  let customerName: any = customerStore.getAllCustomers.find(
    (customer: any) => customer.value === props.data.id_customer
  )?.name_customer_display
  exportPdf.value.generateReport(
    `${getDateToday()}_領収書_${customerName}様`,
    0,
    jsPDFOptions
  )
}

onMounted(async () => {
  clinic.value = await clinicStore.fetchClinicById(props.data.id_clinic)
  await nextTick(() => {
    generateReport()
    emits('close')
  })
})
</script>
<template>
  <div id="element-to-print" class="pdf-receipt-container">
    <PdfExport
      sheetName="_注文書"
      ref="exportPdf"
      orientationMode="landscape"
    />
    <header>
      <div class="header-section">
        <span class="title">領収書</span>
        <div class="header-information">
          <div class="customer-name">
            <p>
              {{ data.id_customer_name }}
            </p>
            <span>
              {{ getPetFirstName(petData) }}
            </span>
          </div>
          <div class="date-information">
            <span>発行日 {{ formatDate(data.datetime_publish) }}</span>
            <span>領収書番号 {{ data.number_payment_receipt }}</span>
          </div>
        </div>
      </div>
    </header>
    <main>
      <div class="main-information">
        <div class="receipt-information">
          <span class="amount"> 金額 </span>
          <span class="amount amount-large">
            ￥ {{ numberFormat(roundFloat(data.amount_receipt)) }}
          </span>
          <span class="no-tax"> (税込) </span>
        </div>
      </div>
      <div class="main-received">
        <span> 但 </span>
        <span class="mid">
          <template
            v-if="
              data.flg_proviso_medical_treatment ||
              data.flg_proviso_prescription ||
              data.flg_proviso_vaccine
            "
          >
            {{
              concatenate(
                data.flg_proviso_medical_treatment ? '診療代' : '',
                data.flg_proviso_prescription ? '処方箋代' : '',
                data.flg_proviso_vaccine ? 'ワクチン代' : ''
              )
            }}
          </template>
          <template v-else>
            {{ data.memo_proviso }}
          </template>
        </span>
        <span> として </span>
      </div>
      <span class="note"> 上記の金額、正に領収いたしました。 </span>
    </main>
    <div class="tax-information">
      <div class="tax-detail">
        <span class="title">内訳</span>
        <div class="tax">
          <span class="tax-amount">10%</span>
          <div class="details">
            <span class="detail">
              <span> 税別金額 </span>
              <span>
                {{
                  data.vat10_amount_receipt
                    ? `￥ ${numberFormat(
                        roundFloat(data.vat10_amount_receipt)
                      )}`
                    : '--'
                }}
              </span>
            </span>
            <span class="detail">
              <span> 消費税 </span>
              <span>
                {{
                  data.vat10_amount_receipt
                    ? `￥ ${numberFormat(roundFloat(data.tax10_amount))}`
                    : '--'
                }}
              </span>
            </span>
          </div>
        </div>
        <hr class="separator" />
        <div class="tax">
          <span class="tax-amount">8%</span>
          <div class="details">
            <div class="detail">
              <span> 税別金額 </span>
              <span>
                {{
                  data.vat10_amount_receipt
                    ? `￥
                  ${numberFormat(roundFloat(data.vat08_amount_receipt))}`
                    : '--'
                }}
              </span>
            </div>
            <div class="detail">
              <span> 消費税 </span>
              <span>
                {{
                  data.vat10_amount_receipt
                    ? `￥ ${numberFormat(roundFloat(data.tax08_amount))}`
                    : '--'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="payment-method">
        <span class="title">お支払い方法</span>
        <div
          v-for="(method, idx) in paymentMethod"
          :key="idx"
          class="payment-breakdown"
        >
          <p class="label">
            {{ method.label }}
          </p>
          <p>￥ {{ numberFormat(roundFloat(method.breakdown)) }}</p>
          <p>
            {{ method.date }}
          </p>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="notes">
        <span class="title"> 備考 </span>
        <span>
          {{ data.remarks }}
        </span>
      </div>
      <div class="logo">
        <div>
          <p class="text-body1 text-weight-bold">
            {{ clinic?.name_clinic_display }}
          </p>
          <p class="font-12px">
            {{
              concatenate(
                clinic?.address_prefecture,
                clinic?.address_city,
                clinic?.address_other
              )
            }}
          </p>
          <p class="font-12px">TEL: {{ clinic?.phone1 }}</p>
          <p v-if="clinic?.number_invoice_register" class="font-12px">
            登録番号: {{ clinic?.number_invoice_register }}
          </p>
        </div>
      </div>
      <div class="stamp">
        <span class="title"> 印紙 </span>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.pdf-receipt-container {
  background-color: $white;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-weight: 400;
  .header-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    .title {
      font-size: 24px;
      letter-spacing: 20px;
    }
    .header-information {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      line-height: 20px;
      .customer-name {
        width: 100%;
        max-width: 200px;
        p {
          font-size: 16px;
          line-height: 28px;
          margin: 0;
          border-bottom: 2px solid rgb(86, 86, 86);
        }
        span {
          font-size: 14px;
        }
      }
      .date-information {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  }
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    .main-information {
      background-color: rgba(64, 108, 192, 0.2);
      height: 50px;
      .receipt-information {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: $black;
        height: 100%;
        text-align: center;
        .amount {
          flex: 1;
          font-size: 16px;
        }
        .amount-large {
          font-size: 20px;
        }
        .no-tax {
          flex: 1;
          font-size: 12px;
        }
      }
    }
    .main-received {
      display: flex;
      gap: 12px;
      align-items: center;
      text-align: center;
      width: 100%;
      max-width: 60%;
      margin: 0 auto;
      .mid {
        flex: 1;
        height: 30px;
        border-bottom: 1px solid #406cc0;
      }
    }
    .note {
      text-align: center;
    }
  }
  .tax-information {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    div {
      flex: 1;
      &.tax-detail {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        .title {
          padding: 2px 8px;
          background-color: rgba(64, 108, 192, 0.2);
          line-height: 16px;
          letter-spacing: 2px;
          text-align: center;
        }
        .tax {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          .tax-amount {
            width: 20%;
          }
          .details {
            display: flex;
            flex: 1;
            flex-direction: column;
            .detail {
              display: flex;
              justify-content: space-between;
            }
          }
        }
      }
      &.payment-method {
        .title {
          text-align: center;
          padding: 2px 8px;
          background-color: rgba(64, 108, 192, 0.2);
          line-height: 16px;
        }
        .payment-breakdown {
          p {
            margin: 0;
          }
          .label {
            flex: 1;
          }
          display: flex;
          justify-content: space-between;
          gap: 24px;
        }
      }
    }
  }
  .footer {
    display: flex;
    align-items: flex-end;
    gap: 32px;
    .notes {
      .title {
        background-color: transparent;
        letter-spacing: 0;
      }
      display: flex;
      flex-direction: column;
      padding: 2px 8px;
      width: 100%;
      max-width: 270px;
      border: 1px solid #406cc0;
      border-radius: 3px;
      height: 70px;
    }
    .logo {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: flex-start;
      p {
        margin: 0;
      }
    }
    .stamp {
      display: inline-flex;
      justify-content: flex-end;
      padding: 0 20px 0;
      .title {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background-color: transparent;
        letter-spacing: 0;
        border: 1px dashed #406cc0;
        height: 80px;
        width: 70px;
      }
    }
  }
  .separator {
    width: 100%;
    border-top: 1px solid #e0e0e0;
  }
}
</style>
