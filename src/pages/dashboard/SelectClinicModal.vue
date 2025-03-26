<script setup lang="ts">
import { computed, defineEmits, onMounted, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useClinicStore from '@/stores/clinics'
import useAuthStore from '@/stores/auth'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'

const authStore = useAuthStore()
const clinicStore = useClinicStore()
const { getAuthUser } = storeToRefs(authStore)

const selectedClinic = ref<number | null>(null)
const props = defineProps<{
  callBack?: () => void
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectClinic = () => {
  const selected = clinicStore.getClinics.find((c) => {
    return c.id_clinic === selectedClinic.value
  })

  clinicStore.selectClinic(selected)
  localStorage.setItem('selectedClinic', selected.id_clinic)
  localStorage.setItem('id_clinic', selected.id_clinic)
  if (props.callBack) {
    props.callBack()
  }
  return close()
}

const close = () => {
  emit('close')
}

const clinicOptions = computed(() => {
  const currentLoginUserClinics = clinicStore.getClinics.filter((c) => {
    return getAuthUser.value.id_clinic_list.includes(c.id_clinic)
  })
  return currentLoginUserClinics.map((c) => {
    return {
      ...c,
      label: c.name_clinic_display,
      value: c.id_clinic
    }
  })
})

onMounted(() => {
  selectedClinic.value = getAuthUser?.value?.id_clinic_list[0]
})
</script>

<template>
  <div class="q-pa-lg">
    <div class="flex column gap-3">
      <h3 class="text-center">
        病院の選択
      </h3>
      <p class="text-center">
        複数病院の所属があります。<br/>ログイン病院を選択してください。
      </p>
      <MtFormPullDown
        v-model:selected="selectedClinic"
        :options="clinicOptions"
        :rules="[aahValidations.validationRequired]"
        label="ログイン病院"
      />
      <q-btn unelevated color="primary" @click="selectClinic">Ok</q-btn>
    </div>
  </div>
</template>