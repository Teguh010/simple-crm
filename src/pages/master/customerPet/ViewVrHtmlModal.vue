<script setup lang="ts">
const props = defineProps({
  buttons: [] as any
})

const formatClinicURL = (value: string) => {
  // value as the target URL
  // Define the regex pattern
  const pattern = /\/html\/([\d\/]+)\//

  // Get the part that matches the pattern
  const match = value.match(pattern)

  if (match && match[1]) {
    // Store the numeric sequence in a variable
    const numberString = match[1].split('/').join('_')
    return numberString
  } else {
    return null
  }
}

const openHtmlSite = (el: {
  code_customer_ex: string
  code_pet_ex: string
  flgPetDetailBtn: boolean
  label: string
}) => {
  const clinicData = JSON.parse(localStorage.getItem('clinic'))

  if(clinicData && Object.keys(clinicData).length > 0 && Boolean(clinicData.clinic.url_vr_html)) {
    let clinicPath = clinicData.clinic.url_vr_html
    const clinicPathWithoutPrefix = formatClinicURL(clinicPath)
    const formattedCodeCustomer = String(el.code_customer_ex).padStart(6, '0')
    let ownerPrefix = ''
    let location = ''
    
    if(el.hasOwnProperty('flgCustomerBtn')) {
      // open customer html site
      ownerPrefix = 'オーナー情報'
      location = `${clinicPath}${formattedCodeCustomer}/${clinicPathWithoutPrefix}_${formattedCodeCustomer}_${ownerPrefix}.html`
    }
    else if(el.hasOwnProperty('flgPetDetailBtn')) {
      // open pet detail site
      const formattedCodePet = String(el.code_pet_ex).padStart(9, '0')
      ownerPrefix = 'ペット情報'
      location = `${clinicPath}${formattedCodeCustomer}/${formattedCodePet}/${clinicPathWithoutPrefix}_${formattedCodeCustomer}_${formattedCodePet}_${ownerPrefix}.html`
    }
    else if(el.hasOwnProperty('flgPetMemoCarteBtn')) {
      // open pet memo carte site
      const formattedCodePet = String(el.code_pet_ex).padStart(9, '0')
      ownerPrefix = 'カルテ情報'
      location = `${clinicPath}${formattedCodeCustomer}/${formattedCodePet}/${clinicPathWithoutPrefix}_${formattedCodeCustomer}_${formattedCodePet}_${ownerPrefix}.html`
    }

    window.open(location, '_blank')
  }
}
</script>
<template>
  <q-card class="my-card flex" flat bordered>
    <template v-for="(button, idx) in buttons" :key="idx">
      <q-card-section>
        <q-btn color="primary" unelevated @click="openHtmlSite(button)">
          <span>{{ button.label }}</span>
        </q-btn>
      </q-card-section>
    </template>
  </q-card>
</template>
