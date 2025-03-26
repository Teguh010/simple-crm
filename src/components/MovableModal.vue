<script setup lang="ts">
import { ref, withDefaults, computed, onMounted, onUnmounted } from 'vue'
import VueDraggableResizable from 'vue-draggable-resizable'
import { useMovableModalStore } from '@/stores/movable-modal'
import { storeToRefs } from 'pinia'
const movableModalStore = useMovableModalStore()
const { getMovableModalData } = storeToRefs(movableModalStore)

type DragResizeEmitType = {
  left: number
  top: number
  width: number
  height: number
}

const props = withDefaults(
  defineProps<{
    width: number
    height: number
    x: number
    y: number
  }>(),
  {
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }
)

const emit = defineEmits<{
  (e: 'update:resize', resize: DragResizeEmitType): void
  (e: 'dragStop', value: DragResizeEmitType): void
}>()

const onResizing = (e: DragResizeEmitType) => {
  emit('update:resize', e)
}

const onDragStop = (e: DragResizeEmitType) => {
  emit('dragStop', e)
}

const onSelectElement = (event: Event) => {
  const { className, tagName } = event.target as HTMLElement

  if (className === 'q-editor__content') {
    (event.target as HTMLElement).focus()
  }

  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    (event.target as HTMLElement).focus()
  }
}

const modalHeight = computed(() => {
  const contentHeight = document.querySelector('.modal-content')?.scrollHeight || 0
  const padding = 40
  return Math.max(600, contentHeight + padding)
})

// Add constant for header and footer heights
const HEADER_HEIGHT = 56 // Adjust based on your header height
const FOOTER_HEIGHT = 72 // Adjust based on your footer height

// Compute available content height
const availableContentHeight = computed(() => {
  const totalHeight = modalHeight.value
  return `calc(${totalHeight}px - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`
})

// Watch perubahan content
const observer = ref<ResizeObserver | null>(null)

onMounted(() => {
  observer.value = new ResizeObserver(() => {
    modalHeight.value
  })

  const content = document.querySelector('.modal-content')
  if (content) {
    observer.value.observe(content)
  }
})

// Cleanup listener
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<template>
  <VueDraggableResizable
    :active="true"
    :w="props.width"
    :h="modalHeight"
    :x="props.x"
    :y="props.y"
    :z="getMovableModalData?.z || 6001"
    :minHeight="600"
    :minWidth="500"
    :draggable="true"
    :resizable="true"
    axis="both"
    class="movable-modal"
    @onResize="onResizing"
    @dragstop.once="onDragStop"
  >
    <div class="modal-content">
      <slot @mousedown="onSelectElement" @touchstart="onSelectElement" name="content" />
    </div>
  </VueDraggableResizable>
</template>

<style lang="scss" scoped>
:root {
  --header-height: 56px;
  --footer-height: 72px;
}

.movable-modal {
  top: 800px;
  background-color: $white;
  position: fixed;
  display: flex;
  flex-direction: column;
  
  &.active::before {
    outline: 2px dotted darkred;
  }
  
  .vdr-stick {
    width: 10px;
    height: 10px;
  }
}

.modal-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.scrollable-content) {
    height: v-bind(availableContentHeight);
    overflow-y: auto;
    flex: 1;
  }
}

:deep(.content-container) {
  overflow: hidden;
  z-index: 6001;
}
</style>
