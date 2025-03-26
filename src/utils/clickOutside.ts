import type { DirectiveBinding } from 'vue'

const HANDLERS_PROPERTY = "__v-click-outside"
const HAS_WINDOWS = typeof window !== "undefined"
const HAS_NAVIGATOR = typeof navigator !== "undefined"
const IS_TOUCH =
  HAS_WINDOWS &&
  ("ontouchstart" in window ||
    (HAS_NAVIGATOR && navigator.maxTouchPoints > 0))
const EVENTS = IS_TOUCH ? ["touchstart"] : ["click"]

interface BindingValue {
  handler: (event: Event) => void
  middleware?: (event: Event) => boolean
  events?: string[]
  isActive?: boolean
  detectIframe?: boolean
  capture?: boolean
}

const processDirectiveArguments = (bindingValue: any): Required<BindingValue> => {
  const isFunction = typeof bindingValue === "function";
  if (!isFunction && typeof bindingValue !== "object") {
    throw new Error(
      "v-click-outside: Binding value must be a function or an object"
    )
  }
  return {
    handler: isFunction ? bindingValue : bindingValue.handler,
    middleware: bindingValue.middleware || ((item: Event) => true),
    events: bindingValue.events || EVENTS,
    isActive: !(bindingValue.isActive === false),
    detectIframe: !(bindingValue.detectIframe === false),
    capture: Boolean(bindingValue.capture),
  }
}

const execHandler = ({
  event,
  handler,
  middleware,
}: {
  event: Event
  handler: (event: Event) => void
  middleware: (event: Event) => boolean
}) => {
  if (middleware(event)) {
    handler(event)
  }
}

const onFauxIframeClick = ({
  el,
  event,
  handler,
  middleware,
}: {
  el: HTMLElement
  event: FocusEvent
  handler: (event: Event) => void
  middleware: (event: Event) => boolean
}) => {
  setTimeout(() => {
    const { activeElement } = document
    if (
      activeElement &&
      activeElement.tagName === "IFRAME" &&
      !el.contains(activeElement)
    ) {
      execHandler({ event, handler, middleware })
    }
  }, 0)
}

const onEvent = ({
  el,
  event,
  handler,
  middleware,
}: {
  el: HTMLElement
  event: Event
  handler: (event: Event) => void
  middleware: (event: Event) => boolean
}) => {
  const path = (event as any).path || (event.composedPath && event.composedPath())
  const isClickOutside = path
    ? path.indexOf(el) < 0
    : !el.contains(event.target as Node)
  if (!isClickOutside) {
    return
  }
  execHandler({ event, handler, middleware })
}

const beforeMount = (el: HTMLElement, { value }: DirectiveBinding) => {
  const {
    events,
    handler,
    middleware,
    isActive,
    detectIframe,
    capture,
  } = processDirectiveArguments(value)

  if (!isActive) {
    return
  }

  el[HANDLERS_PROPERTY] = events.map((eventName) => ({
    event: eventName,
    srcTarget: document.documentElement,
    handler: (event: Event) => onEvent({ el, event, handler, middleware }),
    capture,
  }))

  if (detectIframe) {
    const detectIframeEvent = {
      event: "blur",
      srcTarget: window,
      handler: (event: Event) => onFauxIframeClick({ el, event: event as FocusEvent, handler, middleware }),
      capture
    }
    el[HANDLERS_PROPERTY] = [...el[HANDLERS_PROPERTY], detectIframeEvent]
  }

  el[HANDLERS_PROPERTY].forEach(({ event, srcTarget, handler: thisHandler }) =>
    setTimeout(() => {
      if (!el[HANDLERS_PROPERTY]) {
        return
      }
      srcTarget.addEventListener(event, thisHandler, capture)
    }, 0)
  )
}

const unmounted = (el: HTMLElement) => {
  const handlers = el[HANDLERS_PROPERTY] || []
  handlers.forEach(({ event, srcTarget, handler, capture }) =>
    srcTarget.removeEventListener(event, handler, capture)
  )
  delete el[HANDLERS_PROPERTY]
}

const updated = (el: HTMLElement, { value, oldValue }: DirectiveBinding) => {
  if (JSON.stringify(value) === JSON.stringify(oldValue)) {
    return
  }
  unmounted(el)
  beforeMount(el, { value })
}

const directive = {
  beforeMount,
  updated,
  unmounted
}

export default HAS_WINDOWS ? directive : {}
