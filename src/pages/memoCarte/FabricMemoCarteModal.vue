<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { markRaw, onMounted, onUnmounted, ref } from 'vue'
import { fabric } from 'fabric'
import useFabricStore from '@/stores/fabrics'
import { QIcon } from 'quasar'
import mtUtils from '@/utils/mtUtils'
import CreateTemplateMemoCarteModal from './CreateTemplateMemoCarteModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import CreateAdditionalImageMemoCarteModal from './CreateAdditionalImageMemoCarteModal.vue'
import useClinicalFilesStore from '@/stores/clinical-files'
import { event_bus } from '@/utils/eventBus'
import { formatDateWithTime, getDateTimeNow } from '@/utils/aahUtils'
import useMemoCarteStore from '@/stores/memo-cartes'
import MtPetInfo from '@/components/MtPetInfo.vue'

const props = defineProps({
  id_memo_carte: String,
  additional_image: Array,
  id_customer: String,
  id_pet: String,
  isOpenTemplate: Boolean,
  isDirectSubmit: Boolean,
  id_pet_illness_history: Array,
  imageUrl: String,
  isEdit: Boolean,
  id_clinical_file: Object
})
const fabricStore = useFabricStore()
const templateStore = useTextTemplateStore()
const clinicalFilesStore = useClinicalFilesStore()
const memoCarteStore = useMemoCarteStore()

const { getAdditionalMemoCarte } = storeToRefs(fabricStore)
const { getTemplate } = storeToRefs(templateStore)
const emits = defineEmits(['close'])
const closeModal = async (direct: boolean = true) => {
  if (!direct) {
    const objects = fabricCanvas.value.getObjects()
    if (objects.length > 0) {
      const confirmation = await mtUtils.confirm(
        '未保存の内容があります。 \n 保存しますか？',
        '確認',
        '保存して閉じる',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function
        },
        true,
        '保存しないで閉じる',
        true
      )

      if (confirmation) {
        await exportImage()
        return
      }
    }
  }
  emits('close')
}

const size = ref()
const isAdditional = ref(false)
const copiedObject = ref(null)
const undoStack = ref([])
const redoStack = ref([])
const can = ref(null)
const fabricCanvas = ref()
const textInput = ref('')
const textEdit = ref('')
const isTextInput = ref(false)
const isEditText = ref(false)
const images = ref()
const colorSelected = ref('#FF0000')
const selectedFabricObjects = ref(null)
const multipleImage = ref([])

let selectedText: any = null

const isAddText = ref(false)
const isDrawing = ref(false)
const origX = ref(0)
const origY = ref(0)
const selectedTool = ref('')
const shape: any = ref(null)
const isFilledColor = ref(false)
const isStrokeColor = ref(false)
const showFinishDrawing = ref(false)
const defaultFontSize = ref(20)

const selectTool = (tool: string, sizeObject = 0) => {
  fabricCanvas.value.isDrawingMode = false
  selectedTool.value = tool
  isDrawing.value = false
  shape.value = null
  fabricCanvas.value.selection = false
  if (sizeObject !== 0) size.value = sizeObject

  fabricCanvas.value.forEachObject((obj) => {
    obj.selectable = false
    obj.evented = false
  })
}

const addText = () => {
  fabricCanvas.value.isDrawingMode = false
  isAddText.value = true
  selectedTool.value = 'text'
}

const setTextFontSize = (value: string) => {
  if (value === 'increase') {
    fabricCanvas.value
      .getActiveObject()
      .set('fontSize', defaultFontSize.value++)
  }

  if (value === 'decrease') {
    fabricCanvas.value
      .getActiveObject()
      .set('fontSize', defaultFontSize.value--)
  }

  return fabricCanvas.value.renderAll()
}

const onMouseDown = (o) => {
  if (!isDrawing.value && selectedTool.value) {
    isDrawing.value = true
    let pointer = fabricCanvas.value.getPointer(o.e)
    origX.value = pointer.x
    origY.value = pointer.y

    switch (selectedTool.value) {
      case 'arrow':
        shape.value = new fabric.Line(
          [origX.value, origY.value, origX.value, origY.value],
          {
            strokeWidth: 4,
            fill: '#FF0000',
            stroke: '#FF0000',
            originX: 'left',
            originY: 'top',
            selectable: true,
            evented: false
          }
        )
        break
      case 'rectangle':
        shape.value = new fabric.Rect({
          name: 'rectangle',
          selectable: true,
          evented: true,
          left: origX.value,
          top: origY.value,
          originX: 'left',
          originY: 'top',
          width: pointer.x - origX.value,
          height: pointer.y - origY.value,
          fill: 'transparent',
          stroke: '#FF0000',
          strokeWidth: 4
        })
        fabricCanvas.value.add(markRaw(shape.value))
        break
      case 'circle':
        shape.value = new fabric.Circle({
          name: 'circle',
          selectable: true,
          evented: true,
          left: origX.value,
          top: origY.value,
          originX: 'left',
          originY: 'top',
          radius: 1,
          fill: 'transparent',
          stroke: '#FF0000',
          strokeWidth: 4
        })
        fabricCanvas.value.add(markRaw(shape.value))
        break
      case 'dots':
        shape.value = new fabric.Circle({
          name: 'dots',
          selectable: true,
          evented: true,
          left: origX.value - size.value,
          top: origY.value - size.value,
          originX: 'left',
          originY: 'top',
          radius: size.value,
          fill: '#FF0000'
        })
        fabricCanvas.value.add(markRaw(shape.value))
        break
      case 'text':
        shape.value = new fabric.IText('Sample text', {
          name: 'text',
          editable: true,
          fontFamily: 'Lobster',
          selectable: true,
          evented: true,
          left: origX.value,
          top: origY.value,
          width: 150,
          fontSize: defaultFontSize.value
        })
        shape.value.hiddenTextareaContainer =
          fabricCanvas.value.lowerCanvasEl.parentNode
        fabricCanvas.value.add(markRaw(shape.value))
        break
    }
    fabricCanvas.value.renderAll()
  }
}

const onMouseMove = (o) => {
  if (!isDrawing.value || !shape.value) return
  let pointer = fabricCanvas.value.getPointer(o.e)

  if (selectedTool.value === 'arrow') {
    shape.value.set({ x2: pointer.x, y2: pointer.y })
    fabricCanvas.value.renderAll()
  } else if (['circle', 'dots'].includes(selectedTool.value)) {
    let radius =
      Math.max(
        Math.abs(origX.value - pointer.x),
        Math.abs(origY.value - pointer.y)
      ) / 2
    shape.value.set({ radius: radius })
    shape.value.set({ left: origX.value, top: origY.value })
  } else if (['rectangle'].includes(selectedTool.value)) {
    if (origX.value > pointer.x) {
      shape.value.set({ left: Math.abs(pointer.x) })
    }
    if (origY.value > pointer.y) {
      shape.value.set({ top: Math.abs(pointer.y) })
    }
    shape.value.set({ width: Math.abs(origX.value - pointer.x) })
    shape.value.set({ height: Math.abs(origY.value - pointer.y) })
  }

  fabricCanvas.value.renderAll()
}

const onMouseUp = () => {
  if (fabricCanvas.value.isDrawingMode) {
    const objects = fabricCanvas.value.getObjects()
    const lastObject = objects[objects.length - 1]

    if (lastObject) {
      // Set a custom property on the last object
      lastObject.set({
        name: 'drawing'
      })
    }
    fabricCanvas.value.setActiveObject(lastObject)
  }
  if (isDrawing.value) {
    fabricCanvas.value.selection = true

    if (selectedTool.value === 'arrow') {
      isDrawing.value = false
      const angle =
        Math.atan2(
          shape.value.y2 - shape.value.y1,
          shape.value.x2 - shape.value.x1
        ) *
        (180 / Math.PI)
      const arrowHead = new fabric.Triangle({
        width: 20,
        height: 30,
        fill: 'red',
        left: shape.value.x2 + 1.7,
        top: shape.value.y2 + 1.8,
        angle: angle + 90,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: false
      })

      const group = new fabric.Group([shape.value, arrowHead], {
        name: 'arrow'
      })

      fabricCanvas.value.add(markRaw(group))
      fabricCanvas.value.setActiveObject(group)
    } else if (selectedTool.value === 'text') {
      isDrawing.value = false
      fabricCanvas.value.setActiveObject(shape.value)

      const target = fabricCanvas.value.getActiveObject()
      selectedText = target
      textEdit.value = target.text
      isEditText.value = true
    } else {
      if (shape.value) {
        shape.value.set({
          selectable: true,
          evented: true
        })
        fabricCanvas.value.setActiveObject(shape.value)
      }
    }
    shape.value = null
    selectedTool.value = null

    fabricCanvas.value.forEachObject((obj) => {
      obj.selectable = true
      obj.evented = true
    })

    fabricCanvas.value.renderAll()
  }
}
const colorClicked = () => {
  if (fabricCanvas.value?.isDrawingMode) {
    if (fabricCanvas.value.freeDrawingBrush) {
      const brush = fabricCanvas.value.freeDrawingBrush
      brush.color = colorSelected.value
    }
  } else {
    const selectedObjects = fabricCanvas.value.getActiveObject()
    changeWhiteToTransparent()
    switch (selectedObjects?.name) {
      case 'circle':
        selectedObjects.set('stroke', colorSelected.value)
        break
      case 'rectangle':
        selectedObjects.set('stroke', colorSelected.value)
        break
      case 'dots':
        selectedObjects.set('fill', colorSelected.value)
        break
      case 'drawing':
        selectedObjects.set('stroke', colorSelected.value)
        break
      case 'arrow':
        selectedObjects.forEachObject((obj) => {
          if (obj.type === 'line') {
            obj.set('stroke', colorSelected.value)
          } else if (obj.type === 'triangle') {
            obj.set('fill', colorSelected.value)
          }
        })
        break
      default:
        break
    }
    fabricCanvas.value.renderAll()
  }
}
const changeWhiteToTransparent = () => {
  if (
    colorSelected.value === '#FFFFFF' ||
    colorSelected.value === '#ffffff' ||
    colorSelected.value === 'rgb(255,255,255)'
  )
    colorSelected.value = 'transparent'
}
const copy = () => {
  const activeObject = fabricCanvas.value.getActiveObject()
  if (activeObject) {
    activeObject.clone((cloned) => {
      copiedObject.value = cloned
    })
  }
}
const paste = () => {
  if (copiedObject.value) {
    copiedObject.value.clone((clonedObj) => {
      fabricCanvas.value.discardActiveObject()
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true
      })
      if (clonedObj.type === 'activeSelection') {
        // Active selection needs a special treatment
        clonedObj.canvas = fabricCanvas.value
        clonedObj.forEachObject((obj) => {
          fabricCanvas.value.add(obj)
        })
        clonedObj.setCoords()
      } else {
        fabricCanvas.value.add(clonedObj)
      }
      fabricCanvas.value.setActiveObject(clonedObj)
      fabricCanvas.value.requestRenderAll()
    })
  }
}
const undo = () => {
  if (undoStack.value.length > 0) {
    redoStack.value.push(undoStack.value.pop())
    fabricCanvas.value.clear()
    fabricCanvas.value.loadFromJSON(
      undoStack.value[undoStack.value.length - 1] || {},
      () => {
        fabricCanvas.value.renderAll()
        reEnableControls()
      }
    )
  }
}
const redo = () => {
  if (redoStack.value.length > 0) {
    undoStack.value.push(redoStack.value.pop())
    fabricCanvas.value.clear()
    fabricCanvas.value.loadFromJSON(
      undoStack.value[undoStack.value.length - 1] || {},
      () => {
        fabricCanvas.value.renderAll()
        reEnableControls()
      }
    )
  }
}
const reEnableControls = () => {
  fabricCanvas.value.forEachObject((obj) => {
    // Set any specific properties or re-bind event handlers if needed
    obj.set({
      selectable: true,
      evented: true
    })
  })
  fabricCanvas.value.discardActiveObject()
}
const saveState = () => {
  if (
    !undoStack.value.length ||
    JSON.stringify(fabricCanvas.value.toJSON()) !==
      JSON.stringify(undoStack.value[undoStack.value.length - 1])
  ) {
    undoStack.value.push(fabricCanvas.value.toJSON())
    redoStack.value = [] // Clear redo stack on new action
  }
}
const deleteObject = () => {
  const activeObjects = fabricCanvas.value.getActiveObjects()

  if (activeObjects.length > 0) {
    activeObjects.forEach((object) => {
      fabricCanvas.value.remove(object)
    })

    fabricCanvas.value.discardActiveObject()
    fabricCanvas.value.requestRenderAll()
  }
}
const textEditChanged = () => {
  if (selectedText) {
    selectedText.set({ text: textEdit.value })
    fabricCanvas.value.renderAll()
  }
}
const updateText = () => {
  textEdit.value = ''
  isEditText.value = false
  fabricCanvas.value.discardActiveObject()
}
const toggleDrawing = () => {
  fabricCanvas.value.isDrawingMode = !fabricCanvas.value.isDrawingMode
  // showFinishDrawing.value = true
  if (fabricCanvas.value.freeDrawingBrush) {
    const brush = fabricCanvas.value.freeDrawingBrush
    brush.width = 5
    brush.color = '#FF0000'
  }
  isDrawing.value = !isDrawing.value
  fabricCanvas.value.selection = true
  selectedTool.value = null
}
const addImage = async (imageUrl: string) => {
  if (!imageUrl.includes(';base64')) {
    const uniqueString = new Date().getTime()
    imageUrl = imageUrl + `&nocache=${uniqueString}`
  }

  fabric.Image.fromURL(
    imageUrl,
    (img) => {
      const containerWidth =
        document.querySelector('.container')?.clientWidth || 800
      const containerHeight =
        document.querySelector('.container')?.clientHeight || 600

      const widthRatio = (containerWidth * 0.8) / img.width
      const heightRatio = (containerHeight * 0.8) / img.height
      const scale = Math.min(widthRatio, heightRatio)

      img.scale(scale)

      img.set({
        left: (containerWidth - img.width * scale) / 2,
        top: (containerHeight - img.height * scale) / 2
      })

      fabricCanvas.value.add(markRaw(img))
      fabricCanvas.value.renderAll()

      fabricCanvas.value.setDimensions({
        width: containerWidth,
        height: containerHeight
      })

      // Centring canvas content
      fabricCanvas.value.centerObject(img)
    },
    { crossOrigin: 'anonymous' }
  )

  if (props?.isDirectSubmit) {
    const image = {
      id_pet_illness_history: props.id_pet_illness_history?.[0]
        ? props.id_pet_illness_history?.[0]
        : null,
      datetime_receive: formatDateWithTime(
        getDateTimeNow(),
        'YYYY/MM/DD HH:mm:ss'
      ),
      name_file: formatDateWithTime(
        getDateTimeNow(),
        'FileMemoCarte_YYYYMMDD_HHmmss.jpeg'
      ),
      type_file: 1,
      type_receive_format: 2,
      id_pet: props.id_pet,
      id_customer: props.id_customer,
      file_path: imageUrl,
      imageUrl
    }
    multipleImage.value.push(image)
  }
}
const openTemplate = async () => {
  await mtUtils.popup(CreateTemplateMemoCarteModal, {})
  if (getTemplate.value) {
    addImage(getTemplate.value?.img_file_path_template)
    templateStore.selectTemplate(null)
  }
}
const openAdditional = async () => {
  await mtUtils.mediumPopup(CreateAdditionalImageMemoCarteModal, {
    additional_image: props.additional_image
  })
  if (getAdditionalMemoCarte.value) {
    addImage(getAdditionalMemoCarte.value?.file_url)
    fabricStore.setAdditionalMemoCarte([])
  }
}
const onFilePicked = (e) => {
  const file = e.target.files[0]

  if (file) {
    const reader = new FileReader()

    reader.onload = (event) => {
      const imageUrl = event.target?.result
      addImage(imageUrl)
    }

    reader.readAsDataURL(file)
  }
}
const exportImage = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

  const objects = fabricCanvas.value.getObjects()
  if (objects.length === 0) {
    mtUtils.autoCloseAlert('オブジェクトを追加してください。')
    return
  }

  function base64ToBlob(base64, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize)

      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType })
  }

  // Calculate composite bounds
  const compositeBounds = objects.reduce(
    (acc, object) => {
      const boundingRect = object.getBoundingRect()
      acc.left = Math.min(acc.left, boundingRect.left)
      acc.top = Math.min(acc.top, boundingRect.top)
      acc.right = Math.max(acc.right, boundingRect.left + boundingRect.width)
      acc.bottom = Math.max(acc.bottom, boundingRect.top + boundingRect.height)
      return acc
    },
    { left: Infinity, top: Infinity, right: 0, bottom: 0 }
  )

  const width = compositeBounds.right - compositeBounds.left
  const height = compositeBounds.bottom - compositeBounds.top

  const file = fabricCanvas.value.toDataURL({
    format: 'jpg',
    left: compositeBounds.left - 20,
    top: compositeBounds.top - 20,
    width: width + 40,
    height: height + 40
  })

  const createFabric = {
    file_path: file,
    id_clinic: id_clinic,
    id_customer: props.id_customer,
    id_pet: props.id_pet
  }

  if (props.id_memo_carte != -1)
    Object.assign(createFabric, { id_memo_carte: props.id_memo_carte })

  if (props?.isDirectSubmit) {
    let promises = []

    const image = {
      id_pet_illness_history: props.id_pet_illness_history?.[0]
        ? props.id_pet_illness_history?.[0]
        : null,
      datetime_receive: formatDateWithTime(
        getDateTimeNow(),
        'YYYY/MM/DD HH:mm:ss'
      ),
      name_file: formatDateWithTime(
        getDateTimeNow(),
        'FileMemoCarte_YYYYMMDD_HHmmss.jpeg'
      ),
      type_file: 1,
      type_receive_format: 2,
      ...createFabric
    }

    if (props.isEdit) {
      const confirmation = await mtUtils.confirm(
        '元画像があります。\n元画像を削除しますか？',
        '',
        '元画像を維持',
        '更新画像のみ残す'
      )

      if (confirmation && confirmation == 'edit') {
        const base64Data = image.file_path.split(',')[1]
        image.file_path = await base64ToBlob(base64Data, 'image/jpeg')

        await clinicalFilesStore.updateClinicalFile(
          props.id_clinical_file,
          image
        )
        await memoCarteStore.fetchMemoCarteV1({
          id_pet: props.id_pet,
          id_customer: props.id_customer
        })

        if (!props?.isDirectSubmit) {
          await fabricStore.setFabricOption(createFabric)
        }
        closeModal()
        return
      }
    }

    promises.push(clinicalFilesStore.submitClinicalFile(image))
    await mtUtils.promiseAllWithLoaderMsg(promises, '更新しています...')

    await memoCarteStore.fetchMemoCarteV1({
      id_pet: props.id_pet,
      id_customer: props.id_customer
    })
  }

  if (!props?.isDirectSubmit) {
    await fabricStore.setFabricOption(createFabric)
  }
  closeModal()
}
const renderIcon = (icon) => {
  return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
    let size = this.cornerSize
    ctx.save()
    ctx.translate(left, top)
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle))
    ctx.drawImage(icon, -size / 2, -size / 2, size, size)
    ctx.restore()
  }
}
const handleKeydown = (event: KeyboardEvent) => {
  selectedFabricObjects.value = fabricCanvas.value.getActiveObject()
  if (selectedFabricObjects.value?.type === 'i-text') {
    return false
  }
  if (fabricCanvas.value?.getActiveObject()) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') undo()
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') copy()
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') paste()
    if (event.keyCode === 46 || event.keyCode === 8) {
      deleteObject()
      event.preventDefault()
    }
  }
}
const updatingSelection = (e) => {
  isFilledColor.value = false
  isStrokeColor.value = false
  selectedFabricObjects.value = fabricCanvas.value.getActiveObject()
  fabricCanvas.value.renderAll()

  if (selectedFabricObjects.value?.type === 'i-text') {
    isAddText.value = true
  }

  switch (selectedFabricObjects.value?.name) {
    case 'circle':
      {
        isAddText.value = false
        isStrokeColor.value = true
      }
      break
    case 'rectangle':
      {
        isAddText.value = false
        isStrokeColor.value = true
      }
      break
    case 'dots':
      {
        isAddText.value = false
        isFilledColor.value = true
      }
      break
    case 'arrow':
      {
        isAddText.value = false
        isStrokeColor.value = true
      }
      break
    case 'drawing':
      {
        isAddText.value = false
        isStrokeColor.value = true
      }
      break
  }
}

const mergeObjects = () => {
  const drawingObjects = fabricCanvas.value.getObjects('path')
  if (drawingObjects.length > 1) {
    // Create a new group with all drawing objects
    const group = new fabric.Group(drawingObjects)
    // Remove individual drawing objects from the canvas
    drawingObjects.forEach((obj) => fabricCanvas.value.remove(obj))
    // Add the group back to the canvas
    fabricCanvas.value.add(markRaw(group))
    fabricCanvas.value.renderAll()
  }
}
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', setCanvasSize)
  event_bus.off('addImageUrl')
})
const setCanvasSize = () => {
  const container = document.querySelector('.container')
  if (!container || !fabricCanvas.value) return

  fabricCanvas.value.setHeight(container.clientHeight)
  fabricCanvas.value.setWidth(container.clientWidth)
  fabricCanvas.value.renderAll()
}

onMounted(() => {
  const container = document.querySelector('.container')
  if (container) {
    fabricCanvas.value = markRaw(new fabric.Canvas(can.value))

    fabricCanvas.value.setHeight(container.clientHeight)
    fabricCanvas.value.setWidth(container.clientWidth)

    fabricCanvas.value.isDrawingMode = false
    fabricCanvas.value.backgroundColor = '#ffffff'

    window.addEventListener('resize', setCanvasSize)
  }

  window.addEventListener('keydown', handleKeydown)
  const deleteIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E"
  const deleteImg = document.createElement('img')
  deleteImg.src = deleteIcon

  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderIcon(deleteImg),
    cornerSize: 24
  })
  fabricCanvas.value.on({
    'mouse:down': onMouseDown,
    'mouse:move': onMouseMove,
    'mouse:up': onMouseUp,

    'object:added': () => saveState(),
    'object:modified': () => saveState(),
    'selection:created': (e) => updatingSelection(e),
    'selection:updated': (e) => updatingSelection(e),
    'path:created': () => mergeObjects(),
    'selection:cleared': () => {
      isFilledColor.value = false
      isStrokeColor.value = false
      selectedFabricObjects.value = null

      isAddText.value = false
      isEditText.value = false
      isTextInput.value = false
      textInput.value = ''
      textEdit.value = ''

      fabricCanvas.value.renderAll()
    },
    'mouse:dblclick': (options) => {
      const target = options.target
      if (target instanceof fabric.IText) {
        selectedText = target
        textEdit.value = target.text
        isEditText.value = true
      }
    }
  })

  if (props?.isOpenTemplate) {
    openTemplate()
  }

  if (props?.imageUrl) {
    addImage(props.imageUrl)
  }

  event_bus.on('addImageUrl', (e) => addImage(e))
})
</script>

<template>
  <MtModalHeader class="mt-header" @closeModal="closeModal(false)">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      所見・シェーマ図の描画
      <MtPetInfo class="ellipsis full-width" />
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-py-md q-px-md">
    <div class="flex">
      <q-btn
        outline
        color="primary"
        size="12px"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        @click="openTemplate()"
      >
        <q-tooltip class="primary">テンプレート画像</q-tooltip
        ><q-icon name="photo_library" />
      </q-btn>
      <q-btn
        :color="isDrawing ? 'red' : 'primary'"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        outline
        size="12px"
        @click="toggleDrawing"
      >
        <q-tooltip class="primary">フリー</q-tooltip><q-icon name="draw" />
      </q-btn>
      <q-btn
        outline
        :color="selectedTool === 'rectangle' ? 'red' : 'primary'"
        size="12px"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        @click="selectTool('rectangle')"
      >
        <q-tooltip class="primary">四角枠</q-tooltip
        ><q-icon name="o_rectangle" />
      </q-btn>
      <q-btn
        outline
        :color="selectedTool === 'circle' ? 'red' : 'primary'"
        size="12px"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        @click="selectTool('circle')"
      >
        <q-tooltip class="primary">丸枠</q-tooltip><q-icon name="o_circle" />
      </q-btn>
      <q-btn-dropdown
        outline
        :color="selectedTool === 'dots' ? 'red' : 'primary'"
        size="12px"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        icon="circle"
      >
        <q-list>
          <q-item clickable v-close-popup @click="selectTool('dots', 6)">
            <q-item-section>
              <q-item-label class="text-center"
                ><q-icon name="circle" size="6px"
              /></q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="selectTool('dots', 9)">
            <q-item-section>
              <q-item-label class="text-center"
                ><q-icon name="circle" size="9px"
              /></q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="selectTool('dots', 12)">
            <q-item-section>
              <q-item-label class="text-center"
                ><q-icon name="circle" size="12px"
              /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        outline
        :color="selectedTool === 'arrow' ? 'red' : 'primary'"
        size="12px"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        @click="selectTool('arrow')"
      >
        <q-tooltip class="primary">矢印</q-tooltip
        ><q-icon name="arrow_forward" />
      </q-btn>
      <!-- Additional tools start -->
      <q-btn
        v-if="!isAdditional"
        outline
        color="primary"
        size="xs"
        class="bg-grey-100 text-grey-800 q-mr-xs"
        @click="isAdditional = true"
      >
        その他
      </q-btn>
      <template v-else>
        <q-btn
          :color="selectedTool === 'text' ? 'red' : 'primary'"
          class="bg-grey-100 text-grey-800 q-mr-xs"
          outline
          size="12px"
          @click="addText"
        >
          <q-tooltip class="primary">テキスト</q-tooltip><q-icon name="title" />
        </q-btn>
        <q-btn
          outline
          color="primary"
          size="12px"
          class="bg-grey-100 text-grey-800 q-mr-xs"
          @click="images.click()"
        >
          <q-tooltip class="primary">画像アップロード</q-tooltip
          ><q-icon name="add_photo_alternate" />
        </q-btn>
        <!-- <q-btn outline color="primary" size="12px" class="bg-grey-100 text-grey-800 q-mr-xs" @click="openAdditional()">
          <q-tooltip class="primary">Add additional image from this memo carte</q-tooltip><q-icon name="image" outline />
        </q-btn> -->
      </template>
      <!-- Additional tools end -->
      <div class="control-style1 bg-grey-300 q-ml-md q-mr-xs" @click="undo">
        <q-tooltip>やり直し</q-tooltip><q-icon name="undo" />
      </div>
      <div class="control-style1 bg-grey-300 q-mr-xs" @click="redo">
        <q-tooltip>やり直しの取消</q-tooltip><q-icon name="redo" />
      </div>
      <div v-if="isAddText">
        <q-btn
          class="bg-grey-100 text-grey-800 q-mr-xs"
          color="primary"
          outline
          size="12px"
          @click="setTextFontSize('increase')"
        >
          <q-tooltip class="primary">Increase font size</q-tooltip>
          <q-icon name="text_increase" />
        </q-btn>
        <q-btn
          class="bg-grey-100 text-grey-800 q-mr-xs"
          color="primary"
          outline
          size="12px"
          @click="setTextFontSize('decrease')"
        >
          <q-tooltip class="primary">Decrease font size</q-tooltip>
          <q-icon name="text_decrease" />
        </q-btn>
      </div>

      <div
        v-if="
          fabricCanvas &&
          (fabricCanvas.isDrawingMode || isStrokeColor || isFilledColor)
        "
        class="q-ml-md q-mr-xs"
      >
        {{ isFilledColor ? '背景色' : '線色' }}
      </div>
      <div
        v-if="
          fabricCanvas &&
          (fabricCanvas.isDrawingMode || isStrokeColor || isFilledColor)
        "
        class="q-mr-xs"
      >
        <q-list>
          <q-color
            @click="colorClicked()"
            v-model="colorSelected"
            no-header
            no-footer
            default-view="palette"
            :palette="[
              '#FF0000',
              '#0000FF',
              '#008000',
              '#ffff00',
              '#FFFFFF',
              '#000000'
            ]"
            unelevated
            class="color-picker"
          />
        </q-list>
      </div>
      <input
        type="file"
        style="display: none"
        ref="images"
        accept="image/*"
        @change="onFilePicked($event)"
      />
    </div>
    <div class="container q-my-lg q-ba full-width full-height">
      <canvas id="canvas" ref="can"></canvas>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn
        outline
        class="bg-grey-100 text-grey-800"
        @click="closeModal(false)"
      >
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="exportImage()">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.color-picker {
  box-shadow: none;
  border-radius: 0;
}
:deep(.q-color-picker__cube) {
  border: 1px solid black;
}
.control-style1 {
  font-size: 18px !important;
  padding: 0px 15px;
  cursor: pointer;
  border-radius: 5px;
}
</style>
