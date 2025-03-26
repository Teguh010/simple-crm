<script setup lang="ts">
import { ref, onMounted, toRaw, computed, nextTick } from 'vue'
// @ts-ignore-line
import html2pdf from 'html2pdf.js'
import _ from 'lodash'
import dayjs from 'dayjs'
import { Notify } from 'quasar'
import axios from 'axios'

interface Props {
  /** label for button if slot is not provided @default PDF出力 */
  label?: string
  /**
   * string content to render
   * - requires html string for pdf
   * - require comma separated value string for csv
   * */
  contentString: string
  /** content string type */
  contentType?: 'pdf' | 'csv'
  /** file name defaults to file_<datetime_now>_0000<uuid> */
  fileName?: string
  /** replace the string to convert from returned string
   *  return false or undefined to cancel export
   */
  contentCallback?: () => string | Promise<string | false | undefined>
  /** PDF export options */
  options?: {
    /** 1 - portrait , 2- landscape */
    orientation?: 1 | 2
    /** Margin can be:
     * - number: all sides equal
     * - [vMargin, hMargin]: vertical and horizontal margins
     * - [top, left, bottom, right]: individual side margins
     */
    margin?: number | [number, number] | [number, number, number, number]
    unit?: 'pt' | 'mm' | 'cm' | 'in' | 'px' | 'pc' | 'em' | 'ex'
    format?:
      | 'a4'
      | 'letter'
      | 'government-letter'
      | 'legal'
      | 'junior-legal'
      | 'ledger'
      | 'tabloid'
      | 'credit-card'
    /** Page break mode for PDF generation */
    pagebreak?: {
      mode?:
        | 'css'
        | 'legacy'
        | 'avoid-all'
        | Array<'css' | 'legacy' | 'avoid-all'>
      avoid?: string[] | string
      before?: string[] | string
      after?: string[] | string
    }
  }
  /** Action type for PDF - either print or download (print is not available for content string type csv)*/
  actionType?: 'print' | 'download'
}

const defaultOptions = {
  orientation: 1,
  margin: 0,
  unit: 'mm',
  format: 'a4',
  pagebreak: {
    mode: 'css'
  }
} as const

const props = withDefaults(defineProps<Props>(), {
  label: 'PDF出力',
  contentType: 'pdf',
  fileName: `file_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}_0000${_.uniqueId()}`,
  options: () => ({}),
  actionType: 'download'
})

const iframeRendererRef = ref<HTMLIFrameElement | null>(null)
const iframeExporterRef = ref<HTMLIFrameElement | null>(null)
const isLoading = ref<boolean>(false)

// Add this computed property
const mergedOptions = computed(() => {
  return _.merge({}, defaultOptions, props.options)
})

// inject links to to iframe
const injectLinks = (document: Document) => {
  const links: {
    href: string
    rel?: string
    crossorigin?: string
    integrity?: string
  }[] = [
    // {
    //   href: 'https://fonts.googleapis.com',
    //   rel: 'preconnect',
    //   crossorigin: ''
    // },
    // {
    //   href: 'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;600&display=swap',
    //   rel: 'stylesheet'
    // },
    // {
    //   href: 'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;600&display=swap',
    //   rel: 'stylesheet'
    // }
  ]
  links.forEach((stylesheetObj) => {
    let link = document.createElement('link')
    link.href = stylesheetObj.href
    if (stylesheetObj.rel && stylesheetObj.rel !== '') {
      link.rel = stylesheetObj.rel
    }
    if (stylesheetObj.integrity && stylesheetObj.integrity !== '') {
      link.integrity = stylesheetObj.integrity
    }
    if (
      _.has(stylesheetObj, 'crossorigin') &&
      stylesheetObj.crossorigin !== ''
    ) {
      link.crossOrigin = stylesheetObj.crossorigin!
    }
    document.head.appendChild(link)
  })
}

// Add this new function
const injectMeta = (document: Document) => {
  const metaTags = [
    {
      name: 'format-detection',
      content: 'telephone=no, date=no, address=no, email=no'
    },
    { httpEquiv: 'x-apple-data-detectors', content: 'none' },
    {
      name: 'viewport',
      content: 'width=1024, initial-scale=1.0'
    }
  ]

  metaTags.forEach((metaObj) => {
    const meta = document.createElement('meta')
    if ('httpEquiv' in metaObj) {
      meta.setAttribute('http-equiv', metaObj.httpEquiv!)
    } else {
      meta.setAttribute('name', metaObj.name!)
    }
    meta.setAttribute('content', metaObj.content)
    document.head.appendChild(meta)
  })
}

// Add x-apple-data-detectors attribute to elements with text content
const addDataDetectorsAttribute = (element: Element) => {
  if (!element.classList.contains('with-decorator')) {
    if (element.textContent?.trim()) {
      element.setAttribute('x-apple-data-detectors', 'false')
      element.setAttribute('x-apple-data-detectors', 'false')
      element.setAttribute('data-detector', 'false')
      element.setAttribute('x-apple-data-detectors-type', 'none')
    }
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        addDataDetectorsAttribute(child as Element)
      }
    })
  }
}

// Update renderHtml to use the new function
const renderHtml = async (htmlString?: string) => {
  if (!iframeRendererRef.value) return

  const iframeDoc =
    iframeRendererRef.value.contentDocument ||
    iframeRendererRef.value.contentWindow?.document
  if (!iframeDoc) return

  let content = htmlString ?? props.contentString

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content

  // Get the modified HTML content
  content = tempDiv.innerHTML

  // Write the modified content
  iframeDoc.write(content)
  iframeDoc.close()

  injectLinks(iframeDoc)
  injectMeta(iframeDoc)

  addDataDetectorsAttribute(iframeDoc.body)

  // Find the last style tag or create one if none exists
  let lastStyle = iframeDoc.head.querySelector('style:last-of-type')
  if (!lastStyle) {
    lastStyle = iframeDoc.createElement('style')
    iframeDoc.head.appendChild(lastStyle)
  }

  // [notoSansJPBase64] repalces with base64 from API to reduce load weight;
  lastStyle.innerHTML += `
   @font-face {
      font-family: 'Noto Sans JP';
      src: url("data:font/ttf;base64,[notoSansJPBase64]") format("truetype");
   }
   body *,
    * {
      font-family: 'Noto Sans JP';
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
      pointer-events: none !important;
      user-select: none !important;
      color: inherit !important;
      text-decoration: none !important;
      -webkit-user-select: none !important;
    }

    /* Enhanced iOS data detection prevention */
    body,
    body *:not(.with-decorator),
    *[x-apple-data-detectors]:not(.with-decorator),
    *[x-apple-data-detectors-type="none"]:not(.with-decorator) {
      color: inherit !important;
      text-decoration: none !important;
      pointer-events: none !important;
      -webkit-text-fill-color: inherit !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
      cursor: default !important;
    }

    /* Additional specific element targeting */
    a[href^="tel:"]:not(.with-decorator),
    a[href^="mailto:"]:not(.with-decorator),
    a[href^="sms:"]:not(.with-decorator),
    a[href^="tel://"]:not(.with-decorator),
    a[href^="mailto://"]:not(.with-decorator),
    a[href^="sms://"]:not(.with-decorator) {
      color: inherit !important;
      text-decoration: none !important;
      pointer-events: none !important;
    }

  `
}

// create download window
const createDownloadWindow = async (): Promise<Window | null> => {
  const newWindow = window.open('about:blank', '_blank')
  if (!newWindow) {
    const errMessage: string =
      'ポップアップがブロックされました。」このサイトのポップアップを許可してください。'
    Notify.create({
      icon: 'warning',
      position: 'top',
      message: errMessage,
      actions: [
        {
          label: 'わかった',
          color: 'white',
          round: true
        },
        {
          label:
            props.actionType === 'print'
              ? 'とにかく印刷する'
              : 'とにかくダウンロード',
          color: 'white',
          handler: () => {
            exportPdf('download', true)
          }
        }
      ]
    })
    throw new Error(errMessage)
  }
  // Write a loading message immediately
  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${
          props.actionType === 'print'
            ? '印刷準備中...'
            : 'ダウンロード準備中...'
        }</title>
        <style>
          body { font-family: 'Gothic A1', 'Noto Sans JP', sans-serif;
; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .loader { text-align: center; }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .safari-notice { margin-top: 15px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <p>${
            props.actionType === 'print'
              ? '印刷の準備中です...'
              : 'ダウンロードの準備中です...'
          }</p>
        </div>
      </body>
    </html>
  `)

  return newWindow
}

// handle export
const handleExport = async () => {
  switch (props.contentType) {
    case 'csv':
      await exportCsv()
      break
    case 'pdf':
    default:
      await exportPdf(props.actionType, true)
      break
  }
}

// Check if the device is iPad
const isIPadDevice = (): boolean => {
  // Check for iOS devices including modern iPads
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
  )
}

// Check if the browser is Safari
const isSafariBrowser = (): boolean => {
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !/CriOS/.test(navigator.userAgent) && // Exclude Chrome for iOS
    !/FxiOS/.test(navigator.userAgent) && // Exclude Firefox for iOS
    !/EdgiOS/.test(navigator.userAgent) // Exclude Edge for iOS
  )
}

// Method to export the content as a PDF
const exportPdf = async (action: string, bypassCompatibilty?: boolean) => {
  if (!iframeRendererRef.value || !iframeExporterRef.value) return
  try {
    // for ipad case print - make suer download
    if (action === 'print' && isIPadDevice() && bypassCompatibilty) {
      Notify.create({
        icon: 'warning',
        position: 'top',
        message: 'PDFファイルをダウンロードして、手動で印刷してください。',
        actions: [
          {
            label: 'キャンセル',
            color: 'white',
            round: true
          },
          {
            label: 'ダウンロード',
            color: 'white',
            handler: () => {
              exportPdf('download', true)
            }
          }
        ]
      })
      return
    }

    isLoading.value = true
    iframeExporterRef.value.innerHTML = ''
    const iframeRenderer = iframeRendererRef.value
    const iframeDocRenderer =
      iframeRenderer.contentDocument || iframeRenderer.contentWindow?.document
    const iframeExporter = iframeExporterRef.value
    const iframeDocExporter =
      iframeExporter.contentDocument || iframeExporter.contentWindow?.document
    if (!iframeDocRenderer || !iframeDocExporter)
      throw new Error('Failed to access iframe document')

    const content = props.contentCallback
      ? await props.contentCallback()
      : props.contentString

    if (content === false || content === undefined) {
      isLoading.value = false
      return
    }

    await renderHtml(content)
    // Wait for fonts and images to load
    const options = {
      margin: mergedOptions.value.margin,
      filename: props.fileName,
      enableLinks: false,
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        scale: 2,
        unit: mergedOptions.value.unit,
        format: mergedOptions.value.format,
        orientation:
          mergedOptions.value.orientation === 1 ? 'portrait' : 'landscape'
      },
      pagebreak: mergedOptions.value.pagebreak
    }

    const replaceLinks = () => {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = iframeDocRenderer.body.innerHTML
      const links = tempDiv.getElementsByTagName('a')
      while (links.length > 0) {
        const link = links[0]
        const span = document.createElement('span')
        span.innerHTML = link.innerHTML
        Array.from(link.attributes).forEach((attr) => {
          if (attr.name !== 'href') {
            span.setAttribute(attr.name, attr.value)
          }
        })
        link.parentNode?.replaceChild(span, link)
      }
      return iframeDocRenderer.body
    }

    replaceLinks()

    /** @note patch */
    const response = await axios.post(
      'https://pdf-gen.vetty.clinic/',
      {
        test_key: 'Add test key here for local host testing.',
        options: {
          orientation:
            mergedOptions.value.orientation === 1 ? 'Portrait' : 'Landscape'
        },
        html: `<!DOCTYPE html>
        <html lang="ja">
          <head>
            ${iframeDocRenderer.head.innerHTML}
          </head>
          <body>
            ${iframeDocRenderer.body.innerHTML}
          </body>
        </html>`
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        responseType: 'blob'
      }
    )

    const apiBlob = new Blob([response.data], { type: 'application/pdf' })
    const apiUrl = window.URL.createObjectURL(apiBlob)

    if (isIPadDevice() && !bypassCompatibilty) {
      // to be deprecated
      html2pdf()
        .set(options)
        .from(iframeDocRenderer.body)
        .toPdf()
        .get('pdf')
        .then(function (pdf: any) {
          nextTick(async () => {
            const newWindow = await createDownloadWindow()
            if (!newWindow) return
            return newWindow
          }).then((newWindow: Window | undefined) => {
            if (!newWindow) return
            isLoading.value = false
            let b64 = pdf.output('datauristring')
            const byteCharacters = atob(b64.split(',')[1]) // Decoding base64
            const byteArrays = []
            for (
              let offset = 0;
              offset < byteCharacters.length;
              offset += 1024
            ) {
              const slice = byteCharacters.slice(offset, offset + 1024)
              const byteNumbers = new Array(slice.length)
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i)
              }
              byteArrays.push(new Uint8Array(byteNumbers))
            }

            const blob = new Blob(byteArrays, { type: 'application/pdf' })
            const blobUrl = URL.createObjectURL(blob)

            newWindow.document.open()
            newWindow.document.write('<!DOCTYPE html><html>')
            newWindow.document.write('<head>')
            newWindow.document.write(`
              <style>
                body {
                  font-family: 'Gothic A1', sans-serif;
                  display: flex;
                  justify-content: center;
                  flex-direction:column;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                .loader { text-align: center; }
                .spinner {
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #3498db;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite; margin: 20px auto;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .message {
                    font-size: 18px;
                    margin-bottom: 20px;
                }
                .link {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #606265;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                }
                .link:hover {
                    background-color: #0056b3;
                }
            </style>
           `)
            newWindow.document.write('</head>')
            newWindow.document.write('<body>')
            newWindow.document.write(`
            <div class="loader">
            <div class="spinner"></div>
                  <p>${
                    action === 'print'
                      ? '印刷の準備中です...'
                      : 'ダウンロードの準備中です...'
                  }</p>
                      </div>
                <p class="message" id="announcement">
                ${
                  action === 'print'
                    ? '印刷が開始されない場合、手動で行うには下のボタンをクリックしてください。'
                    : 'ダウンロードが開始されない場合、手動で行うには下のボタンをクリックしてください。'
                }
                </p>
                <a href="${blobUrl}" class="link" id="manualAction" download='${
              props.fileName
            }.pdf'>ここをクリック</a>
            `)
            newWindow.document.write('</body>')
            newWindow.document.write('</html>')
            newWindow.document.close()

            const a = newWindow.document.createElement('a')
            a.href = blobUrl
            a.download = `${props.fileName}.pdf`
            newWindow.document.body.appendChild(a)
            if (action === 'print') {
              const printFrame = newWindow.document.createElement('iframe')
              printFrame.style.display = 'none'
              printFrame.src = blobUrl
              printFrame.onload = () => {
                if (printFrame.contentWindow) {
                  setTimeout(() => {
                    printFrame.contentWindow?.print()
                    URL.revokeObjectURL(blobUrl)
                  }, 1000)
                }
              }
              newWindow.document.body.appendChild(printFrame)
            } else {
              a.click()
              URL.revokeObjectURL(blobUrl)
            }
          })
        })
        .catch((error: Error) => {
          isLoading.value = false
          throw error
        })
    } else {
      if (action === 'download' || isIPadDevice()) {
        iframeExporter.src = 'about:blank'
        if (iframeDocExporter) {
          const a = iframeDocExporter.createElement('a')
          a.href = apiUrl
          a.download = `${props.fileName}.pdf`
          iframeDocExporter.body.appendChild(a)
          a.click()
          setTimeout(() => {
            URL.revokeObjectURL(apiUrl)
          }, 500)
        }
      } else {
        iframeExporter.src = apiUrl
        if (iframeDocExporter) {
          iframeExporter.onload = () => {
            setTimeout(() => {
              iframeExporter.contentWindow?.focus() // Ensure focus before print
              iframeExporter.contentWindow?.print()
              setTimeout(() => {
                URL.revokeObjectURL(apiUrl)
              }, 500)
            }, 1000) // Small delay to ensure full loading
          }
        }
      }
    }
    isLoading.value = false
  } catch (err) {
    console.error('Error in exportPdf:', err)
    isLoading.value = false
    throw err
  }
}

// Method to export the content as a CSV
const exportCsv = async () => {
  try {
    isLoading.value = true
    const { contentString, fileName, contentType } = toRaw(props)

    let _contentString = contentString
    if (props.contentCallback) {
      const htmlString = await props.contentCallback()
      if (htmlString === false || htmlString === undefined) {
        isLoading.value = false
        return
      }
      _contentString = htmlString
    }
    if (!contentString && contentType !== 'csv') throw Error()

    const isIOS = isIPadDevice()
    const isSafari = isSafariBrowser()

    if (isIOS && !isSafari) {
      // Show message for iOS users not using Safari
      const newWindow = await createDownloadWindow()
      if (!newWindow) return

      newWindow.document.open()
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ブラウザの互換性について</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 80vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              .message {
                max-width: 80%;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="message">
              <p>申し訳ございませんが、現在お使いのブラウザではダウンロードに対応しておりません。</p>
              <p>Safari ブラウザをご利用ください。</p>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()

      isLoading.value = false
      return
    }

    if (isIOS || isSafari) {
      nextTick(async () => {
        const newWindow = await createDownloadWindow()
        if (!newWindow) return
        return newWindow
      }).then((newWindow: Window | undefined) => {
        if (!newWindow) return

        const timeout = setTimeout(() => {
          newWindow.close()
          throw new Error('Processing timeout. Please try again.')
        }, 15000)

        const utf8Array = new TextEncoder().encode(_contentString)

        // Add BOM to ensure correct encoding detection in Excel
        const bom = new Uint8Array([0xef, 0xbb, 0xbf])

        const uint8Array = new Uint8Array([...bom, ...utf8Array])

        const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-8' })
        const a = newWindow.document.createElement('a')
        const url = URL.createObjectURL(blob)
        a.href = url
        a.download = `${fileName}.csv` // Add .csv extension
        a.style.display = 'none'
        newWindow.document.body.appendChild(a)

        // Force the download
        setTimeout(() => {
          a.click()
          newWindow.document.body.removeChild(a)
          URL.revokeObjectURL(url)
          clearTimeout(timeout)

          // Close the window after showing the success message
          setTimeout(() => {
            newWindow.close()
          }, 2000)
        }, 500)
      })
    } else {
      const utf8Array = new TextEncoder().encode(_contentString)

      // Add BOM to ensure correct encoding detection in Excel
      const bom = new Uint8Array([0xef, 0xbb, 0xbf])

      const uint8Array = new Uint8Array([...bom, ...utf8Array])

      const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.csv` // Add .csv extension
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    isLoading.value = false
    return true
  } catch (err) {
    console.error('Error in exportCsv:', err)
    isLoading.value = false
    throw err
  }
}

// Render the HTML when the component mounts
onMounted(() => {
  if (props.contentType === 'pdf') {
    renderHtml()
  }
})
</script>

<template>
  <div class="relative" style="display: flex">
    <!-- Update iframe reference -->
    <iframe ref="iframeRendererRef" class="hidden-container"></iframe>
    <iframe ref="iframeExporterRef" class="hidden-container"></iframe>
    <!-- sandbox="allow-same-origin" -->
    <!-- Export PDF button -->
    <slot
      :onExport="handleExport"
      :isLoading="isLoading"
      :label="label"
      v-if="$slots.default"
    >
    </slot>
    <q-btn
      color="primary"
      unelevated
      @click.prevent="handleExport"
      class="export-btn"
      :loading="isLoading"
      :isSafariBrowser="isSafariBrowser"
      :isIOSDevice="isIPadDevice"
      v-else
    >
      {{ label }}
    </q-btn>
  </div>
</template>

<style scoped>
.hidden-container {
  display: none;
}

.export-btn {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.export-btn:hover {
  background-color: #45a049;
}
</style>
