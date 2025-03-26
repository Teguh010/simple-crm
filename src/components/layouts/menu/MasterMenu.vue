<script setup lang="ts">
import mtUtils from '@/utils/mtUtils'
import { defineAsyncComponent } from 'vue'

const ConfirmSkypeModal = defineAsyncComponent(
  () => import('@/components/layouts/menu/ConfirmSkypeModal.vue')
)

const props = defineProps({ masterMenuList: Array })
const emit = defineEmits(['goTo'])
const goTo = (value: string) => emit('goTo', value)


const openExternalLinkConfirmationModal = (e: Event) => {
  e.preventDefault()

  const anchor = e.currentTarget as HTMLAnchorElement;
  const url = anchor.href;

  let popup: {
    isConfirmed: boolean
  } = { isConfirmed : false}
  mtUtils.smallPopup(ConfirmSkypeModal, {popup}).then(() => {
    if(popup.isConfirmed) {
      window.open(url, '_blank')
    }
  })
}
</script>
<template>
  <div class="q-px-md">
    <div class="flex justify-between q-mt-sm">
      <div class="text-grey-900 title2 bold">病院マスタ</div>
      <div class="caption1 regular text-danger q-mt-md"> ※ 責任者によるマスタデータ管理を推奨します。</div>
    </div>
    <div class="row q-mt-sm">
      <div
        class="col-md-3 col-xs-12 col-sm-6"
        v-for="(card, index) in props.masterMenuList"
        :key="index"
      >
        <q-card flat class="master-card bg-grey-100 full-height">
          <q-card-section class="q-px-sm q-py-md">
            <div class="row justify-center items-center q-py-sm col-3">
              <q-icon :name="card.icon" size="20px" />
              <div class="bold text-grey-900 text-center q-ml-xs">
                {{ card.label }}
              </div>
            </div>
            <q-card-actions vertical class="justify-around col-9 action-box">
              <ol class="cursor-pointer title3 text-underline text-blue">
                <div
                  class="flex justify-between q-mb-md"
                  v-for="(item, index) in card.children"
                  :key="index"
                  @click="goTo(item)"
                >
                  <li>{{ item.label }}</li>
                </div>
              </ol>
            </q-card-actions>
          </q-card-section>
          <!-- <q-card-section v-if="card.secondMenu" class="q-px-sm q-py-md">
            <div class="row justify-center items-center q-py-sm col-3">
              <q-icon :name="card.secondMenu.icon" size="20px" />
              <div class="bold text-grey-900 text-center q-ml-xs">
                {{ card.secondMenu.label }}
              </div>
            </div>

            <q-card-actions vertical class="justify-around col-9 action-box">
              <div
                class="flex justify-between q-mb-md"
                v-for="(item, index) in card.secondMenu.children"
                :key="index"
                @click="goTo(item)"
              >
                <div class="cursor-pointer title3 text-underline text-blue">
                  {{ item.label }}
                </div>
              </div>
            </q-card-actions>
          </q-card-section> -->
        </q-card>
      </div>
    </div>
    <div class="flex justify-end q-mt-md">
      <a href="https://web.skype.com/" target="_blank" @click="openExternalLinkConfirmationModal">
        <q-btn class="caption1 regulater text-grey-900">
          <q-icon name="feedback" size="16px" class="text-blue q-mr-sm" /> 臨時Skypeサポート 平日10:00-17:00
        </q-btn>
      </a>
    </div>
  </div>
</template>
