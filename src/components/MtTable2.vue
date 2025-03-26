<script setup lang="ts">
import { ref, useSlots } from 'vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

interface Column {
  field?: string
  align?: string
  style?: string
  overLoad?: boolean
  label?: string
}

interface Props {
  columns: Column[]
  rows: any[]
  style?: Object
  noDataMessage?: string
  classTd?: any
  styleTd?: any
  rowsBg?: any
  expandRow?: any
  selectedRow?: any
  styleTableOnModal?: boolean
  flat?: any
  separator?: boolean
  bordered?: boolean
  sticky?: boolean
  dense?: boolean
  virtualScroll?: any
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  flat: false,
  separator: false,
  bordered: false,
  draggable: false,
  styleTableOnModal: false,
  ref: 'tableRef'
})

const slots = useSlots()

const emit = defineEmits(['rowClick', 'checked', 'onDrop', 'virtualScroll'])

const checkedEvent = ref(false)

const draggedIndex = ref<number>()
const isDragOverIndex = ref<number | null>(null)
const touchStartY = ref<number | null>(null)
const touchStartX = ref<number | null>(null)
const touchedRowIndex = ref<number | null>(null)
const isDragging = ref(false)
const touchStartTime = ref<number | null>(null)
const dragThreshold = 500 // milliseconds to wait before initiating drag

function checkBoxUpdate() {
  emit('checked', checkedEvent.value)
}

function rowClick(row: any, index: any) {
  emit('rowClick', row, index)
}

function onDragStart(event: DragEvent, index: number) {
  if (props.draggable) {
    draggedIndex.value = index
    event.dataTransfer?.setData('text/plain', String(index))
  }
}
function onDragOver(event: DragEvent, index: number) {
  if (props.draggable) {
    event.preventDefault()
    isDragOverIndex.value = index
    ;(event.currentTarget as HTMLElement)?.classList.add('drag-over-target')
  }
}
function onDragLeave(event: DragEvent, index: number) {
  if (props.draggable) {
    event.preventDefault()
    isDragOverIndex.value = null
    ;(event.currentTarget as HTMLElement)?.classList.add('drag-over-target')
  }
}
function onDrop(event: DragEvent, row: any, index: number) {
  if (props.draggable) {
    event.preventDefault()
    const draggedIndexValue = parseInt(
      event.dataTransfer?.getData('text/plain') || '-1',
      10
    )
    const targetIndex = index
    const emitRow = {
      ...row,
      draggedIndex: draggedIndexValue,
      targetIndex: targetIndex
    }

    if (draggedIndexValue !== -1 && draggedIndexValue !== targetIndex) {
      moveColumn(draggedIndexValue, targetIndex)
      emit('onDrop', emitRow)
    }

    isDragOverIndex.value = null
    ;(event.currentTarget as HTMLElement)?.classList.remove('drag-over-target')
  }
}
function moveColumn(fromIndex: number, toIndex: number) {
  if (props.draggable) {
    if (fromIndex === toIndex) return

    const item = props.rows.splice(fromIndex, 1)[0]
    props.rows.splice(toIndex, 0, item)
  }
}

function onTouchStart(event: TouchEvent, index: number) {
  if (props.draggable) {
    touchStartY.value = event.touches[0].clientY
    touchStartX.value = event.touches[0].clientX
    touchedRowIndex.value = index
    touchStartTime.value = Date.now()
    isDragging.value = false
  }
}

function onTouchMove(event: TouchEvent, index: number) {
  if (
    props.draggable &&
    touchStartY.value !== null &&
    touchStartX.value !== null &&
    touchStartTime.value !== null
  ) {
    const currentY = event.touches[0].clientY
    const currentX = event.touches[0].clientX
    const diffY = currentY - touchStartY.value
    const diffX = currentX - touchStartX.value
    const timeDiff = Date.now() - touchStartTime.value

    if (!isDragging.value && timeDiff > dragThreshold) {
      isDragging.value = true
    }

    if (isDragging.value) {
      event.preventDefault() // Prevent scrolling only if dragging
      isDragOverIndex.value = index
    }
  }
}

function onTouchEnd(event: TouchEvent, row: any, index: number) {
  if (props.draggable && isDragging.value) {
    if (touchedRowIndex.value !== null && isDragOverIndex.value !== null) {
      moveColumn(touchedRowIndex.value, isDragOverIndex.value)
      emit('onDrop', {
        ...row,
        draggedIndex: touchedRowIndex.value,
        targetIndex: isDragOverIndex.value
      })
    }
  }

  // Reset all touch-related refs
  touchStartY.value = null
  touchStartX.value = null
  touchedRowIndex.value = null
  isDragOverIndex.value = null
  isDragging.value = false
  touchStartTime.value = null
}

const logTableData = (rows: any[]) => {
  console.log('MtTable2 - Detailed row data:', {
    totalRows: rows.length,
    allRows: rows.map(row => ({
      id: row.id_queue_ticket,
      number: row.number_queue_ticket,
      customer: row.customer?.name_customer_display,
      status: row.type_status_queue_ticket,
      pets: row.petList?.map(pet => pet.name_pet),
      doctor: row.id_employee_doctor,
      visitPurpose: row.type_visit_purpose_ticket,
      times: {
        issued: row.datetime_issued,
        checkIn: row.datetime_check_in,
        serviceStart: row.datetime_service_start,
        absent: row.datetime_absent,
        cancel: row.datetime_cancel,
        bin: row.datetime_bin
      }
    }))
  })
}
</script>

<template>
  <div style="width: 100%">
    <q-virtual-scroll
      type="table"
      :style="props.style"
      :virtual-scroll-item-size="15"
      :virtual-scroll-sticky-size-end="15"
      :virtual-scroll-sticky-size-start="15"
      :items="props.rows"
      :separator="props.separator"
      :bordered="props.bordered"
      :flat="props.flat"
      :sticky="sticky"
      :dense="dense"
      wrap-cells
      @virtualScroll="(value) => emit('virtualScroll', value)"
    >
      <template v-slot:before>
        <thead
          class="thead-sticky text-left"
          :class="props.styleTableOnModal ? 'table-on-modal' : ''"
        >
          <tr class="th-row">
            <slot
              v-if="slots.thead"
              name="thead"
              :columns="props.columns"
            ></slot>
            <th
              v-else
              scope="header"
              v-for="(col, index) in props.columns"
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
            </th>
          </tr>
        </thead>
      </template>

      <template v-slot="{ item: row, index }">
        <template v-if="slots.body">
          <slot
            name="body"
            :row="row"
            :index="index"
            :columns="props.columns"
          ></slot>
        </template>
        <template v-else>
          <div v-if="isDragOverIndex === index" class="drop-target-indicator" />
          <tr
            :key="index"
            @click="rowClick(row, index)"
            v-if="row && row.flg_delete != '1'"
            class="drag-container"
            :class="[
              row.flg_completed
                ? rowsBg
                : [index % 2 == 0 ? 'bg-grey-050' : 'bg-gray-100'],
              { 'touch-dragging': isDragging && touchedRowIndex === index }
            ]"
            :draggable="draggable"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @dragleave="onDragLeave($event, index)"
            @drop="onDrop($event, row, index)"
            @touchstart="onTouchStart($event, index)"
            @touchmove="onTouchMove($event, index)"
            @touchend="onTouchEnd($event, row, index)"
          >
            <slot name="row" :row="row" :index="index" :columns="props.columns">
            </slot>
          </tr>
          <tr
            v-if="expandRow"
            class="relative-position expanded-row text-danger"
          >
            <slot :row="row" name="expandedRow"> </slot>
          </tr>
        </template>
      </template>
    </q-virtual-scroll>

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
.thead-sticky tr > * {
  position: sticky;
  z-index: 1;
  background: $white;
  top: 0;
  left: 0;
}
.thead-sticky.table-on-modal tr > * {
  top: -20px;
}
.drop-target-indicator {
  height: 12px;
  width: 100%;
  border: 3px solid #a6baff;
  border-radius: 2px;
  margin: 5px 0;
  position: absolute;
  z-index: 2;
}
.touch-dragging {
  opacity: 0.5;
  background-color: #e0e0e0 !important;
}
.custom-badge {
  padding: 0 8px;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.drag-container {
  -webkit-touch-callout: none !important;
  -webkit-user-select: none;
  user-select: none !important;
  touch-action: auto; /* Allow all touch actions */
  -webkit-transition-duration: 0ms;
  -webkit-transition-delay: 0ms;
  -webkit-transform-style: preserve-3d;
  -webkit-backface-visibility: hidden;
  -webkit-transform: translateZ(0);
}

.touch-dragging {
  opacity: 0.7;
  background-color: #e0e0e0 !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
  transition: all 0.2s ease;
}

.expanded-row {
  height: 20px;
  text-align: right;
}
</style>
