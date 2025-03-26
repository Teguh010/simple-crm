<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import { setPageTitle } from '@/utils/pageTitleHelper'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import { isDateOutOfToday, formatDate, getDateToday } from '@/utils/aahUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtHtmlToExportButton from '@/components/MtHtmlToExportButton.vue'
import _ from 'lodash'
import dayjs from 'dayjs'

export interface ToRenderElement {
  element: 'table' | 'tbody' | 'tr' | 'td' | 'span' | 'div' | 'br'
  styles?: Partial<CSSStyleDeclaration>
  classes?: Array<string>
  children: string | Array<ToRenderElement | undefined>
}

const cliCommonStore = useCliCommonStore()
const emits = defineEmits(['close'])
const props = defineProps({
  mode: String,
  data: Object,
  searchCallback: Function
})

const inputDefaultValue = {
  name: '',
  margin_header: 15,
  margin_side: 5,
  columns: 2,
  cell_height: 40,
  space_between_cells: 3,
  start_number: 1,
  end_number: 8,
  start_cell_number: 1,
  content_line_height: 2,
  cell_bottom_margin: 1,
  inCell_padding: 1,
  text_align: 2, // can set to 1, 2 and 3
  cell_content_align: 1, // 1: top, 2: middle, 3: bottom
  orientation: 2, // can set to 1, and 2
  font_size: 12,
  csv_columns: 'A, B, C'
}

const jsonData = ref({
  name: inputDefaultValue.name,
  margin_header: inputDefaultValue.margin_header,
  margin_side: inputDefaultValue.margin_side,
  columns: inputDefaultValue.columns,
  cell_height: inputDefaultValue.cell_height,
  space_between_cells: inputDefaultValue.space_between_cells,
  start_number: inputDefaultValue.start_number,
  end_number: inputDefaultValue.end_number,
  start_cell_number: inputDefaultValue.start_cell_number,
  content_line_height: inputDefaultValue.content_line_height,
  cell_bottom_margin: inputDefaultValue.cell_bottom_margin,
  inCell_padding: inputDefaultValue.inCell_padding,
  text_align: inputDefaultValue.text_align,
  cell_content_align: inputDefaultValue.cell_content_align,
  orientation: inputDefaultValue.orientation,
  font_size: inputDefaultValue.font_size,
  csv_columns: inputDefaultValue.csv_columns
})

const isEdit = ref(false)
const selectedCliCommon = ref(null)
const cliCommonList = ref<any[]>([])
const selectedCsvRows = ref<string[][]>([])
const selectedCsvFile = ref(null)
const uploadedFile = ref<File | undefined>()
const toRenderHtmlString = ref<string>('')
const toRenderHtmlData = ref<Array<ToRenderElement | undefined>>()
const toRenderPreviewData = ref<ToRenderElement | undefined>()
const toRenderedHtmlStringIsReady = ref<boolean>(false)
const fileUploadEvent = ref(null)
const fileName = ref<string>('')
let totalCsvRows = 0
const exportOptions = computed(() => {
  return {
    margin: 0,
    orientation: jsonData.value.orientation as 1 | 2,
    pagebreak: {
      // mode: ['css'] as ('css' | 'legacy' | 'avoid-all')[],
      // avoid: ['.page']
    }
  }
})

const canExport = computed(
  () =>
    !!(
      toRenderHtmlString.value &&
      uploadedFile.value &&
      toRenderedHtmlStringIsReady.value
    )
)

const canUpdate = computed(() => uploadedFile.value)

// Mode Save/update
const closeModal = () => {
  emits('close')
}

const initScript = () => {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js',
      integrity: ''
    }
  ]
  scripts.forEach((scriptObj) => {
    let script = document.createElement('script')
    script.src = scriptObj.src
    if (scriptObj.integrity !== '') {
      script.integrity = scriptObj.integrity
    }
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    document.body.appendChild(script)
  })
}

const get_code_func1_str = () => {
  let d = jsonData.value
  return `${d.margin_header},${d.columns},${d.cell_height},${d.space_between_cells},${d.text_align},${d.orientation},${d.start_number},${d.end_number},${d.start_cell_number},${d.content_line_height},${d.cell_content_align},${d.cell_bottom_margin},${d.font_size},${d.margin_side},${d.inCell_padding}`
}

const get_code_func2_str = () => {
  let str = jsonData.value.csv_columns
  if (str.trim().length == 0) {
    str = 'A,B,C'
  }
  return str
}

function htmlFontSizeToWk(px: number, zoom: number = 1.2466): number {
  return px * zoom
}

const prepareCommonCliJson = () => {
  let data_ = {}
  if (isEdit.value) {
    data_ = props.data ?? {}
  } else {
    data_ = {
      date_start: getDateToday(),
      date_end: formatDate(new Date(9999, 1, 1))
    }
  }
  data_ = {
    ...data_,
    name_cli_common: jsonData.value.name,
    code_func1: get_code_func1_str(),
    code_func2: get_code_func2_str(),
    code_cli_common: '21',
    display_order: 1
  }
  return data_
}

const submit = async () => {
  let commonCliJson: Record<string, any> = prepareCommonCliJson()
  if (isEdit.value) {
    await cliCommonStore.updateClinicCommon(
      commonCliJson.id_cli_common,
      commonCliJson
    )
  } else {
    await cliCommonStore.submitClinicCommon(commonCliJson)
  }
  mtUtils.autoCloseAlert('データを保存しました。')
  closeModal()
  if (props.searchCallback) {
    props.searchCallback()
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await cliCommonStore.destroyCliCommon(props.data?.id_cli_common)
            mtUtils.autoCloseAlert('データを保存しました。')
            closeModal()
            if (props.searchCallback) {
              props.searchCallback()
            }
          }
        })
    }
  }
}

const prefilledEditCase = () => {
  jsonData.value.name = props.data?.name_cli_common
  let code_func1_arr = props.data?.code_func1.split(',')
  jsonData.value.margin_header = code_func1_arr[0].trim()
  jsonData.value.columns = code_func1_arr[1].trim()
  jsonData.value.cell_height = code_func1_arr[2].trim()
  jsonData.value.space_between_cells = code_func1_arr[3].trim()
  jsonData.value.text_align = Number(code_func1_arr[4].trim())
  jsonData.value.orientation = Number(code_func1_arr[5].trim())
  jsonData.value.start_number = code_func1_arr[6].trim()
  jsonData.value.end_number = code_func1_arr[7].trim()
  jsonData.value.start_cell_number = code_func1_arr[8].trim()
  jsonData.value.content_line_height = code_func1_arr[9].trim()
  jsonData.value.cell_content_align = Number(code_func1_arr[10].trim())
  jsonData.value.cell_bottom_margin = code_func1_arr[11].trim()
  jsonData.value.font_size = Number(code_func1_arr[12].trim())

  jsonData.value.margin_side = code_func1_arr[13]?.trim()
  jsonData.value.inCell_padding = code_func1_arr[14]?.trim()

  jsonData.value.csv_columns = props.data?.code_func2?.trim()
}

// Mode Print
const csvUploaded = async (event: any) => {
  fileUploadEvent.value = event
  const file = event.target.files[0]
  if (!file) return
  reset('file')
  uploadedFile.value = event.target.files[0]

  const columnToSelect = jsonData.value.csv_columns
  const columns = columnToSelect.split(',').map((col) => col.trim()) // Extract and trim column names

  var fileReader = new FileReader()
  fileReader.onload = function (e) {
    if (!(e && e.target && e.target.result)) return
    // fetch headers
    const csvData = e.target.result
    const textUtf = new TextDecoder('utf-8').decode(
      csvData as AllowSharedBufferSource
    )
    const text: string = textUtf.includes('�')
      ? new TextDecoder('shift-jis').decode(csvData as AllowSharedBufferSource)
      : textUtf
    let apha_index = 0
    let alphabets = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z'
    ]
    const header = text
      .trim()
      .split('\n')[0]
      .split(',')
      .map((s) => {
        let x = {
          name: s.trim(),
          alpha: alphabets[apha_index]
        }
        apha_index += 1
        return x
      })
    selectedCsvFile.value = file
    selectedCsvRows.value.length = 0
    const limit = 500
    // @ts-ignore - inject Papaparse library
    Papa?.parse(text, {
      header: true,
      worker: true,
      complete: function (results: any) {
        let csvRows = results.data
        totalCsvRows = csvRows.length
        fileName.value = `${dayjs().format(
          'YYYYMMDD'
        )}_タックシール_${totalCsvRows}件`
        if (totalCsvRows > limit) {
          mtUtils.autoCloseAlert(
            `CSVに${limit}行以上のデータが登録されています。\n${limit}件未満で利用してください。`
          )
          selectedCsvRows.value = []
          fileUploadEvent.value = null
          return
        } else {
          for (let r = 0; r < csvRows.length; r++) {
            let one_row = [] as string[]
            for (let c in columns) {
              let column = columns[c]
              let value = ''
              column.split('').forEach(function (col) {
                let column_name = header.find((f) => f.alpha == col)?.name
                if (!Boolean(column_name)) {
                  value += col
                } else {
                  value += csvRows[r][column_name!]
                }
              })
              one_row.push(value)
            }
            selectedCsvRows.value.push(one_row)
          }
        }
        processCsv(true)
      }
    })
  }
  fileReader.readAsArrayBuffer(file)
  // fileReader.readAsText(file, 'UTF-8')
}

const uploadCsv = () => {
  document.getElementById('csvuploader')?.click()
}

const renderToHTMLString = (nodes: (ToRenderElement | undefined)[]): string => {
  return nodes
    .filter((node): node is ToRenderElement => node !== undefined) // Remove undefined values
    .map((node) => {
      const styleString = Object.entries(node.styles || {})
        .map(
          ([key, value]) =>
            `${key.replace(
              /[A-Z]/g,
              (match) => `-${match.toLowerCase()}`
            )}:${value}`
        )
        .join(';')

      const classString = node.classes?.length
        ? ` class="${node.classes.join(' ')}"`
        : ''

      const childrenString = Array.isArray(node.children)
        ? renderToHTMLString(node.children) // Recursively process children
        : node.children

      return `<${node.element}${classString} style="${styleString}">${childrenString}</${node.element}>`
    })
    .join('') // Combine elements into a single string
}

const drawCellsOnA4 = async (
  options: {
    margin_header: number
    margin_side: number
    columns: number
    cell_height: number
    space_between_cells: number
    text_align: number
    orientation: string
    start_number: number
    end_number: number
    dataToPrint: string[][]
    start_cell_number: number
    content_line_height: number
    cell_content_align: number
    cell_bottom_margin: number
    inCell_padding: number
    font_size: number
  },
  preview: boolean
): Promise<string> => {
  const {
    margin_header,
    margin_side,
    columns,
    cell_height,
    space_between_cells,
    text_align,
    orientation,
    start_number,
    end_number,
    dataToPrint,
    start_cell_number,
    content_line_height,
    cell_content_align,
    cell_bottom_margin: etc,
    inCell_padding,
    font_size
  } = options
  return nextTick(() => {
    reset('preview')
    const A4_WIDTH = 210.058 // html2pdf width 8.27in
    const A4_HEIGHT = 296.926 + 0.5 // wkhtmlto adjustment
    const cell_bottom_margin = 0
    const { data } = (() => {
      const paperHeight = orientation === 'portrait' ? A4_HEIGHT : A4_WIDTH // -25 to avoid blank page in last page
      const paperWidth = orientation === 'portrait' ? A4_WIDTH : A4_HEIGHT

      const pageHeight =
        orientation === 'portrait'
          ? A4_HEIGHT - margin_header * 2
          : A4_WIDTH - margin_header * 2
      const pageWidth =
        orientation === 'portrait'
          ? A4_WIDTH - 2 * margin_side
          : A4_HEIGHT - 2 * margin_side
      const modifiedDataToPrint = [
        ...Array.from({ length: start_cell_number - 1 }, () => []),
        ...(dataToPrint ?? [])
      ]
      const totalCells = modifiedDataToPrint.length
      const cellStartOffset = start_cell_number - 1
      const cellGapY = cell_bottom_margin
      const cellHeight = cell_height
      const cellWidth = pageWidth / columns
      const cellPaddingX = Math.min(inCell_padding, cellWidth / 2)
      const cellPaddingY = Math.min(space_between_cells, cellHeight / 2)
      const cellJustify =
        cell_content_align === 1
          ? 'top'
          : cell_content_align === 2
          ? 'middle'
          : 'bottom'
      const cellFontSize = htmlFontSizeToWk(Number(font_size ?? 0), 1.05)
      const cellTextLineSpacing = content_line_height || 1.4
      const textAlign =
        text_align === 1 ? 'center' : text_align === 2 ? 'left' : 'right'
      const cellContentWidth = Math.max(0, cellWidth - cellPaddingX * 2)
      const cellContentHeight = Math.max(0, cellHeight - cellPaddingY * 2)
      const rowHeight = cellHeight
      const rowWidth = cellWidth * columns
      const rowsPerPage = Math.floor(pageHeight / (rowHeight + cellGapY))
      const totalRows = Math.ceil(totalCells / columns)
      const totalPages = Math.ceil(totalRows / rowsPerPage)
      const pageMarginTop = margin_header
      const pageMarginX = margin_side
      const debug = (
        color: string = '#efefef'
      ): Partial<CSSStyleDeclaration> => {
        const d = false // set to false
        if (!d)
          return {
            border: '1px solid transparent'
          }
        return {
          border: `1px dashed ${color}`
        }
      }
      const pageStart =
        cellStartOffset >= rowsPerPage * columns
          ? Math.floor(cellStartOffset / (rowsPerPage * columns))
          : 0
      let data: Array<ToRenderElement | undefined> = []
      let cellIndex =
        pageStart === 0
          ? 0
          : rowsPerPage *
            columns *
            Math.floor(cellStartOffset / (rowsPerPage * columns))
      for (let iPage = pageStart; iPage < totalPages; iPage++) {
        data.push({
          element: 'div',
          classes: ['page'],
          styles: {
            height: `${paperHeight}mm`,
            width: `${paperWidth}mm`,
            overflow: 'hidden',
            ...debug('black')
          },
          children: [
            {
              element: 'table',
              classes: ['page-conent'],
              styles: {
                width: `${pageWidth}mm`,
                height: `${pageHeight}mm`,
                borderCollapse: 'collapse',
                borderSpacing: '0',
                border: 'none',
                marginTop: `${pageMarginTop}mm`,
                marginLeft: `${pageMarginX}mm`,
                marginRight: `${pageMarginX}mm`,
                ...debug('black')
              },
              children: [
                {
                  element: 'tbody',
                  children: (() => {
                    return Array.from({ length: rowsPerPage }, (_row, iRow) =>
                      rowsPerPage * iPage + iRow > totalRows
                        ? undefined
                        : {
                            element: 'tr',
                            classes: ['row'],
                            styles: {
                              height: `${rowHeight}mm`,
                              width: `${rowWidth}mm`,
                              display: 'block',
                              border: 'none',
                              overflow: 'hidden',
                              ...debug('blue')
                            },
                            children: (() => {
                              return Array.from({ length: columns }, () => {
                                const cell: ToRenderElement = {
                                  element: 'td',
                                  classes: ['cell'],
                                  styles: {
                                    width: `${cellWidth}mm`,
                                    height: `${cellHeight}mm`,
                                    padding: `${cellPaddingY}mm ${cellPaddingX}mm`,
                                    textAlign: textAlign,
                                    lineHeight: `${cellTextLineSpacing}`,
                                    overflow: 'hidden',
                                    ...debug('green')
                                  },
                                  children: [
                                    {
                                      element: 'div',
                                      classes: ['content-wrapper'],
                                      styles: {
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'block',
                                        width: `${cellContentWidth}mm`,
                                        height: `${cellContentHeight}mm`,
                                        verticalAlign: cellJustify,
                                        overflow: 'hidden',
                                        ...debug('blue')
                                      },
                                      children: [
                                        {
                                          element: 'div',
                                          classes: ['content-inner'],
                                          styles: {
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'table-cell',
                                            fontSize: `${cellFontSize}px`, //inline font size wont work on wkhtmlto
                                            fontWeight: '500',
                                            fontFamily: "'Noto Sans JP'",
                                            verticalAlign: cellJustify,
                                            overflow: 'hidden',
                                            width: `${cellContentWidth}mm`,
                                            height: `${cellContentHeight}mm`
                                          },
                                          children: (() => {
                                            return !modifiedDataToPrint[
                                              cellIndex
                                            ]
                                              ? []
                                              : modifiedDataToPrint[
                                                  cellIndex
                                                ].map((text) => ({
                                                  element: 'span',
                                                  classes: ['content-item'],
                                                  styles: {
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    display: 'block',
                                                    fontSize: `${cellFontSize}px`, //inline font size wont work on wkhtmlto
                                                    fontWeight: '500',
                                                    fontFamily:
                                                      "'Noto Sans JP'",
                                                    overflow: 'hidden'
                                                  },
                                                  children: text
                                                }))
                                          })()
                                        }
                                      ]
                                    }
                                  ]
                                }
                                if (
                                  modifiedDataToPrint[cellIndex] &&
                                  modifiedDataToPrint[cellIndex].length > 0 &&
                                  !toRenderPreviewData.value
                                ) {
                                  toRenderPreviewData.value = cell
                                }
                                cellIndex++
                                return cell
                              }) as []
                            })()
                          }
                    )
                  })()
                }
              ]
            }
          ]
        })
      }
      return { data }
    })()

    toRenderHtmlData.value = data

    const pagesContent = renderToHTMLString(data)
    if (preview) {
      generateAndPrintPDF(
        pagesContent,
        true,
        `${htmlFontSizeToWk(Number(font_size ?? 0), 1.05)}px`
      )
    }
    return pagesContent
  }).then((data: string) => {
    return data
  })
}

function isIPad() {
  return (
    /iPad|Macintosh/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 1
  )
}

async function generateAndPrintPDF(
  pagesContent: any,
  download?: boolean,
  fontSize?: string
) {
  /** @note - styles to be removed page content is not full html doc */
  const styleMatch = pagesContent.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  const styleContent = styleMatch ? styleMatch[1] : '' // Extracted CSS
  let bodyContent = pagesContent

  const fullHtmlDocument = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
         @media print {
          @page {
            margin: 0mm;
          }
          html, body {
            margin: 0; /* Reset any extra body margin */
            padding: 0;
            font-family: 'Noto Sans JP';
            font-size: ${fontSize} !important;
          }
        }
        html, body {
          margin: 0; /* Reset any extra body margin */
          padding: 0;
          font-family: 'Noto Sans JP';
          font-size: ${fontSize} !important;
        }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `
  toRenderHtmlString.value = fullHtmlDocument
  if (download) return fullHtmlDocument
  /**
   * @deprecated - Nothing executed after this line , moved to MtHtmlToExportButton
   */
  if (isIPad()) {
    const newWindow = window.open('', '_blank')
    newWindow?.document.open()
    newWindow?.document.write(fullHtmlDocument)
    // @ts-ignore - this blocked is not used (to be removed)
    newWindow.document.body.style.margin = '0px'
    // @ts-ignore - this blocked is not used (to be removed)
    newWindow.document.body.style.padding = '0px'
    // @ts-ignore - this blocked is not used (to be removed)
    newWindow.document.close()
    // @ts-ignore - this blocked is not used (to be removed)
    newWindow.onload = () => {
      newWindow!.focus() // Ensure focus
      newWindow!.print() // Open the print dialog
      newWindow!.close() // Optional: Close the tab after printing
    }
  } else {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    // @ts-ignore - this blocked is not used (to be removed)
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(fullHtmlDocument)
    iframeDoc.close()
    iframe.onload = async () => {
      iframeDoc.title = ''
      // @ts-ignore - this blocked is not used (to be removed)
      iframe.contentWindow.focus()
      // @ts-ignore - this blocked is not used (to be removed)
      iframe.contentWindow.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(iframe.src)
      }, 30000)
    }
  }
}

const processCsv = async (preview: boolean) => {
  if (jsonData.value.start_number <= 0) {
    jsonData.value.start_number = 1
  }
  if (
    jsonData.value.end_number <= 0 ||
    !Boolean(jsonData.value.end_number) ||
    isNaN(jsonData.value.end_number)
  ) {
    // jsonData.value.end_number = 10
    jsonData.value.end_number = totalCsvRows
  }
  if (jsonData.value.start_cell_number < 1) {
    jsonData.value.start_cell_number = 1
  }

  const attributes = {
    margin_header: Number(jsonData.value.margin_header),
    margin_side: Number(jsonData.value.margin_side),
    columns: Number(jsonData.value.columns),
    cell_height: Number(jsonData.value.cell_height),
    space_between_cells: Number(jsonData.value.space_between_cells),
    text_align: jsonData.value.text_align, // 1 for center, 2 for left, 3 for right
    orientation: jsonData.value.orientation == 1 ? 'portrait' : 'landscape',
    start_number: Number(jsonData.value.start_number),
    end_number: Number(jsonData.value.end_number),
    dataToPrint: [] as string[][],
    start_cell_number: Number(jsonData.value.start_cell_number),
    content_line_height: Number(jsonData.value.content_line_height),
    cell_content_align: jsonData.value.cell_content_align,
    cell_bottom_margin: Number(jsonData.value.cell_bottom_margin),
    font_size: jsonData.value.font_size,
    inCell_padding: jsonData.value.inCell_padding
  }
  const dataToPrint = selectedCsvRows.value.slice(
    attributes.start_number - 1,
    attributes.end_number
  )
  attributes.dataToPrint = dataToPrint
  await drawCellsOnA4(attributes, preview)

  if (preview == true && toRenderPreviewData.value) {
    toRenderedHtmlStringIsReady.value = false
    let previewPanDiv = document.getElementsByClassName('preview-pane')[0]
    if (toRenderPreviewData.value) {
      previewPanDiv.innerHTML = `
        <table>
          <tbody>
            <tr>
              ${renderToHTMLString([toRenderPreviewData.value])}
            </tr>
          </tbody>
        </table>
      `
    } else {
      previewPanDiv.innerHTML = ''
    }
  }
  setTimeout(() => {
    toRenderedHtmlStringIsReady.value = true
  }, 500)
}

const onSelectedCliCommon = _.debounce((val: string) => {
  let cli_comm = cliCommonList.value.find(
    (f: any) => f.id_cli_common == val
  )! as any
  if (!cli_comm) {
    reset('cli')
    onFormFieldChange()
    return
  }
  let code_func1_arr = cli_comm.code_func1.split(',')
  let code_func2 = cli_comm.code_func2
  jsonData.value.margin_header = code_func1_arr[0].trim()
  jsonData.value.columns = code_func1_arr[1].trim()
  jsonData.value.cell_height = code_func1_arr[2].trim()
  jsonData.value.space_between_cells = code_func1_arr[3].trim()
  jsonData.value.text_align = Number(code_func1_arr[4].trim())
  jsonData.value.orientation = Number(code_func1_arr[5].trim())
  jsonData.value.start_number = code_func1_arr[6].trim()
  jsonData.value.end_number = code_func1_arr[7].trim()
  jsonData.value.start_cell_number = code_func1_arr[8].trim()
  jsonData.value.content_line_height = code_func1_arr[9].trim()
  jsonData.value.cell_content_align = Number(code_func1_arr[10].trim())
  jsonData.value.cell_bottom_margin = code_func1_arr[11].trim()
  jsonData.value.font_size = Number(code_func1_arr[12]?.trim())

  jsonData.value.margin_side = Number(code_func1_arr[13]?.trim())
  jsonData.value.inCell_padding = Number(code_func1_arr[14]?.trim())

  jsonData.value.csv_columns = code_func2

  csvUploaded(fileUploadEvent.value)
})

const onFormFieldChange = _.debounce(() => {
  if (props.mode == 'print') {
    csvUploaded(fileUploadEvent.value)
  }
}, 800)

const setPageHeight = () => {
  if (isIPad()) {
    // return 'auto'
    return 'calc(100vh - 100px)'
  } else {
    return 'auto'
  }
}

const handleRenderCallback = async () => {
  return toRenderHtmlString.value
    ? toRenderHtmlString.value
    : (await processCsv(true)) ?? ''
}

const reset = (...values: Array<'preview' | 'cli' | 'file'>) => {
  toRenderedHtmlStringIsReady.value = false
  if (!values.length || values.includes('file')) {
    uploadedFile.value = undefined
    toRenderHtmlString.value = ''
  }
  if (!values.length || values.includes('cli')) {
    jsonData.value = { ...jsonData.value, ...inputDefaultValue }
    selectedCliCommon.value = null
    toRenderHtmlString.value = ''
  }
  if (!values.length || values.includes('preview')) {
    toRenderHtmlData.value = undefined
    toRenderPreviewData.value = undefined
    document.getElementsByClassName('preview-pane')[0].innerHTML = ''
  }
}

// watch(jsonData, onFormFieldChange, { deep: true })

onMounted(async () => {
  if (Boolean(props.data?.id_cli_common)) {
    isEdit.value = true
    prefilledEditCase()
  } else if (props.mode == 'print') {
    initScript()
    let cliCommonTackSealList = [...cliCommonStore.cliCommonTackSeal]
    if (cliCommonTackSealList.length == 0) {
      await Promise.all([
        cliCommonStore.fetchPreparationCliCommonList(
          { code_cli_common: [21] },
          true
        )
      ])
      cliCommonTackSealList = [...cliCommonStore.cliCommonTackSeal]
    }
    cliCommonList.value = cliCommonTackSealList
      .filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
      .map((item) => {
        return {
          ...item,
          label: item.name_cli_common,
          value: item.id_cli_common
        }
      })
  }
  setPageTitle('タックシール印刷')
  // setPageHeight()
})
</script>

<template>
  <!-- <q-form @submit="submit" style="height: calc(100vh - 50px); overflow: scroll;"> -->
  <q-form
    @submit="submit"
    :style="{ height: setPageHeight(), overflow: 'hidden' }"
  >
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        タックシール印刷
      </q-toolbar-title>
      <q-btn round flat @click="openMenu" class="q-mx-sm" v-if="isEdit">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section
      class="q-px-md"
      style="overflow: hidden; overflow-y: auto; max-height: 70vh"
    >
      <div
        class="row q-row-gutter-md q-mb-sm q-pr-md"
        v-if="props.mode == 'print'"
      >
        <div class="col-6">
          <input
            type="file"
            id="csvuploader"
            accept=".csv"
            @change="csvUploaded"
            style="display: none"
          />
          <q-btn class="bg-grey-300 text-grey-800" @click="uploadCsv" flat>
            <q-icon class="q-pr-sm" size="sm" name="upload_file" />CSV を選択
          </q-btn>
        </div>
        <div class="col-6">
          <MtFormPullDown
            label="用途区分"
            type="selection"
            outlined
            v-model:selected="selectedCliCommon!"
            :options="cliCommonList"
            @update:model-value="onSelectedCliCommon"
            :disable="!canUpdate"
          />
        </div>
        <span class="text-grey-800 text-caption" v-if="uploadedFile">
          {{ `${uploadedFile.name} (${selectedCsvRows.length + 1}行)` }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-sm q-pr-md" v-else>
        <div class="col-8">
          <MtInputForm
            type="text"
            v-model="jsonData.name"
            outlined
            label="タックシール設定名"
            :rules="[aahValidations.validationRequired]"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-4"></div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm q-pr-md q-mt-sm">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.margin_header"
            label="外周上下余白（mm）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.margin_side"
            label="外周左右余白（縦）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.columns"
            label="列数（縦）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.cell_height"
            label="セル高さ（mm）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.space_between_cells"
            label="セル内上下余白（mm）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.inCell_padding"
            label="セル内左右余白（mm）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.content_line_height"
            label="行高（フォントサイズの倍数）"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <!-- <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.cell_bottom_margin"
            label="セル下余白（mm）"
            @update:model-value="onFormFieldChange"
          />
        </div> -->
      </div>
      <hr class="light" />
      <div class="row q-col-gutter-md q-pr-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.start_number"
            label="CSV内の開始行番号"
            class="col-12 q-mb-md"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.end_number"
            label="CSV内の終了行番号"
            class="col-12 q-mb-md"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="number"
            v-model="jsonData.start_cell_number"
            label="開始セル番号"
            class="col-12 q-mb-md"
            @update:model-value="onFormFieldChange"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-pr-md">
        <div class="col-lg-4 col-md-4 col-sm-4">
          <MtInputForm
            type="number"
            v-model="jsonData.font_size"
            label="文字の大きさ"
            class="col-12 q-mb-md"
            @update:model-value="onFormFieldChange"
          />
        </div>
        <div class="col-lg-8 col-md-8 col-sm-8">
          <MtInputForm
            type="text"
            v-model="jsonData.csv_columns"
            label="CSVから抽出する列"
            class="col-12 q-mb-md"
            placeholder="Write Comma seperated: A, B, C"
            @update:model-value="onFormFieldChange"
          />
        </div>
      </div>
      <q-expansion-item
        expand-separator
        dense
        dense-toggle
        caption="その他設定"
        header-class="q-px-sm text-right text-black"
        default-opened
      >
        <q-card class="q-pb-sm q-px-none">
          <q-card-section class="q-py-none q-px-none">
            <div class="row q-row-gutter-md q-my-sm">
              <div class="col-lg-3 col-md-4 col-sm-12">横方向位置</div>
              <div class="col-lg-9 col-md-8 col-sm-12">
                <MtInputForm
                  type="radio"
                  label="aaa"
                  :items="[
                    { value: 1, label: '中央' },
                    { value: 2, label: '左寄せ' },
                    { value: 3, label: '右寄せ' }
                  ]"
                  v-model="jsonData.text_align"
                  @update:model-value="onFormFieldChange"
                />
              </div>
            </div>
            <div class="row q-row-gutter-md q-my-sm">
              <div class="col-lg-3 col-md-4 col-sm-12">縦方向位置</div>
              <div class="col-lg-9 col-md-8 col-sm-12">
                <MtInputForm
                  type="radio"
                  :items="[
                    { value: 1, label: '上' },
                    { value: 2, label: '上下中央' },
                    { value: 3, label: '下' }
                  ]"
                  v-model="jsonData.cell_content_align"
                  @update:model-value="onFormFieldChange"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md q-my-sm">
              <div class="col-lg-3 col-md-4 col-sm-12">用紙の方向</div>
              <div class="col-lg-9 col-md-8 col-sm-12">
                <MtInputForm
                  type="radio"
                  :items="[
                    { value: 1, label: '縦方向' },
                    { value: 2, label: '横方向' }
                  ]"
                  v-model="jsonData.orientation"
                  @update:model-value="onFormFieldChange"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <div class="row q-mt-sm">
        <div
          class="col-6 preview-pane"
          :class="{ bordered: !!toRenderPreviewData }"
        ></div>
      </div>
    </q-card-section>
    <q-card-section class="bg-white bottom-sticky">
      <div class="row text-center modal-btn" style="gap: 8px">
        <div class="col no-gutter">
          <q-btn
            outline
            class="full-width bg-grey-100 text-grey-800"
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
        </div>
        <div class="col" v-if="props.mode != 'print'">
          <q-btn unelevated color="primary" class="q-ml-md" type="submit">
            <span>保存</span>
          </q-btn>
        </div>
        <template v-else>
          <div class="col no-gutter">
            <MtHtmlToExportButton
              :contentCallback="handleRenderCallback"
              :contentString="toRenderHtmlString"
              :options="exportOptions"
              :actionType="'print'"
              :fileName="fileName"
            >
              <template #default="{ onExport, isLoading }">
                <q-btn
                  color="primary"
                  unelevated
                  @click="onExport"
                  @touchstart="onExport"
                  :loading="isLoading"
                  :disable="!canExport"
                >
                  <span>プレビュー表示</span>
                </q-btn>
              </template>
            </MtHtmlToExportButton>
          </div>
          <div class="col-auto no-gutter">
            <MtHtmlToExportButton
              :contentCallback="handleRenderCallback"
              :contentString="toRenderHtmlString"
              :options="exportOptions"
              :actionType="'download'"
              :fileName="fileName"
            >
              <template #default="{ onExport, isLoading }">
                <q-btn
                  color="primary"
                  unelevated
                  @click="onExport"
                  @touchstart="onExport"
                  style="width: fit-content; height: 10px"
                  :loading="isLoading"
                  :disable="!canExport"
                >
                  <q-icon name="download" style="font-size: 18px"></q-icon>
                  <span>PDF出力</span>
                  <q-tooltip class="bg-primary q-pa-sm text-white">
                    PDF出力
                  </q-tooltip>
                </q-btn>
              </template>
            </MtHtmlToExportButton>
          </div>
        </template>
      </div>
    </q-card-section>
    <div id="finalPrintContainer"></div>
  </q-form>
</template>

<style lang="scss" scoped>
@page {
  -webkit-print-color-adjust: exact !important;
}
.preview-pane {
  // transform: scale(0.75);
  transform-origin: top left;
  overflow: hidden;
  width: fit-content;
  height: fit-content;
  &.bordered {
    border: 1px dashed #afadad;
  }
}
</style>
