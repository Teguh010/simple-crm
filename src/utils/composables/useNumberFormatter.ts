import { formatNumberWithDecimals } from '@/utils/aahUtils'

export function useNumberFormatter() {
  /**
   * Converts full-width (JP) numbers to half-width (EN).
   * @param value The input string to convert.
   * @returns The formatted string with half-width numbers.
   */
  const convertToHalfWidth = (value: string): string => {
    let numStr = ''
    if (value.length && value.length > 0) {
      //文字列の場合
      for (var i = 0; i < value.length; i++) {
        let target = value.charAt(i)
        //全角を半角に変える
        switch (target) {
          case '0':
          case '０':
            numStr += '0'
            break
          case '1':
          case '１':
            numStr += '1'
            break
          case '2':
          case '２':
            numStr += '2'
            break
          case '3':
          case '３':
            numStr += '3'
            break
          case '4':
          case '４':
            numStr += '4'
            break
          case '5':
          case '５':
            numStr += '5'
            break
          case '6':
          case '６':
            numStr += '6'
            break
          case '7':
          case '７':
            numStr += '7'
            break
          case '8':
          case '８':
            numStr += '8'
            break
          case '9':
          case '９':
            numStr += '9'
            break
          case '.':
          case '．':
            numStr += '.'
            break
          case '。':
            numStr += '.'
            break
          case '-':
          case 'ー':
            numStr += '-'
            break
          case '―':
            numStr += '-'
            break
          case '−':
            numStr += '-'
            break
          case '－':
            numStr += '-'
            break
          default:
        }
      }

      //数字型へキャスト
      let float = Number.parseFloat(numStr)
      //小数第２位表示
      let fixed2 = formatNumberWithDecimals(float)

      return fixed2
    } else {
      //数字の場合
      return value
    }
  }

  const processNumToHalfWidth = (value: string, isInteger: boolean = false) => {
    let pattern = /^[-0-9０-９]+(\.[-0-9０-９]+)*$/g
    value = convertToHalfWidth(value)

    if (value?.toString().match(pattern)) {
      // 全角数字 or 半角数字の場合
      let emitVal = 0
      let numVal = convertToHalfWidth(value)
      if (isNaN(numVal)) {
        return ''
      }

      if (isInteger) {
        //整数に変換
        emitVal = Math.floor(numVal)
      } else {
        //小数に変換
        let float = Number.parseFloat(numVal)
        emitVal = formatNumberWithDecimals(float)
      }

      return emitVal
    } else {
      return ''
    }
  }

  return {
    convertToHalfWidth,
    processNumToHalfWidth
  }
}
