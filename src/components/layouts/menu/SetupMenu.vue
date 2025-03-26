<script setup lang="ts">
const props = defineProps({ menuList: Array, selectedMenu: Array })
const emit = defineEmits(['update:selectedMenu'])
const onClickCheck = (index: number) => emit('update:selectedMenu', index)
</script>
<template>
  <div>
    使用頻度の高いメニューにチェックを入れてください。チェックを入れた項目はピックアップメニューに表示します。
    <div class="row q-col-gutter-md q-mt-xs q-mb-md q-px-md">
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
        v-for="(card, index) in props.menuList"
        :key="index"
      >
        <q-card
          class="my-card no-box-shadow full-height cursor-pointer"
          @click.stop="onClickCheck(index)"
          :style="'background-color:' + card.bg_color"
        >
          <q-btn
            rounded
            dense
            flat
            :class="selectedMenu[index] ? 'ba-accent-900 bg-accent-200 text-accent-900' : 'ba-grey-300 bg-grey-100 text-grey-300'"
            class="checkmark-setup-menu"
          >
            <q-icon size="lg" name="check" />
          </q-btn>
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
            >
              <div
                class="flex justify-between title2 bold text-grey-800"
                :class="
                  item.label != 'separator'
                    ? 'q-py-sm q-px-md menu-box bg-white q-mb-xs'
                    : 'q-mb-sm'
                "
                v-for="(item, index) in card.children"
                :key="index"
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
  </div>
</template>

<style lang="scss" scoped>
.checkmark-setup-menu {
  position: absolute;
  left: 0px;
  top: -15px;
  z-index: 1;
}
</style>