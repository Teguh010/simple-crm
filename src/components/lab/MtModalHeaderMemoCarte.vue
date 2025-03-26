<script setup lang="ts">
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'

const props = defineProps({
  fixedFilter: { type: Boolean, default: false },
  memoCarteSearch: String,
  illnessHistoryList: Array,
  illnessHistoryListDefault: Array,
  illnessHistorySelected: String,
  yearPeriod: String
})

const emit = defineEmits([
  'update:memoCarteSearch',
  'update:illnessHistorySelected',
  'update:yearPeriod',
  'onEnterPress',
  'onSearch',
  'onAddMemoCarte',
  'update:illnessHistoryList'
])

const handleIllnessHistoryUpdate = (val) => {
  emit('update:illnessHistorySelected', val)
  emit('onSearch')
}
</script>

<template>
  <div
    class="full-width q-pr-lg z-top header-container"
    :class="props.fixedFilter ? 'bg-white sticky-header' : ''"
  >
    <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
      <MtFormInputText
        :model-value="props.memoCarteSearch"
        @update:model-value="(val) => emit('update:memoCarteSearch', val)"
        label="キーワード"
        style="flex: 1"
        autofocus
        @onEnterPress="() => emit('onEnterPress')"
      />
      <div style="flex: 1">
        <MtFilterSelect
          ref="illnessHistoryRef"
          label="現疾患・既往歴"
          :options="props.illnessHistoryList"
          :options-default="props.illnessHistoryListDefault"
          :selecting="props.illnessHistorySelected"
          @update:options="(val) => emit('update:illnessHistoryList', val)"
          @update:selecting="handleIllnessHistoryUpdate"
          @onEnterPress="() => emit('onSearch')"
        />
      </div>
      <div>
        <MtFormRadiobtn
          label="直近90日"
          :model-value="props.yearPeriod"
          @update:model-value="(val) => emit('update:yearPeriod', val)"
          val="last90days"
          @update:selected="() => emit('onSearch')"
        />
        <MtFormRadiobtn
          label="今年"
          :model-value="props.yearPeriod"
          @update:model-value="(val) => emit('update:yearPeriod', val)"
          val="current"
          @update:selected="() => emit('onSearch')"
        />
        <MtFormRadiobtn
          label="去年"
          :model-value="props.yearPeriod"
          @update:model-value="(val) => emit('update:yearPeriod', val)"
          val="last"
          @update:selected="() => emit('onSearch')"
        />
        <MtFormRadiobtn
          label="全期間"
          :model-value="props.yearPeriod"
          @update:model-value="(val) => emit('update:yearPeriod', val)"
          val="all"
          @update:selected="() => emit('onSearch')"
        />
      </div>
      <div>
        <q-btn
          unelevated
          padding="6px 14px"
          @click="() => emit('onSearch')"
          color="accent-800"
          text-color="white"
        >
          <q-icon size="18px" name="search" />検索
        </q-btn>
      </div>
      <q-btn
        unelevated
        padding="6px 14px"
        color="primary"
        text-color="white"
        @click="() => emit('onAddMemoCarte')"
      >
        <q-icon size="18px" name="add" class="q-mr-xs" />メモカルテ
      </q-btn>
    </div>
  </div>
</template>

<style scoped>
.header-container {
  position: relative;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>