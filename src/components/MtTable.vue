<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { GenericArrayType } from '@/types/types'

const props = withDefaults(
  defineProps<{
    columns: Array
    rows: Array<GenericArrayType>
    style?: Object
    noDataMessage?: string
    classTd?: any
    styleTd?: any
    rowsBg?: any
    expandRow?: any
    selectedRow?: any
    flat?: any
    separator?: string
    bordered?: boolean
    sticky?: boolean
    dense?: boolean
    virtualScroll?: any
    itemPerPage?: number
    callApiBack?: any
  }>(),
  {
    flat: false,
    separator: 'none',
    bordered: false,
    itemPerPage: 50,
    callApiBack: () => {},
  }
)

const slots = useSlots()

const emit = defineEmits(['rowClick', 'checked', 'callApi', 'scroll'])

const pagination = ref({rowsPerPage: 0})
const currentPage = ref(1)

const checkedEvent = ref(true)
const scrollContainer = ref(null)

const getRows = computed(() => props.rows)

function checkBoxUpdate() {
  emit('checked', checkedEvent.value)
}

function rowClick(row: any, index: any) {
  emit('rowClick', row, index)
}
</script>

<template>
  <div ref="scrollContainer" class="scroll-container">
    <q-table
      class="mt-table"
      :style="props.style"
      :columns="props.columns"
      :rows="getRows"
      :flat="props.flat"
      :sticky="sticky"
      :dense="dense"
      :rows-per-page-options="[0]"
      hide-bottom
      :separator="'none'"
      v-model:pagination="pagination"
      @scroll="(value)=> emit('scroll', value)"
    >
      <template v-slot:header="headerProps">
        <q-tr class="sticky-header">
          <slot
            v-if="slots.thead"
            name="thead"
            :columns="headerProps.cols"
          ></slot>
          <q-th
            v-else
            scope="header"
            v-for="(col, index) in headerProps.cols"
            :key="'1--' + col.field"
            :class="[props.classTd, 'text-' + (col.align || 'left')]"
            :style="col.style"
          >
            <span
              v-if="!col.overLoad"
              style="white-space: nowrap"
              v-bind:class="{ separate: !(index < 1) }"
              >{{ col.label }}</span
            >
            <div v-else>
              <MtFormCheckBox
                v-model:checked="checkedEvent"
                @update:checked="checkBoxUpdate"
              />
            </div>
          </q-th>
        </q-tr>
      </template>

      <template v-slot:body="bodyProps">
        <q-tr
          :key="bodyProps.rowIndex"
          @click="rowClick(bodyProps.row, bodyProps.key)"
          v-if="bodyProps.row && bodyProps.row.flg_delete != '1'"
          :class="
            bodyProps.row.flg_completed
              ? rowsBg
              : [bodyProps.rowIndex % 2 == 0 ? 'bg-grey-050' : 'bg-gray-100']
          "
        >
          <slot
            name="row"
            :row="bodyProps.row"
            :index="bodyProps.key"
            :columns="bodyProps.cols"
          ></slot>
        </q-tr>
        <q-tr v-show="expandRow && selectedRow === bodyProps.row.prescription_number">
          <slot name="expandedRow"></slot>
        </q-tr>
      </template>
    </q-table>

    <div
      v-if="props.rows && props.rows.length === 0 && props.noDataMessage"
      style="width: 100%"
      class="flex flex-center q-pt-lg"
    >
      {{ props.noDataMessage }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.mt-table {

}

.q-table--horizontal-separator, .q-table--cell-separator {
  thead th, tbody tr:not(:last-child) > td {
    border-bottom: unset;
  }
}
  
.sticky-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}
.bottom-div {
  height: 2px;
}

</style>
