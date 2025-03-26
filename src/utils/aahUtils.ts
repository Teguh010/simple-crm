import { date } from 'quasar'
import mtUtils from '@/utils/mtUtils'
import dogThumbnail from '@/assets/img/petdetail/types/dog.png'
import catThumbnail from '@/assets/img/petdetail/types/cat.png'
import rabbitThumbnail from '@/assets/img/petdetail/types/rabbit.png'
import rodentThumbnail from '@/assets/img/petdetail/types/rodent.png'
import birdThumbnail from '@/assets/img/petdetail/types/bird.png'
import otherThumbnail from '@/assets/img/petdetail/types/other.png'
import { numberFormat } from '@/utils/helper'
import useDoseStore from '@/stores/dose-frequencies'
import useCommonStore from '@/stores/common'
import useAuthStore from '@/stores/auth'
import { CustomerType, DateRangeItem, GenericValueLabelType, PetType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import { sortBy } from 'lodash'
import useInsuranceStore from '@/stores/insurances'
import AllCartePerDateListModal from '@/pages/request/AllCartePerDateListModal.vue'
import aahValidations from './aahValidations'

export const concatenate = (...args: any[]) => {
  var s = ''
  if (args && args.length && args.length > 0) {
    args.forEach((str) => {
      if (str) {
        if (s.length > 0) {
          s += ' '
        }
        s += str
      }
    })
  }
  return s
}
export const isEmty = (val: any) => {
  if (val == null || val == undefined || val == '') {
    return ''
  }
}
export const aahTruncate = (text: string, length: number, ellipsis: string = '…') => {
  if (text) {
    let newText = text
      .replace(/<([a-z]+)(?![^>]*\/>)[^>]*>/g, ' ')
      .replace(/<\/([a-z]+)(?![^>]*\/>)[^>]*>/g, '')
    return newText.length > length
      ? newText.slice(0, length - 1) + ellipsis
      : newText
  }
}
export const passwordRule = (password: string, passwordScore: number) => {
  if (password?.length == 0) return true
  if (password) {
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{}':"\\|,.<>/?]/.test(password)
    if (hasSymbol) return 'パスワードは6-20文字以内で、英大文字、英小文字、数字で設定してください。'
    if (passwordScore < 2) return 'パスワードを強化してください。'
    return (
      (password?.length >= 6 && password?.length < 20) ||
      'パスワードは6～20文字以内で、英大文字・英小文字・数字、特別文字を含めてください。'
    )
  }
}
export const checkPassword = (password?: string) => {
  if (!password) return { score: 0, feedback: '' }
  const result = aahValidations.validatePassword(password)
  return result
}
export const formatNumberWithDecimals = (number: number) => {
  // This function removes the decimals if the number is an integer
  if (number % 1 === 0) {
    return number.toFixed(0) // no decimals
  } else {
    return number.toFixed(2).toString() // keep the existing decimals
  }
}

export const search = (
  text: string,
  search: string
) => {
  if (text) {
    let newText = text
    const regex = new RegExp('(' + search + ')', 'gi')
    newText = newText.replace(regex, (match) => {
      return match
        ? `<span style="background-color:#ffff00">${match}</span>`
        : match
    })
    return newText
  }
}
export const truncateAndSearch = (
  text: string,
  length: number,
  search: string
) => {
  if (text) {
    let newText = text
      .replace(/<([a-z]+)(?![^>]*\/>)[^>]*>/g, ' ')
      .replace(/<\/([a-z]+)(?![^>]*\/>)[^>]*>/g, '')
      .replace(/<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g, '')
    if (search) {
      let indexText = newText.indexOf(search)
      if (indexText < length - 1)
        newText = newText.substr(indexText, indexText + length)
      else
        newText =
          '…' + newText.substr(indexText - length / 2, indexText + length / 2)
    }
    newText =
      newText.length > length ? newText.slice(0, length - 1) + '…' : newText
    const regex = new RegExp('(' + search + ')', 'gi')
    newText = newText.replace(regex, (match) => {
      return match
        ? `<span style="background-color:#ffff00">${match}</span>`
        : match
    })
    return newText
  }
}
export const searchWithHighlight = (text: string, search: string) => {
  if (text && search) {
    // Escape any special characters in the search terms
    search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

    // Split search terms by spaces instead of commas
    const terms = search.split(' ').map((term) => term.trim()).filter(Boolean)

    // Create a regex pattern to match any of the search terms
    const regexPattern = `(${terms.join('|')})`
    const regex = new RegExp(regexPattern, 'gi')

    // Replace matching terms with highlighted versions
    const newText = text.replace(regex, (match) => {
      return `<span style="background-color:#ffff00">${match}</span>`
    })

    return newText
  }
  return text
}
export const blank = (data: any, row: any[]) => {
  if (row && row.length && row.length > 0) {
    row.forEach((field) => {
      data[field] = null
    })
  }
  return data
}

// Detect for all messages, If there're any link. Then convert into HTML a tag link.
export const parseForlinks = (message) => {
  if (!message) {
    return ''
  }
  const imgTagPattern = /<img\b[^>]*>/g
  const imgTags = message.match(imgTagPattern) || []
  const newText = message.replace(
    /((?:https?|ftp):\/\/[\w-]+(\.[\w-]+)+(?:\/[\w-./?%&=]*)?)\b/g,
    (match) => {
      // Check if the URL is within any <img> tag
      const isInImgTag = imgTags.some((imgTag) => imgTag.includes(match))
      if (isInImgTag) {
        return match // If the URL is within an <img> tag, keep it as-is
      } else {
        return `<a style="color: #0070ff" href="${match}" target="_blank">${match}</a>`
      }
    }
  )
  return newText
}
export const parseForlinksOld = (message?: any) => {
  const pattern1 =
    /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim
  const text = message.replace(pattern1, '<a href="$1" target="_blank">$1</a>')
  const pattern2 = /(^|[^/])(www\.[\S]+(\b|$))/gim
  message = text.replace(
    pattern2,
    '$1<a href="http://$2" target="_blank">$2</a>'
  )
  return message
}
// Check if there is a single emoji icon send in the message. Then apply different CSS.
export const parseForSingleEmoji = (message: string) => {
  const singleEmoji = message.length > 9
  if (/\p{Emoji}/u.test(message) && message.startsWith('&#') && !singleEmoji) {
    return true
  } else {
    return false
  }
}
export const dateFormat = (reqDate: string | Date, format: string = 'YYYY/MM/DD'): string => {
  return date.formatDate(reqDate, format)
}
export const getDateToday = () => {
  //今日の日付を取得
  const timeStamp = Date.now()
  return date.formatDate(timeStamp, 'YYYY/MM/DD')
}
export const aahUtilsGetPetInsurance = (pet: any, pet_insurances: any[]) => {
  const today = getDateToday()
  const insuranceStore = useInsuranceStore()

  // Handle null/undefined cases first
  if (!pet_insurances || pet_insurances.length === 0) {
    return pet?.flg_insurance_plan ? '保険なし' : 'ペット保険登録なし'
  }

  const validInsurances = pet_insurances.filter(insurance => 
    insurance?.date_insurance_start && insurance?.date_insurance_end
  )

  if (validInsurances.length === 0) {
    return '保険情報が不正です'
  }

  // Get most recent insurance
  const pet_insurance = validInsurances.reduce((latest, current) => {
    return new Date(current.date_insurance_end) > new Date(latest.date_insurance_end) 
      ? current 
      : latest
  })

  if (pet?.flg_insurance_plan) {
    // Add null check for insurance plan
    const insurancePlan = insuranceStore.getInsurances.find(
      (plan: any) => plan.id_insurance_plan === pet_insurance?.id_insurance_plan
    ) || {}


    if (insurancePlan?.flg_unavailable) {
      return '登録保険は提供を終了しています。'
    }

    const insuranceName = insurancePlan?.name_insurance_plan || '不明な保険'

    if (pet_insurance?.date_insurance_end) {
      const endDate = new Date(pet_insurance.date_insurance_end)
      const todayDate = new Date(today)
      const isExpired = endDate < todayDate
      const isLastDay = endDate.toDateString() === todayDate.toDateString()

      if (isExpired) {
        return `<span class="text-negative">【失効】${insuranceName} </span> `
      } else if (isLastDay) {
        return `<span class="text-bold text-negative">期限最終日 ${insuranceName}</span>`
      } else {
        return insuranceName
      }
    }
    return insuranceName
  }
  return 'ペット保険登録なし'
}

export const roundFloat = (num: string | number) => {
  if (!num) return
  // Function is use when you want to round a float number (e.g : Quantity with float)
  var fixedNum = parseFloat(num).toFixed(1)
  // Parse it back to a float and check if it's an integer
  if (parseFloat(fixedNum) === parseInt(fixedNum, 10)) {
    return parseInt(fixedNum, 10) // Return as integer
  } else {
    return fixedNum // Return as string with 2 decimal places
  }
}
export const dateDifferences = (date_1: any, date_2: any) => {
  const date1 = new Date(date_1)
  const date2 = new Date(date_2)
  return date.getDateDiff(date1, date2, 'days')
}
export const truncateDecimal = (value: number) => {
  if (typeof value !== 'number') {
    return 'Input is not a number'
  }

  if (value > 0) {
    return Math.floor(value)
  } else {
    return Math.ceil(value)
  }
}
export const getCharAt = (str, index) => {
  return str?.toString().splice(index, 1);
}

export const setCharAt = (str, index, chr) => {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

export const getCurrentPetAge = (pet: PetType): string => {
  if (!pet || !pet.date_birth) {
    return '未設定' // Return "Not Set" if birthdate is missing
  }

  const today = new Date()
  const birthDate = new Date(pet.date_birth)

  // Check if the birthdate is in the future
  if (birthDate > today) {
    return '未来日' // "Future date"
  }

  // Calculate the difference in years
  let years = today.getFullYear() - birthDate.getFullYear()

  // Check if the birthday has occurred this year
  const petHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate())

  // If the birthday hasn't occurred yet this year, subtract 1 year
  if (!petHadBirthdayThisYear) {
    years--
  }

  // Calculate total months difference
  let totalMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth())

  // Adjust for the day of the month (if the current day is before the birth day)
  if (today.getDate() < birthDate.getDate()) {
    totalMonths--
  }

  // If the pet's age is less than 12 months, return age in months
  if (totalMonths < 12) {
    return `${totalMonths} ヶ月 齢`
  }

  // Calculate remaining months after the last birthday
  let remainingMonths = today.getMonth() - birthDate.getMonth()
  if (today.getDate() < birthDate.getDate()) remainingMonths--
  if (remainingMonths < 0) remainingMonths += 12

  // Handle cases where pet is younger than 3 years
  // if (years < 3) {
  //   if (pet.flg_unknown_dob) {
  //     return `${years} 歳 ${remainingMonths} ヶ月 推定`;
  //   } else {
  //     return `${years} 歳 ${remainingMonths} ヶ月`;
  //   }
  // }

  // Handle cases where pet is 3 years or older
  if (pet.flg_unknown_dob) {
    return remainingMonths
      ? `推定: ${years}~${years + 1} 歳 ${remainingMonths} ヶ月`
      : `推定: ${years}~${years + 1} 歳`
  } else {
    return remainingMonths
      ? `${years} 歳 ${remainingMonths} ヶ月`
      : `${years} 歳`
  }
}

export const getCurrentPetAgeInMonth = (pet: PetType): number => {
  if (!pet || !pet.date_birth) {
    return 0 // Return 0 if birthdate is missing
  }

  const today = new Date()
  const birthDate = new Date(pet.date_birth)

  // Check if the birthdate is in the future
  if (birthDate > today) {
    return 9999
  }

  // Calculate total months difference
  let totalMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth())

  // Return total months difference
  return totalMonths
}

// ================================================================
// OLD LOGIC
// ================================================================
// export const getCurrentPetAge = (pet: any) => {
//   const today = getDateToday()
//   if (pet && pet.date_birth) {
//     if (pet.date_birth > today) {
//       return '未来日'
//     } else {
//       const monthAge = date.getDateDiff(today, pet.date_birth, 'months')
//       if (monthAge < 12) {
//         return truncateDecimal(monthAge) + ' ヶ月 齢'
//       } else {
//         const petYear = Math.floor(monthAge / 12)
//         const petRemainderMonth = truncateDecimal(monthAge % 12)
//         if (petYear < 3) {
//           if (pet.flg_unknown_dob)
//             return `推定: ${petYear} 歳 ${petRemainderMonth} ヶ月`
//           else return `${petYear} 歳 ${petRemainderMonth} ヶ月`
//         } else {
//           if (pet.flg_unknown_dob)
//             return `推定: ${petYear}~${
//               petYear + 1
//             } 歳 ${petRemainderMonth} ヶ月`
//           else return `${petYear} 歳 ${petRemainderMonth} ヶ月`
//         }
//       }
//     }
//   } else {
//     return '未設定'
//   }
// }

export const getEmployeeDisplayName = (employee: any) => {
  if (employee) {
    return employee.name_display
  }
}
export const getCustomerName = (customer: any) => {
  if (customer) {
    return (
      customer.name_customer_display ??
      (customer.name_family || customer.name_corporate)
    )
  }
}
export const getCustomerNameWithCode = (customer: any) => {
  if (customer) {
    return customer.code_customer + ' ' + customer.name_customer_display
  }
}
export const getCustomerNameHonorific = (customer: any) => {
  if (customer) {
    if (parseInt(customer.type_customer) === 1)
      return (customer.name_family ?? '') + ' ' + customer.name_first + ' 様'
    if (parseInt(customer.type_customer) === 2)
      return (customer.name_corporate ?? '') + ' 御中'
    return (customer.name_family ?? '') + ' ' + customer.name_first + ' 様'
  }
}
export const getCustomerKanaName = (customer: any) => {
  if (customer) {
    return customer.name_kana_family + ' ' + customer.name_kana_first
  }
}
export const getCustomerKanaNameHonorific = (customer: any) => {
  if (customer) {
    if (parseInt(customer.type_customer) === 1)
      return customer.name_kana_family + ' ' + customer.name_kana_first + ' 様'
    if (parseInt(customer.type_customer) === 2)
      return customer.name_kana_corporate + ' 御中'
    return customer.name_kana_family + ' ' + customer.name_kana_first + ' 様'
  }
}
export const getCustomerNameById = (customer: any, mode: number) => {
  if (customer && mode) {
    if (mode === 1) return customer.name_customer_display
    if (mode === 2) return customer.name_family + ' ' + customer.name_first
    if (mode === 3)
      return (
        customer.code_customer +
        ' ' +
        customer.name_family +
        ' ' +
        [isEmty(customer.name_first) !== '' ? customer.name_first : '']
      )
    if (mode === 4)
      return customer.name_kana_family + ' ' + customer.name_kana_first
    if (mode === 5) return customer.name_corporate
  }
}
export const getFullPetCustomerName = (pet: any, customer: any) => {
  if (pet) {
    if (customer && parseInt(customer.type_customer) === 1)
      return customer.name_family + ' ' + pet.name_pet

    return pet.name_pet
  }
}
export const getFullPetNameWithoutHonorific = (
  pet: any,
  customer: any | null = null
) => {
  if (pet?.customer_name_family) {
    return pet?.customer_name_family + ' ' + pet?.name_pet
  } else {
    if (pet && customer) {
      return customer?.name_family + ' ' + pet?.name_pet
    }
  }
}
export const getFullPetName = (pet: any, customer: any) => {
  if (pet && customer) {
    if (parseInt(pet.type_title_pet_customer_updated) === 1)
      return customer.name_family + ' ' + pet.name_pet + ' ちゃん'
    if (parseInt(pet.type_title_pet_customer_updated) === 2)
      return customer.name_family + ' ' + pet.name_pet + ' くん'
    if (parseInt(pet.type_title_pet_customer_updated) === 3)
      return customer.name_family + ' ' + pet.name_pet + ' さん'
    if (parseInt(pet.type_title_pet_customer_updated) === 4)
      return customer.name_family + ' ' + pet.name_pet
    return pet.name_pet
  }
}
export const getPetFirstName = (pet: any) => {
  if (pet) {
    if (parseInt(pet.type_title_pet_customer_updated) === 1)
      return pet.name_pet + ' ちゃん'
    if (parseInt(pet.type_title_pet_customer_updated) === 2)
      return pet.name_pet + ' くん'
    if (parseInt(pet.type_title_pet_customer_updated) === 3)
      return pet.name_pet + ' さん'
    return pet.name_pet + ' ちゃん'  // default honorific
  }
}
export const getPetKanaName = (pet: PetType, customer: CustomerType) => {
  if (customer && pet) {
    return customer.name_kana_family + ' ' + pet.name_kana_pet
  }
}
export const getPetFirstNameOnly = (pet: any) => {
  if (pet) {
    return pet.name_pet
  }
}

export const getPetImageUrl = (pet: any) => {
  if (!pet.id_pet) {
    return otherThumbnail
  }
  if (pet) {
    if (pet.image_path2) {
      return pet.image_path2
    }
    if (pet.image_path1) {
      return pet.image_path1
    }
    if (pet.thumbnail_path1) {
      return pet.thumbnail_path1
    }
    if (pet.thumbnail_path2) {
      return pet.thumbnail_path2
    }

    const commonStore = useCommonStore()
    const common = commonStore.getCommonTypeAnimalOptionList.find((v) => {
      return v.id_common === pet.id_cm_animal
    })

    if (common) {
      if (parseInt(common.code_func1) == 1) return dogThumbnail
      else if (parseInt(common.code_func1) == 2) return catThumbnail
      else if (parseInt(common.code_func1) == 3) return rabbitThumbnail
      else if (parseInt(common.code_func1) == 4) return rodentThumbnail
      else if (parseInt(common.code_func1) == 5) return birdThumbnail
      return otherThumbnail
    }

    return otherThumbnail
  }
}

export const getImageUrl = (type: number) => {
  if (type == 1) {
    return dogThumbnail
  } else if (type == 2) {
    return catThumbnail
  } else if (type == 3) {
    return rabbitThumbnail
  } else if (type == 4) {
    return rodentThumbnail
  } else if (type == 5) {
    return birdThumbnail
  } else {
    return otherThumbnail
  }
}
export const handleImageError = (event: any, pet: number) => {
  if (pet) {
    const commonStore = useCommonStore()
    const common = commonStore.getCommonTypeAnimalOptionList.find(
      (v) => v.id_common == pet.id_cm_animal
    )
    if (common) {
      event.target.src = getImageUrl(common.code_func1)
    }
  } else {
    event.target.src = otherThumbnail
  }
}
export const aahUtilsGetEmployeeName = (
  allEmployees: GenericValueLabelType[],
  employeeId: string
): string => {
  if (typeof employeeId === 'string') {
    return (
      allEmployees.find((v) => v.value.toString() === employeeId)
        ?.nameDisplay ?? ''
    )
  } else {
    return allEmployees.find((v) => v.value === employeeId)?.nameDisplay ?? ''
  }
}
export const aahUtilsGetUpdatedEmployeeName = (
  allEmployees: GenericValueLabelType[],
  employeeId: string
): string => {
  let emplo
  let name_arr = []
  if (typeof employeeId === 'string') {
    emplo = allEmployees.find((v) => v.id_employee.toString() === employeeId)
  } else {
    emplo = allEmployees.find((v) => v.id_employee === employeeId)
  }
  if (Boolean(emplo?.name_family)) {
    name_arr.push(emplo?.name_family)
  }
  if (Boolean(emplo?.name_first)) {
    name_arr.push(emplo?.name_first)
  }
  return name_arr.join(' ')
}
export const createEmptyArrays = (data) => {
  const newData = {}
  Object.keys(data).forEach((key) => {
    newData[key] = []
  })
  return newData
}
export const copyText = async (text: string, defaultSuccessMsg = 'コピーしました。') => {
  try {
    await navigator.clipboard.writeText(text)
    mtUtils.autoCloseAlert(defaultSuccessMsg)
  } catch ($e) {
    mtUtils.autoCloseAlert('コピーに失敗しました。')
  }
}
export const getDaysBefore = (days: Number, year: any = null) => {
  //今日の日付を取得
  const timeStamp = Date.now()
  const newDate = date.subtractFromDate(timeStamp, { day: days, years: year })
  return date.formatDate(newDate, 'YYYY/MM/DD')
}
export const getDaysAfter = (days: Number) => {
  // Week Later
  const timeStamp = Date.now()
  const newDate = date.addToDate(timeStamp, { day: days })
  return date.formatDate(newDate, 'YYYY/MM/DD')
}
export const getDaysAfterDate = (reqdate, days: Number) => {
  reqdate = new Date(reqdate)
  const newDate = date.addToDate(reqdate, { day: days })
  return date.formatDate(newDate, 'YYYY/MM/DD')
}
export const getHoursAfter = (hour: Number) => {
  const timeStamp = Date.now()
  const newDate = date.addToDate(timeStamp, { hours: hour })
  return date.formatDate(newDate, 'YYYY/MM/DD HH:mm:ss')
}
export const getHoursAfterByDate = (reqdate, hour: Number) => {
  reqdate = new Date(reqdate)
  const newDate = date.addToDate(reqdate, { hours: hour })
  return date.formatDate(newDate, 'YYYY/MM/DD HH:mm:ss')
}
export const getDateTimeNow = () => {
  //今日の日付を取得
  const timeStamp = Date.now()
  return date.formatDate(timeStamp, 'YYYY/MM/DD HH:mm:ss')
}

// Function to generate the time slots
export const generateTimeSlots = (
  startHour = 7,
  endHour = 30,
  interval = 15
) => {
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const h = (hour % 24).toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      const timeString = `${h}:${m}`

      slots.push({ label: timeString, value: timeString, enLabel: timeString })
    }
  }
  return slots
}

export const getHourListADay = (start_hour = 8) => {
  let arr = []

  for (let i = start_hour; i < 24; i++) arr.push(i)
  for (let i = 0; i < start_hour; i++) arr.push(i)

  return arr
}
export const inputFiscalYear = (yyyymmdd) => {
  //YYYY/MM/DD→YYYY/MMへ変換
  if (yyyymmdd == null) return

  let yyyymm = yyyymmdd.substring(0, 10).replaceAll('-', '/')
  return yyyymm.slice(0, 7)
}
export const formatDateTime = (datetime) => {
  //yyyy-mm-dd 00:00:00 → yyyy/mm/dd へ変換
  if (datetime == null) return

  return datetime.substr(0, 10).replaceAll('-', '/')
}

export const formatDateWithTime = (datetime, format = 'YYYY/MM/DD HH:mm'): string => {
  //yyyy-mm-dd 00:00:00 → yyyy/mm/dd へ変換
  if (datetime == null) return ''
  const timeStamp = new Date(datetime)
  return date.formatDate(timeStamp, format)
}
export const formatDate = (dt): string => {
  if (!dt) return ''
  //yyyy-mm-dd
  dt = new Date(dt)
  var y = dt.getFullYear()
  var m = ('00' + (dt.getMonth() + 1)).slice(-2)
  var d = ('00' + dt.getDate()).slice(-2)
  return y + '/' + m + '/' + d
}
export const formatTime = (dt, show_s = true) => {
  if (!dt) return
  //00:00:00
  dt = new Date(dt)
  var h = ('00' + dt.getHours()).slice(-2)
  var min = ('00' + dt.getMinutes()).slice(-2)
  var s = ('00' + dt.getSeconds()).slice(-2)
  return h + ':' + min + (show_s ? ':' + s : '')
}
export const formatPhoneNumber = (number: number | string) => {
  var x = number
    .toString()
    .replace(/\D/g, '')
    .match(/(\d{0,3})(\d{0,4})(\d{0,4})/)
  number = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '')
  return number
}
export const processFormatHourMinutes = (dt) => {
  dt = new Date(dt)
  var h = ('00' + dt.getHours()).slice(-2)
  var min = dt.getMinutes()
  var s = ('00' + dt.getSeconds()).slice(-2)

  // Round minutes to the nearest quarter-hour (00, 15, 30, 45)
  min = Math.round(min / 15) * 15
  // If minutes become 60 after rounding, set minutes to 0 and increment hour by 1
  if (min === 60) {
    min = 0
    h = ('00' + ((parseInt(h) + 1) % 24)).slice(-2) // Increment hour, mod 24 to reset to 0 after 23
  }

  min = ('00' + min).slice(-2) // Ensure minutes have two digits

  // Return the formatted time
  return h + ':' + min
}
export const formatHoursMinutes = (dt, use_ampm = false) => {
  //00:00:00
  dt = new Date(dt)
  var h = ('00' + dt.getHours()).slice(-2)
  var min = ('00' + dt.getMinutes()).slice(-2)
  if (use_ampm) {
    const ampm = dt.getHours() >= 12 ? 'PM' : 'AM'
    return h + ':' + min + ' ' + ampm
  }
  return h + ':' + min
}
export const formatHours = (dt) => {
  //00:00:00
  dt = new Date(dt)
  var h = dt.getHours()
  return h
}
export const changeDate = (dateReq, status = 'next') => {
  dateReq = new Date(dateReq)
  if (status === 'next')
    return formatDate(dateReq.setDate(dateReq.getDate() + 1))
  if (status === 'prev')
    return formatDate(dateReq.setDate(dateReq.getDate() - 1))
}
export const changeMonth = (monthReq, status = 'next') => {
  monthReq = new Date(monthReq)
  if (status === 'next')
    return date.formatDate(date.addToDate(monthReq, { months: +1 }), 'YYYY/MM')
  if (status === 'prev')
    return date.formatDate(date.addToDate(monthReq, { months: -1 }), 'YYYY/MM')
}

export const getDateByFormat = (newDate, format = 'YYYY/MM/DD') => {
  newDate = new Date(newDate)
  return date.formatDate(newDate, format)
}
export const getDaysInMonth = (newDate) => {
  newDate = new Date(newDate)
  return date.daysInMonth(newDate)
}

export const getMonthStartAndEnd = (monthStr) => {
  const monthDate = date.extractDate(monthStr, 'YYYY/MM')
  const firstDay = date.startOfDate(monthDate, 'month')
  const lastDay = date.endOfDate(monthDate, 'month')
  return {
    date_start: date.formatDate(firstDay, 'YYYY-MM-DD'),
    date_end: date.formatDate(lastDay, 'YYYY-MM-DD')
  }
}
export const roundMinutesToNearest15 = (datetime) => {
  const date = new Date(datetime);
  const minutes = date.getMinutes();

  // Rounding the minutes to the nearest 15
  const roundedMinutes = Math.round(minutes / 15) * 15;

  // Setting the rounded minutes back to the date object
  date.setMinutes(roundedMinutes);

  // Formatting the result back to 'HH:mm' format
  const hours = date.getHours().toString().padStart(2, '0');
  const minutesFormatted = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutesFormatted}`;
};


export const replaceAll = (str, find, replace) => {
  return str.replace(new RegExp(find, 'g'), replace)
}
export const convertToISO = (dateString: any) => {
  // Convert the custom format to a standard format "YYYY-MM-DDThh:mm:ssZ"
  return dateString.replace(/[/]/g, '-')
}
export const isDateTimeField = (key: any) => {
  return !!(key.includes('date') || key.includes('birthday'))
}
export const convertAllDateTimeFields = (obj: any) => {
  // Base cases
  if (obj === null || obj === undefined) return

  // Check if it's an array
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'object') {
        let newItem = { ...item }
        convertAllDateTimeFields(newItem)
        obj[index] = newItem // Replace the old object with the new one
      }
    })
  }

  // Check if it's an object
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (isDateTimeField(key) && typeof obj[key] === 'string') {
          obj[key] = convertToISO(obj[key])
        }
        // Recursive call for every key, regardless of whether it's a date-time field or not
        if (typeof obj[key] === 'object' || Array.isArray(obj[key])) {
          convertAllDateTimeFields(obj[key])
        }
      }
    }
  }
}
export const isExactYYYYMMDD = (yyyymmdd: any) => {
  let dateParts = yyyymmdd.split('/')

  let year = parseInt(dateParts[0])
  let month = parseInt(dateParts[1])
  let day = parseInt(dateParts[2])

  //月についてはdateオブジェクトの起算が0から始まるため-1を行う ex 0 → 1月
  let date = new Date(year, month - 1, day)

  if (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return true
  } else {
    return false
  }
}
export const timeDifferences = (date_1: any, date_2: any, unit = 'days') => {
  const diff = date.getDateDiff(date_1, date_2, unit)
  return diff
}
export const convertWeightInG = (
  val_weight: string,
  type_body_weight: number
) => {
  if (type_body_weight == 1) {
    return parseInt(val_weight) / 1000
  }
  if (type_body_weight == 2) {
    return roundZeroAfterPoint(val_weight)
  }
  return val_weight
}
export const convertWeightToG = (
  val_weight: string,
  type_body_weight: number
) => {
  if (type_body_weight == 1) {
    return parseInt(val_weight)
  }
  if (type_body_weight == 2) {
    return parseInt(val_weight) * 1000
  }
  return val_weight
}
export const roundZeroAfterPoint = (inputValue, afterDecimal = 4) => {
  // Check if inputValue is not a number or is empty
  if (isNaN(inputValue) || inputValue === '') {
    return null
  }

  // Convert inputValue to a number to handle any formatting issues
  inputValue = Number(inputValue)

  // Split the number into integer and decimal parts
  let [beforeDecimalPoint, afterDecimalPoint] = inputValue.toString().split('.')

  // Format the beforeDecimalPoint part
  beforeDecimalPoint = numberFormat(beforeDecimalPoint).trim()

  if (afterDecimalPoint) {
    if (afterDecimalPoint.length >= 2) {
      afterDecimalPoint = afterDecimalPoint.substring(0, afterDecimal)
    }
    // Remove trailing zeros from the decimal part
    afterDecimalPoint = afterDecimalPoint.replace(/0+$/, '')

    // Append the decimal part if it is not empty
    if (afterDecimalPoint) {
      return `${beforeDecimalPoint}.${afterDecimalPoint}`
    }
  }

  return beforeDecimalPoint
}
export const calculateDays = (
  date_start = null,
  date_end = null,
  mode: any = null
) => {
  if (!date_start || !date_end) return
  if (mode && mode == '1') {
    return timeDifferences(date_end, date_start) + 1
  }
  if (mode && mode == '2') {
    const weeks = timeDifferences(date_end, date_start) / 7
    return weeks < 1 ? 1 : Math.ceil(weeks)
  }
  if (mode && mode == '3') {
    const months = timeDifferences(date_end, date_start, 'months')
    return months < 1 ? 1 : months
  }
  return timeDifferences(date_end, date_start) + 1
}

export const calculateDate = (
  date_start = null,
  amount = 0,
  mode: any = null,
  is_normal_amount = false
) => {
  if (!date_start) return
  if (mode && mode == '1') {
    if (!is_normal_amount) amount = amount - 1
    return date.formatDate(
      date.addToDate(new Date(date_start), { day: amount }),
      'YYYY/MM/DD'
    )
  }
  if (mode && mode == '2') {
    const weeks = 7 * amount
    return date.formatDate(
      date.addToDate(new Date(date_start), { day: weeks }),
      'YYYY/MM/DD'
    )
  }
  if (mode && mode == '3') {
    return date.formatDate(
      date.addToDate(new Date(date_start), { month: amount }),
      'YYYY/MM/DD'
    )
  }
  if (mode && mode == '4') {
    return date.formatDate(
      date.addToDate(new Date(date_start), { year: amount }),
      'YYYY/MM/DD'
    )
  }
  return date.formatDate(
    date.addToDate(new Date(date_start), { day: amount - 1 }),
    'YYYY/MM/DD'
  )
}

export const typeDoseUI = (id_dose_frequency: any) => {
  const doseStore = useDoseStore()
  const tempDosage: any = doseStore.getAllDoses.find(
    (dose: any) => dose.value == id_dose_frequency
  )
  if (tempDosage) {
    if (tempDosage.type_dose == '1') {
      return '回/日'
    }
    if (tempDosage.type_dose == '2') {
      return '回/週'
    }
    if (tempDosage.type_dose == '3') {
      return '回/月'
    }
    if (tempDosage.type_dose == '10' || tempDosage.type_dose == '99') {
      return '回分'
    }
  }
  return '回/日'
}

export const typeDoseQuantityUI = (id_dose_frequency) => {
  const doseStore = useDoseStore()
  let typeDoseUI = 1,
    quantity_dose = 1
  const tempDosage: any = doseStore.getAllDoses.find(
    (dose: any) => dose.value == id_dose_frequency
  )
  if (tempDosage) {
    if (tempDosage.quantity_dose) quantity_dose = tempDosage.quantity_dose
    if (tempDosage.type_dose) typeDoseUI = tempDosage.type_dose
    return { typeDoseUI: typeDoseUI, quantity_dose: quantity_dose }
  }
  return { typeDoseUI: 1, quantity_dose: 1 }
}
export const comTypeDose = (typeDoseUI) => {
  if (typeDoseUI == '1') {
    return '日'
  }
  if (typeDoseUI == '2') {
    return '週'
  }
  if (typeDoseUI == '3') {
    return 'ヵ月'
  }
  if (typeDoseUI == '10' || typeDoseUI == '99') {
    return '回分'
  }
  return '日'
}

export const computedQuantityUI = (id_dosage_frequency: any) => {
  const typeQuantityUi = typeDoseQuantityUI(id_dosage_frequency)
  if (typeQuantityUi) {
    if (
      typeQuantityUi.typeDoseUI == '10' ||
      typeQuantityUi.typeDoseUI == '99'
    ) {
      return ''
    }
  }
  return (
    ' x 頻度 ' +
    typeDoseQuantityUI(id_dosage_frequency)?.quantity_dose +
    ' ' +
    typeDoseUI(id_dosage_frequency)
  )
}

export const decimalToFraction = (
  decimal: number,
  denominators: any = [
    { denominator: 2 },
    { denominator: 3 },
    { denominator: 4 },
    { denominator: 6 },
    { denominator: 7 },
    { denominator: 8 },
    { denominator: 11 },
    { denominator: 12 },
    { denominator: 13 },
    { denominator: 15 },
    { denominator: 16 },
    { denominator: 32 },
    { denominator: 64 }
  ]
): string => {
  let closestFraction = '0/1'
  let minDifference = Math.abs(decimal)

  denominators.forEach((denominatorObj) => {
    const denominator = denominatorObj.denominator

    let numerator = Math.round(decimal * denominator)
    let difference = Math.abs(decimal - numerator / denominator)

    if (difference < minDifference) {
      minDifference = difference
      closestFraction = `${numerator}/${denominator}`
    }
  })

  return closestFraction
}

export const customRound = (number) => {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.90) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

export const sortPrescriptionDetailOrder = (
  prescriptionDetailList: any,
  typeKey: string = 'order'
) => {
  let detailList = []
  var propsCopy = [...prescriptionDetailList]

  if (propsCopy && propsCopy.length && propsCopy.length > 0) {
    detailList = propsCopy.sort((rowA, rowB) => {
      let pdA = parseInt(rowA?.['row'])
      let pdB = parseInt(rowB?.['row'])
      return pdA > pdB ? 1 : pdA < pdB ? -1 : 0
    })
  }

  return detailList
}
export const filterRows = (rows: any) => {
  let filteredRows: any = rows.filter((v) => {
    if (Object.keys(v) && Object.keys(v).length && Object.keys(v).length > 0) {
      return Object.values(v).some((v) => !!v)
    } else {
      return false
    }
  })
  return filteredRows
}
export const getImage = async (url: String) => {
  try {
    if (!url) return ''
    const response = await fetch(url)
    let blob: any = await response.blob()
    return URL.createObjectURL(blob)
  } catch (err) {
    return null
  }
}
export const imageBlobUrlToBase64 = async (blobUrl: any) => {
  const response = await fetch(blobUrl)
  let blob: any = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
export const decoder = (str: any) => {
  str = parseForlinksOld(str)
  if (str.match(/(?:\r\n|\r|\n)/g)) {
    const newLineStr = str.replace(/(?:\r\n|\r|\n)/g, '<br>')
    return `${newLineStr}`
  } else {
    return `${str}`
  }
}
export const memoDecoder = (str: any) => {
  str = parseForlinksOld(str)
  if (str.match(/###/g)) {
    str = str.replace(/###/g, `<span class="title3">`)
  }
  if (str.match(/##/g)) {
    str = str.replace(/##/g, `<span class="title2">`)
  }
  if (str.match(/#/g)) {
    str = str.replace(/#/g, `<span class="title1">`)
  }
  if (str.match(/(?:\r\n|\r|\n)/g)) {
    const newLineStr = str.replace(/(?:\r\n|\r|\n)/g, '<br>')
    return `${newLineStr}`
  } else {
    return `${str}`
  }
}
export const isBitSet = (number: any, bitValue: any) => {
  return (number & bitValue) === bitValue
}
export const getCustomerLabelColor = (type_customer: number): string => {
  const cliCommonStore = useCliCommonStore()
  if (type_customer) {
    const filteredColorsByValidDate = cliCommonStore.getCliCommonCustomerColorList.filter(
      (item) => !isDateOutOfToday(item.date_start, item.date_end)
    )
    const sortedColorsById = sortBy(filteredColorsByValidDate, ['id_cli_common'])
    return sortedColorsById.find(
      (v: any, index) => v.code_func1 == type_customer
    )?.text1
  }
  return ''
}
export const changeToggleDropdownNames = () => {
  // Updated menu content
  let menus = document.querySelectorAll(
    '[role="menu"] .q-item .q-item__section .text-no-wrap'
  )
  let menuArray = Array.from(menus)
  if (menuArray && menuArray.length && menuArray.length > 0) {
    menuArray.forEach((menu: any) => {
      if (menu.hasChildNodes()) {
        const tagName = menu.firstChild.tagName
        switch (tagName) {
          case 'H2':
            menu.firstChild.textContent = '見出し 1'
            break
          case 'H3':
            menu.firstChild.textContent = '見出し 2'
            break
          case 'H4':
            menu.firstChild.textContent = '見出し 3'
            break
          case 'H5':
            menu.firstChild.textContent = '見出し 4'
            break
          default:
            menu.firstChild.textContent = '通常' // for paragraph
        }
      }
    })
  }
  updateBtnLabel('')
}

export const updateBtnLabel = (val: any) => {
  let toolbarGroup = document.querySelectorAll('.q-editor__toolbar-group')
  let lastGroup = Array.from(toolbarGroup)[toolbarGroup.length - 1]
  if (lastGroup && lastGroup.hasChildNodes()) {
    let targetedSpanElement = lastGroup.querySelector('span.block')
    if (targetedSpanElement) {
      if (val.includes('h2')) {
        targetedSpanElement.textContent = '見出し 1'
      } else if (val.includes('<h3>')) {
        targetedSpanElement.textContent = '見出し 2'
      } else if (val.includes('<h4>')) {
        targetedSpanElement.textContent = '見出し 3'
      } else if (val.includes('<h5>')) {
        targetedSpanElement.textContent = '見出し 4'
      } else {
        targetedSpanElement.textContent = '通常'
      }
    }
  }
}

export const extractContent = (s: any, space: any) => {
  var span = document.createElement('span')
  span.innerHTML = s
  if (space) {
    var children = span.querySelectorAll('*')
    for (var i = 0; i < children.length; i++) {
      if (children[i].textContent) children[i].textContent += ' '
      else children[i].innerText += ' '
    }
  }
  return [span.textContent || span.innerText].toString().replace(/ +/g, ' ')
}
export const checkDateRange = (dateRange: any = []) => {
  if (dateRange && dateRange.length && dateRange.length > 0) {
    for (let i = 0; i < dateRange.length; i++) {
      let range: any = dateRange[i]
      const date1 = new Date(range.start_date)
      const date2 = new Date(range.end_date)
      const diff = date.getDateDiff(date1, date2)
      if (diff > 0) {
        mtUtils.autoCloseAlert('日付の前後関係を確認してください。')
        return false
      }
    }
    return true
  }
}
export const getLoggedinUser = () => {
  let authUser = useAuthStore().getAuthUser
  return authUser
}

export const convertLinkInMemo = (input: string): string => {
  const urlPattern = /(https?:\/\/[^\s]+)/g

  // Replace URL with anchor tag
  const withAnchorTag = input.replace(
    urlPattern,
    (url) => `<a href="${url}" target="_blank">${url}</a>`
  )

  // Wrap the rest of the text in span tags
  const finalResult = withAnchorTag.replace(
    /^(https?:\/\/[^\s]+)(.*)/,
    '<a href="$1" target="_blank">$1</a><span>$2</span>'
  )

  return finalResult
}

export const isSysAdmin = (SYS_ADMIN_ID: number) => {
  const type_occupation = localStorage.getItem('userTypeOccupation')
  if (type_occupation) return type_occupation == SYS_ADMIN_ID

  return false
}

export const applyModalBottomPadding = () => {
  let contentArea: HTMLElement | null = document.getElementById('content-area'),
    actionBtns: Element | null = document.querySelector('.bottom-sticky')
  if (window.innerHeight < contentArea.scrollHeight) {
    contentArea.style.paddingBottom = `${actionBtns.clientHeight + 30}px`
  }
}

export const getClinicCompleteAddress = (clinic_object: any) => {
  let address = ''
  if (Boolean(clinic_object)) {
    address = `${clinic_object.address_prefecture} ${clinic_object.address_city} ${clinic_object.address_other}`
  }
  return address
}

export const isDateOutOfToday = (dateStart: string, dateEnd: string) => {
  const today = date.formatDate(new Date(), 'YYYY-MM-DD')
  const startDate = dateStart ? date.formatDate(dateStart, 'YYYY-MM-DD') : null
  const endDate = dateEnd ? date.formatDate(dateEnd, 'YYYY-MM-DD') : null

  if (startDate && startDate > today) return true
  if (endDate && endDate < today) return true
  return false
}

export const getJpDate = (dateStr: String) => {
  if (!Boolean(dateStr)) {
    return ''
  } else {
    const daysOfWeek = [
      '日曜日',
      '月曜日',
      '火曜日',
      '水曜日',
      '木曜日',
      '金曜日',
      '土曜日'
    ]
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // Remove leading zero by using the number directly
    const day = date.getDate()
    const dayOfWeek = daysOfWeek[date.getDay()] // Get the Japanese day name
    return `${year}年 ${month}月 ${day}日 (${dayOfWeek})`
  }
}

export const getSimpleJpDate = (dateStr: String) => {
  if (!Boolean(dateStr)) {
    return ''
  } else {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // Remove leading zero by using the number directly
    const day = date.getDate()
    return `${year}年 ${month}月 ${day}日`
  }
}

export const highlightText = ({ searchQuery = '', content = '' }): string => {
  const query = searchQuery
  const originalContent = content
  let highlightedContent = ''

  // Reset highlights first by removing any existing span tags
  let sanitizedContent = originalContent.replace(
    /<span class="bg-\w+">([^<]+)<\/span>/gi,
    '$1'
  )

  // If there's no query, return the original content
  if (!query) {
    highlightedContent = sanitizedContent
    return ''
  }

  // Regex to match the query (case insensitive)
  const regex = new RegExp(`(${query})`, 'gi')

  // Replace matching text with highlighted span
  const newContent = sanitizedContent.replace(regex, (match) => {
    // Apply specific colors based on matched
    return `<span class="bg-yellow">${match}</span>`
  })

  highlightedContent = newContent

  return highlightedContent
}

export const isNumeric = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value))
}


export const groupByDateRange = <T extends DateRangeItem>(
  items: T[],
  startDateField: keyof T,
  endDateField: keyof T
): { [key: string]: T[] } => {
  if (!items?.length) return {}
  
  return Object.fromEntries(
    Object.entries(
      items.reduce((acc, item) => {
        const startDate = new Date(item[startDateField] as string | Date)
        const endDate = item[endDateField] 
          ? new Date(item[endDateField] as string | Date)
          : startDate
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          const dateKey = dateFormat(currentDate)
          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(item)
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        return acc
      }, {} as { [key: string]: T[] })
    ).sort(([dateA], [dateB]) => 
      new Date(dateB).getTime() - new Date(dateA).getTime()
    )
  )
}
export const stripHtmlTags = (input: any, maxLength = 40) => {
  if (!input) return "";
  const doc = new DOMParser().parseFromString(input, 'text/html')
  const text = doc.body.textContent || ""
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

export const openViewAllCartePerDateList = async (customerSelected: CustomerType, petSelected: PetType) => {
  await mtUtils.popup(AllCartePerDateListModal, {
    customerSelected,
    petSelected
  })
}
