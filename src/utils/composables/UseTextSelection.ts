import { ref } from 'vue'

interface TextSelectionProps {
  containerId: string
  onSelectionComplete?: (selectedText: string) => void
}

export const useTextSelection = ({ containerId, onSelectionComplete }: TextSelectionProps) => {
  const touchStartCoords = ref<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.changedTouches?.[0]
    if (touch) {
      touchStartCoords.value = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    console.log('=== touchmove triggered ===', {
      touches: e.touches.length,
      coords: e.changedTouches?.[0] ? {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      } : null
    })
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches?.[0]
    if (!touch || !touchStartCoords.value) return

    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartCoords.value.x, 2) +
      Math.pow(touch.clientY - touchStartCoords.value.y, 2)
    )

    try {
      if (distance < 10) {
        // Single tap logic
        const range = document.caretRangeFromPoint?.(touch.clientX, touch.clientY)
        if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
          const text = range.startContainer.textContent || ''
          const position = range.startOffset

          let start = position
          let end = position
          
          while (start > 0 && !/[\s,.]/.test(text[start - 1])) {
            start--
          }
          
          while (end < text.length && !/[\s,.]/.test(text[end])) {
            end++
          }

          const wordRange = document.createRange()
          wordRange.setStart(range.startContainer, start)
          wordRange.setEnd(range.startContainer, end)
          
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(wordRange)
            const selectedText = selection.toString().trim()
            if (selectedText && onSelectionComplete) {
              onSelectionComplete(selectedText)
            }
          }
        }
      } else {
        // Drag selection
        const container = document.getElementById(containerId)
        if (!container) return

        const textNodes: Node[] = []
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          null
        )

        let node: Node | null
        while ((node = walker.nextNode())) {
          textNodes.push(node)
        }

        const startRange = document.caretRangeFromPoint?.(
          touchStartCoords.value.x,
          touchStartCoords.value.y
        )
        const endRange = document.caretRangeFromPoint?.(
          touch.clientX,
          touch.clientY
        )

        if (startRange && endRange) {
          const selection = window.getSelection()
          if (selection) {
            const range = document.createRange()
            
            const startNodeIndex = textNodes.indexOf(startRange.startContainer)
            const endNodeIndex = textNodes.indexOf(endRange.startContainer)

            const isBackward = startNodeIndex > endNodeIndex || 
              (startNodeIndex === endNodeIndex && 
               startRange.startOffset > endRange.startOffset)

            if (isBackward) {
              range.setStart(endRange.startContainer, endRange.startOffset)
              range.setEnd(startRange.startContainer, startRange.startOffset)
            } else {
              range.setStart(startRange.startContainer, startRange.startOffset)
              range.setEnd(endRange.startContainer, endRange.startOffset)
            }

            selection.removeAllRanges()
            selection.addRange(range)

            const selectedText = selection.toString().trim()
            if (selectedText && onSelectionComplete) {
              onSelectionComplete(selectedText)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in selection:', error)
    }

    touchStartCoords.value = null
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}