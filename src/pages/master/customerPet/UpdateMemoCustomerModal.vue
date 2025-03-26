<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import OptionModal from '@/components/OptionModal.vue'
import useMemoCustomerStore from '@/stores/memo-customer'
import { typeMemoCustomer } from '@/utils/enum'
import { MemoCustomerType } from '@/types/types'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import {
  getDateToday
} from '@/utils/aahUtils'
import { TypeMemoCustomer } from '@/stores/memo-customer'

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

const props = defineProps({
  id_customer: String,
  data: {},
  flgDuplicate: Boolean
})

const memoCustomerStore = useMemoCustomerStore()

const isEdit = ref<boolean>(false)

const memoCustomerData = reactive<MemoCustomerType>({
  id_customer: props.id_customer,  
  type_memo_customer: TypeMemoCustomer.MEMO,
  memo_text: '',
  flg_pin: false,
  flg_complete: false,
  date_complete: null,
  date_memo_customer: getDateToday()  
})

let defaultMemoCustomerData = {...memoCustomerData}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '複製する',
      name: 'duplicate',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
      .confirm(aahMessages.delete_ask, aahMessages.delete)
      .then((confirmation) => {
        if (confirmation) {
          memoCustomerStore.destroyMemoCustomer(memoCustomerData.id_memo_customer).then(() => {
            memoCustomerStore.fetchMemoCustomers({id_customer: props.id_customer}).then(() => {
              closeModal()
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          })
        }
      })
    }

    if(selectedOption.name == 'duplicate') {
      let duplicateMemoData = {
        id_customer: props.id_customer,
        type_memo_customer: memoCustomerData.type_memo_customer,
        memo_text: memoCustomerData.memo_text,
        flg_pin: memoCustomerData.flg_pin,
        flg_complete: false,
        date_complete: null,
        date_memo_customer: getDateToday()
      }
      localStorage.setItem('pageAction', 'duplicateCustomerMemo')
      localStorage.setItem('pageActionParam', JSON.stringify(duplicateMemoData))
      closeModal()
    }
  }       
}

const submit = () => {
  if(!isEdit.value) {
    memoCustomerStore.submitMemoCustomer(memoCustomerData).then(() => {
      memoCustomerStore.fetchMemoCustomers({id_customer: props.id_customer}).then(() => {
        closeModal()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
    })
  }
  else {
    memoCustomerStore.updateMemoCustomer(memoCustomerData.id_memo_customer, memoCustomerData).then(() => {
      memoCustomerStore.fetchMemoCustomers({id_customer: props.id_customer}).then(() => {
        closeModal()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
    })
  }
}

const assignPageData = (data: MemoCustomerType) => {
  for(let key in data) {
    memoCustomerData[key] = data[key]
  }
  nextTick(() => {
    defaultMemoCustomerData = {...memoCustomerData}
  })
}

const handleFlgComplete = (val: boolean) => {
  if(!val) memoCustomerData.date_complete = null
  else memoCustomerData.date_complete = getDateToday()
}

const handleTypeMemoCustomer = (val: number) => {
  if(val == 1) {
    memoCustomerData.flg_complete = false
    memoCustomerData.date_complete = null
  }
}

const handleFlgPin = () => {
  memoCustomerData.flg_pin = !memoCustomerData.flg_pin
}

const MODAL_CONTENT_CLASS = ref('memo-customer-content')

const handleOutsideClick = async (e: MouseEvent | TouchEvent) => {
  const target = e.target as HTMLElement
  const modalExists = !!document.querySelector('div[confirmation-modal="true"]');

  if (target.getAttribute('tabIndex') == '-1' && !modalExists) {
    if (JSON.stringify(memoCustomerData) !== JSON.stringify(defaultMemoCustomerData)) {
      const confirmation = await mtUtils.confirm(
        '未保存の内容があります。 \n 保存しますか？',
        '確認',
        '保存して閉じる',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function,
        },
        true,
        '保存しないで閉じる',
        true
      )
      
      if (confirmation) {
        try {
          if (isEdit.value) {
            await memoCustomerStore.updateMemoCustomer(
              memoCustomerData.id_memo_customer, 
              memoCustomerData
            )
          } else {
            await memoCustomerStore.submitMemoCustomer(memoCustomerData)
          }
          await memoCustomerStore.fetchMemoCustomers({id_customer: props.id_customer})
          mtUtils.autoCloseAlert(aahMessages.success)
        } catch (error) {
          console.error('Save failed:', error)
          return 
        }
        closeModal()
      } else {
        closeModal()
      }
    } else {
      closeModal();
    }
  }
};


onMounted(() => {
  if(props.data?.id_memo_customer) {
    isEdit.value = true
    assignPageData(props.data)
  }
  else if(props.flgDuplicate) assignPageData(props.data)

  nextTick(() => {
    requestAnimationFrame(() => {
      window.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('touchstart', handleOutsideClick)
    })
  })
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('touchstart', handleOutsideClick)
})

</script>
<template>
  <div :class="MODAL_CONTENT_CLASS">
    <q-form @submit="submit">
        <MtModalHeader @closeModal="closeModal" :class="{'memo-bg-yellow': memoCustomerData.type_memo_customer === TypeMemoCustomer.TODO && !memoCustomerData.flg_complete }">
          <q-toolbar-title class="text-grey-900 title2 bold">
          <span >
            オーナーメモ 
          </span>
        </q-toolbar-title>
        <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
          <q-icon size="xs" name="more_horiz" />
        </q-btn>
      </MtModalHeader>
      <q-card-section class="content">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-auto">
             <MtFormRadiobtn
               v-for="(item, idx) in typeMemoCustomer"
               :key="`${idx}-${item.value}`"
               :label="item.label"
               :val="item.value"
               v-model:selected="memoCustomerData.type_memo_customer"
               @update:selected="handleTypeMemoCustomer"
             />  
          </div>
          <div class="col-auto q-ml-auto">
             <q-icon 
                name="push_pin"
                class="cursor-pointer"
                size="30px"
                @click="handleFlgPin"
                :style="{'opacity': memoCustomerData.flg_pin ? 1 : 0.5}"
              />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <MtInputForm
              v-model="memoCustomerData.memo_text"
              label="メモ内容"
              maxlength="500"            
              type="textarea"
              autogrow
              :row="6"
              autofocus
              tabindex="1"
            />
            <div class="flex justify-end">
              {{ memoCustomerData.memo_text.length }} / 500
            </div>  
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md" v-if="memoCustomerData.type_memo_customer == '2'">
          <div class="col-auto">
            <MtFormCheckBox
              v-model:checked="memoCustomerData.flg_complete"
              label="完了"
              class="q-ml-md"
              @update:checked="handleFlgComplete"
            />
          </div>
          <div class="col" v-if="memoCustomerData.flg_complete">
            <MtFormInputDate
              v-model:date="memoCustomerData.date_complete"
              label="完了日"
              outlined
            />  
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <MtFormInputDate
              v-model:date="memoCustomerData.date_memo_customer"
              label="記録日"
              outlined
              tabindex="2"
            />  
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-bt bg-white">
        <div class="text-center modal-btn">
          <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
            <span>キャンセル</span>
          </q-btn>
          <q-btn unelevated tabindex="5" color="primary" class="q-ml-md" type="submit">
            <span>保存</span>
          </q-btn>
        </div>
      </q-card-section>
    </q-form>
  </div>
</template>
<style lang="scss" scoped>
.memo-bg-yellow {
  background-color: #fcff5a;
}
</style>