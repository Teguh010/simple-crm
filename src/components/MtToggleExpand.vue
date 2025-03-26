<script setup lang="ts">
import { ComponentPublicInstance, computed, defineEmits, defineProps, nextTick, onUpdated, ref, toRef } from 'vue'
import MtSpinnerLoading from './MtSpinnerLoading.vue'

// follow this type for the props
type TableRowsType = {
  label: string
  child: {
    subHeader: string
    subData: {
      label: string
      value: number
    }[]
  }[]
}[]

const props = withDefaults(
  defineProps<{
    data: TableRowsType
    isLoading: boolean
    isExpand: boolean
    isShowHeader: boolean
  }>(),
  {
    data: () => {
      return [] as TableRowsType
    },
    isLoading: false,
    isExpand: false,
    isShowHeader: false
  }
)

const expand = toRef(props, 'isExpand')

const emit = defineEmits<{
  (e: 'onBadgeClick', value: number): void
}>()

const tableHeader = ref<HTMLElement | null>(null)
const subHeaders = ref<HTMLElement[]>([])

const badgeClick = (v: number) => {
  emit('onBadgeClick', v)
}

const updateStickyPositions = () => {
  if (tableHeader.value) {
    const headerWidth = tableHeader.value.offsetWidth
    tableHeader.value.style.left = '0px'
    if (subHeaders.value.length) {
      subHeaders.value.forEach((subHeader) => {
        subHeader.style.left = `${headerWidth - 3}px`
      })
    }
  }
}

const setSubHeaders = (e: ComponentPublicInstance | Element | null) => {
  if (e instanceof HTMLElement) {
    subHeaders.value.push(e)
  }
}

onUpdated(async () => {
  await nextTick()
  updateStickyPositions()
})

</script>

<template>
  <q-expansion-item
    v-model="expand"
    :header-style="{ display: isShowHeader ? 'flex' : 'none' }"
    :class="{ 'flex justify-center': isLoading }"
  >
    <MtSpinnerLoading v-if="isLoading" />
    <div v-if="!isLoading" class="custom-table-wrapper">
      <q-table
        :rows="props.data"
        flat
        hide-header
        hide-pagination
        class="custom-table body2"
      >
        <template v-slot:body="props">
          <tr>
            <!-- Header Column (spanning rows) -->
            <th
              ref="tableHeader"
              class="sticky-header col-2 content-center"
              :rowspan="props.row.child.length"
              >
              {{ props.row.label }}
            </th>
            
            <!-- First Sub-header and Data -->
            <template class="row">
              <td :ref="(e) => setSubHeaders(e)" class="sticky-header sub-header col-2 content-center">
                {{ props.row.child[0].subHeader }}
              </td>
              <td class="sub-data col-8">
                <q-badge
                  v-for="data in props.row.child[0].subData"
                  color="accent-100"
                  :label="data.label"
                  class="text-grey-900 q-px-md q-my-sm cursor-pointer status-border"
                  style="border-radius: 20px;"
                  @click="badgeClick(data.value)"
                />
              </td>
            </template>
          </tr>

          <!-- Remaining Sub-header and Data Rows -->
          <tr v-for="(child, index) in props.row.child.slice(1)" :key="index" class="row">
            <td :ref="(e) => setSubHeaders(e)" class="sticky-header sub-header col-2 content-center">{{ child.subHeader }}</td>
            <td class="sub-data col-10">
              <q-badge
                v-for="data in child.subData"
                color="accent-100"
                :label="data.label"
                class="text-grey-900 q-px-md q-my-sm cursor-pointer status-border"
                style="border-radius: 20px;"
                @click="badgeClick(data.value)"
              />
            </td>
          </tr>
        </template>
      </q-table>
    </div>
  </q-expansion-item>
</template>

<style lang="scss" scoped>
.custom-table-wrapper {
  margin-top: 7px;
  overflow-x: auto;
  max-width: 100dvw;
  max-height: 200px;
}

.custom-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.custom-table th {
  padding: 8px;
  text-align: center;
  border: none;
}

.custom-table td {
  padding: 4px;
  text-align: center;
  border: none;
  &.sub-data {
    display: flex;
    gap: 8px;
  }
}

.sticky-header {
  position: sticky;
  left: 0;
  background-color: #f8f8f8;
  z-index: 2;
  white-space: nowrap;
  min-width: 50px;
  &.sub-header {
    z-index: 1;
  }
}
.status-border {
  border: 1px solid #a09d00; 
}
</style>
