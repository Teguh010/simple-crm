<script setup lang="ts">
import { computed, ref } from 'vue';
import { IllnessHistoryType } from '@/types/types';
import MtFilterSelect from '../MtFilterSelect.vue';
import MtFormRadiobtn from '../form/MtFormRadiobtn.vue';
import MtFormCheckBox from '../form/MtFormCheckBox.vue';

const closeModal = () => {
  emit('closeModal')
}

const props = withDefaults(defineProps<Props>(), {
  fixedFilter: false,
  yearPeriod: 'all',
  illnessHistoryListDefault: () => [],
  showUnitRange: false,
  categoryGroupedList: () => ({}),
  tabs: '',
});

const emit = defineEmits([
  'update:yearPeriod',
  'update:showUnitRange',
  'update:tabs',
  'filterChange',
  'openAddModal',
  'tabChange'
]);

const illnessHistoryRef = ref();
const illnessHistoryList = ref<IllnessHistoryType[]>([]);
const illnessHistorySelected = ref();

const yearPeriodValue = computed({
  get: () => props.yearPeriod,
  set: (value) => emit('update:yearPeriod', value)
});

const showUnitRangeValue = computed({
  get: () => props.showUnitRange,
  set: (value) => emit('update:showUnitRange', value)
});

const tabValue = computed({
  get: () => props.tabs,
  set: (value) => emit('update:tabs', value)
});

const handleFilterChange = () => {
  emit('filterChange', {
    yearPeriod: yearPeriodValue.value,
    illness_history: illnessHistorySelected.value
  });
};

const handleTabChange = (value: string) => {
  emit('tabChange', value);
};

defineExpose({
  illnessHistoryRef,
  illnessHistoryList,
  illnessHistorySelected
});
</script>
<template>
  <div class="full-width z-top" :class="props.fixedFilter ? 'q-pr-lg q-pl-none bg-white fixed' : ''">
    <div v-if="props.fixedFilter" class="flex no-wrap items-center" style="gap: 13px">
      <div style="flex: 1">
        <MtFilterSelect
          v-model:options="illnessHistoryList"
          v-model:selecting="illnessHistorySelected"
          ref="illnessHistoryRef"
          label="現疾患・既往歴"
          :options-default="props.illnessHistoryListDefault"
          :options-label="(v: IllnessHistoryType) => v.name_disease ? v.name_disease : v.name_disease_free"
          @onEnterPress="handleFilterChange"
          @update:selecting="handleFilterChange"
        />
      </div>

      <div>
        <MtFormRadiobtn 
          v-model="yearPeriodValue" 
          label="直近90日" 
          val="last90days"
          @update:selected="handleFilterChange" 
        />
        <MtFormRadiobtn 
          v-model="yearPeriodValue" 
          label="今年" 
          val="current"
          @update:selected="handleFilterChange" 
        />
        <MtFormRadiobtn 
          v-model="yearPeriodValue" 
          label="去年" 
          val="last"
          @update:selected="handleFilterChange" 
        />
        <MtFormRadiobtn 
          v-model="yearPeriodValue" 
          label="全期間" 
          val="all"
          @update:selected="handleFilterChange" 
        />
      </div>

      <div>
        <q-btn
          padding="6px 14px"
          unelevated
          @click="handleFilterChange"
          color="accent-800"
          text-color="white"
        >
          <q-icon size="18px" name="search" />検索
        </q-btn>
      </div>

      <q-btn
        unelevated
        color="primary"
        text-color="white"        
        @click="$emit('openAddModal')"
      >
        <q-icon size="18px" name="add" class="q-mr-xs" />検査結果
      </q-btn>
    </div>

    <div class="flex items-center justify-between">
      <q-tabs 
        align="left" 
        v-model="tabValue" 
        class="text-grey-800" 
        narrow-indicator 
        @update:model-value="handleTabChange"
      >
        <template v-for="cat in categoryGroupedList">
          <q-tab 
            v-if="cat?.label" 
            :name="`category-${cat.id_category}`" 
            :label="`${cat.label || ''}`" 
          />
        </template>
      </q-tabs>

      <div>
        <MtFormCheckBox
          label="単位/基準値" 
          v-model="showUnitRangeValue"
        /> 
      </div>
    </div>
  </div>
</template>
