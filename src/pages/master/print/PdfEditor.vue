<script lang="ts">
export const MAX_NUMBER_OF_TEXT_BOXES = 20
</script>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, toRaw } from 'vue'
import useCustomerStore from '@/stores/customers'
import { formatDate, getFullPetName } from '@/utils/aahUtils'
import {
  typeBooking,
  typePrevention,
  typePetGender,
  typeDose
} from '@/utils/enum'
import useAddressesStore from '@/stores/addresses'
import useTelephoneStore from '@/stores/telephones'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import {
  getCurrentPetAge,
  getClinicCompleteAddress,
  getJpDate,
  getSimpleJpDate
} from '@/utils/aahUtils'
import { fabric as fabricLib } from 'fabric'
const props = defineProps({
  pdfFile: Uint8Array,
  canvasWidth: Number,
  canvasHeight: Number,
  pdfAttributes: Array,
  renderDirectly: Boolean,
  dataToRender: Object,
  masterPrintData: Object,
  pdfFormat: String,
  currentTypePrintOutput: String
})
const customerStore = useCustomerStore()
const addressesStore = useAddressesStore()
const telephoneStore = useTelephoneStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()

const fabricObj = ref(null)
const enableAddText = ref(null)
const changeFontSize = ref(null)
const downloadPdf = ref(null)
const printPdf = ref(null)
const changePrintSize = ref(null)
const getPdfCanvas = ref(null)
const setOldObjects = ref(null)
const setTextInObjectPlace = ref(null)
const deleteSelectedObject = ref(null)
const getSelectedObject = ref(null)
const getPdfBlob = ref(null)
const allPdfAttributes = ref(null)
const pausePanning = ref<boolean>(false)
const zoomStartScale = ref<number>(0)
const currentX = ref<number>(0)
const currentY = ref<number>(0)
const lastX = ref<number>(0)
const lastY = ref<number>(0)
const xChange = ref<number>(0)
const yChange = ref<number>(0)

const pdRectReferences = []
const rectTextMap = new Map()

const emits = defineEmits<{
  (event: 'select:item', item: any): void;
  (event: 'deselect:item'): void;
  (event: 'scaled:item', item: any): void;
  (event: 'editing:item', item: any): void;
}>();

function formatTextVertically(text) {
  return text.split('').join('\n').replace(/\n+/g, '\n');
}


const current_type_print_output = computed(()=>{
  const x = props.currentTypePrintOutput == "横書き" ? 3 : 4
  return x
})

var PDFAnnotate = function (t: any, e: any, n = {}) {
  ;(this.number_of_pages = 0),
    (this.pages_rendered = 0),
    (this.active_tool = 1),
    (this.fabricObjects = []),
    (this.fabricObjectsData = []),
    (this.color = '#212121'),
    (this.borderColor = '#000000'),
    (this.format = props.pdfFormat ? props.pdfFormat : ''),
    (this.borderSize = 1),
    (this.font_size = 20),
    (this.active_canvas = 0),
    (this.container_id = t),
    (this.url = e),
    (this.pageImageCompression = n.pageImageCompression
      ? n.pageImageCompression.toUpperCase()
      : 'NONE'),
    (this.textBoxText = 'Sample Text'),
    this.format,
    this.orientation
  var a = this
  const _original_initHiddenTextarea = fabric.IText.prototype.initHiddenTextarea
  var defaultOnTouchStartHandler = fabric.Canvas.prototype._onTouchStart;
  fabric.util.object.extend(fabric.IText.prototype, {
    initHiddenTextarea: function () {
      _original_initHiddenTextarea.call(this)
      this.canvas.wrapperEl.appendChild(this.hiddenTextarea)
    }
  })

  fabric.util.object.extend(fabric.Canvas.prototype, { 
    _onTouchStart: function(e) {
      var target = this.findTarget(e); 
      if (this.allowTouchScrolling && !target && !this.isDrawingMode) { 
        return; 
      } 
      defaultOnTouchStartHandler.call(this, e); 
    } 
  })

  pdfjsLib.getDocument(this.url).promise.then(
    function (t) {
      // var e = n.scale ? n.scale : 1.3;
      var e = 2
      a.number_of_pages = t.numPages
      for (var o = 1; o <= t.numPages; o++)
        // for (var o = 1; o <= 1; o++)
        t.getPage(o).then(function (t) {
          try {
            var n = t.getViewport({ scale: 1 })
            var i = document.createElement('canvas')
            var container = document.getElementById(a.container_id)
            container.appendChild(i)
            i.className = 'pdf-canvas'

            var desiredWidth =
              document.getElementsByClassName('left-canvas')[0].clientWidth
            var desiredHeight =
              document.getElementsByClassName('right-canvas')[0].clientHeight

            // var viewport = t.getViewport({ scale: 1, });
            // var scale = desiredWidth / viewport.width;
            // var scaledViewport = t.getViewport({ scale: scale, });
            // i.width = Math.floor(scaledViewport.width);
            // i.height = Math.floor(scaledViewport.height);
            // i.style.width = Math.floor(scaledViewport.width) + "px";
            // i.style.height =  Math.floor(scaledViewport.height) + "px";
            // var context = i.getContext('2d')

            var context = i.getContext('2d')
            i.style.height = desiredHeight + 'px'
            i.style.width = desiredWidth + 'px'
            var scale = 2.5
            var viewport = t.getViewport({ scale: scale })
            i.height = viewport.height
            i.width = viewport.width

            var r = { canvasContext: context, viewport: viewport }
            // var r = { canvasContext: context, viewport: scaledViewport }

            t.render(r).promise.then(function () {
              var canvases = document.querySelectorAll('.pdf-canvas')
              canvases.forEach(function (canvas, index) {
                canvas.id = 'page-' + (index + 1) + '-canvas'
              })
              a.pages_rendered++
              if (a.pages_rendered == a.number_of_pages) {
                a.initFabric()
              }
            })
          } catch (error) {}
        })
    },
    function (t) {}
  ),
    (this.initFabric = function () {
      var t = this
      let e = document.querySelectorAll('#' + t.container_id + ' canvas')
      e.forEach(function (o, a) {
        var i = o.toDataURL('image/png'),
          r = new fabric.Canvas(o.id, {
            freeDrawingBrush: { width: 1, color: t.color },
            allowTouchScrolling: true,
            selection: false,
            imageSmoothingEnabled: false
          })

        // document.getElementsByClassName('canvas-container')[0].style.width = document.getElementById('pdf-container')?.clientWidth + 'px';
        // document.getElementsByClassName('canvas-container')[0].style.height = document.getElementById('pdf-container')?.clientHeight + 'px';

        t.fabricObjects.push(r)

        if (typeof n.onPageUpdated === 'function') {
          r.on('object:added', function () {
            var e = Object.assign({}, t.fabricObjectsData[a])
            t.fabricObjectsData[a] = r.toJSON()
            n.onPageUpdated(a + 1, e, t.fabricObjectsData[a])
          })
        }

        r.on("selection:created", () => {
          emits('select:item' , r.getActiveObject())
        });

        r.on("selection:updated", () => {
          emits('select:item', r.getActiveObject()); 
        });

        r.on("selection:cleared", () => {
          emits('deselect:item' )
        });

        r.on('object:scaled', (e:any) => {
          const obj = e.target;
          if (obj) {
            emits('scaled:item' , obj )
          }
        });

        r.on('text:editing:entered', function (e: any) {
          emits('editing:item', e)
        });

        r.setBackgroundImage(i, r.renderAll.bind(r))

        r.upperCanvasEl.addEventListener('click', function (e) {
          t.active_canvas = a
          t.fabricClickHandler(e, r)
        })

        r.on('after:render', function () {
          t.fabricObjectsData[a] = r.toJSON()
          r.off('after:render')
        })

        if (a === e.length - 1 && typeof n.ready === 'function') {
          n.ready()
        }
      })
    }),
    (this.fabricClickHandler = function (t, e) {})
}
;(PDFAnnotate.prototype.enableSelector = function () {
  var t = this
  ;(t.active_tool = 0),
    t.fabricObjects.length > 0 &&
      $.each(t.fabricObjects, function (t, e) {
        e.isDrawingMode = !1
      })
}),
  (PDFAnnotate.prototype.enablePencil = function () {
    var t = this
    ;(t.active_tool = 1),
      t.fabricObjects.length > 0 &&
        $.each(t.fabricObjects, function (t, e) {
          e.isDrawingMode = !0
        })
  }),
  (PDFAnnotate.prototype.enableAddText = function (t, renderTextVertical) {
    var e = this
    var c = e.fabricObjects[e.active_canvas]
    e.active_tool = 2
    if (typeof t === 'string') {
      e.textBoxText = t
      let n = null
      let rect = null
      if (t == 'ペット写真' || t == '病院ロゴ' || t == 'ペット写真/病院') {
        rect = new fabric.Rect({
          left: Math.abs(c.upperCanvasEl.getBoundingClientRect().left) + 50,
          top: Math.abs(c.upperCanvasEl.getBoundingClientRect().top) + 50,
          originX: 'left',
          originY: 'top',
          width: 150,
          height: 150,
          angle: 0,
          fill: 'rgba(255,0,0,0.5)',
          transparentCorners: false
        })
        const label = new fabric.Text(t, {
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
          originX: 'center',
          originY: 'center',
          fontSize: 12,
          fill: '#000'
        })
        const group = new fabric.Group([rect, label], {
          left: rect.left,
          top: rect.top,
          originX: 'left',
          originY: 'top'
          // lockScalingX: true,
          // lockScalingY: true,
        })
        c.add(group)
        // c.add(rect)
      } else {
        let text_ = e.textBoxText
        if(renderTextVertical == true){
          text_ = formatTextVertically(text_)
        }
        n = new fabric.IText(text_, {
          left: Math.abs(c.upperCanvasEl.getBoundingClientRect().left) + 50,
          top: Math.abs(c.upperCanvasEl.getBoundingClientRect().top) + 50,
          fill: e.color,
          fontSize: e.font_size,
          selectable: true,
          editable: true,
          fontFamily: 'Noto Sans JP',
          lockScalingX: true,
          lockScalingY: true,
          lockScalingFlip: true,
          lockScalingFlipX: true,
          lockScalingFlipY: true
        })
        c.add(n)

        if(renderTextVertical == true){
          n.extraKeys = 4
          n.on('changed', function () {
            var originalText = this.text.replace(/\n/g, ''); // Remove any existing newlines
            var newText = formatTextVertically(originalText); // Add newlines after each character
            if (this.text !== newText) {
              this.text = newText;
              this.setSelectionStart(this.text.length); // Set the cursor at the end of the text
              c.renderAll();
            }
          });
        }else{
          n.extraKeys = 3
        }
      }
    }
  }),
  (PDFAnnotate.prototype.enableRectangle = function () {
    var t = this
    t.fabricObjects[t.active_canvas]
    ;(t.active_tool = 4),
      t.fabricObjects.length > 0 &&
        $.each(t.fabricObjects, function (t, e) {
          e.isDrawingMode = !1
        })
  }),
  (PDFAnnotate.prototype.enableAddArrow = function (t = null) {
    var e = this
    ;(e.active_tool = 3),
      e.fabricObjects.length > 0 &&
        $.each(e.fabricObjects, function (n, a) {
          ;(a.isDrawingMode = !1),
            new Arrow(a, e.color, function () {
              ;(e.active_tool = 0), 'function' == typeof t && t()
            })
        })
  }),
  (PDFAnnotate.prototype.addImageToCanvas = function () {
    var t = this.fabricObjects[this.active_canvas]
    if (t) {
      var e = document.createElement('input')
      ;(e.type = 'file'),
        (e.accept = '.jpg,.jpeg,.png,.PNG,.JPG,.JPEG'),
        (e.onchange = function () {
          var n = new FileReader()
          n.addEventListener(
            'load',
            function () {
              e.remove()
              var n = new Image()
              ;(n.onload = function () {
                t.add(new fabric.Image(n))
              }),
                (n.src = this.result)
            },
            !1
          ),
            n.readAsDataURL(e.files[0])
        }),
        document.getElementsByTagName('body')[0].appendChild(e),
        e.click()
    }
  }),
  (PDFAnnotate.prototype.deleteSelectedObject = function () {
    var activeCanvas = this.fabricObjects[this.active_canvas]
    let activeObjects_ = null
    if (Boolean(activeCanvas._activeObject)) {
      activeObjects_ = activeCanvas._activeObject._objects
    }
    if (!Boolean(activeObjects_)) {
      activeObjects_ = [activeCanvas.getActiveObject()]
    }
    let array = []
    activeObjects_.forEach(function (n) {
      if (n == null) return
      if (n.text) {
        activeCanvas.remove(n)
        if (props.renderDirectly) {
          if (!array.includes(n.extraKeys)) {
            array.push(n.extraKeys)
          }
        } else {
          if (!array.includes(n.text)) {
            array.push(n.text)
          }
        }
      } else {
        if (props.renderDirectly) {
          let ob_text = n.extraKeys
          if (!array.includes(ob_text)) {
            array.push(ob_text)
            activeCanvas.remove(n)
          }
        } else {
          let ob_text = n.group._objects[0].text
            ? n.group._objects[0].text
            : n.group._objects[1].text
          if (!array.includes(ob_text)) {
            array.push(ob_text)
            activeCanvas.remove(n)
          }
        }
      }
    })
    activeCanvas.renderAll()
    return array
  }),
  (PDFAnnotate.prototype.savePdf = async function (t, orientation) {
    var e = this
    var n = e.format || 'a4'
    var a = e.orientation || orientation || 'portrait'

    if (e.fabricObjects.length) {
      var o = new jspdf.jsPDF({ format: n, orientation: a })
      var t = t || `${new Date().getTime()}.pdf`
      for (let r = 0; r < e.fabricObjects.length; r++) {
        const i = e.fabricObjects[r]
        if (r !== 0) {
          o.addPage(n, a)
          o.setPage(r + 1)
        }

        var compression = 'NONE' == e.pageImageCompression ? 'PNG' : 'JPEG'
        var width = o.internal.pageSize.getWidth()
        var height = o.internal.pageSize.getHeight()

        o.addImage(
          i.toDataURL({ format: 'png' }),
          compression,
          0,
          0,
          width,
          height,
          `page-${r + 1}`,
          ['FAST', 'MEDIUM', 'SLOW'].indexOf(e.pageImageCompression) >= 0
            ? e.pageImageCompression
            : void 0
        )

        if (r === e.fabricObjects.length - 1) {
          var c = e.fabricObjects[e.active_canvas]
          var imageFormat = 'png'
          const imageData = c.toDataURL(`image/${imageFormat}`)
          const customerNow = customerStore.getCustomer.id_customer
          const data = {
            image: imageData
          }
          const resp = await customerStore.fetchCustomerCertificatePdf(data)
          const pdf_content = resp.pdf_content
        }
      }
      o.save(t)
    }
  }),
  (PDFAnnotate.prototype.setBrushSize = function (t) {
    $.each(this.fabricObjects, function (e, n) {
      n.freeDrawingBrush.width = parseInt(t, 10) || 1
    })
  }),
  (PDFAnnotate.prototype.setColor = function (t) {
    ;(this.color = t),
      $.each(this.fabricObjects, function (e, n) {
        n.freeDrawingBrush.color = t
      })
  }),
  (PDFAnnotate.prototype.setBorderColor = function (t) {
    this.borderColor = t
  }),
  (PDFAnnotate.prototype.setFontSize = function (t) {
    this.font_size = t
  }),
  (PDFAnnotate.prototype.setBorderSize = function (t) {
    this.borderSize = t
  }),
  (PDFAnnotate.prototype.clearActivePage = function () {
    var t = this.fabricObjects[this.active_canvas],
      e = t.backgroundImage
    confirm('Are you sure?') &&
      (t.clear(), t.setBackgroundImage(e, t.renderAll.bind(t)))
  }),
  (PDFAnnotate.prototype.serializePdf = function (t) {
    var e = this,
      n = []
    e.fabricObjects.forEach(function (a) {
      a.clone(function (a) {
        if (
          (a.setBackgroundImage(null),
          a.setBackgroundColor(''),
          n.push(a),
          n.length === e.fabricObjects.length)
        ) {
          var o = {
            page_setup: { format: e.format, orientation: e.orientation },
            pages: n
          }
          t(JSON.stringify(o))
        }
      })
    })
  }),
  (PDFAnnotate.prototype.loadFromJSON = function (t) {
    var e = this,
      { page_setup: n, pages: a } = t
    void 0 === a && (a = t),
      'object' == typeof n &&
        'string' == typeof n.format &&
        'string' == typeof n.orientation &&
        ((e.format = n.format), (e.orientation = n.orientation)),
      $.each(e.fabricObjects, function (t, n) {
        a.length > t &&
          n.loadFromJSON(a[t], function () {
            e.fabricObjectsData[t] = n.toJSON()
          })
      })
  }),
  (PDFAnnotate.prototype.setDefaultTextForTextBox = function (t) {
    'string' == typeof t && (this.textBoxText = t)
  }),
  (PDFAnnotate.prototype.getSelectedObject = function () {
    var activeCanvas = this.fabricObjects[this.active_canvas]
    let activeObjects_ = null
    if (Boolean(activeCanvas._activeObject)) {
      activeObjects_ = activeCanvas._activeObject._objects
    }
    if (!Boolean(activeObjects_)) {
      activeObjects_ = [activeCanvas.getActiveObject()]
  }
    return activeObjects_
  })

  PDFAnnotate.prototype.changeFontSize = function (t: string |number) {
    var activeCanvas = this.fabricObjects[this.active_canvas]
    let activeObjects_ = null
    if (Boolean(activeCanvas._activeObject)) {
      activeObjects_ = activeCanvas._activeObject._objects
    }
    if (!Boolean(activeObjects_)) {
      activeObjects_ = [activeCanvas.getActiveObject()]
    }
    activeObjects_.forEach(function (n: any) {
      if (n.text) {
        if (typeof t === 'number') {
          n.fontSize = t
        } else {
          if (t === 'small') {
            n.fontSize -= 2
          } else {
            n.fontSize += 2
          }
        }
      } else {
      }
    })
    activeCanvas.renderAll()
  }

const init_fabric = function () {
  fabric.LineArrow = fabric.util.createClass(fabric.Line, {
    type: 'lineArrow',
    initialize: function (element, options) {
      options || (options = {})
      this.callSuper('initialize', element, options)
    },

    toObject: function () {
      return fabric.util.object.extend(this.callSuper('toObject'))
    },

    _render: function (ctx) {
      this.callSuper('_render', ctx)

      // do not render if width/height are zeros or object is not visible
      if (this.width === 0 || this.height === 0 || !this.visible) return

      ctx.save()

      var xDiff = this.x2 - this.x1
      var yDiff = this.y2 - this.y1
      var angle = Math.atan2(yDiff, xDiff)
      ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2)
      ctx.rotate(angle)
      ctx.beginPath()
      //move 10px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
      ctx.moveTo(10, 0)
      ctx.lineTo(-20, 15)
      ctx.lineTo(-20, -15)
      ctx.closePath()
      ctx.fillStyle = this.stroke
      ctx.fill()

      ctx.restore()
    }
  })
  fabric.LineArrow.fromObject = function (object, callback) {
    callback &&
      callback(
        new fabric.LineArrow(
          [object.x1, object.y1, object.x2, object.y2],
          object
        )
      )
  }
  fabric.LineArrow.async = true
  var Arrow = (function () {
    function Arrow(canvas, color, callback) {
      this.canvas = canvas
      this.className = 'Arrow'
      this.isDrawing = false
      this.color = color
      this.callback = callback
      this.bindEvents()
    }
    Arrow.prototype.bindEvents = function () {
      var inst = this
      inst.canvas.on('mouse:down', function (o) {
        inst.onMouseDown(o)
      })
      inst.canvas.on('mouse:move', function (o) {
        inst.onMouseMove(o)
      })
      inst.canvas.on('mouse:up', function (o) {
        inst.onMouseUp(o)
      })
      inst.canvas.on('object:moving', function (o) {
        inst.disable()
      })
    }
    Arrow.prototype.unBindEventes = function () {
      var inst = this
      inst.canvas.off('mouse:down')
      inst.canvas.off('mouse:up')
      inst.canvas.off('mouse:move')
      inst.canvas.off('object:moving')
    }
    Arrow.prototype.onMouseUp = function (o) {
      var inst = this
      inst.disable()
      inst.unBindEventes()
      if (inst.callback) inst.callback()
    }
    Arrow.prototype.onMouseMove = function (o) {
      var inst = this
      if (!inst.isEnable()) {
        return
      }

      var pointer = inst.canvas.getPointer(o.e)
      var activeObj = inst.canvas.getActiveObject()
      activeObj.set({
        x2: pointer.x,
        y2: pointer.y
      })
      activeObj.setCoords()
      inst.canvas.renderAll()
    }
    Arrow.prototype.onMouseDown = function (o) {
      var inst = this
      inst.enable()
      var pointer = inst.canvas.getPointer(o.e)

      var points = [pointer.x, pointer.y, pointer.x, pointer.y]
      var line = new fabric.LineArrow(points, {
        strokeWidth: 5,
        fill: inst.color ? inst.color : 'red',
        stroke: inst.color ? inst.color : 'red',
        originX: 'center',
        originY: 'center',
        hasBorders: false,
        hasControls: true,
        selectable: true
      })

      inst.canvas.add(line).setActiveObject(line)
    }
    Arrow.prototype.isEnable = function () {
      return this.isDrawing
    }
    Arrow.prototype.enable = function () {
      this.isDrawing = true
    }
    Arrow.prototype.disable = function () {
      this.isDrawing = false
    }
    return Arrow
  })()
  fabricObj.value = fabric
}

const initScriptsNested = async () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js'
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      init_fabric()
      resolve() // Resolve the promise once init_fabric is complete
    }, 1000)
  })
}

const get_type_label = (type_value: number, type_name: string) => {
  if (type_name == 'type_pet_gender') {
    return typePetGender.find((item) => item.value == type_value)?.label
  } else if (type_name == 'type_service') {
    return commonStore.getCommonTypeServiceOptionList.find(
      (item) => item.code_func1 == type_value
    )?.name_common
  } else if (type_name == 'type_booking') {
    return typeBooking.find((item) => item.value == type_value)?.label
  } else if (type_name == 'type_prevention') {
    return typePrevention.find((item) => item.value == type_value)?.label
  } else if (type_name == 'type_dose') {
    return typeDose.find((item) => item.value == type_value)?.label
  } else if (type_name == 'type_inject_route') {
    return type_value
  } else if (type_name == 'type_rabies_process') {
    return type_value
  } else {
    return ''
  }
}

const get_value_from_common = (id_cm_: any, attr: any) => {
  let founded: any = {}
  if (attr == 'id_cm_breed') {
    founded = commonStore.getCommonBreedOptionList.filter(
      (item) => item.id_common == id_cm_
    )[0]
  } else if (attr == 'id_cm_hair') {
    founded = cliCommonStore.getCliCommonHairColorList.filter(
      (item) => item.id_cli_common == id_cm_
    )[0]
    if (Boolean(founded)) {
      return founded.name_cli_common
    }
  } else if (attr == 'id_cm_animal') {
    founded = commonStore.getCommonTypeAnimalOptionList.filter(
      (item) => item.id_common == id_cm_
    )[0]
  } else {
    founded = { name_common: '' }
  }

  if (Boolean(founded)) {
    return founded.name_common
  } else {
    return ''
  }
}

const get_value_by_text = (text: string) => {
  let value = allPdfAttributes.value.find((item) => item.text == text)?.value
  if (!Boolean(value)) {
    value = ''
  }
  return value
}

const get_pet_address_rabies = async (id_pet: number, id_customer: number) => {
  await addressesStore.fetchAddressPetRabies(id_pet)
  let addressToPick = null
  addressToPick = addressesStore.addressPetRabies
  if (addressToPick) {
    return `${addressToPick.zip_code || ''} ${addressToPick.address_prefecture || ''} ${addressToPick.address_city || ''} ${addressToPick.address_other || ''}`
  } else {
    return get_customer_main_address(id_customer)
  }
}

const get_customer_main_address = async (id_customer: any) => {
  const resp = await addressesStore.fetchAddresses(id_customer)
  let addresses = []
  let addressToPick = null
  if (!Boolean(resp)) {
    addresses = addressesStore.addresses
  } else {
    addresses = resp.data.data
  }
  addressToPick = addresses.filter((item) => item.flg_main_address == true)[0]
  if (Boolean(addressToPick)) {
    return `${addressToPick.zip_code || ''} ${addressToPick.address_prefecture || ''} ${addressToPick.address_city || ''} ${addressToPick.address_other || ''}`
  } else {
    return ''
  }
}

const get_customer_main_tel = async (id_customer: any) => {
  const resp = await telephoneStore.fetchTelephones({
    id_customer: id_customer
  })
  const telephones = resp.data.data
  const telephoneToPick = telephones.filter(
    (item) => item.flg_main_tel == true
  )[0]
  if (Boolean(telephoneToPick)) {
    return `${telephoneToPick.tel_full}`
  } else {
    return ''
  }
}

const render_data_on_runtime = async (pdf: any, text: any) => {
  const print_data = props.masterPrintData
  var c = pdf.fabricObjects[pdf.active_canvas]
  pdf.active_tool = 2
  text = text.replace('{', '').replace('}', '').trim()
  let obj_entries = Object.entries(print_data)
  let index = -1
  for (let i = 0; i < obj_entries.length; i++) {
    let obj = obj_entries[i]
    if (obj[0].startsWith('item') && obj[1] == text) {
      index = i
      break
    }
  }
  let fontSize = 18
  let xy_hw = '20,20,150,150'
  let left = Number(xy_hw.split(',')[0])
  let top = Number(xy_hw.split(',')[1])

  const value = get_value_by_text(text)
  const data_to_search_in = props.dataToRender

  let labelToRender = ''
  let is_image = false
  if (value == 'customer_main_address') {
    labelToRender = await get_customer_main_address(
      data_to_search_in.id_customer.id_customer
    )
  } else if (value == 'id_pet.pet_address_rabies') {
    labelToRender = await get_pet_address_rabies(data_to_search_in.id_pet.id_pet, data_to_search_in.id_customer.id_customer)
  } else if (value == 'customer_main_tel') {
    labelToRender = await get_customer_main_tel(
      data_to_search_in.id_customer.id_customer
    )
  } else if (value == 'id_pet.pet_age') {
    labelToRender = getCurrentPetAge(data_to_search_in.id_pet)
  } else if (value == 'id_pet.name_pet_honorific') {
    labelToRender = getFullPetName(
      data_to_search_in.id_pet,
      data_to_search_in.id_customer
    )
  } else if (value == 'id_clinic.complete_address') {
    labelToRender = getClinicCompleteAddress(data_to_search_in.id_clinic)
  } else if (value == '') {
    labelToRender = text
  } else if (value == 'booking.datetime_booking_confirmed') {
    labelToRender = getJpDate(
      data_to_search_in.booking?.datetime_booking_confirmed
    )
  } else {
    labelToRender = { ...data_to_search_in }
    const attrs = value.split('.')
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i]
      if (Boolean(labelToRender)) {
        labelToRender = labelToRender[attr]
        if (attr.startsWith('type_')) {
          labelToRender = get_type_label(labelToRender, attr)
        } else if (attr.startsWith('datetime_') || attr.startsWith('date_')) {
          // labelToRender = formatDate(labelToRender)
          labelToRender = getSimpleJpDate(labelToRender)
        } else if (attr.startsWith('image_path1')) {
          is_image = true
          labelToRender = data_to_search_in.id_pet.image_path1
          break
        } else if (attr.startsWith('image_path2')) {
          is_image = true
          if (data_to_search_in.id_pet.image_path2) {
            labelToRender = data_to_search_in.id_pet.image_path2
          } else {
            labelToRender = data_to_search_in.id_pet.image_path1
          }
          break
        } else if (attr == 'logo_file_path1') {
          is_image = true
          labelToRender = data_to_search_in.id_clinic.logo_file_path1
          break
        } else if (attr == 'id_cm_breed') {
          labelToRender = get_value_from_common(labelToRender, attr)
        } else if (attr == 'id_cm_hair') {
          labelToRender = get_value_from_common(labelToRender, attr)
        } else if (attr == 'id_cm_animal') {
          labelToRender = get_value_from_common(labelToRender, attr)
        } else if (attr == 'name_customer_display') {
          labelToRender += ' 様'
        } else if (attr == 'start_date') {
          renderPdData(pdf, 'date_start')
        } else if (attr == 'name_prescription_display') {
          renderPdData(pdf, attr)
        } else if (attr == 'total_days_dose') {
          renderPdData(pdf, attr)
        } else if (attr == 'dose_frequency') {
          renderPdData(pdf, attr)
        } else if (attr == 'total_amount') {
          renderPdData(pdf, attr)
        }
        
      }
    }
  }
  if (labelToRender == null) {
    labelToRender = ''
  }
  labelToRender = labelToRender + ''
  if (is_image) {
    try {
      let w = Number(xy_hw.split(',')[2])
      let h = Number(xy_hw.split(',')[3])
      let zoomX = Number(xy_hw.split(',')[4])
      let zoomY = Number(xy_hw.split(',')[5])
      fabric.Image.fromURL(
        labelToRender,
        function (myImg) {
          const desiredSize = 150
          const originalWidth = myImg.width
          const originalHeight = myImg.height
          const scaleX = desiredSize / originalWidth
          const scaleY = desiredSize / originalHeight
          const scale = Math.min(scaleX, scaleY)
          myImg.scale(scale)
          const roundedCorners = (fabricObject, cornerRadius) =>
            new fabric.Rect({
              width: fabricObject.width,
              height: fabricObject.height,
              rx: cornerRadius / fabricObject.scaleX,
              ry: cornerRadius / fabricObject.scaleY,
              left: -fabricObject.width / 2,
              top: -fabricObject.height / 2
            })
          if (value == 'id_pet.image_path1' || value == 'id_pet.image_path2') {
            myImg.set('clipPath', roundedCorners(myImg, 10))
          }
          const group = new fabric.Group([myImg], {
            left: left,
            top: top,
            originX: 'left',
            originY: 'top'
          })
          group.extraKeys = text
          c.add(group)
          c.renderAll()
        },
        {
          crossOrigin: 'Anonymous'
        }
      )
    } catch (error) {
      console.error('Error loading image', error)
    }
  } else {
    pdf.textBoxText = labelToRender
    try {
      
      let text_ = pdf.textBoxText
      let type_print_output = current_type_print_output.value
      if(type_print_output == 4){
        text_ = formatTextVertically(text_)
      }

      var n = new fabric.IText(text_, {
        left: left,
        top: top,
        fontSize: fontSize,
        selectable: true,
        editable: true,
        fontFamily: 'Noto Sans JP',
        lockScalingX: true,
        lockScalingY: true,
        lockScalingFlip: true,
        lockScalingFlipX: true,
        lockScalingFlipY: true
      })
      n.extraKeys = text
      c.add(n)
      c.renderAll()

      if(type_print_output == 4){
        n.on('changed', function () {
          var originalText = this.text.replace(/\n/g, ''); // Remove any existing newlines
          var newText = formatTextVertically(originalText); // Add newlines after each character
          if (this.text !== newText) {
            this.text = newText;
            this.setSelectionStart(this.text.length); // Set the cursor at the end of the text
            c.renderAll();
          }
        });
      }

    } catch (error) {
      console.log(error)
    }
  }
}

const renderPrescriptionDetailBoxes = (pdf) => {
  let canvas = pdf.fabricObjects[pdf.active_canvas]
  if(canvas && props.dataToRender?.id_paper_bag && props.dataToRender.id_paper_bag?.prescription.prescription_detail_list) {
    const prescriptionDetailList = props.dataToRender.id_paper_bag?.prescription.prescription_detail_list
    prescriptionDetailList.forEach((_, idx) => {
      let rect = new fabric.Rect({
        left: 100,
        top: 300 + (idx * 175),
        width: 650,
        height: 150,
        fill: '',
        stroke: 'blue',
        strokeWidth: 3,
        padding: 10
     });
     pdRectReferences.push(rect)
     rectTextMap.set(rect, [])
     canvas.add(rect)
    })
  }
}

const renderPdData = (pdf, attr: string) => {
  const prescriptionDetailList = props.dataToRender?.id_paper_bag?.prescription.prescription_detail_list
  if(prescriptionDetailList.length > 0 && pdRectReferences.length > 0) {
    let canvas = pdf.fabricObjects[pdf.active_canvas]
     for (let i = 0; i < pdRectReferences.length; i++) {
      const rect = pdRectReferences[i]
      let existingText = rectTextMap.get(rect)
      let totalWidth: number = existingText.reduce((totalWidth, textObj) => totalWidth + textObj.getScaledWidth(), 0)
      let text = new fabric.Text(prescriptionDetailList[i][attr], {
        left: rect.left + 10 + (totalWidth ? totalWidth + 10 : 0),
        top: rect.top + 10,
        fontSize: 16,
        fill: 'black'
      });
      existingText.push(text)
      canvas.add(text)
    }
  }
}

onMounted(async () => {
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [8] })

  await initScriptsNested()
  allPdfAttributes.value = props.pdfAttributes
  let pdf: any
  function loadPdf(pdfData: any) {
    pdf = new (PDFAnnotate as any)('pdf-container', pdfData, {
      onPageUpdated() {},
      ready() {
        setTimeout(() => {
          const parent_ = document.getElementById('pdf-container')
          const allCanvas = document.getElementsByClassName('canvas-container')
          for (let i = 1; i < allCanvas.length; i++) {
            parent_?.removeChild(allCanvas[i])
            // document.body.remove(allCanvas[i])
          }
        }, 2000)
      },
      scale: 2,
      pageImageCompression: 'FAST'
    })
  }

  ;(enableAddText.value as any) = (text: any, event: any, renderTextVertical: any) => {
    event.preventDefault()
    if (props.renderDirectly) {
      render_data_on_runtime(pdf, text)
    } else {
      pdf.enableAddText(text, renderTextVertical)
    }
  }
  ;(changeFontSize.value as any) = (action: String | number) => {
    pdf.changeFontSize(action)
  }
  ;(deleteSelectedObject.value as any) = () => {
    return pdf.deleteSelectedObject()
  }
  ;(printPdf.value as any) = async (
    width: any,
    height: any,
    type_print_size: any
  ) => {
    var canvasToPrint = pdf.fabricObjects[pdf.active_canvas]
    var base64Url = canvasToPrint.toDataURL('data:application/png', 1.0)
    const printFrame = document.getElementById('print-frame')
    const printDocument = printFrame.contentWindow.document
    printDocument.open()
    printDocument.write(`
      <html>
      <head>
        <style>
          @media print {
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              width: auto;
              height: auto;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <img src="${base64Url}" onload="window.print(); window.close();" />
      </body>
      </html>
    `)
    printDocument.close()
    printDocument.body.style.margin = '0'
    printDocument.body.style.padding = '0'
    printFrame.contentWindow.focus()
  }
  ;(downloadPdf.value as any) = (customerName: String, orientation: String) => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Month is zero-based
    const day = String(currentDate.getDate()).padStart(2, '0')
    const fileName = `${year}${month}${day}_${customerName}様.pdf`
    pdf.savePdf(fileName, orientation) // save with given file name
  }
  ;(changePrintSize.value as any) = (size: String) => {}
  ;(getPdfCanvas.value as any) = () => {
    var c = pdf.fabricObjects[pdf.active_canvas]
    return c
  }
  ;(getPdfBlob.value as any) = () => {
    var canvasToPrint = pdf.fabricObjects[pdf.active_canvas]
    var base64Url = canvasToPrint.toDataURL('application/pdf') // Change the format to data:application/pdf or image/jpeg as needed
    var binaryData = atob(base64Url.split(',')[1])
    var arrayBuffer = new ArrayBuffer(binaryData.length)
    var typedArray = new Uint8Array(arrayBuffer)
    for (var i = 0; i < binaryData.length; i++) {
      typedArray[i] = binaryData.charCodeAt(i)
    }
    var blob = new Blob([typedArray], { type: 'application/pdf' }) // Change the type to match the format used in toDataURL
    return blob
  }
  ;(setOldObjects.value as any) = (print_data: {}) => {
    setTimeout(function () {
      var c = pdf.fabricObjects[pdf.active_canvas]
      pdf.active_tool = 2
      var arr = []
      for (let i = 0; i < MAX_NUMBER_OF_TEXT_BOXES; i++) {
        if (!Boolean(print_data[`item${i + 1}`])) {
          continue
        }
        let text = print_data[`item${i + 1}`]
        let fontSize = print_data[`font_size${i + 1}`]
        let xy_hw = print_data[`xy_hw${i + 1}`]
        let type_print_output = print_data[`type_print_output${i + 1}`]
        let left = Number(xy_hw.split(',')[0])
        let top = Number(xy_hw.split(',')[1])
        let width = Number(xy_hw.split(',')[2])
        let height = Number(xy_hw.split(',')[3])
        let metadata = toRaw(print_data[`json${i + 1}`])
        arr.push([text, fontSize, left, top])
        pdf.textBoxText = text
        if (
          text == 'ペット写真' ||
          text == '病院ロゴ' ||
          text == 'ペット写真/病院'
        ) {
          let w = Number(xy_hw.split(',')[2])
          let h = Number(xy_hw.split(',')[3])
          let zoomX = Number(xy_hw.split(',')[4])
          let zoomY = Number(xy_hw.split(',')[5])
          let rect = new fabric.Rect({
            left: Math.abs(c.upperCanvasEl.getBoundingClientRect().left) + 50,
            top: Math.abs(c.upperCanvasEl.getBoundingClientRect().top) + 50,
            originX: 'left',
            originY: 'top',
            width: w * c.width,
            height: h * c.height,
            angle: 0,
            fill: 'rgba(255,0,0,0.5)',
            transparentCorners: false
          })
          const label = new fabric.Text(text, {
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
            originX: 'center',
            originY: 'center',
            fontSize: 16,
            fill: '#000'
          })
          const group = new fabric.Group([rect, label], {
            left: left * c.width,
            top: top * c.height,
            originX: 'left',
            originY: 'top',
            width: w * c.width,
            height: h * c.height,
            // lockScalingX: true,
            // lockScalingY: true,
            // scaleX: zoomX,
            // scaleY: zoomY
          })
          c.add(group)
        } else {
          let text_ = pdf.textBoxText
          if (metadata && metadata.stylable) {
            var n = new fabric.Textbox(text_, {
              left: left * c.width,
              top: top * c.height,
              // fill: pdf.color,
              fontSize: fontSize,
              selectable: true,
              editable: true,
              fontFamily: 'Noto Sans JP',
              fill: '#000',
              textAlign: metadata.options?.textAlign ?? 'left',
              splitByGrapheme: metadata.options?.wrap ?? false,
              width: metadata.options?.width ?? width ?? 50,
              height: metadata.options?.height ?? height ?? 50,
              lockScalingX: false,
              lockScalingY: true,
              lockScalingFlip: true,
              lockScalingFlipX: true,
              lockScalingFlipY: true,
              metadata
              // fontWeight: '600',
            })
            n.set({ height: n.calcTextHeight() + 10 })
            c.add(n)
          } else {
            
            if(type_print_output == 4){
              text_ = formatTextVertically(text_)
            }
            var n = new fabric.IText(text_, {
              left: left * c.width,
              top: top * c.height,
              fontSize: fontSize,
              selectable: true,
              editable: true,
              fontFamily: 'Noto Sans JP',
              fill: '#000',
              lockScalingX: true,
              lockScalingY: true,
              lockScalingFlip: true,
              lockScalingFlipX: true,
              lockScalingFlipY: true,
              width,
              height
            })
            c.add(n)

            if(type_print_output == 4){
              n.extraKeys = 4
              n.on('changed', function () {
                var originalText = this.text.replace(/\n/g, ''); // Remove any existing newlines
                var newText = formatTextVertically(originalText); // Add newlines after each character
                if (this.text !== newText) {
                  this.text = newText;
                  this.setSelectionStart(this.text.length); // Set the cursor at the end of the text
                  c.renderAll();
                }
              });
            }else{
              n.extraKeys = 3
            }
          }
          
        }
      }
    }, 1000)
  }
  ;(setTextInObjectPlace.value as any) = (
    print_data: {},
    data_to_search_in: {}
  ) => {
    setTimeout(async function () {
      var c = pdf.fabricObjects[pdf.active_canvas]
      pdf.active_tool = 2
      for (let i = 0; i < MAX_NUMBER_OF_TEXT_BOXES; i++) {
        let text = print_data[`item${i + 1}`]
          .replace('{', '')
          .replace('}', '')
          .trim()
        let fontSize = print_data[`font_size${i + 1}`]
        let xy_hw = print_data[`xy_hw${i + 1}`]
        let left = Number(xy_hw.split(',')[0])
        let top = Number(xy_hw.split(',')[1])
        let type_print_output = print_data[`type_print_output${i + 1}`]
        if (!Boolean(print_data[`item${i + 1}`])) {
          continue
        }
        const value = get_value_by_text(text)
        let labelToRender = ''
        let selectedAttr = ''
        let is_image = false
        if (value == 'customer_main_address') {
          labelToRender = await get_customer_main_address(
            data_to_search_in.id_customer.id_customer
          )
        } else if (value == 'customer_main_tel') {
          labelToRender = await get_customer_main_tel(
            data_to_search_in.id_customer.id_customer
          )
        } else if (value == 'id_pet.pet_age') {
          labelToRender = getCurrentPetAge(data_to_search_in.id_pet)
        } else if (value == 'id_pet.name_pet_honorific') {
          labelToRender = getFullPetName(
            data_to_search_in.id_pet,
            data_to_search_in.id_customer
          )
        } else if (value == 'id_clinic.complete_address') {
          labelToRender = getClinicCompleteAddress(data_to_search_in.id_clinic)
        } else if (value == '') {
          labelToRender = text
        } else if (value == 'booking.datetime_booking_confirmed') {
          labelToRender = getJpDate(
            data_to_search_in.booking?.datetime_booking_confirmed
          )
        } else {
          labelToRender = { ...data_to_search_in }
          const attrs = value.split('.')
          for (let i = 0; i < attrs.length; i++) {
            let attr = attrs[i]
            selectedAttr = attr
            // value.split('.').forEach(async function (attr: string) {
            if (Boolean(labelToRender)) {
              labelToRender = labelToRender[attr]
              if (attr.startsWith('type_')) {
                labelToRender = get_type_label(labelToRender, attr)
              } else if (
                attr.startsWith('datetime_') ||
                attr.startsWith('date_')
              ) {
                labelToRender = getSimpleJpDate(labelToRender)
              } else if (attr.startsWith('image_path1')) {
                is_image = true
                if (data_to_search_in.id_pet.image_path1) {
                  labelToRender = data_to_search_in.id_pet.image_path1
                } else {
                  labelToRender = data_to_search_in.id_pet.image_path2
                }
                break
              } else if (attr.startsWith('image_path2')) {
                is_image = true
                if (data_to_search_in.id_pet.image_path2) {
                  labelToRender = data_to_search_in.id_pet.image_path2
                } else {
                  labelToRender = data_to_search_in.id_pet.image_path1
                }
                break
              } else if (attr == 'logo_file_path1') {
                is_image = true
                labelToRender = data_to_search_in.id_clinic.logo_file_path1
                break
              } else if (attr == 'id_cm_breed') {
                labelToRender = get_value_from_common(labelToRender, attr)
              } else if (attr == 'id_cm_hair') {
                labelToRender = get_value_from_common(labelToRender, attr)
              } else if (attr == 'id_cm_animal') {
                labelToRender = get_value_from_common(labelToRender, attr)
              } else if (attr == 'name_customer_display') {
                labelToRender += ' 様'
              } else if (attr == 'license_id' && value == 'rabies.license_id') {
                if (!Boolean(labelToRender)) {
                  labelToRender = data_to_search_in.id_pet?.license_id
                }
              }
            }
            // })
          }
        }
        if (labelToRender == null) {
          labelToRender = ''
        }
        labelToRender = labelToRender + ''
        if (is_image) {
          try {
            let w = Number(xy_hw.split(',')[2])
            let h = Number(xy_hw.split(',')[3])
            let zoomX = Number(xy_hw.split(',')[4])
            let zoomY = Number(xy_hw.split(',')[5])
            fabric.Image.fromURL(
              labelToRender,
              function (myImg) {
                const desiredSize = w * c?.width
                const originalWidth = myImg.width
                const originalHeight = myImg.height
                const scaleX = desiredSize / originalWidth
                const scaleY = desiredSize / originalHeight
                const scale = Math.min(scaleX, scaleY)
                myImg.scale(scale)
                const roundedCorners = (fabricObject, cornerRadius) =>
                  new fabric.Rect({
                    width: fabricObject.width,
                    height: fabricObject.height,
                    rx: cornerRadius / fabricObject.scaleX,
                    ry: cornerRadius / fabricObject.scaleY,
                    left: -fabricObject.width / 2,
                    top: -fabricObject.height / 2
                  })
                if (
                  value == 'id_pet.image_path1' ||
                  value == 'id_pet.image_path2'
                ) {
                  myImg.set('clipPath', roundedCorners(myImg, 10))
                }
                const group = new fabric.Group([myImg], {
                  left: left * c?.width,
                  top: top * c?.height,
                  originX: 'left',
                  originY: 'top',
                  scaleX: zoomX,
                  scaleY: zoomY
                })
                group.extraKeys = text
                c.add(group)
              },
              {
                crossOrigin: 'Anonymous'
              }
            )
          } catch (error) {
            console.error('Error loading image', error)
          }
        } else {
          pdf.textBoxText = labelToRender
          try {
            let text_ = pdf.textBoxText
            if(type_print_output == 4){
              text_ = formatTextVertically(text_)
            }

            let n = new fabric.IText(text_, {
              left: left * c.width,
              top: top * c.height,
              fill: pdf.color,
              fontSize: fontSize,
              selectable: true,
              editable: true,
              fontFamily: 'Noto Sans JP',
              lockScalingX: true,
              lockScalingY: true,
              lockScalingFlip: true,
              lockScalingFlipX: true,
              lockScalingFlipY: true
            })
            n.extraKeys = text
            c.add(n)

            if(type_print_output == 4){
              n.on('changed', function () {
                var originalText = this.text.replace(/\n/g, ''); // Remove any existing newlines
                var newText = formatTextVertically(originalText); // Add newlines after each character
                if (this.text !== newText) {
                  this.text = newText;
                  this.setSelectionStart(this.text.length); // Set the cursor at the end of the text
                  c.renderAll();
                }
              });
            }
          } catch (error) {}
        }
      }
    }, 1000)

    const pdfContainer = document.querySelector('#pdf-container') as HTMLElement;
    const canvasContainer = document.querySelector('.upper-canvas') as HTMLElement;
    
    if (pdfContainer && canvasContainer) {
      // Prevent default touch behaviors except for scrolling
      pdfContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          e.stopPropagation();
        }
      }, { passive: true });

      // Enable scrolling when not interacting with canvas objects
      let isScrolling = false;
      let startX = 0;
      let startY = 0;

      canvasContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startX = e.touches[0].pageX;
          startY = e.touches[0].pageY;
          isScrolling = true;
        }
      }, { passive: true });

      canvasContainer.addEventListener('touchmove', (e) => {
        if (isScrolling && e.touches.length === 1) {
          const deltaY = e.touches[0].pageY - startY;
          const deltaX = e.touches[0].pageX - startX;
          if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
            // If scrolling vertically, prevent canvas interaction
            e.stopPropagation();
            pdfContainer.scrollTop -= deltaY;
            startY = e.touches[0].pageY;
            pdfContainer.scrollLeft -= deltaX;
            startX = e.touches[0].pageX;
          }
        }
      }, { passive: true });

      canvasContainer.addEventListener('touchend', () => {
        isScrolling = false;
      }, { passive: true });
    }
  }
  ;(getSelectedObject.value as any) = () => {
    return pdf.getSelectedObject()
  }

  loadPdf(props.pdfFile)
  
  if(props.masterPrintData && [11, 12, 13].includes(props.masterPrintData.type_print)) {
    setTimeout(() => {
      renderPrescriptionDetailBoxes(pdf)    
    }, 500)
  }
})

defineExpose({
  enableAddText,
  changeFontSize,
  downloadPdf,
  printPdf,
  changePrintSize,
  getPdfCanvas,
  setOldObjects,
  setTextInObjectPlace,
  deleteSelectedObject,
  getPdfBlob,
  getSelectedObject
})
</script>

<template>
  <div id="pdf-container"></div>
  <iframe id="print-frame"></iframe>
</template>

<style>
#print-frame {
  display: none;
}

canvas,
.canvas-container {
  -webkit-box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.75);
  box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.75);
}

.toolbar {
  width: 100%;
  background-color: rgb(50, 54, 57);
  height: 50px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
}

#pdf-container {
  /* width: 100%; */

  height: 100%;
  overflow: auto;
  text-align: center;
  margin-top: 0.3rem;
  -webkit-overflow-scrolling: touch;
  pointer-events: all;
}

@media screen and (max-width: 1024px) {
  #pdf-container {
    max-height: calc(100vh - 180px);
  }
}

button:focus {
  outline: 0;
}

.toolbar .tool {
  display: inline-block;
  color: #fff;
  height: 100%;
  padding-top: 10px;
  padding-left: 10px;
  margin-right: 5px;
}

.toolbar .tool label,
.toolbar .tool select,
.toolbar .tool input {
  display: inline-block;
  width: auto;
  height: auto !important;
  padding: 0;
}

.toolbar .tool input {
  width: 50px;
}

.toolbar .tool .color-tool {
  height: 25px;
  width: 25px;
  border-radius: 25px;
  border: 0;
  cursor: pointer;
  display: inline-block;
}

.toolbar .tool .color-tool.active {
  -webkit-box-shadow: 3px 4px 5px 0px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 3px 4px 5px 0px rgba(0, 0, 0, 0.75);
  box-shadow: 3px 4px 5px 0px rgba(0, 0, 0, 0.75);
}

.toolbar .tool:nth-last-child(1) {
  float: right;
}

.toolbar .tool .tool-button {
  background-color: rgb(50, 54, 57);
  border: 1px solid rgb(50, 54, 57);
  color: #fff;
  cursor: pointer;
}

.toolbar .tool .tool-button:hover,
.toolbar .tool .tool-button.active {
  background-color: rgb(82, 86, 89);
  border-color: rgb(82, 86, 89);
}
.textLayer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
}
.textLayer > div {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
canvas {
  box-shadow: none;
  -webkit-box-shadow: none;
}
.canvas-container {
  box-shadow: none;
  -webkit-box-shadow: none;
  margin: 0 auto;
}
</style>
