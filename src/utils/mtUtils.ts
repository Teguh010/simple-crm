import { createApp } from 'vue'
import { Loading, LocalStorage, Quasar } from 'quasar'
import iconSet from 'quasar/icon-set/material-icons'
import '@quasar/extras/material-icons/material-icons.css'
import http from '@/utils/http'
import MtUtilsPopup from '@/components/MtUtilsPopup.vue'
import MtInnerMenuPopup from '@/components/MtInnerMenuPopup.vue'
import MtUtilsMediumDialog from '@/components/MtUtilsMediumDialog.vue'
import MtUtilsFullHeightPopup from '@/components/MtUtilsFullHeightPopup.vue'
import MtSmalPopup from '@/components/MtSmallPopup.vue'
import MtDraggablePopup from '@/components/MtDraggablePopup.vue'
import MtDraggableNotificationPopup from '@/components/MtDraggableNotificationPopup.vue'
import MtCustomerPetByPhoneNumberPopup from '@/pages/master/customerPet/MtDraggableCustomerPetByPhoneNumberPopup.vue'
import MtDraggableServicePopup from '@/components/MtDraggableServicePopup.vue'
import MtDraggableSummaryPopup from '@/components/MtDraggableSummaryPopup.vue'
import MtUtilsAlert from '@/components/MtUtilsAlert.vue'
import MtUtilsConfirm from '@/components/MtUtilsConfirm.vue'
import MtUtilsImageViewPopup from '@/components/MtImageViewModal.vue'
import MtUtilsWait from '@/components/MtUtilsWait.vue'
import MtUtilsDialog from '@/components/MtUtilsDialog.vue'
import MtAutoCloseDialog from '@/components/MtAutoCloseDialog.vue'
import router from '@/router'
import selectOptions from '@/utils/selectOptions'
import { api } from '@/boot/axios'
import { KatakanaDirective } from './toKana'
import permissionDirective from '@/utils/permission'
import { setPageTitle } from './pageTitleHelper'
import MtUtilsMediumDialogWithPre from '@/components/MtUtilsMediumDialogWithPre.vue'
import MtInnerMenuPopupWithPresistance from '@/components/MtInnerMenuPopupWithPresistance.vue'
import MtUtilsMaximizedPopup from '@/components/MtUtilsMaximizedPopup.vue'
import MtSmallPopupScrollable from '@/components/MtSmallPopupScrollable.vue'

export default {
  async popup(
    component,
    props: any = null,
    withoutScrollArea: boolean = false
  ) {
    return new Promise<void>((resolve) => {
      const dom = document.createElement('div')
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      let popupProps = { ...props }
      if (!popupProps.hasOwnProperty('popup')) {
        popupProps['popup'] = {}
      }
      popupProps.popup['withoutScrollArea'] = withoutScrollArea

      const popup = createApp(MtUtilsPopup, {
        ...popupProps,
        persistent: props?.popup?.persistent || false,
        onSubmit(...args) {
          if (props?.onSubmit) {
            props.onSubmit(...args)
          }
          resolve(...args)
        },
        onClose(...args: any) {
          if (typeof childCallBack === 'function') {
            childCallBack()
          }

          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.directive('permission', permissionDirective)

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })

      childCallBack = content.unmount
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async smallPopup(component, props: any = null, options: any = {}) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtInnerMenuPopup, {
        ...props,
        persistent: options.persistent || false,
        onClose() {
          sessionStorage.setItem('pageType', null)
          if (typeof childCallBack === 'function') {
            childCallBack()
          }

          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.onClose) {
            props.onClose()
          }
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.directive('permission', permissionDirective)
      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })
      childCallBack = content.unmount
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)
      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async smallPopupWithPresistance(component, props: any = null) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtInnerMenuPopupWithPresistance, {
        onClose() {
          sessionStorage.setItem('pageType', null)
          if (typeof childCallBack === 'function') {
            childCallBack()
          }

          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        },
        ...props
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.directive('permission', permissionDirective)
      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })
      childCallBack = content.unmount
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)
      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },

  async mediumPopup(
    component,
    props: any = null,
    withoutScrollArea: boolean = false,
    width?: string
  ) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')

      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }

      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      let popupProps = { ...props }

      if (!popupProps.hasOwnProperty('popup')) {
        popupProps['popup'] = {}
      }

      popupProps.popup['withoutScrollArea'] = withoutScrollArea

      if (width) {
        popupProps['width'] = width
      }

      const popup = createApp(MtUtilsMediumDialog, {
        ...popupProps,
        persistent: props?.popup?.persistent || false,
        onClose(...args: any) {
          if (typeof childCallBack === 'function') {
            childCallBack()
          }

          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.directive('permission', permissionDirective)
      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          content.unmount()
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })
      childCallBack = content.unmount

      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
        const el = document.querySelector('.popup-scroll-area') as HTMLElement
        el.style.overflow = 'hidden'
      })
    })
  },

  async mediumPopupWithPresistance(
    component,
    props: any = null,
    withoutScrollArea: boolean = false
  ) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')

      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }

      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      let popupProps = { ...props }

      if (!popupProps.hasOwnProperty('popup')) {
        popupProps['popup'] = {}
      }

      popupProps.popup['withoutScrollArea'] = withoutScrollArea

      const popup = createApp(MtUtilsMediumDialogWithPre, {
        ...popupProps,
        onClose(...args: any) {
          if (typeof childCallBack === 'function') {
            childCallBack()
          }

          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.directive('permission', permissionDirective)

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          content.unmount()
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })
      childCallBack = content.unmount

      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
        const el = document.querySelector('.popup-scroll-area') as HTMLElement
        el.style.overflow = 'hidden'
      })
    })
  },

  async fullHeightPopup(component, props) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      let childCallBack
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      let popupProps = { ...props }
      if (!popupProps.hasOwnProperty('popup')) {
        popupProps['popup'] = {}
      }

      const popup = createApp(MtUtilsFullHeightPopup, {
        ...popupProps,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)

          if (typeof childCallBack === 'function') {
            childCallBack()
          }
          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.directive('permission', permissionDirective)

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })

      childCallBack = content.unmount

      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)
      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async littlePopup(component, props: any = null) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      let childCallBack
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtSmalPopup, {
        onClose() {
          sessionStorage.setItem('pageType', null)

          if (typeof childCallBack === 'function') {
            childCallBack()
          }
          popup.unmount()
          dom.parentNode.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        },
        ...props
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.directive('permission', permissionDirective)

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })

      childCallBack = content.unmount

      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async draggablePopup(component?: any, props?: any) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.classList.add('ns-popup')
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtDraggablePopup, {
        onClose() {
          sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, props)
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async draggableNotificationPopup(component?: any, props?: any) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.classList.add('ns-popup')
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtDraggableNotificationPopup, {
        onClose() {
          sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, props)
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async draggableCustomerPetByPhoneNumberPopup(props?: any) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.classList.add('ns-popup')
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtCustomerPetByPhoneNumberPopup, {
        ...props,
        onClose() {
          sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      // const content = createApp(component, props)
      // content.use(router)
      // content.use(Quasar, {
      //   plugins: {
      //     Loading,
      //     LocalStorage
      //   },
      //   iconSet: iconSet
      // })

      // router.isReady().then(() => {
      //   KatakanaDirective(content)
      //   content.mount(popup._instance?.refs?.elm)
      // })
    })
  },
  async draggablePopupSevice(component?: any, props?: any) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.classList.add('ns-popup')
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')

      const popup = createApp(MtDraggableServicePopup, {
        onClose() {
          sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      const content = createApp(component, props)
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  async draggablePopupSummary(props?: any) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.classList.add('ns-popup')
      document.body.appendChild(dom)

      // sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtDraggableSummaryPopup, {
        summary: props.summary,
        transcript: props.transcript,
        requestData: props.requestData,
        onClose() {
          // sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      // const content = createApp(component, props)
      // content.use(router)
      // content.use(Quasar, {
      //   plugins: {
      //     Loading,
      //     LocalStorage
      //   },
      //   iconSet: iconSet
      // })

      // router.isReady().then(() => {
      //   KatakanaDirective(content)
      //   content.mount(popup._instance?.refs?.elm)
      // })
    })
  },
  async imageViewPopup(component, props) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      dom.style.backgroundColor = 'white'
      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtUtilsImageViewPopup, {
        ...props,
        onClose() {
          sessionStorage.setItem('pageType', null)
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      // We Can't comment this code, this code helps us to correctly render images
      while (true) {
        if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
          break
        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }

      const content = createApp(component, props)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      content.mount(popup._instance?.refs?.elm)
    })
  },

  async alert(message?: string, title?: string, center?: boolean) {
    return new Promise((resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      const dialog = createApp(MtUtilsAlert, {
        title,
        message,
        center: center,
        onClose(e) {
          dialog.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      dialog.mount(dom)
    })
  },

  async autoCloseAlert(
    message: any,
    title: string | null = null,
    timeout: any = 3000
  ) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      let childCallBack

      const popup = createApp(MtUtilsDialog, {
        position: 'standard',
        onClose(e) {
          if (typeof childCallBack === 'function') {
            childCallBack()
          }
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      while (true) {
        if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
          break
        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }

      const content = createApp(MtAutoCloseDialog, {
        title: title,
        message: message,
        time: timeout,
        onClose() {
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })

      childCallBack = content.unmount

      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      content.mount(popup._instance?.refs?.elm)
    })
  },

  async autoCloseAlertWithHeader(
    messageObj: { header: string; content: string },
    timeout: number = 3000
  ) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      let childCallBack

      const popup = createApp(MtUtilsDialog, {
        position: 'standard',
        onClose(e) {
          if (typeof childCallBack === 'function') {
            childCallBack()
          }
          popup.unmount()
          dom.parentNode.removeChild(dom)
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.mount(dom)

      while (true) {
        if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
          break
        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }

      const content = createApp(MtAutoCloseDialog, {
        title: messageObj.header,
        titleClass: 'text-weight-bold',
        message: messageObj.content,
        time: timeout,
        onClose() {
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })

      childCallBack = content.unmount

      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      content.mount(popup._instance?.refs?.elm)
    })
  },

  async confirm(
    message,
    title,
    okLabel = '削除',
    editLabel?: String = null,
    detailedMessage?: String = null,
    newBtn: Object = null,
    isEmployeeList = {
      show: false,
      callBackFun: Function
    },
    cancelBtn: Boolean = false,
    cancelBtnLabel: string = 'キャンセル',
    persistent: Boolean = false
  ) {
    return new Promise((resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)
      const dialog = createApp(MtUtilsConfirm, {
        title: title,
        message: message,
        okLabel: okLabel,
        editLabel: editLabel,
        detailedMessage: detailedMessage,
        newBtn: newBtn,
        isEmployeeList: isEmployeeList,
        cancelBtn: cancelBtn,
        cancelBtnLabel: cancelBtnLabel,
        persistent: persistent,
        onClose(e) {
          dialog.unmount()
          dom.parentNode.removeChild(dom)
          resolve(e)
        }
      })

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      dialog.mount(dom)
    })
  },

  // Refactor callApi with silent param and object params
  async callApiEx({
    method = selectOptions.reqMethod.GET,
    url = '',
    params = {},
    wholeResponse = false,
    headers = {},
    wholeResponseWithCode = false,
    generalResponse = false,
    silent = true
  }: {
    method?: string
    url?: string
    params?: any
    wholeResponse?: boolean
    headers?: any
    wholeResponseWithCode?: boolean
    generalResponse?: boolean
    silent?: boolean
  } = {}) {
    return new Promise(async (resolve) => {
      let dom, dialog

      if (!silent) {
        dom = document.createElement('div')
        document.body.appendChild(dom)

        dialog = createApp(MtUtilsWait)

        dialog.use(Quasar, {
          plugins: {
            Loading,
            LocalStorage
          },
          iconSet: iconSet
        })

        dialog.mount(dom)

        Loading.show({
          backgroundColor: 'transparent',
          spinnerColor: 'black',
          message: '読み込み中です...',
          messageColor: 'black'
        })
      }

      let res
      if (method === selectOptions.reqMethod.GET) {
        res = await api
          .get(url, { params: params, headers: headers })
          .catch(() => {})
      }
      if (method === selectOptions.reqMethod.POST) {
        res = await api.post(url, params, { headers: headers }).catch(() => {})
      }
      if (method === selectOptions.reqMethod.PUT) {
        res = await api.put(url, params, { headers: headers }).catch(() => {})
      }
      if (method === selectOptions.reqMethod.DELETE) {
        res = await api.delete(url).catch(() => {})
      }

      if (!silent) {
        Loading.hide()
        if (dialog) dialog.unmount()
        if (dom) dom.parentNode?.removeChild(dom)
      }

      if (res && res.data && res.data.code == '200') {
        if (wholeResponseWithCode) {
          resolve(res)
        } else if (wholeResponse) {
          resolve(res.data)
        } else if (res.data.data) {
          resolve(res.data.data)
        } else {
          resolve(res.data)
        }
      } else if (generalResponse) {
        resolve(res)
      } else {
        resolve(null)
      }
    })
  },

  async callApi<TData = any>(
    method = selectOptions.reqMethod.GET,
    url: any = '',
    params: any = {},
    wholeResponse: boolean = false,
    headers: any = {},
    wholeResponseWithCode: boolean = false,
    generalResponse: boolean = false
  ) {
    return new Promise<TData>(async (resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      const dialog = createApp(MtUtilsWait)

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      dialog.mount(dom)

      Loading.show({
        backgroundColor: 'transparent',
        spinnerColor: 'black',
        message: '読み込み中です...',
        messageColor: 'black'
      })
      let res
      if (method === selectOptions.reqMethod.GET) {
        res = await api
          .get(url, { params: params, headers: headers })
          .catch(() => {})
      }
      if (method === selectOptions.reqMethod.POST) {
        res = await api
          .post(url, params, { headers: headers })
          .catch((error) => error.response)
      }
      if (method === selectOptions.reqMethod.PUT) {
        res = await api.put(url, params, { headers: headers }).catch(() => {})
      }
      if (method === selectOptions.reqMethod.DELETE) {
        res = await api.delete(url).catch((error) => error.response)
      }
      Loading.hide()

      dialog.unmount()
      dom.parentNode.removeChild(dom)
      if (res && res.data && res.data.code == '200') {
        if (wholeResponseWithCode) {
          resolve(res)
        }
        if (wholeResponse) {
          resolve(res.data)
        }
        if (res.data.data) {
          resolve(res.data.data)
        }
        resolve(res.data)
      } else if (generalResponse) {
        resolve(res)
      } else {
      }

      resolve(null)
    })
  },

  async promiseAllWithLoader(promises: any[]): Promise<any[]> {
    return await new Promise((resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      const dialog = createApp(MtUtilsWait)

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet
      })

      dialog.mount(dom)

      Loading.show({
        backgroundColor: 'transparent',
        spinnerColor: 'black',
        message: '読み込み中です...',
        messageColor: 'black'
      })

      Promise.all(promises)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          console.error('Error loading promises:', error)
          resolve([])
        })
        .finally(() => {
          Loading.hide()
          dialog.unmount()
          dom.parentNode?.removeChild(dom)
        })
    })
  },

  async promiseAllSilently(promises: any) {
    return new Promise(async (resolve) => {
      const response = await Promise.all(promises).catch((error) => {
        resolve(null)
      })
      resolve(response)
    })
  },

  // promise with dynamic message string
  async promiseAllWithLoaderMsg(promises: any, message: string) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      const dialog = createApp(MtUtilsWait)

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      dialog.mount(dom)

      Loading.show({
        backgroundColor: 'transparent',
        spinnerColor: 'black',
        message,
        messageColor: 'black'
      })
      const response = await Promise.all(promises).catch((error) => {
        Loading.hide()
        dialog.unmount()
        resolve(null)
      })
      Loading.hide()

      dialog.unmount()
      dom.parentNode.removeChild(dom)
      resolve(response)
    })
  },

  async loadFile(url, param) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)

      const dialog = createApp(MtUtilsWait)

      dialog.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      dialog.mount(dom)

      let response = await http.post(url, param)

      dialog.unmount()
      dom.parentNode.removeChild(dom)

      if (response.data) {
        resolve(response.data)
      } else {
        resolve(null)
      }
    })
  },

  async loadImage(url, param) {
    let response: any = await http.post(url, param)
    return response?.data?.data?.src
  },

  closePopup(popups) {
    if (popups && popups.length && popups.length > 0) {
      popups.forEach((popup) => {
        if (popup.parentNode && popup.parentNode.tagName == 'DIV') {
          popup.parentNode.remove()
          return
        }
        popup.remove()
      })
    }
  },

  pdfRender(component: any, props: any) {
    return new Promise(async (resolve, reject) => {
      const dom = document.createElement('div')
      document.body.appendChild(dom)
      const popup = createApp(component, {
        ...props,
        onClose(...args: any) {
          popup.unmount()
          dom.remove()
          resolve()
        }
      })

      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      popup.mount(dom)
    })
  },
  isDuplicateCodeFunc1(itemList, codeFunc1, isEdit = false) {
    if (isEdit) return false

    const activeItems = itemList.filter((item) => !item.flg_delete)
    const maxCodeFunc1 = Math.max(
      ...activeItems.map((item) => parseInt(item.code_func1))
    )
    const defaultCodeFunc1 = maxCodeFunc1 + 1

    return activeItems.some(
      (item) =>
        parseInt(item.code_func1) === parseInt(codeFunc1) &&
        parseInt(codeFunc1) !== defaultCodeFunc1
    )
  },
  getNextCodeFunc1(itemList) {
    const activeItems = itemList.filter((item) => !item.flg_delete)
    const maxCodeFunc1 = Math.max(
      ...activeItems.map((item) => parseInt(item.code_func1))
    )
    return maxCodeFunc1 + 1
  },
  async fetchQrCode(data, size = '50x50', margin = '0') {
    try {
      const response = await http.get(
        'https://api.qrserver.com/v1/create-qr-code/',
        {
          params: { data, size, margin },
          responseType: 'arraybuffer'
        }
      )
      return URL.createObjectURL(new Blob([response.data]))
    } catch (error) {
      console.error('Error fetching QR code:', error)
      throw error
    }
  },
  async smallPopupScrollable(component, props: any = null, options: any = {}) {
    return new Promise(async (resolve) => {
      const dom = document.createElement('div')
      if (props?.popup?.popupClassName) {
        dom.classList.add(props.popup.popupClassName)
      }
      let childCallBack

      document.body.appendChild(dom)
      sessionStorage.setItem('pageType', 'modal')
      const popup = createApp(MtSmallPopupScrollable, {
        ...props,
        width: options.width || '500px',
        onClose() {
          sessionStorage.setItem('pageType', null)
          if (typeof childCallBack === 'function') {
            childCallBack()
          }
          popup.unmount()
          dom.parentNode?.removeChild(dom)
          if (props?.fromPage) {
            setPageTitle(props?.fromPage)
          }
          resolve()
        }
      })
      popup.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })

      popup.directive('permission', permissionDirective)
      popup.mount(dom)

      // while (true) {
      //   if (popup._instance && popup._instance.refs && popup._instance.refs.elm)
      //     break
      //   await new Promise((resolve) => {
      //     setTimeout(resolve, 1)
      //   })
      // }

      const content = createApp(component, {
        ...props,
        onClose(...args: any) {
          sessionStorage.setItem('pageType', null)
          resolve(...args)
          if (popup?._instance?.exposed?.flgShow) {
            popup._instance.exposed.flgShow.value =
              !popup._instance.exposed.flgShow.value
          }
        }
      })
      childCallBack = content.unmount
      content.use(router)
      content.use(Quasar, {
        plugins: {
          Loading,
          LocalStorage
        },
        iconSet: iconSet
      })
      content.directive('permission', permissionDirective)
      router.isReady().then(() => {
        KatakanaDirective(content)
        content.mount(popup._instance?.refs?.elm)
      })
    })
  },
  formattedErrors(error: any) {
    const { response } = error
    const errorData = response.data
    const errorMessage = Object.entries(errorData.data)
      .map(([key, messages]) => `${key}: ${messages.join(', ')}`)
      .join('\n')
    return errorMessage
  }
}
