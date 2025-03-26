<script setup lang="ts">
import { defineProps, defineEmits, withDefaults, computed } from 'vue'
import { formatDateTime, roundZeroAfterPoint } from '@/utils/aahUtils'
import { PetBioInfoType } from '@/types/types'
import MtTable2 from '@/components/MtTable2.vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    showPagination: boolean
    petBioListData: Array<PetBioInfoType>
  }>(),
  {
    currentPage: 1,
    totalPages: 10,
    showPagination: true,
    petBioListData: () => {
      return [] as PetBioInfoType[]
    }
  }
)

const emit = defineEmits<{
  (e: 'editPetBioInfo', value: PetBioInfoType): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const columnBio = [
  {
    name: 'datetime_measure',
    label: '測定日時',
    field: 'datetime_measure',
    align: 'left'
  },
  { name: 'val_weight', label: '体重', field: 'val_weight', align: 'left' },
  {
    name: 'val_temperature',
    label: 'T',
    field: 'val_temperature',
    align: 'left'
  },
  {
    name: 'val_heartbeat_rate',
    label: 'P',
    field: 'val_heartbeat_rate',
    align: 'center'
  },
  {
    name: 'val_respiration_rate',
    label: 'R',
    field: 'val_respiration_rate',
    align: 'center'
  },
  {
    name: 'val_pressure_systolic',
    label: 'SBP',
    field: 'val_pressure_systolic',
    align: 'left'
  },
  {
    name: 'val_pressure_diastolic',
    label: 'DBP',
    field: 'val_pressure_diastolic',
    align: 'left'
  },
  {
    name: 'val_pressure_mean_arterial',
    label: 'MAP',
    field: 'val_pressure_mean_arterial',
    align: 'left'
  },
  {
    name: 'val_blood_oxygen_level',
    label: 'SpO2',
    field: 'val_blood_oxygen_level',
    align: 'left'
  },
  {
    name: 'val_blood_carbon_dioxide_level',
    label: 'EtCO2',
    field: 'val_blood_carbon_dioxide_level',
    align: 'center'
  },
  {
    name: 'memo_measure',
    label: '測定時メモ',
    field: 'memo_measure',
    align: 'center'
  },
  {
    name: 'action',
    label: '',
    field: 'action',
    align: 'center'
  }
]

const canGoPrevious = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

const goToPreviousPage = () => {
  if (canGoPrevious.value) {
    emit('previous')
  }
}

const goToNextPage = () => {
  if (canGoNext.value) {
    emit('next')
  }
}

const editPetBioInfo = (row: PetBioInfoType) => {
  emit('editPetBioInfo', row)
}

const breakWords = (text: string, maxWidth: number) => {
  const words = text.split(' ')
  let lines = []
  let currentLine = ''

  words.forEach((word) => {
    if (word.length > maxWidth) {
      // If the current line is not empty, push it first
      if (currentLine) {
        lines.push(currentLine)
        currentLine = ''
      }
      // Break the long word
      for (let i = 0; i < word.length; i += maxWidth) {
        lines.push(word.slice(i, i + maxWidth))
      }
    } else if ((currentLine + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}
</script>

<template>
  <div v-if="props.petBioListData.length" class="q-py-lg q-mb-xl">
    <MtTable2
      :columns="columnBio"
      :rows="props.petBioListData"
      :style="{ boxShadow: 'none' }"
      class="custody-table "
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columnBio"
          :key="index"
        >
          <div v-if="col.field === 'datetime_measure'" class="caption2 regular">
            {{ formatDateTime(row[col.field]) }}
          </div>
          <div v-else-if="['val_weight'].includes(col.field)">
            {{
              parseInt(row[col.field])
                ? row.type_body_weight === 1
                  ? (row[col.field] / 1000).toFixed(2) + ' kg'
                  : parseFloat(row[col.field]).toFixed(2) + ' g'
                : '-'
            }}
          </div>
          <div v-else-if="col.field === 'action'">
            <q-btn unelevated round @click="editPetBioInfo(row)">
              <q-icon size="18px" name="content_copy" />
            </q-btn>
          </div>
          <div
            v-else-if="col.field === 'memo_measure'"
            style="
              max-width: 200px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ row[col.field] ? row[col.field] : '-' }}
            <q-tooltip>
              <span class="body">
                {{ breakWords(row[col.field], 10) }}
              </span>
            </q-tooltip>
          </div>
          <div v-else>
            {{ row[col.field] ? roundZeroAfterPoint(row[col.field]) : '-' }}
          </div>
        </td>
      </template>
    </MtTable2>
    <div
      v-if="props.showPagination"
      class="flex justify-between items-center q-mt-md q-mb-lg"
    >
      <q-btn
        label="前"
        :disabled="!canGoPrevious"
        color="primary"
        flat
        @click="goToPreviousPage"
      />
      <q-btn
        label="次"
        :disabled="!canGoNext"
        color="primary"
        flat
        @click="goToNextPage"
      />
    </div>
  </div>

  <p v-else class="q-pl-md text-grey-500">生体情報はありません。</p>
</template>
