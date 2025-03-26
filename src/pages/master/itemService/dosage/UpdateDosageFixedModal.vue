<script setup lang="ts">
import { onMounted, ref } from "vue"
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from "@/components/MtModalHeader.vue"
import aahMessages from "@/utils/aahMessages"
import mtUtils from "@/utils/mtUtils"
import OptionModal from "@/components/OptionModal.vue"
import useDosageFixedStore from "@/stores/dosage-fixed"
import MtFormPullDown from "@/components/form/MtFormPullDown.vue";
import useCommonStore from "@/stores/common";

const dosageFixedStore = useDosageFixedStore()

const emits = defineEmits(["close"])
const props = defineProps({ data: Object, itemService: Object})
const data = ref({
  id_item_service: '',
  val_weight_min: '',
  val_weight_max: '',
  type_animal:0,
  display_order: null
})

const commonOptionList: any = ref([])
const submit = () => {
  if (props.data) {
    dosageFixedStore.updateDosageFixed(data.value.id_dosage_fixed, data.value).then(() => {
      emits("close");
      mtUtils.autoCloseAlert(aahMessages.success);
    });
  } else {
    dosageFixedStore.submitDosageFixed(data.value).then(() => {
      emits("close");
      mtUtils.autoCloseAlert(aahMessages.success);
    });
  }
  return true
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: "削除する",
      name: "delete",
      isChanged: false,
      attr: {
        class: null,
        clickable: true,
      },
    },
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == "delete") {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await dosageFixedStore.destroyDosageFixed(data.value?.id_dosage_fixed)
            emits('close')
            return false
          }
        })
    }
  }
}
const closeModal = () => {
  emits("close")
}
onMounted(() => {
  commonOptionList.value = useCommonStore().getCommonOptionList.filter((o: any) => o.code_common == '1')
    .map((o: any) => ({value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common,}))
  
  if (props.data) {
    // Update case
    data.value = {...props.data}
  } else {
    // Create case
    data.value.id_item_service = props.itemService?.id_item_service
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        早見表：体重範囲
      </q-toolbar-title>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-md">
      <div class="col-12 q-mt-md">
        <p class="caption1 regular text-grey-700">
          単位はグラムで登録してください。
        </p>
      </div>
      <div class="col-lg-5 col-md-5 col-sm-12 ">
        <MtInputForm
          type="number"
          v-model="data.val_weight_min"
          label=" 動物体重（以上）g"
          required
        />
      </div>
      <div class="col-1">
          ~
      </div>
      <div class="col-lg-5 col-md-5 col-sm-12 ">
        <MtInputForm
          type="number"
          v-model="data.val_weight_max"
          label=" 動物体重（未満）g"
          required
        />
      </div>
      <q-space></q-space>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtFormPullDown v-model:selected="data.id_common" :options="commonOptionList" class="col-4" label="動物種別"/>
      </div>
      <q-space></q-space>
      <div class="col-lg-6 col-md-6 col-sm-6 q-mb-lg">
        <MtInputForm
          type="number"
          v-model="data.display_order"
          label="表示順序（0~999; 小を上位表示）"
        />
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
