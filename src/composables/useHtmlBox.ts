import { dom } from 'quasar'
import { ref, onMounted, onUnmounted, Ref, watch, computed } from 'vue'

const { height, width } = dom

export function useHtmlBox(elementRef: Ref<HTMLElement | null>) {
    const boxWidth = ref(0)
    const boxHeight = ref(0)
    const cBoxWidth = computed(() => elementRef.value ? width(elementRef.value) : 0)
    const cBoxHeight = computed(() => elementRef.value ? height(elementRef.value) : 0)
    // Function to update dimensions
    const updateDimensions = () => {
        if (elementRef.value) {
            boxWidth.value = width(elementRef.value)
            boxHeight.value = height(elementRef.value)
        }
    }

    // Resize observer for DOM changes
    let resizeObserver: ResizeObserver | null = null



    onMounted(() => {
        // Initialize ResizeObserver
        resizeObserver = new ResizeObserver(updateDimensions)

        if (elementRef.value) {
            resizeObserver.observe(elementRef.value)
        }

        // Listen to window resize events
        window.addEventListener('resize', updateDimensions)

        // Initial measurement
        updateDimensions()
    })

    onUnmounted(() => {
        // Cleanup
        if (resizeObserver) {
            resizeObserver.disconnect()
        }
        window.removeEventListener('resize', updateDimensions)
    })

    return {
        width: boxWidth,
        height: boxHeight,
        cWidth: cBoxWidth,
        cHeight: cBoxHeight
    }
}
