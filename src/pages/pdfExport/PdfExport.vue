<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import html2pdf from 'html2pdf.js'
import { date, Loading } from 'quasar'
import mtUtils from '@/utils/mtUtils'
import jsPDF from 'jspdf'
import { notoSansJPBase64 } from '@/assets/fonts/Base64NotoSansJP.js'

const props = defineProps({
  sheetName: {
    type: String,
    required: true
  },
  orientationMode: {
    type: String,
    required: false
  },
  sizeFormat: {
    type: String,
    required: false,
    default: 'a4'
  },
  id: {
    type: String,
    required: false
  },
  generateOnePDF: {
    type: Boolean,
    default: true
  }
})

const pdfType = ref('jpeg')

const isIPad = 
  (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) || 
  (navigator.userAgent.includes("Mac") && "ontouchend" in document)) !== null;

const isLargeIPad = 
  (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) || 
  (navigator.userAgent.includes("Mac") && "ontouchend" in document)) !== null &&
  (screen.width >= 1024 && screen.height >= 1366);

function commonCompanyRegNumber(activeClass = '') {
  return `<div class="${activeClass}">___</div>
          <div class="${activeClass}">___</div>`
}

function printPdf(pdfInstance: jsPDF) {
  // Generate Blob URL for the PDF
  const pdfBlobUrl = pdfInstance.output('bloburl')

  // Create an iframe for the PDF
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none' // Hide the iframe
  iframe.src = pdfBlobUrl

  // Append the iframe to the document
  document.body.appendChild(iframe)

  // Trigger the print dialog
  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()

    // Clean up the iframe after printing
    setTimeout(() => document.body.removeChild(iframe), 60_000)
  }
}

function printPdfWorker(element: HTMLElement, opt) {
  const pdfWorker = html2pdf()
    .set(opt)
    .from(element)
    .toPdf()
    .get('pdf')
    .then((pdf) => {
      printPdf(pdf)
    })

  return pdfWorker
}

async function generateReport(
  title: any = '',
  pagesNumber: Number = 0,
  jsPDFOptions: any = {},
  imagePDFOptions: any = {},
  action: 'download' | 'print' = 'download'
) {
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中です...',
    messageColor: 'black'
  })

  if (!title) {
    title = `${date.formatDate(Date.now(), 'YYYYMMDD')}${props.sheetName}`
  }

  // Reference link: https://ekoopmans.github.io/html2pdf.js/#page-breaks
  // var element = this.$refs.html2Pdf;
  var elements = document.querySelectorAll(
    `${
      props.id
        ? '#'.concat(props.id).concat(' > div')
        : '#element-to-print > div'
    }`
  )
  var opt = {
    filename: title,
    image: { type: pdfType.value, quality: 1, ...imagePDFOptions },
    html2canvas: {
      letterRendering: true,
      scale: isIPad && !isLargeIPad ? 3 : 5,
      dpi: 192,
      allowTaint: true
    },
    jsPDF: {
      unit: 'mm',
      format: props.sizeFormat,
      putOnlyUsedFonts: true,
      floatPrecision: 10,
      compressPdf: true,
      orientation: props.orientationMode ? props.orientationMode : 'portrait',
      ...jsPDFOptions
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      before: '.break-before',
      after: '.break-after',
      avoid: '.break-avoid'
    }
  }

  if (elements && elements.length && elements.length > 0) {
    if (action === 'print') {
      const element = document.getElementById(
        props.id ? props.id : 'element-to-print'
      )
      if (element) {
        printPdfWorker(element, opt)
      }
    } else if (
      props.generateOnePDF &&
      (elements.length == 1 || pagesNumber == 1)
    ) {
      const bottomMargin = isIPad ? 15 : 0
      const offsetX = 0,
        offsetY = 0

      const doc = new jsPDF(opt.jsPDF)
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index]
        let pageImage = await html2pdf().from(element).set(opt).outputImg()
        if (index != 0) {
          doc.addPage()
        }
        const format = opt.jsPDF.format
        const isLandscape: boolean = opt.jsPDF.orientation === 'landscape'
        const { width, height } = getPdfDimensions(format)
        const pageWidth = isLandscape ? height : width
        const pageHeight = isLandscape ? width : height - bottomMargin

        doc.addImage(
          pageImage.src,
          pdfType.value,
          offsetX,
          offsetY,
          pageWidth,
          pageHeight
        )
        if (isIPad) await new Promise((resolve) => setTimeout(resolve, 100))
      }
      doc.save(title + '.pdf')
    } else {
      html2pdf()
        .set(opt)
        .from(document.getElementById(props.id ? props.id : 'element-to-print'))
        .save(title + '.pdf')
      // const doc = new jsPDF(opt.jsPDF);
      // // const pageSize = jsPDF.getPageSize(opt.jsPDF);
      // // const height = doc.internal.pageSize.getHeight();
      // const width = doc.internal.pageSize.getWidth();
      // // return;

      // for (let index = 0; index < elements.length; index++) {
      //   const element = elements[index];

      //   let pageImage = await html2pdf().from(element).set(opt).outputImg();

      //   if (index != 0) {
      //     doc.addPage();
      //   }

      //   doc.addImage(pageImage.src, pdfType.value, 0, 0, width, 0);
      // }

      // doc.save(title + '.pdf');
    }
    Loading.hide()
  } else {
    Loading.hide()
    mtUtils.alert(
      '帳票作成に必要なデータが不足し、処理を完了できません。\n不足情報がないか確認してください。',
      '確認'
    )
  }
}

function generateReportDynamicPageBreak(
  title: any = '',
  jsPDFOptions: any = {},
  imagePDFOptions: any = {},
  customFooter: string = '',
  action: 'print' | 'save' = 'print'
) {
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中です...',
    messageColor: 'black'
  })

  if (!title) {
    title = `${date.formatDate(Date.now(), 'YYYYMMDD')}${props.sheetName}`
  }

  var opt = {
    filename: title,
    image: { type: pdfType.value, quality: 1, ...imagePDFOptions },
    html2canvas: {
      letterRendering: true,
      scale: isIPad ? 1.5 : 5,
      dpi: 192,
      allowTaint: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 10,
      compressPdf: true,
      orientation: props.orientationMode ? props.orientationMode : 'portrait',
      ...jsPDFOptions
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      before: '.break-before',
      after: '.break-after',
      avoid: '.break-avoid'
    }
  }
  const dynamicPageBreakWorker = html2pdf()
    .set({ ...opt, margin: [4, 4, 12, 4] })
    .from(document.getElementById(props.id ? props.id : 'element-to-print'))
    .toPdf()
    .get('pdf')
    .then((pdf) => {
      const pageCount = pdf.internal.getNumberOfPages()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)

        // Draw the top border for the footer
        pdf.setDrawColor(0) // Set border color (black)
        pdf.setLineWidth(0.5) // Set border width
        pdf.line(4, pageHeight - 11, pageWidth - 4, pageHeight - 11) // Draw line

        // Add footer text
        pdf.addFileToVFS('NotoSansJP.ttf', notoSansJPBase64)
        pdf.addFont('NotoSansJP.ttf', 'NotoSansJP', 'normal')
        pdf.setFont('NotoSansJP')
        pdf.setFontSize(9)

        const trademarkText = `` //TODO No need this line
        const trademarkTextWidth = pdf.getTextWidth(trademarkText)
        pdf.text(trademarkText, 4, pageHeight - 6)

        if (customFooter) {
          pdf.text(customFooter, 4 + trademarkTextWidth, pageHeight - 6)
        }

        const paginationText = `Page: ${i} / ${pageCount}`
        const paginationTextWidth = pdf.getTextWidth(paginationText)
        pdf.text(
          paginationText,
          pageWidth - 4 - paginationTextWidth,
          pageHeight - 6
        )
      }
      Loading.hide()

      if (action === 'print') {
        printPdf(pdf)
      } else {
        pdf.save(opt.filename)
      }
    })
}

async function getPdfBlob(
  title: any = '',
  pagesNumber: Number = 0,
  jsPDFOptions: any = {},
  imagePDFOptions: any = {},
  useCORS = false
) {
  return new Promise(function (resolve, reject) {
    Loading.show({
      backgroundColor: 'transparent',
      spinnerColor: 'black',
      message: '読み込み中です...',
      messageColor: 'black'
    })
    if (!title) {
      title = `${date.formatDate(Date.now(), 'YYYYMMDD')}${props.sheetName}`
    }
    var opt = {
      filename: title,
      image: { type: pdfType.value, quality: 1, ...imagePDFOptions },
      html2canvas: { letterRendering: true, scale: 5, useCORS },
      jsPDF: {
        unit: 'mm',
        format: props.sizeFormat,
        putOnlyUsedFonts: true,
        floatPrecision: 16,
        compressPdf: true,
        orientation: props.orientationMode ? props.orientationMode : 'portrait',
        ...jsPDFOptions
      },
      pagebreak: {
        mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
        avoid: 'img'
      }
    }
    html2pdf()
      .set(opt)
      .from(document.getElementById(props.id ? props.id : 'element-to-print'))
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        Loading.hide()
        var blob = pdf.output('blob')
        resolve(blob)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function populateRows(
  rowsDetails: any,
  start = 8,
  mid = 13,
  lastPage = 0,
  singlePageRows = 0,
  pdfSettingsData: any, // Assuming you have the pdfSettingsData object, which contains the settings for the PDF
  customizeMaxHeight = 680
) {
  let rows = []
  
  const detailList = rowsDetails

  // const detailList = rowsDetails // Assuming you have the detailList array

  let pageIndex = 0
  let rowIndex = 0
  let printPageBreakID = ''
  let rowCount = 0
  let totalRowsDetailCount = detailList.length
  let noInc = false
  const maxHeight = customizeMaxHeight // Maximum height in pixels

  while (rowIndex < detailList.length) {
    const currentPageRows = []
    let currentPageHeight = 0

    if (noInc) {
      rowIndex++
      noInc = false
    }

    if (pageIndex === 0) {
      rowCount = start
    } else {
      rowCount = mid
    }

    if (lastPage > 0 && rowIndex + rowCount >= totalRowsDetailCount) {
      rowCount = lastPage // Adjust for the last page
      if (pageIndex == 0) {
        if (
          totalRowsDetailCount <= start &&
          totalRowsDetailCount >= singlePageRows
        ) {
          rowCount = start
          noInc = true
        } else {
          rowCount = singlePageRows
        }
      }
    }

    // this is for the case of using calculate height instead of using rowCount, currently we only use this for GetPdfPrescriptionDescription.vue
    if (rowCount != 2 && pdfSettingsData) {
      while (currentPageHeight < maxHeight && rowIndex < detailList.length) {
        const currentItem = detailList[rowIndex]
        currentItem.index = `${rowIndex + 1}`
        const itemHeight = calculateItemHeight(currentItem, pdfSettingsData)
        
        const isNextTitle = (detailList[rowIndex + 2] && detailList[rowIndex + 2]?.flg_group_title) ?? false
        if (isNextTitle && currentItem.type_detail !== 4) {
            currentPageRows.push(currentItem)
            rowIndex++
            break
        }
        currentPageRows.push(currentItem)
        currentPageHeight += itemHeight

        rowIndex++
      }
    } 
    // else calculate it with rowCount
    else {
      for (let i = 0; i < rowCount; i++) {
        if (rowIndex >= detailList.length) {
          currentPageRows.push('') // Fill remaining rows with empty values
        } else {
          const currentItem = detailList[rowIndex]
          currentItem.index = `${rowIndex + 1}`

          if (
            i != 0 &&
            printPageBreakID != currentItem?.id_order_detail &&
            currentItem.type_input_control == '51' &&
            currentItem.flg_print_new_page == '1'
          ) {
            for (let j = 0; j < rowCount - i; j++) {
              currentPageRows.push({})
            }
            printPageBreakID = currentItem.id_order_detail // Remember the ID for not repeating the skipping and break page.
            break // Break the loop if second group title flag encountered
          } else {
            currentPageRows.push(currentItem)
            rowIndex++
          }
        }
      }
    }

    if (noInc) {
      rowIndex--
    }

    rows.push(currentPageRows)
    
    pageIndex++
  }

  return rows
}

function calculateItemHeight(item, pdfSettingsData) {
  let height = 0
  const isWithImage = item.image_path1_pdf && pdfSettingsData.flg_show_image
  // Base height for each row
  height += 75 // Example base height, adjust as needed

  // Additional height for specific fields
  if (item.flgIsuNameRow) {
    height += 20 // Height for name row
  }
  if (item.flg_group_title && item.type_detail === 5) {
    height += 40 // Height for group title
  }
  if (isWithImage) {
    height += 150 // Height for image
  }
  if (item.memo_dose) {
    const maxWidth = isWithImage ? 150 : 200
    height += calculateTextHeight(item.memo_dose, maxWidth) // Height for memo dose
  }
  if (item.memo_alert) {
    const maxWidth = isWithImage ? 150 : 200
    height += calculateTextHeight(item.memo_alert, maxWidth)  // Height for memo alert
    // height += calculateTextHeight(item.memo_alert, 200)
  }
  if (item.memo_clinic_prep) {
    const maxWidth = isWithImage ? 150 : 200
    height += calculateTextHeight(item.memo_clinic_prep, maxWidth) // Height for memo clinic prep
    // height += calculateTextHeight(item.memo_clinic_prep, 200) 
  }
  if (item.memo_efficacy) {
    const maxWidth = isWithImage ? 150 : 200
    height += calculateTextHeight(item.memo_efficacy, maxWidth) // Height for memo efficacy
    // height += calculateTextHeight(item.memo_efficacy, 200) 
  }

  return height
}

function calculateTextHeight(text, maxWidth) {
  const lineHeight = 16 // Example line height, adjust as needed
  const charWidth = 8 // Average character width, adjust as needed
  const charsPerLine = Math.floor(maxWidth / charWidth)
  const lines = Math.ceil(text.length / charsPerLine)
  const lineBreaks = (text.match(/\n/g) || []).length
  const totalLines = lines + lineBreaks

  return totalLines * lineHeight
}

function populateRowsPerPage(rowsDetails: any, rowsPerPage: number[] = []) {
  let rows = []

  const detailList = rowsDetails

  let pageIndex = 0
  let rowIndex = 0
  let rowCount = 0
  let noInc = false

  while (rowIndex < detailList.length) {
    const currentPageRows = []

    if (noInc) {
      rowIndex++
      noInc = false
    }

    rowCount = rowsPerPage[pageIndex]

    for (let i = 0; i < rowCount; i++) {
      if (rowIndex >= detailList.length) {
        currentPageRows.push('')
      } else {
        const currentItem = detailList[rowIndex]
        currentItem.index = `${rowIndex + 1}`

        currentPageRows.push(currentItem)
        rowIndex++
      }
    }

    if (noInc) {
      rowIndex--
    }

    rows.push(currentPageRows)
    pageIndex++
  }

  return rows
}

type PageFormat = {
  width: number
  height: number
}

const getPdfDimensions = (format: Array | string): PageFormat => {
  let formats: { [key]: string; PageFormat } = {
    a3: { width: 297, height: 420 },
    a4: { width: 210, height: 297 },
    a5: { width: 148, height: 210 }
  }
  if (props.orientationMode == 'landscape') {
    formats = {
      a3: { width: 420, height: 297 },
      a4: { width: 297, height: 210 },
      a5: { width: 210, height: 148 }
    }
  }

  if (Array.isArray(format) && format.length > 1)
    return { width: format[0], height: format[1] }
  return formats[format.toLowerCase()] ?? formats['a4']
}

const pdfPerPagePadding = () => {
  const screenWidth = window.screen.width
  const defaultIpadWidth = 834
  return screenWidth <= defaultIpadWidth ? 'q-mt-md q-mx-md' : 'q-mt-sm q-mx-sm'
}

defineExpose({
  generateReport,
  generateReportDynamicPageBreak,
  commonCompanyRegNumber,
  populateRows,
  getPdfBlob,
  pdfPerPagePadding,
  populateRowsPerPage
})
</script>

<template>
  <span><!--Text--></span>
</template>
