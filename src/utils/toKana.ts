import * as WanaKana from 'wanakana'

export function KatakanaDirective(app: any) {
  const katakanaListener = (event) => {
    const katakanaValue = WanaKana.toKatakana(event.target.value, {
      IMEMode: 'toKatakana'
    })
    event.target.value = katakanaValue
  }
  app.directive('katakana', {
    beforeMount(el, binding) {
      if (binding.value) {
        el._katakanaListener = katakanaListener
        el.addEventListener('input', katakanaListener)
      }
    },

    beforeUnmount(el) {
      el.removeEventListener('input', katakanaListener)
    }
  })
}
