<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import MtFormCheckBox from '../form/MtFormCheckBox.vue';
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { LabPrint } from '@/types/types'
import { sortBy } from 'lodash';

interface Props {
  categoryGroupedList: Record<string, any>;
  labPrintList: LabPrint[];
  showUnitRange: boolean;
  selectLatestSixDays: boolean;
  selectLabPrint: LabPrint | null;
  pdfFixedLabComparisonDialog: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  categoryGroupedList: () => ({}),
  labPrintList: () => {[]},
  showUnitRange: false,
  selectLatestSixDays: false,
  pdfFixedLabComparisonDialog: false,
  selectLabPrint: null
});

const emit = defineEmits([
  'update:showUnitRange',
  'update:selectLatestSixDays',
  'update:pdfFixedLabComparisonDialog',
  'update:selectLabPrint',
  'openAddModal',
  'tabChange',
]);

const labPrintOptions = ref(sortBy(props.labPrintList, 'display_order'))
const labPrintOptionsDefault = reactive([...sortBy(props.labPrintList, 'display_order')])

const showUnitRangeValue = computed({
  get: () => props.showUnitRange,
  set: (value) => emit('update:showUnitRange', value),
});

const selectLatest6DaysValue = computed({
  get: () => props.selectLatestSixDays,
  set: (value) => emit('update:selectLatestSixDays', value)
});

const selectLabPrintValue = computed({
  get: () => props.selectLabPrint,
  set: (value) => {
    console.log('value', value)
    return emit('update:selectLabPrint', value)
  }
});

const pdfFixedLabComparisonDialogValue = computed({
  get: () => props.pdfFixedLabComparisonDialog,
  set: (value) => emit('update:pdfFixedLabComparisonDialog', value)
});

const handleTabChange = (value: string) => {
  emit('tabChange', value);
};

onMounted(() => {
  if (!props.selectLabPrint) {
    selectLabPrintValue.value = labPrintOptions.value[0]?.value
  }
})
</script>

<template>
  <div class="full-width header-container z-top q-pr-lg q-pl-none bg-white sticky-header">
    <div class="flex items-center justify-between">
      <q-tabs 
        align="left" 
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

      <div class="flex items-center">
        <MtFilterSelect
          label="固定印刷"
          v-model:options="labPrintOptions"
          v-model:options-default="labPrintOptionsDefault"
          v-model:selecting="selectLabPrintValue"
        />

        <q-btn
          label="出力"
          color="primary"
          class="q-mx-md"
          @click="pdfFixedLabComparisonDialogValue = !pdfFixedLabComparisonDialogValue"
        />

        <MtFormCheckBox
          label="直近6日"
          v-model="selectLatest6DaysValue"
        />
        <MtFormCheckBox
          label="単位/基準値" 
          v-model="showUnitRangeValue"
        />

        <q-btn
          unelevated
          color="primary"
          text-color="white"        
          @click="$emit('openAddModal')"
          class="q-ml-md"
        >
          <q-icon size="18px" name="add" class="q-mr-xs" />検査結果
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-container {
  position: relative;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
