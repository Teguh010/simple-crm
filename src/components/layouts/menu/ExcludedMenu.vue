<script setup lang="ts">
const props = defineProps({ unselectedMenuList: Array })
const emit = defineEmits(['goTo', 'changeHeaderTab'])

const goTo = (value: string) => emit('goTo', value)
const changeHeaderTab = (value: string) => emit('changeHeaderTab', value)
</script>
<template>
  <div class="row q-col-gutter-md q-mt-xs q-mb-md q-px-md">
    <div
      class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
      v-for="(card, index) in props.unselectedMenuList"
      :key="index"
    >
      <q-card
        class="my-card no-box-shadow full-height"
        :style="'background-color:' + card.bg_color"
      >
        <q-card-section flat class="q-px-sm q-py-md">
          <div class="row justify-center items-center q-py-sm">
            <q-icon :name="card.icon" size="20px" />
            <div class="title2 bold text-grey-900 q-ml-xs">
              {{ card.label }}
            </div>
          </div>
          <q-card-actions
            vertical
            class="justify-around"
            v-if="card.icon != 'navigate_next'"
          >
            <div
              class="flex justify-between title2 bold text-grey-800"
              :class="
                item.label != 'separator'
                  ? 'q-py-sm q-px-md menu-box bg-white cursor-pointer q-mb-xs'
                  : 'q-mb-sm'
              "
              v-for="(item, index) in card.children"
              :key="index"
              @click="goTo(item)"
            >
              <template v-if="item.label != 'separator'">
                <div>{{ item.label }}</div>
                <div class="q-pl-sm number" v-if="item.number">
                  {{ item.number }}
                </div>
              </template>
            </div>
          </q-card-actions>
          <q-card-actions
            vertical
            class="justify-around"
            v-else
          >
            <div
              class="flex justify-between title2 bold text-grey-800"
              :class="
                card.label != 'separator'
                  ? 'q-py-sm q-px-md menu-box bg-white cursor-pointer q-mb-xs'
                  : 'q-mb-sm'
              "
              @click="changeHeaderTab('master-menu')"
            >
              <template v-if="card.label != 'separator'">
                <div>{{ card.label }}</div>
                <div class="q-pl-sm number" v-if="card.number">
                  {{ card.number }}
                </div>
              </template>
            </div>
            <div
              class="flex justify-between title2 bold text-grey-800"
              :class="
                item.label != 'separator'
                  ? 'q-py-sm q-px-md menu-box bg-white cursor-pointer q-mb-xs'
                  : 'q-mb-sm'
              "
              v-for="(item, index) in card.children"
              :key="index"
              @click="goTo(item)"
            >
              <template v-if="item.label != 'separator'">
                <div>{{ item.label }}</div>
                <div class="q-pl-sm number" v-if="item.number">
                  {{ item.number }}
                </div>
              </template>
            </div>
          </q-card-actions>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>