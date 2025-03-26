<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

const emit = defineEmits([
  'update:selecting',
  'update:selectingWhole',
  'openMedicine',
  'selectingWhole',
  'clear'
])
const props = defineProps({
  preSelectedId: String,
  preselected: String,
  label: String,
  mode: { default: '1' },
  rules: Object,
  searchIcon: true,
  disable: {
    default: false
  },
  multiple: {
    default: false,
    type: Boolean
  },
  outlined: {
    default: false,
    type: Boolean
  },
  applyDefaultClass: {
    default: true,
    type: Boolean
  },
  tabindex: {
    type: Number
  },
  typeAnimal: {
    type: Number
  },
  id_category1: Number,
  id_category2: Number,
  excludeInject: {
    default: false,
    type: Boolean
  }
})

let inputValue = ''
let prevValue = ''

const options = ref([])
let timeoutID = null

const model = ref('')
const modelArray = ref([])

function filterFun(val, up, abort) {
  inputValue = val
  if (inputValue && inputValue != '' && inputValue.length >= 2) {
    replaceOptions(up, abort)
  }
}

function popupHide(event) {
  var tabIndex = props.tabindex
  if (tabIndex) {
    for (var i = 0; i < 100; i++) {
      ++tabIndex
      var nextFoucusTarget = document.querySelector(`[tabindex="${tabIndex}"]`)
      if (nextFoucusTarget) {
        nextFoucusTarget.focus()
        break
      }
    }
  }
  emit('hide', event)
}

async function replaceOptions(update: any = null, abort: any = null) {
  if (inputValue && inputValue.length && inputValue.length > 0) {
    prevValue = inputValue
    let params = {
      isServiceGroup: true
    }
    let resp = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'mst/service_groups',
      {
        search_words: inputValue,
        ...params
      }
    )
    emit('selectingWhole', resp)
    if (abort) abort()
    if (resp) {
      options.value.length = 0
      let item_list: any = resp
      if (resp && item_list && item_list.length && item_list.length > 0) {
        if (update) {
          update(() => {
            options.value = item_list.map((item) => {
              return {
                ...item,
                label: item.name_service_group,
                value: item.id_service_group
              }
            })
          })
        }
        emit('selectingWhole', resp)
      }
    }
  }

  if (options.value.length == 0) {
    if (abort) abort()
  }
}

const SearchItemNameInput = ref(null)

async function selected(value: any) {
  emit('update:selecting', value?.value ?? value)
  emit('update:selectingWhole', value)
}

onMounted(async () => {
  if (props.preselected) {
    model.value = props?.preselected?.name_item_service ?? ''
  }
})
</script>

<template>
  <div class="full-width">
    <div
      :class="applyDefaultClass ? 'search-conds-area' : ''"
      class="row items-center"
    >
      <div v-if="!multiple" class="col">
        <q-select
          ref="SearchItemNameInput"
          v-model="model"
          :disable="props.disable"
          :dropdown-icon="props.searchIcon"
          :label="props.label"
          :loading="false"
          :multiple="props.multiple"
          :options="options"
          :outlined="props.outlined"
          :rules="props.rules"
          :tabindex="props.tabindex"
          autofocus
          clearable
          dense
          fill-input
          hide-dropdown-icon
          hide-selected
          input-debounce="500"
          name="qSelect"
          use-input
          @clear="emit('clear')"
          @filter="filterFun"
          @update:model-value="selected"
          @popup-hide="popupHide"
        >
          <template v-slot:append>
            <q-icon
              v-if="props.mode == '2'"
              class="cursor-pointer"
              name="feed"
              @click="() => emit('openMedicine')"
            />
            <q-icon v-if="props.searchIcon" name="search" />
            <q-icon v-if="props.searchIcon" name="arrow_drop_down" />
          </template>
          <template v-slot:loading>
            <div></div>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div v-else class="col">
        <q-select
          ref="SearchItemNameInput"
          v-model="modelArray"
          :disable="props.disable"
          :dropdown-icon="props.searchIcon"
          :label="props.label"
          :loading="false"
          :multiple="props.multiple"
          :options="options"
          :outlined="props.outlined"
          :rules="props.rules"
          :tabindex="props.tabindex"
          clearable
          dense
          emit-value
          input-debounce="500"
          map-options
          name="qSelect"
          use-chips
          use-input
          @filter="filterFun"
          @update:model-value="selected"
          @popup-hide="popupHide"
        >
          <template v-slot:append>
            <q-icon
              v-if="props.mode == '2'"
              class="cursor-pointer"
              name="feed"
              @click="() => emit('openMedicine')"
            />
            <q-icon v-if="props.searchIcon" name="search" />
            <q-icon v-if="props.searchIcon" name="arrow_drop_down" />
          </template>
          <template v-slot:loading>
            <div></div>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-conds-area {
  background-color: #ffffff;
  height: 56px;
}

// タブが画面の外に見切れてしまうのを防ぐためX軸のpaddingを解除
.q-tab {
  padding: 0 !important;
}

.ns-btn {
  background-color: #333333;
  color: #ffffff;
}
</style>
