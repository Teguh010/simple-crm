<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, toRaw, nextTick } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import MtModalHeader from '@/components/MtModalHeader.vue'
import PdfEditor, { MAX_NUMBER_OF_TEXT_BOXES } from './PdfEditor.vue'
import usePrintStore from '@/stores/prints'
import { typePrint } from '@/utils/enum'
import { Loading } from 'quasar'
import UpdateInfoListModal from '@/pages/info/UpdateInfoListModal.vue'
import { date } from 'quasar'
import { getCustomerName } from '@/utils/aahUtils'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import _ from 'lodash'

const CANVAS_DEFAULT_ZOOM = 0.50
const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

const printStore = usePrintStore()
const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  pdfData: ArrayBuffer,
  canvasWidth: Number,
  canvasHeight: Number,
  dataToRender: Object,
  rightBoxButtons: Array,
  hideRightButtons: {
    type: Boolean,
    default: false
  },
  renderDirectly: {
    type: Boolean,
    default: false
  },
  pdfUploaded: {
    type: Boolean,
    default: false
  },
  showSendNotificationBtn: {
    type: Boolean,
    default: false
  },
  callback: Function
})
const isEdit = ref(false)
const rightBoxButtons = ref()
const basePdf = ref(null)
const pdfEditorRef = ref<typeof PdfEditor | null>(null)
const buttonUsed = ref<string[]>([])
const buttonsRemoved = ref([])
const contentSection = ref(null)
const paperBagTemplateTypes: number[] = [11, 12, 13]
const data = ref({
  type_print: ''
})
const parentButtons = ref([
  {
    label: 'オーナー',
    childButtonsPrefix: 'id_customer.'
  },
  {
    label: 'ペット',
    childButtonsPrefix: 'id_pet.'
  },
  {
    label: '治療内容',
    childButtonsPrefix: 'id_service_detail.'
  },
  {
    label: '次回来院',
    childButtonsPrefix: 'booking.'
  },
  {
    label: '狂犬病',
    childButtonsPrefix: 'rabies.'
  },
  {
    label: '病院',
    childButtonsPrefix: 'id_clinic.'
  }
])
const rightBoxChildButtons = ref([])
const activeButton = ref<number>(-1)
const currentTypePrintMode = ref('横書き')
const canvasZoomLevel = ref<number>(CANVAS_DEFAULT_ZOOM)
const canvasSelectedObject = ref<any>()
const textData = ref<{
  stylable: boolean,
  fontSize: number
  wrap: boolean,
  textAlign: 'left' | 'center' | 'right',
  width: number,
  height: number
}>({
  stylable: false,
  fontSize: 12,
  wrap: false,
  textAlign: 'left',
  width:50,
  height:50
})
const pdfScrollPosition = ref<{
  scrollTop: number,
  scrollLeft: number
}>({
  scrollTop: 0,
  scrollLeft: 0
})

const hasItemToEdit = computed(() => !!canvasSelectedObject.value)
const isItemStyleable = computed(() => canvasSelectedObject.value && canvasSelectedObject.value.type === 'textbox')
const isItemText = computed(() => canvasSelectedObject.value && canvasSelectedObject.value.type === 'textbox' || canvasSelectedObject.value.type === 'i-text')
const toolStylableButtonStyle = computed(() => ({
  ...(hasItemToEdit.value && isItemStyleable.value && isItemText.value ?
    {} : {
      color: 'rgb(146 141 141)'
    })
}))
const toolButtonDisabledStyle = computed(() => ({
  ...(hasItemToEdit.value ? {} : {  color: 'rgb(146 141 141)' })
}))

const computedCanChangeOrientation = computed(() => {
  return !paperBagTemplateTypes.includes(printStore.getPrint?.type_print)
})

const mappableAttributes = computed(() => {
  return props.rightBoxButtons?.map((button: any) => button.text) ?? []
})

const isItemEditable = computed(() => {
  if(!canvasSelectedObject.value) return false
  return !mappableAttributes.value.includes(canvasSelectedObject.value.text)
})

const getToolButtonActiveStateStyle = (button: 'wrap' | 'text-left' | 'text-center' | 'text-right' | 'landscape' | 'portrait') => {
  let active = false
  switch (button) {
    case 'wrap':
      active = textData.value.wrap
      break
    case 'text-left':
      active = textData.value.textAlign === 'left'
      break;
    case 'text-center':
      active = textData.value.textAlign === 'center'
      break;
    case 'text-right':
      active = textData.value.textAlign === 'right'
      break;
    case 'landscape':
      active = computedCanChangeOrientation.value && printStore.getPrint.flg_landscape
      break;
    case 'portrait':
      active = computedCanChangeOrientation.value && !printStore.getPrint.flg_landscape
      break;
    default:
      active = false
      break
  }
  if (active) return {
    background: '#686565',
    color: '#ffffff'
  } 
  return
}

const getIsAttrButtonCurrentSelected = (value: string) => {
  if(!canvasSelectedObject.value) return false
  return canvasSelectedObject.value.text === value
}

const locateAndAttrButton = (value: string) => {
  if(!canvasSelectedObject.value) return
  const canvas = pdfEditorRef.value.getPdfCanvas()
  const object = canvas._objects.find((obj: any) => obj.text === value)
  if(object) {
    canvasSelectedObject.value = object
  }
}

const closeModal = () => {
  emits('close')
}

const submit = () => {
  if(!pdfEditorRef.value) return
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中...',
    messageColor: 'black'
  })
  const canvas = pdfEditorRef.value.getPdfCanvas()
  var objects = canvas._objects.map((obj: any) => {
    if (Boolean(obj._objects)) {
      let text_object = obj._objects[0].text ? obj._objects[0] : obj._objects[1]
      let box_object = obj._objects[0].text ? obj._objects[1] : obj._objects[0]
      return {
        fontSize: text_object.fontSize,
        left: obj.left / canvas.width,
        top: obj.top / canvas.height,
        text: text_object.text,
        width: obj.width / canvas.width,
        height: obj.height / canvas.height,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        type_print_output: 3
        // lineCoords: [obj.zoomX,obj.zoomY],
      }
    } else {
      return {
        fontSize: obj.fontSize,
        left: obj.left / canvas.width,
        top: obj.top / canvas.height,
        text: obj.text,
        type_print_output: obj.extraKeys,
        width: obj.width,
        height: obj.height,
        metadata: (() => {
          if (!obj.metadata) { 
            _.set(obj ,'metadata' ,{ stylable: false })
          }
          _.set(obj.metadata, 'options.width', obj.width);
          _.set(obj.metadata, 'options.height', obj.height);
          return obj.metadata;
        })()
        // lineCoords: obj.lineCoords
      }
    }
  })
  Array.from({ length: MAX_NUMBER_OF_TEXT_BOXES }, (_, i) => {
    data.value[`xy_hw${i + 1}`] = ''
    data.value[`item${i + 1}`] = ''
    data.value[`font_size${i + 1}`] = ''
    data.value[`type_print_output${i + 1}`] = 3
    data.value[`json${i + 1}`] = {}
  })
  objects.forEach((obj: any, index: number) => {
    data.value[`item${index + 1}`] = obj.text.replace(/\n/g, '')
    data.value[`font_size${index + 1}`] = obj.fontSize
    if (
      obj.text == 'ペット写真' ||
      obj.text == '病院ロゴ' ||
      obj.text == 'ペット写真/病院'
    ) {
      var width = obj.width
      var height = obj.height
      var scaleX = obj.scaleX
      var scaleY = obj.scaleY
      data.value[
        `xy_hw${index + 1}`
      ] = `${obj.left},${obj.top},${width},${height},${scaleX},${scaleY}`
    } else {
      data.value[`xy_hw${index + 1}`] = `${obj.left},${obj.top}`
      data.value[`json${index + 1}`] ={
        ...(obj.metadata ? {
          ...toRaw(obj.metadata)
        } : {})
      }
    }
    data.value[`type_print_output${index + 1}`] = obj.type_print_output
    // if(currentTypePrintMode.value == "縦書き"){ // it is vertical
    //   data.value[`type_print_output${index + 1}`] = 4
    // }else{                                     // it is horizontal
    //   data.value[`type_print_output${index + 1}`] = 3
    // }
  })
  if (data.value.id_print) {
    const formData: Record<string, any> = { ...data.value }
    if (!props.pdfUploaded) {
      delete formData.pdf_path
    }
    // fail safe for json1 - nth validation
    Array.from({ length: MAX_NUMBER_OF_TEXT_BOXES }, (_, i) => `json${i + 1}`).forEach((key: string) => {
      if (!_.has(formData, key)) {
        _.set(formData, key, {})
      } 
      if ( typeof formData[key] === 'object' )  {
        formData[key] = JSON.stringify(formData[key])
      }
    })
    
    printStore.updatePrint(data.value.id_print, formData).then(async () => {
      Loading.hide()
      emits('close')
      printStore.fetchPrints()
      if (props.callback) {
        props.callback()
      }
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    printStore.submitPrint(data.value).then(async () => {
      Loading.hide()
      emits('close')
      if (props.callback) {
        props.callback()
      }
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const changeTypePrintMode = () => {
  // Horizontal = 横書き (type3) 
  // Vertical = 縦書き (type4)
  currentTypePrintMode.value = currentTypePrintMode.value == '横書き' ? "縦書き": "横書き"
  console.log(currentTypePrintMode.value == '横書き' ? 'set to horizontal' : 'set to vertical')
}

const changeFontSize = (action: string | number) => {
  if (!pdfEditorRef.value) return
  pdfEditorRef.value.changeFontSize(action)
}

const deleteSelectedObject = () => {
  if(!pdfEditorRef.value ) return
  const deletedObjectText = pdfEditorRef.value.deleteSelectedObject()
  if (deletedObjectText.length > 0) {
    deletedObjectText.forEach((text: string) => {
      delete_object(text)
      let indexToRemove = buttonUsed.value.indexOf(text)
      if (indexToRemove !== -1) {
        buttonUsed.value.splice(indexToRemove, 1)
        buttonsRemoved.value.push(text)
      }
    })
  }
}

const delete_object = (label: String) => {
  if (!pdfEditorRef.value) return
  const canvas = pdfEditorRef.value.getPdfCanvas()
  var object = canvas._objects.filter((obj: any) => {
    let text = ''
    if (!props.renderDirectly) {
      if (Boolean(obj._objects) && obj._objects.length > 0) {
        let text_object = obj._objects[0].text
          ? obj._objects[0]
          : obj._objects[1]
        text = text_object.text.replace(/\n/g, '');
      } else {
        text = obj.text.replace(/\n/g, '');
      }

    } else {
      if (Boolean(obj._objects) && obj._objects.length > 0) {
        text = obj.extraKeys.replace(/\n/g, '');
      } else {
        text = obj.extraKeys.replace(/\n/g, '');
      }
    }
    return text == label
  })[0]
  if (object) {
    canvas.remove(object)
    let indexToRemove = buttonUsed.value.indexOf(label)
    if (indexToRemove !== -1) {
      buttonUsed.value.splice(indexToRemove, 1)
      buttonsRemoved.value.push(label)
    }
  }
}

const formBtnPressed = (buttonPressed: any) => {
  if (!pdfEditorRef.value) return
  const text = buttonPressed.text
  if (buttonUsed.value.length >= MAX_NUMBER_OF_TEXT_BOXES) {
    mtUtils.autoCloseAlert(`アイテムの最大数(${MAX_NUMBER_OF_TEXT_BOXES})に達しました。`)
    return
  } else {
    if (buttonUsed.value.includes(text) && text != '自由入力 テキスト') {
      delete_object(text)
    } else {
      buttonUsed.value.push(text)
      let verticalText = currentTypePrintMode.value == '縦書き'
      pdfEditorRef.value.enableAddText(text, window.event,verticalText)
    }
  }
}

const changeRightBoxButtons = (button: any, index: number, nonToggle?: boolean) => {
  activeButton.value = nonToggle ? index : (activeButton.value === index ? -1 : index)
  if (activeButton.value === -1) {
    rightBoxChildButtons.value.length = 0
  } else {
    let filteredRightBoxButtons = []
    if (
      button.childButtonsPrefix == 'id_service_detail.' &&
      (data.value.type_print == 70 ||
        data.value.type_print == 80 ||
        data.value.type_print == 90)
    ) {
      filteredRightBoxButtons = rightBoxButtons.value.filter(
        (btn: any) =>
          !(
            btn.value.includes('id_clinic.') ||
            btn.value.includes('id_customer.') ||
            btn.value.includes('id_pet.') ||
            btn.value.includes('booking.') ||
            btn.value.includes('rabies.') ||
            btn.value == 'customer_main_address' ||
            btn.value == 'customer_main_tel'
          )
      )
    } else if (button.childButtonsPrefix == 'id_customer.') {
      filteredRightBoxButtons = rightBoxButtons.value.filter(
        (btn: any) =>
          btn.value.includes(button?.childButtonsPrefix) ||
          btn.value == 'customer_main_address' ||
          btn.value == 'customer_main_tel'
      )
    } else {
      filteredRightBoxButtons = rightBoxButtons.value.filter((btn: any) =>
        btn.value.includes(button?.childButtonsPrefix)
      )
    }
    rightBoxChildButtons.value = filteredRightBoxButtons
  }
}

const findParentButtonForChild = (childButtonAttr: string) => {
  // Get the button value to check against prefixes
  const buttonAttr = props.rightBoxButtons?.find(
    (btn: any) => btn.text === childButtonAttr
  ) as any

  if (!buttonAttr) {
    return
  }
  // Find which parent button this child belongs to
  const parentButtonIndex = parentButtons.value.findIndex(
    (btn: any) => buttonAttr.value.startsWith(btn.childButtonsPrefix)
  )
  // If we found a matching parent, activate it
  if (parentButtonIndex !== -1) {
    changeRightBoxButtons(
      parentButtons.value[parentButtonIndex], 
      parentButtonIndex,
      true
    )
  }

  return parentButtonIndex
}

function convertPngToPdf(pngBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function() {
      const imgData = reader.result;
      // Create a new jsPDF instance
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      // Add PNG image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10); // You can adjust position (x, y) and scaling
      // Convert the PDF to Blob and resolve it
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    };
    reader.onerror = function(error) {
      reject(error);
    };
    // Read PNG Blob as data URL
    reader.readAsDataURL(pngBlob);
  });
}

const attachToTInfo = async () => {
  const originalZoom = canvasZoomLevel.value
  handleCanvasZoom(1)
  let canvas = pdfEditorRef.value.getPdfCanvas()
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jspdf.jsPDF({
    orientation: 'landscape',
  });
  const imgProps= pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  const blob = pdf.output('blob');
  let customer = props.dataToRender?.id_customer
  let pet = props.dataToRender?.id_pet
  let pdfFileName = `${date.formatDate(Date.now(), 'YYYYMMDD')}_比較_${getCustomerName(customer)}様`
  await mtUtils.popup(UpdateInfoListModal, {
    predefinedFile: blob,
    predefinedMessage: '',
    customerObj: customer,
    petObj: pet,
    lineMessageType: '',
    fromViewPetModal: true,
    pdfFileName: pdfFileName,
  })
  handleCanvasZoom(originalZoom)
}

const testPrint = async () => {
  if (!pdfEditorRef.value) return
  const originalZoom = canvasZoomLevel.value
  handleCanvasZoom(1)
  await pdfEditorRef.value.printPdf(
    props.canvasWidth,
    props.canvasHeight,
    props.data.type_print_size
  )
  handleCanvasZoom(originalZoom)
}

const exportAsPdf = async () => {
  if (!pdfEditorRef.value) return
  let orientation: string;
  
  if (paperBagTemplateTypes.includes(printStore.getPrint?.type_print)) {
    orientation = 'portrait';
  } else if (printStore.getPrint.flg_landscape) {
    orientation = 'landscape';
  } else {
    // @note - this is a patch while we don't dynamically controll the page orientation
    // @note - page orientations logic is already prepared in this file
    // Check basePdf dimensions to determine orientation
    if (basePdf.value) {
      const pdfWidth = pdfEditorRef.value?.getPdfCanvas().width;
      const pdfHeight = pdfEditorRef.value?.getPdfCanvas().height;
      orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
    } else {
      orientation = 'portrait';
    }
  }
  const originalZoom = canvasZoomLevel.value
  handleCanvasZoom(1)
  await pdfEditorRef.value.downloadPdf(props.data.name_print, orientation)
  handleCanvasZoom(originalZoom)
}

function waitForPdfEditorRef() {
  return new Promise((resolve, reject) => {
    const checkInitialization = () => {
      if (pdfEditorRef.value) {
        setTimeout(resolve, 1000)
      } else {
        setTimeout(checkInitialization, 100)
      }
    }
    checkInitialization()
  })
}

const handleTextToStylable = () => {
  if (!pdfEditorRef.value) return;

  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas();
  const selectedObject = (pdfEditorRef.value as typeof PdfEditor).getSelectedObject();

  if (selectedObject && selectedObject.length > 0) {
    let obj = selectedObject[0];

    if (obj.type === 'i-text' || obj.type === 'textbox') {
      const isTextbox = obj.type === 'textbox';
      // Preserve existing properties
      const props = {
        text: obj.text,
        left: obj.left,
        top: obj.top,
        width: obj.width || 50,
        fontSize: obj.fontSize || 20,
        fill: obj.fill,
        textAlign: obj.textAlign || 'left',
        fontFamily: obj.fontFamily,
        selectable: true,
        editable: true,
        metadata: {
          stylable: obj.type === 'i-text', // to be converted to textbox
          options: { wrap: false }
        }
      };

      // @ts-ignore-line
      const newObject = isTextbox
      // @ts-ignore-line
        ? new fabric.IText(props.text, props) // Convert back to IText
        // @ts-ignore-line
        : new fabric.Textbox(props.text, { ...props, splitByGrapheme: props.metadata.options.wrap });

      if (!isTextbox) {
        // Ensure text doesn't scale when resizing in Textbox mode
        newObject.set({
          scaleX: 1,
          scaleY: 1,
          lockScalingFlip: true,
          lockScalingX: false,
          lockScalingY: true
        });

        // Auto-expand height when wrapping
        newObject.on('changed', function () {
          // @ts-ignore-line
          if (this.metadata?.stylable && this.metadata?.options?.wrap) {
            // @ts-ignore-line
            const textHeight = this.calcTextHeight();
            // @ts-ignore-line
            this.set({ height: textHeight + 10 });
            canvas.requestRenderAll();
          }
        });
      }

      // Replace the existing object
      canvas.remove(obj);
      canvas.add(newObject);
      canvas.setActiveObject(newObject);
      canvas.requestRenderAll();
    }
  }
};

const handleToggleTextWrapping = () => {
  if (!pdfEditorRef.value) return;

  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas();
  const selectedObject = (pdfEditorRef.value as typeof PdfEditor).getSelectedObject();

  if (selectedObject && selectedObject.length > 0) {
    let obj = selectedObject[0];
    if (obj.type === 'textbox' && obj.metadata?.stylable) {
      // Toggle the wrap option
      obj.metadata.options.wrap = !obj.metadata.options.wrap;

      // Apply wrap setting
      obj.set({ splitByGrapheme: obj.metadata.options.wrap });

      // Ensure height auto-adjusts when wrap is enabled
      if (obj.metadata.options.wrap) {
        const textHeight = obj.calcTextHeight();
        obj.set({ height: textHeight + 10 });
        // hack -trigger aligment
      }
      handleCanvasItemSelected(obj)

      canvas.requestRenderAll();
    }
  }
};

const handleToggleTextAlignment = (align: 'left' | 'center' | 'right') => {
  if (!pdfEditorRef.value) return;

  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas();
  const selectedObject = (pdfEditorRef.value as typeof PdfEditor).getSelectedObject();

  if (selectedObject && selectedObject.length > 0 ) {
    let obj = selectedObject[0];
    if (obj.type === 'textbox' && obj.metadata?.stylable) {
      if (obj.type === 'textbox' && obj.metadata?.stylable) {
      _.set(obj.metadata , 'options.textAlign' , align)
        obj.set({ textAlign: align });
        // hack -trigger aligment
        nextTick(() => {
          obj.set({ width: obj.width + 0.1 });
        }).then(() => {
          obj.set({ width: obj.width - 0.1 });
        })
        handleCanvasItemSelected(obj)
        canvas.requestRenderAll();
      }
    }
  }
};

const handleCanvasItemSelected = (item: any) => {
  const pdfContainer = document.getElementById('pdf-container') as HTMLElement
  pdfScrollPosition.value = {
    scrollTop: pdfContainer.scrollTop,
    scrollLeft: pdfContainer.scrollLeft
  }
  if (mappableAttributes.value.includes(item.text)) {
    item.editable = false
  }
  canvasSelectedObject.value = item
  findParentButtonForChild(item.text)
  textData.value = {
    fontSize: item.fontSize,
    stylable: item.metadata?.stylable ?? false,
    wrap: item.metadata?.options?.wrap ?? false,
    textAlign: item.textAlign,
    width: item.width,
    height: item.height
  }
}

const handleCanvasItemDeselected = () => {
  textData.value = {
    fontSize: canvasSelectedObject.value.fontSize,
    stylable: false,
    wrap: false,
    textAlign: 'left',
    width: 50,
    height: 50
  }
  canvasSelectedObject.value = null
}

const handleCanvasItemScaled = (item: any) => {
  canvasSelectedObject.value = item
  textData.value = {
    fontSize: item.fontSize,
    stylable: item.metadata?.stylable ?? false,
    wrap: item.metadata?.options?.wrap ?? false,
    textAlign: item.textAlign,
    width: item.width,
    height: item.height
  }
}

const handleCanvasItemEditing = (item: any) => {
  const pdfContainer = document.getElementById('pdf-container') as HTMLElement
  pdfContainer.scrollTop = pdfScrollPosition.value.scrollTop
  pdfContainer.scrollLeft = pdfScrollPosition.value.scrollLeft
}

const handleCanvasItemTextUpdated = _.debounce((text: string) => {
  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas()
  if (canvasSelectedObject.value && canvas) {
    canvasSelectedObject.value.text = text
    canvas.requestRenderAll()
  }
}, 100)

function init() {
  if (data.value.type_print == 80) {
    parentButtons.value = parentButtons.value.filter(
      (btn: any) => btn.childButtonsPrefix != 'rabies.'
    )
  }
  if (paperBagTemplateTypes.includes(data.value.type_print)) {
    parentButtons.value = parentButtons.value.filter(
      (btn: any) => btn.childButtonsPrefix === 'id_customer.' || btn.childButtonsPrefix === 'id_pet.' || btn.childButtonsPrefix === 'id_clinic.'
    )
    parentButtons.value.push({label: '処方箋', childButtonsPrefix: 'id_paper_bag'})
  }
  rightBoxButtons.value = props.rightBoxButtons
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.keyCode === 46) {
    deleteSelectedObject()
    event.preventDefault()
  }
}

const initStylesheets = async () => {
  const stylesheets = [
    {
      href: 'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;600&display=swap',
      integrity: ''
    },
    {
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600&display=swap',
      integrity: ''
    }
  ]
  stylesheets.forEach((stylesheetObj) => {
    let link = document.createElement('link')
    link.href = stylesheetObj.href
    link.rel = 'stylesheet'
    if (stylesheetObj.integrity !== '') {
      link.integrity = stylesheetObj.integrity
    }
    link.crossOrigin = 'anonymous'
    link.referrerPolicy = 'no-referrer'
    document.head.appendChild(link)
  })
}

const updateCanvasResolution = () => {
  if (!pdfEditorRef.value) return
  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas()
  if (!canvas) return

  const ratio = window.devicePixelRatio || 1 // Get screen's pixel ratio
  const zoom = canvasZoomLevel.value

  // Get original canvas size
  const originalWidth = canvas.getWidth()
  const originalHeight = canvas.getHeight()

  // Set high-resolution canvas
  canvas.setDimensions({
    width: originalWidth, 
    height: originalHeight
  }, { backstoreOnly: true }) // Prevent UI size distortion

  // Apply high-res scaling
  canvas.setZoom(zoom)

  // Disable blurring effects
  const ctx = canvas.getContext()
  if (ctx) {
    ctx.imageSmoothingEnabled = false
  }

  // Re-render all objects at new zoom level
  canvas.requestRenderAll()
  
}

const handleCanvasZoom = (action: 'in' | 'out' | 'reset' | number) => {
  if (!pdfEditorRef.value) return
  
  const canvas = (pdfEditorRef.value as typeof PdfEditor).getPdfCanvas()
  if (!canvas) return

  const pdfContainer = document.querySelector('#pdf-container') as HTMLElement
  // @ts-ignore fabric is global
  const center = new fabric.Point(canvas.width / 2, canvas.height / 2)

  if (action === 'reset') {
    canvasZoomLevel.value = CANVAS_DEFAULT_ZOOM
  } else if (typeof action === 'number' && ZOOM_LEVELS.includes(action)) {
    // Set zoom directly to the provided level if it's in ZOOM_LEVELS
    canvasZoomLevel.value = action
  } else {
    // Find the nearest zoom level from the predefined steps
    let currentIndex = ZOOM_LEVELS.findIndex(z => z >= canvasZoomLevel.value)
    if (currentIndex === -1) currentIndex = ZOOM_LEVELS.length - 1 // If not found, use max zoom

    if (action === 'in' && currentIndex < ZOOM_LEVELS.length - 1) {
      canvasZoomLevel.value = ZOOM_LEVELS[currentIndex + 1] // Go to next zoom level
    } else if (action === 'out' && currentIndex > 0) {
      canvasZoomLevel.value = ZOOM_LEVELS[currentIndex - 1] // Go to previous zoom level
    }
  }

  // Apply zoom centered on the view
  canvas.zoomToPoint(center, canvasZoomLevel.value)

  // Adjust viewport transform to keep view aligned
  const vpt = canvas.viewportTransform
  vpt[4] = (canvas.width - (canvas.width * canvasZoomLevel.value)) / 2
  vpt[5] = (canvas.height - (canvas.height * canvasZoomLevel.value)) / 2
  canvas.setViewportTransform(vpt)

  // Scroll container to center on reset
  if ((action === 'reset' || typeof action === 'number') && pdfContainer) {
    setTimeout(() => {
      pdfContainer.scrollTo({
        left: (pdfContainer.scrollWidth - pdfContainer.clientWidth) / 2,
        top: (pdfContainer.scrollHeight - pdfContainer.clientHeight) / 2,
        behavior: 'smooth'
      })
    }, 100)
  }

  canvas.requestRenderAll()
  updateCanvasResolution() 
}

onMounted(() => {
  initStylesheets()
  data.value = props.data

  setTimeout(() => {
    basePdf.value = new Uint8Array(props.pdfData)
    waitForPdfEditorRef().then(() => {
      const left_canvas = document.getElementsByClassName('left-canvas')[0]
      const right_canvas = document.getElementsByClassName('right-canvas')[0]
      // if (left_canvas.clientHeight > right_canvas.clientHeight) {
      // left_canvas.style.maxHeight = 'calc(100vh - 212px)'
      // }
      setTimeout(() => {
        if (props.dataToRender) {
          pdfEditorRef.value.setTextInObjectPlace(
            props.data,
            props.dataToRender
          )
        } else {
          pdfEditorRef.value.setOldObjects(props.data)
        }
        for (let i = 1; i <= MAX_NUMBER_OF_TEXT_BOXES; i++) {
          if (props.data[`item${i}`]) {
            let text = props.data[`item${i}`]
            buttonUsed.value.push(text)
            // changeButtonColor(text, '#abb2b9')
          }
        }

        handleCanvasZoom('reset')
      }, 1000)
    })
  }, 500)
  init()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <q-form @submit="submit" style="height: calc(100vh - 50px);">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        帳票
      </q-toolbar-title>
      <MtInputForm
        type="selection"
        v-model="data.type_print"
        :items="typePrint"
        label="用途区分"
        :disable="true"
      />
    </MtModalHeader>
    <q-card-section
      class="content q-pa-none full-width content-container"
      style="background-color: #e5e8e8;"
      ref="contentSection"
    >
      <div class="flex column content-pdf">
        <div class="full-height overflow-auto" style="grid-column: span 9 / span 9">
          <div class="left-canvas">
            <PdfEditor
              v-if="basePdf"
              :pdfAttributes="rightBoxButtons"
              :pdfFile="basePdf"
              :canvasWidth="props.canvasWidth"
              :canvasHeight="props.canvasHeight"
              :renderDirectly="props.renderDirectly"
              :dataToRender="props.dataToRender"
              :masterPrintData="props.data"
              :pdfFormat="paperBagTemplateTypes.includes(printStore.getPrint?.type_print) ? 'a5' : ''"
              :currentTypePrintOutput="currentTypePrintMode"
              @deselect:item="handleCanvasItemDeselected"
              @select:item="handleCanvasItemSelected"
              @scaled:item="handleCanvasItemScaled"
              @editing:item="handleCanvasItemEditing"
              ref="pdfEditorRef"
            />
          </div>
        </div>
        <div class="" style="grid-column: span 3 / span 3">
          <div class="right-canvas">
            <div class="q-px-sm q-pt-sm">
              <span class="text-weight-bold"> 項目 </span>
              <span>
                利用数 =
                {{ buttonUsed.length }} / {{ MAX_NUMBER_OF_TEXT_BOXES }}
              </span>
            </div>
            <hr />
            <div class="row items-center q-px-sm" style="row-gap: 5px; column-gap: 5px;">
              <q-btn-group class="tool-button-group" style="min-height: 40px; align-items: center;">
                <div class="full-height q-px-xs">
                  <span>ズーム({{ ((canvasZoomLevel + 0.3) * 100).toFixed(0) }}%)</span>
                </div>
                <q-btn class="q-px-sm" dense icon="zoom_in" @click="handleCanvasZoom('in')"/>
                <q-btn class="q-px-sm" dense icon="zoom_out" @click="handleCanvasZoom('out')"/>
                <q-btn class="q-px-sm" dense label="リセット" @click="handleCanvasZoom('reset')"/>
              </q-btn-group>
            </div>
            <hr />
            <div class="text-styling-wrapper">
              <div class="column justify-start q-pb-sm">
                <MtFormCheckBox label="スタイリングを使用する" @update:checked="handleTextToStylable" :checked="textData.stylable" :disable="!hasItemToEdit"/>
                <div class="row justify-start items-center q-px-sm"  style="row-gap: 5px; column-gap: 5px;">
                  <q-btn-group class="tool-button-group" style="min-height: 40px; max-height: 40px;" >
                    <q-select
                      class="q-pl-xs"
                      v-model="textData.fontSize" 
                      @update:model-value="changeFontSize"
                      :options="Array.from({ length: 40 - 8 + 1 }, (_, i) => i + 8)"
                      dense
                      options-dense
                      borderless
                      :disable="!hasItemToEdit"
                    >
                      <template v-slot:prepend>
                        <q-icon name="format_size" />
                      </template>
                    </q-select>
                    <q-btn
                      @click="changeTypePrintMode()"
                      style="white-space: nowrap"
                      :label="currentTypePrintMode"
                      :disable="!hasItemToEdit || isItemStyleable"
                      :style="toolButtonDisabledStyle"
                      v-if="data.type_print == 1 || data.type_print == 2"
                    />
                    <q-btn
                      dense
                      style="white-space: nowrap"
                      @click="
                        formBtnPressed({
                          value: '自由入力 テキスト',
                          text: '自由入力 テキスト'
                        })
                      "
                      label="自由入力 テキスト"
                    />
                  </q-btn-group>
                  <q-btn-group class="tool-button-group" style="min-height: 40px;" >
                    <q-btn 
                      class="q-px-sm" 
                      @click="handleToggleTextWrapping" 
                      dense 
                      icon="wrap_text" 
                      :disable="!isItemStyleable" 
                      :style="{...toolStylableButtonStyle , ...getToolButtonActiveStateStyle('wrap')}"/>
                    <q-btn 
                      @click="handleToggleTextAlignment('left')" 
                      class="q-px-sm" 
                      dense
                      icon="align_horizontal_left" 
                      :disable="!isItemStyleable" 
                      :style="{...toolStylableButtonStyle , ...getToolButtonActiveStateStyle('text-left')}"/>
                    <q-btn 
                      @click="handleToggleTextAlignment('center')" 
                      class="q-px-sm" 
                      dense 
                      icon="format_align_center" 
                      :disable="!isItemStyleable" 
                      :style="{...toolStylableButtonStyle , ...getToolButtonActiveStateStyle('text-center')}"/>
                    <q-btn 
                      @click="handleToggleTextAlignment('right')" 
                      class="q-px-sm" 
                      dense 
                      icon="align_horizontal_right" 
                      :disable="!isItemStyleable" 
                      :style="{...toolStylableButtonStyle , ...getToolButtonActiveStateStyle('text-right')}"/>
                  </q-btn-group>
                  <q-btn-group style="min-height: 40px;" >
                    <q-btn class="q-px-sm" @click="deleteSelectedObject()" dense icon="delete" :disable="!hasItemToEdit" :style="toolButtonDisabledStyle"/>
                  </q-btn-group>
                </div>
                <template v-if="false">
                  <span class="q-px-sm q-mt-sm q-mt-sm">ページの向き (ページのむき)</span>
                  <div class="row justify-start items-center q-px-sm"  style="row-gap: 5px; column-gap: 5px;">
                  <q-btn-group class="tool-button-group" style="min-height: 40px; align-items: center;">
                    <q-btn class="q-px-sm" dense label="たてむき" :style="getToolButtonActiveStateStyle('portrait')"/>
                    <q-btn class="q-px-sm" dense label="よこむき" :style="getToolButtonActiveStateStyle('landscape')"/>
                    </q-btn-group>
                  </div>
                </template>
              </div>
            </div>
            <hr />
            <template  v-if="isItemEditable" :disable="!isItemEditable">
              <div class="text-styling-wrapper">
                <div class="column justify-start q-pb-sm">
                  <span class="q-px-sm q-mt-sm q-mt-sm">自由入力 テキスト 値</span>
                  <MtInputForm
                  type="text"
                  v-model="canvasSelectedObject.text"
                  class="col-12"
                  @update:model-value="handleCanvasItemTextUpdated"
                  
                  />
                </div>
              </div>
              <hr />
            </template>
            <div class="q-px-sm rightBtnsContainer" v-if="!hideRightButtons">
              <div class="column full-height">
                <div class="q-mb-sm" style="max-height: 30%; overflow-y: auto;">
                  <template
                    v-for="(button, index) in parentButtons"
                    :key="index"
                  >
                    <q-btn
                      class="q-ma-xs"
                      @click="changeRightBoxButtons(button, index)"
                      :class="{ active: activeButton === index }"
                      >{{ button.label }}</q-btn
                    >
                  </template>
                </div>
                <small v-if="rightBoxChildButtons.length > 0"><span class="q-px-sm q-mt text-grey-800">利用可能なアイテム</span></small>
                <div class="column items-container">
                  <div class="items-wrapper">
                    <template
                      v-for="(button, index) in rightBoxChildButtons"
                      :key="index"
                    >
                    <q-btn
                    :class="{
                      'q-ma-sm': true,
                          grayColored: buttonUsed.includes(button.text),
                          'item-used-selected': getIsAttrButtonCurrentSelected(button.text)
                        }"
                        @click="formBtnPressed(button)"
                        >
                        {{ ' ' + button.text + ' ' }}
                      </q-btn>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="bg-white">
      <div>
        <div class="flex row items-center justify-center no-wrap text-center modal-btn">
          <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
            <span>キャンセル</span>
          </q-btn>
          <q-btn v-if="props.showSendNotificationBtn" unelevated color="primary" class="q-ml-md" @click="attachToTInfo">
            <span>myVetty</span>
          </q-btn>
          <q-btn unelevated color="primary" class="q-ml-md" @click="testPrint">
            <span>印刷</span>
          </q-btn>
          <q-btn unelevated color="primary" class="q-ml-md" @click="exportAsPdf">
            <span>PDF出力</span>
          </q-btn>
          <q-btn
            v-if="!props.dataToRender"
            unelevated
            color="primary"
            class="q-ml-md"
            type="submit"
          >
            <span>保存</span>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.content-container {
  @media screen and (max-width: 1366px) {
    height: 100%;
    max-height: calc(100vh - 200px);
    overflow: hidden;
  }
  max-height: calc(100vh - 170px);
}
.content-pdf {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.active {
  background-color: #007bff;
  color: white;
}
.left-canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  // background-color: white;
  // border: 1px solid #ABB2B9;

  background-color: transparent;
  border: 0px;
}

.right-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 0px 1px 1px 1px solid #abb2b9;
}

.customBtn {
  width: 80%;
  margin: 0 auto;
  font-size: 18px;
}

.customBtn:hover {
  cursor: pointer;
  color: #abb2b9;
}
.rightBtnsContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: auto;
  overflow: hidden;
}

.items-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70%;
}

.items-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 10px;
}

.grayColored {
  color: #abb2b9;
}

.text-styling-wrapper {
  min-width: 230px;
  overflow-x: auto;
}

.tool-button-group > *:not(:first-child) {
  border-left: 1px solid rgb(224, 220, 220);
}

.item-used-selected {
  border: 1px solid #007bff;
}

@page {
  -webkit-print-color-adjust: exact !important;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: #f0f0f0;
}

// @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600&display=swap');
</style>
