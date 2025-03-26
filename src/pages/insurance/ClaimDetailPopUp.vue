<template>
  <div
    class="inline-block"
    @mouseleave="startCloseTimer"
    @mouseover="openPopup"
  >
    <!-- QPopupProxy as the actual popup container -->
    <q-popup-proxy
      v-model="showPopup"
      :target="anchorEl"
      anchor="bottom middle"
      cover
      self="top middle"
      transition-hide="scale"
      transition-show="scale"
      @mouseleave="startCloseTimer"
      @mouseover="cancelCloseTimer"
    >
      <!-- The content of the popup -->
      <q-card class="q-pa-md">
        <div class="text-h6">
          Whole Popup
        </div>

        <q-separator class="q-my-sm" />

        <div>
          <p class="q-mb-sm">
            This is a larger, more interactive popup.
            You can put anything here: cards, buttons, forms, etc.
          </p>
          <q-btn
            class="q-my-sm"
            color="primary"
            label="Some action"
            @click="handleAction"
          />
        </div>
      </q-card>
    </q-popup-proxy>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const showPopup = ref(false)
const anchorEl = ref(null)
let timer = null
const props = defineProps({ mouseEnter: false })


watch(() => props.mouseEnter, (nowValue, oldValue) => {
  if (nowValue) {
    openPopup()
    showPopup.value = true
  }
})

function openPopup() {
  showPopup.value = true
}

function startCloseTimer() {
  // Delay closing to allow for moving from the trigger to the popup
  timer = setTimeout(() => {
    showPopup.value = false
  }, 200)
}

function cancelCloseTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function handleAction() {
  // Example action when the button is clicked
  // Could be an API call, route change, etc.
  alert('Action performed!')
}
</script>

<style scoped>
.inline-block {
  display: inline-block;
}
</style>
