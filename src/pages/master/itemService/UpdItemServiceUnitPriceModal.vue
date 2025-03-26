<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import { getDateToday, roundZeroAfterPoint } from '@/utils/aahUtils'
import { api } from '@/boot/axios'
import OptionModal from '@/components/OptionModal.vue'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import useModalStore from '@/stores/modal'

const modalStore = useModalStore()
const props = defineProps({
  priceObj: Object,
  idItemServiceUnit: Number,
  ItemService: Object,
  modalName: String,
  callBack: Function
})
const emit = defineEmits(['close'])

type priceFormType = {
  id_price: Number | null
  price: string
  id_manufacturer: string
  id_item_service_unit: Number | null
  memo_price: string
  date_start: string
  date_end: string
  display_order: number | null
  flg_delete: boolean
  flg_unit_purchase: boolean
  id_price_UI:Number | null
}


const data = ref<priceFormType>({
  id_price: null,
  price: '',
  flg_unit_purchase: false,
  id_manufacturer: '',
  id_item_service_unit: null,
  memo_price: '',
  date_start: getDateToday(),
  date_end: '9999-01-01',
  display_order: null,
  flg_delete: false,
  id_price_UI:null
})

const tab = ref('unit_price')
const isEdit = ref(false)
const originalDateStart = ref<string>('')
const originalDateEnd = ref<string>('')
const dateValidationError = ref<string | null>(null)

const closeModal = () => {
  emit('close')
}

const onTabChange = (val: string) => {
  data.value.flg_unit_purchase = val === 'unit_purchase'
}

const computedPrices = computed(() => {
  if (!props.ItemService || !props.ItemService.length) {
    return { previousPrice: null, nextPrice: null }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sorted = [...props.ItemService].sort((a, b) =>
    new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  )
  const previousPrice = sorted
    .filter((p) => new Date(p.date_end) < today)
    .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime())[0]

  const nextPrice = sorted
    .filter((p) => new Date(p.date_start) > today)
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())[0]

  return { previousPrice, nextPrice }
})

const parseDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date()
  }
  const parts = dateStr.split(/[-\/]/)
  if (parts.length < 3) {
    return new Date()
  }
  const year = Number(parts[0])
  const month = Number(parts[1]) - 1
  const day = Number(parts[2])
  return new Date(year, month, day)
}
watch(
  () => [data.value.date_start, data.value.date_end],
  ([newStartStr, newEndStr]) => {
    if (
      isEdit.value &&
      newStartStr === originalDateStart.value &&
      newEndStr === originalDateEnd.value
    ) {
      dateValidationError.value = null
      return
    }

    const newStart = parseDate(newStartStr)
    const newEnd = parseDate(newEndStr)

    // Validating  the start date is not after the end date.
    if (newStart > newEnd) {
      dateValidationError.value = "開始日付は終了日付より前でなければなりません。"
      return
    }

    // Checking for overlapping ranges with existing pricing records.
    if (props.ItemService && props.ItemService.length) {
      for (const record of props.ItemService) {
        // In edit mode, skip the record being edited.
        if (isEdit.value && record.id_price === data.value.id_price) continue

        const recordStart = parseDate(record.date_start)
        const recordEnd = parseDate(record.date_end)
        // If the new range overlaps an existing range:
        if (newStart <= recordEnd && newEnd >= recordStart) {
          dateValidationError.value = "指定された期間は既存の価格履歴と重複しています。"
          return
        }
      }
    }
    dateValidationError.value = null
  }
)
function generateRandomId() {
  return `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

const submit = async () => {
  if (dateValidationError.value) {
    mtUtils.autoCloseAlert(dateValidationError.value)
    return
  }
  try {
    data.value.id_item_service_unit = props.idItemServiceUnit

    if (!props.idItemServiceUnit) {
      data.value.id_price_UI = generateRandomId();

      if (props.callBack) {
        const newData = { ...data.value };
        delete newData.id_price;
        props.callBack(newData);
        emit('close')
      }
      return
    }
    const endpoint = isEdit.value
      ? `mst/item_service_unit_price/${data.value.id_price}`
      : 'mst/item_service_unit_price';

    const response = isEdit.value
      ? await api.put(endpoint, data.value)
      : await api.post(endpoint, data.value);


    if (response?.data?.data?.id_price) {
      await mtUtils.autoCloseAlert(aahMessages.success);
      emit('close', response.data);
      return;
    }

    await mtUtils.autoCloseAlert(aahMessages.failed)
  } catch (error) {
    console.error('Error in submit:', error);
    await mtUtils.autoCloseAlert(error.response?.data?.data || '更新に失敗しました')
  }
};

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

  let selectedOption = menuOptions.find((i) => i.isChanged === true)

  if (selectedOption && selectedOption.name === 'delete') {
    modalStore.open({
      component: ExtraConfirmationModal,
      data: {
        submitFn: async () => {
          modalStore.toggleLoading(true)
          try {
            const endpoint = `mst/item_service_unit_price/${data.value.id_price}`
            await api.delete(endpoint)
            modalStore.close()
            emit('close')
            mtUtils.autoCloseAlert(aahMessages.success)
          } catch (error) {
            console.error('Error deleting price record:', error)
            mtUtils.autoCloseAlert(error.response?.data?.data || '削除に失敗しました')
          } finally {
            modalStore.toggleLoading(false)
          }
        }
      }
    })
  }
}


onMounted(() => {
  if (props.priceObj && props.priceObj.id_price) {
    isEdit.value = true
    data.value = { ...props.priceObj }
    tab.value = data.value.flg_unit_purchase ? 'unit_purchase' : 'unit_price'
  }

})
</script>

<template>
  <q-form @submit="submit">
    <div class="price-modal">
      <MtModalHeader @closeModal="closeModal" class="modal-header">
      <q-toolbar-title class="text-grey-900 title2 bold" >
        {{props.modalName}}
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
      <q-btn flat dense icon="close" @click="closeModal" />
    </MtModalHeader>

      <div class="modal-content">
        <div class="tabs-section">
          <q-tabs
            v-model="tab"
            class="bg-grey-4"
            dense
            narrow-indicator
            @update:model-value="onTabChange"
          >
            <q-tab name="unit_price" label="販売単価" />
          </q-tabs>
        </div>

        <div class="price-form">
          <div class="form-section">
            <label>単価情報 :</label>
            <div class="date-inputs">
              <MtFormInputDate v-model:date="data.date_start" />
              <MtFormInputDate v-model:date="data.date_end" />
            </div>
            <div v-if="dateValidationError" class="error-message">
              {{ dateValidationError }}
            </div>
            <div class="price-input">
              <label>販売単価</label>
              <MtFormInputNumber2
                v-model:value="data.price"
                style="width: 240px;"
              />
            </div>
          </div>
          <div class="history-section">
            <!-- PREVIOUS -->
            <div class="previous-price">
              <label>前の期間 :</label>
              <div v-if="computedPrices.previousPrice" class="price-record">
                <span>
                  {{ computedPrices.previousPrice.date_start }} ~
                  {{ computedPrices.previousPrice.date_end }}
                </span>
                <span>
                  {{ roundZeroAfterPoint(computedPrices.previousPrice.price) }}
                </span>
              </div>
              <div v-else class="price-record">
                <span>データがありません。</span>
              </div>
            </div>

            <!-- NEXT -->
            <div class="future-price">
              <label>後の期間 :</label>
              <div v-if="computedPrices.nextPrice" class="price-record">
                <span>
                  {{ computedPrices.nextPrice.date_start }} ~
                  {{ computedPrices.nextPrice.date_end }}
                </span>
                <span>
                  {{ roundZeroAfterPoint(computedPrices.nextPrice.price) }}
                </span>
              </div>
              <div v-else class="price-record">
                <span>データがありません。</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <q-btn 
          outline 
          class="cancel-btn" 
          label="キャンセル" 
          @click="closeModal" 
        />
        <!-- Disable submit if validation error exists -->
        <q-btn 
          unelevated 
          class="save-btn" 
          label="保存" 
          type="submit" 
          :disable="dateValidationError !== null"
        />
      </div>
    </div>
  </q-form>
</template>

<style lang="scss" scoped>
.price-modal {
  background: white;
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 2px solid #b0a5a5;
    
    h3 {
      margin: 0;
      font-size: 1.2rem;
    }
  }

  .modal-content {
    padding: 1.5rem;

    .tabs-section {
      margin-bottom: 2rem;

      :deep(.q-tabs) {
        border-radius: 24px;
        padding: 4px;
      
        .q-tab {
          border-radius: 20px;
          padding: 8px 16px;
          min-height: unset;
          
          
          &--active {
            background: #333;
            color: white;
          }
        }

        .q-tab__indicator {
          display: none;
        }
      }
    }

    .price-form {
      .form-section {
        margin-bottom: 2rem;
        label {
          display: block;
          color: #666;
        }

        .date-inputs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .price-input {
          label {
            display: block;
            margin-bottom: -13px; 
            font-size: 0.9rem;  
            color: #666;
          }

        }
      }

      .history-section {
        color: #666;

        .price-record {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
      }
    }
  }

  .modal-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 16px 20px;
  border-top: 2px solid #b0a5a5;

  .cancel-btn {
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    color: rgba(0, 0, 0, 0.87);
    padding: 8px 24px;
    min-width: 150px;
    font-weight: normal;
  }

  .save-btn {
    background: #424242;
    border-radius: 4px;
    color: white;
    padding: 8px 24px;
    min-width: 150px;
    font-weight: normal;
  }
}
}
.error-message{
  color: red;
  margin-bottom: 4px;
}
</style>