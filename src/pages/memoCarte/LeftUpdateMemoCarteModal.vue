<script setup lang="ts">
import MtInputForm from '@/components/form/MtInputForm.vue'
import useMemoCarteStore from '@/stores/memo-cartes'
import { dateFormat, truncateAndSearch } from '@/utils/aahUtils'
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

const emits = defineEmits(['setMemoCarteContent'])
const memoCarteStore = useMemoCarteStore()
const { getMemoCartePetDetail, getMemoCartes } = storeToRefs(memoCarteStore)
const memoCarteInitList = ref([])
const memoCarteList = ref([])
const memoCarteSearch = ref('')
const isSearch = ref(false)

const set = (memo) => {
  closeSearchMemoCarte()
  emits('setMemoCarteContent', memo)
}
const searchMemoCarte = () => {
  isSearch.value = true
  memoCarteList.value = memoCarteInitList.value.filter((v) => {
    return v.memo_other
      .toLowerCase()
      .includes(memoCarteSearch.value.toLowerCase())
  })
}
const closeSearchMemoCarte = () => {
  isSearch.value = false
}
onMounted(() => {
  if (getMemoCartePetDetail.value.length > 0)
    memoCarteInitList.value = getMemoCartePetDetail.value
  else if (getMemoCartes.value.length > 0)
    memoCarteInitList.value = getMemoCartes.value
  memoCarteList.value = memoCarteInitList.value
})
</script>

<template>
  <div
    :class="isSearch ? 'absolute bg-white' : ''"
    :style="isSearch ? 'width: 500px; z-index: 10;' : ''"
  >
    <q-form @submit="searchMemoCarte()" class="flex no-wrap q-mb-md">
      <MtInputForm
        type="text"
        class="full-width q-mr-md"
        v-model="memoCarteSearch"
        @updatedValue="searchMemoCarte()"
      />
      <q-btn type="submit">
        <q-icon name="search" size="14" />
      </q-btn>
    </q-form>
    <q-list bordered separator>
      <q-scroll-area
        style="width: 100%; max-width: 100%; height: calc(100vh - 280px)"
      >
        <q-item
          @click="set(memo)"
          v-for="memo in memoCarteList"
          clickable
          v-ripple
        >
          <q-item-section>
            <div class="q-pa-none q-ma-none body1">
              <span class="text-grey-500">{{
                dateFormat(memo.datetime_memo_carte)
              }}</span>
              <span
                v-html="
                  truncateAndSearch(
                    memo.memo_other,
                    isSearch ? 50 : 20,
                    memoCarteSearch
                  )
                "
              ></span>
            </div>
          </q-item-section>
        </q-item>
      </q-scroll-area>
    </q-list>
  </div>
</template>
