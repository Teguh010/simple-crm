<script setup lang="ts">
import { onMounted, ref } from 'vue'

const closeUpdDialogFlg = ref(false)
const props = defineProps<{
  modelTitle: ''
  pets: {
    type: Array<any>
  }
  selectedPet: Array<any>
  petList: any
}>()

const petList = ref([])

function close(isSubmit: any) {
  if (isSubmit) {
    props.petList.length = 0
    props.petList.push(...petList.value)
    closeUpdDialogFlg.value = true
  }
  closeUpdDialogFlg.value = true
}

async function optionSelected(id_pet: any) {
  if (petList.value.includes(id_pet)) {
    const idx = petList.value.indexOf(id_pet)
    petList.value.splice(idx, 1)
    return
  }
  petList.value.push(id_pet)
}

onMounted(() => {
  petList.value = [...props.petList]
})
</script>

<template>
  <div v-close-popup="closeUpdDialogFlg" class="">
    <div
      class="header-row row flex justify-between q-py-sm q-px-md items-center"
    >
      <div>{{ modelTitle ? modelTitle : '操作' }}</div>
      <q-btn @click="close" flat round dense icon="close" />
    </div>
    <div class="q-mt-md">
      <div class="pet-row">
        <q-btn
          v-for="pet in props.pets"
          :id="pet.id_pet.toString()"
          :key="pet.id_pet"
          :label="pet.name_pet"
          :outline="!petList.includes(pet.id_pet)"
          class="q-ma-sm"
          color="blue-grey"
          rounded
          size="lg"
          @click="optionSelected(pet.id_pet)"
        />
      </div>
    </div>
    <div class="modal-footer q-mb-sm">
      <q-btn flat icon="arrow_back" label="いいえ" @click="close(false)" />
      <q-btn
        flat
        icon-right="arrow_forward"
        label="はい"
        @click="close(true)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.dialog-header {
  .heading {
    font-size: 14px;
    font-weight: 700;
  }
}

.header-row {
  background-color: #dddddd;
}
.pet-row {
  width: 90%;
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  margin: 0 auto;
  padding-bottom: 1rem;
}
</style>
