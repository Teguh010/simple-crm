import { Dialog, Loading, type QDialogOptions } from 'quasar'

/**
 * 数字型のフォマット
 */
export function numberFormat(number: string | number) {
  return ''.concat(number.toString()).replace(/\B(?=(\d{3})+(?!\d))\.*?/g, ',')
}

export function imageResize(file, width = 500, height = 300, resultType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onloadend = () => {
      let img = document.createElement('img')
      img.src = reader.result

      img.onload = () => {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')

        // Maintain aspect ratio
        const useWidth = img.width > width ? width : img.width
        let scaleRatio = Math.min(useWidth / img.width, img.height)
        canvas.width = img.width * scaleRatio
        canvas.height = img.height * scaleRatio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        let dataUrl = canvas.toDataURL(resultType)

        dataURLToBlob(dataUrl).then((resizedImage) => {
          // Resolve the promise with the resized image
          resolve(resizedImage)
        })
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function dataURLToBlob(dataURL) {
  const response = await fetch(dataURL)
  return await response.blob()
}

export function decimalNumberFormat(
  number: string | number,
  decimalPointFix: number = 2
) {
  number = parseFloat(number.toString()).toFixed(decimalPointFix)
  let [beforeDecimal, afterDecimal] = number.toString().split('.')
  return `${numberFormat(beforeDecimal)}.${afterDecimal}`
}

export function formatNumber(value, decimalPlaces = 0, format = true) {
  // Round the number to the specified decimal places
  let rounded = Number(value).toFixed(decimalPlaces)

  // If format is true, format the number with commas
  if (format) {
    rounded = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  return rounded
}

export function formatDecimalNumber(value, locale: Boolean = false) {
  if (!value) return null
  if (Math.floor(value) === value) {
    // If the number is an integer, return it as is.
    if (locale) {
      return value.toLocaleString()
    }
    return value.toString()
  } else {
    // If the number is not an integer, convert to string and trim trailing zeros.
    if (locale) {
      return parseInt(value).toLocaleString()
    }
    return value.toString().replace(/0+$/, '').replace(/\.$/, '')
  }
}

export function formattedPrice(number: number) {
  if (number === 0) {
    return '0' // Directly return '0' if the number is exactly zero
  }
  if (number) {
    number = Math.floor(number)
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      currencyDisplay: 'code'
    })

    return formatter.format(number).replace('JPY', '').trim()
  }
  return ''
}

export function absoluteFormattedPrice(number: number) {
  return formattedPrice(Math.abs(number))
}

export function alert(message: string, title?: string) {
  const opt: QDialogOptions = {
    message: message,
    ok: {
      flat: true,
      label: 'OK',
      color: 'primary'
    }
  }

  if (title !== undefined) {
    opt.title = title
  }

  Dialog.create(opt)
}

export function confirm(
  message: string,
  onOK: (payload?: any) => void,
  onCancel?: () => void,
  title?: string
) {
  const opt: QDialogOptions = {
    message: message,
    ok: {
      flat: true,
      label: 'OK',
      color: 'primary'
    },
    cancel: {
      flat: true,
      label: 'Cancel',
      color: 'primary'
    },
    persistent: true
  }

  if (title !== undefined) {
    opt.title = title
  }

  const dialog = Dialog.create(opt).onOk(onOK)

  if (onCancel !== undefined) {
    dialog.onCancel(onCancel)
  }
}

export function startLoading(message?: string) {
  Loading.show({
    message: message
  })
}

export function stopLoading() {
  Loading.hide()
}
