<script lang="ts" setup>
import { ref } from 'vue'

const emits = defineEmits(['close'])

const props = defineProps({
  data: Object
})

const notificationData = ref(props.data)

const pos = ref({
  // x: (window.innerWidth - 320) / 2,
  x: window.innerWidth - 330,
  y: 10
})

const notificationWrapperRef = ref<HTMLElement | null>(null)

const closeModal = () => {
  emits('close')
}

const closeData = (index: number) => {
  notificationData.value?.splice(index, 1)
  if (props.data?.length === 0) {
    closeModal()
  }
}

const openCustomerPage = (data, index) => {
  window.open(
    `/SearchCustomerList?code_customer=${data.code_customer_id}`,
    '_blank'
  )
  closeData(index)
}
const openCustomerPetPage = (data, pet, index) => {
  window.open(
    `/SearchCustomerList?code_customer=${data.code_customer_id}&code_pet=${pet.code_pet}&tab=1`,
    '_blank'
  )
  closeData(index)
}
</script>

<template>
  <div
    v-if="data"
    class="adjustable-modal-container"
    :style="{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }"
    tabindex="0"
    ref="notificationWrapperRef"
  >
    <div
      class="adjustable-modal-content q-pa-sm"
      v-for="(data, index) in notificationData"
      :style="data.pets.length > 0 ? 'height: 70px' : 'height: 50px'"
    >
      <div class="flex q-gutter-sm items-center">
        <div class="">
          <i
            style="font-size: 32px"
            class="q-icon notranslate material-icons text-black"
            aria-hidden="true"
            role="img"
            >phone</i
          >
        </div>
        <div class="col">
          <div class="flex q-gutter-sm">
            <div class="col">
              <div
                class="cursor-pointer"
                style="font-weight: bold"
                @click="openCustomerPage(data, index)"
              >
                {{ data.code_customer_id }}
                {{ data.name_customer_display }}
              </div>
            </div>
            <div class="flex items-center justify-center">
              <div
                class="bg-danger text-white flex items-center justify-center"
                style="width: 22px; height: 22px; border-radius: 100%"
              >
                <i
                  @click.stop="closeData(index)"
                  id="openNotificationIcon"
                  style="font-size: 18px"
                  class="q-icon notranslate material-icons text-white"
                  aria-hidden="true"
                  role="img"
                  >close</i
                >
              </div>
            </div>
          </div>
          <div
            class="flex items-center q-mt-sm hide-scrollbar"
            style="overflow-x: auto; white-space: nowrap"
            v-if="data.pets.length > 0"
          >
            <div style="display: flex">
              <small
                @click="openCustomerPetPage(data, pet, index)"
                v-for="pet in data.pets"
                style="background-color: #fff4cb"
                class="q-br-5 q-px-xs q-mr-sm cursor-pointer"
                >{{ pet.name_pet }}</small
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$z-index-modal: 9999;
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, and Opera */
}
.adjustable-modal-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: $z-index-modal;
  display: flex;
  flex-direction: column;
  // gap: 8px;
}

.adjustable-modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  width: 314px;
  margin-bottom: 8px;
  border: 1px #222 solid;
}
</style>
