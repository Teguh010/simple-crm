<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { ItemService } from '@/types'
import { ValidationRule } from 'quasar'

const emit = defineEmits<{
  (e: 'update:selecting', value: string): void
  (e: 'update:selectingWhole', value: ItemService): void
  (e: 'openMedicine'): void
  (e: 'selectingWhole', value: ItemService[]): void
  (e: 'clear'): void
}>()

const props = withDefaults(
  defineProps<{
    preSelectedId?: string
    preselected?: ItemService
    label?: string
    mode?: string
    rules?: ValidationRule[]
    searchIcon?: boolean
    disable?: boolean
    multiple?: boolean
    outlined?: boolean
    applyDefaultClass?: boolean
    tabindex?: number
    typeAnimal?: number
    id_category1?: number
    id_category2?: number
    excludeInject?: boolean
  }>(),
  {
    mode: '1',
    disable: false,
    multiple: false,
    outlined: false,
    applyDefaultClass: true,
    searchIcon: true,
    excludeInject: false
  }
)

const inputValue = ref('')
const prevValue = ref('')
const options = ref([])

const model = ref('')
const modelArray = ref([])

const searchDropdownIcon = computed(() => {
  return props.searchIcon ? 'search' : ''
})

function filterFun(val: string, up: any, abort: any) {
  inputValue.value = val
  if (
    inputValue.value &&
    inputValue.value != '' &&
    inputValue.value.length >= 2
  ) {
    replaceOptions(up, abort)
  }
}

function popupHide(event: any) {
  var tabIndex = props.tabindex
  if (tabIndex) {
    for (var i = 0; i < 100; i++) {
      ++tabIndex
      var nextFoucusTarget = document.querySelector(`[tabindex="${tabIndex}"]`)
      if (nextFoucusTarget) {
        ;(nextFoucusTarget as HTMLElement).focus()
        break
      }
    }
  }
  // emit('hide', event) - svm - hide is not declared and I ma not sure what this for
}

async function replaceOptions(update: any = null, abort: any = null) {
  if (
    inputValue.value &&
    inputValue.value.length &&
    inputValue.value.length > 0
  ) {
    prevValue.value = inputValue.value
    let params = {}
    if (props.mode == '2') {
      params = {
        flg_service: false,
        type_item: 1,
        type_animal_allowed: props.typeAnimal,
        exclude_inject: props.excludeInject
      }
    }
    let resp = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'mst/SearchItemServiceList',
      {
        search_words: inputValue.value,
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
            options.value = item_list.map((item: ItemService) => {
              return {
                ...item,
                label: item.name_item_service,
                value: item.id_item_service
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

watch(
  () => props.preSelectedId,
  async (nowValue, oldValue) => {
    if (props.preSelectedId) {
      const response = await mtUtils.callApi<ItemService[]>(
        selectOptions.reqMethod.GET,
        'mst/SearchItemServiceList',
        {
          id_item_service: props.preSelectedId,
          id_category1: props.id_category1,
          id_category2: props.id_category2
        }
      )
      if (response && response?.length > 0) {
        model.value = response[0].name_item_service
      }
    }
  }
)

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
          :label="props.label"
          :loading="false"
          :options="options"
          :rules="props.rules"
          autofocus
          clearable
          dense
          fill-input
          hide-dropdown-icon
          hide-selected
          input-debounce="500"
          name="qSelect"
          :outlined="props.outlined"
          use-input
          @filter="filterFun"
          @update:model-value="selected"
          :disable="props.disable"
          :multiple="props.multiple"
          :dropdown-icon="searchDropdownIcon"
          :tabindex="props.tabindex"
          @popup-hide="popupHide"
          @clear="emit('clear')"
        >
          <template v-slot:append>
            <q-icon
              v-if="props.mode == '2'"
              class="cursor-pointer"
              name="feed"
              @click="() => emit('openMedicine')"
            />
            <q-icon v-if="props.searchIcon && !props.disable" name="search" />
            <q-icon v-if="props.searchIcon && !props.disable" name="arrow_drop_down" />
          </template>
          <template v-slot:loading>
            <div></div>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div v-else class="col">
        <q-select
          ref="SearchItemNameInput"
          dense
          v-model="modelArray"
          :disable="props.disable"
          :label="props.label"
          :loading="false"
          :multiple="props.multiple"
          :options="options"
          :outlined="props.outlined"
          :rules="props.rules"
          clearable
          emit-value
          input-debounce="500"
          map-options
          name="qSelect"
          use-chips
          :dropdown-icon="searchDropdownIcon"
          use-input
          @filter="filterFun"
          @update:model-value="selected"
          :tabindex="props.tabindex"
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
              <q-item-section class="text-grey"> No results </q-item-section>
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
