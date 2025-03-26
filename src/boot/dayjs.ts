import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import timezone from 'dayjs/plugin/timezone'
import isYesterday from 'dayjs/plugin/isYesterday'
import utc from 'dayjs/plugin/utc'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import localeData from 'dayjs/plugin/localeData'
import weekday from 'dayjs/plugin/weekday'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/ja'
import floor from '@/boot/dayjs/plugins/floor'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isToday)
dayjs.extend(timezone)
dayjs.extend(isYesterday)
dayjs.extend(utc)
dayjs.extend(localizedFormat)
dayjs.extend(localeData)
dayjs.extend(weekday)
dayjs.extend(customParseFormat)
dayjs.locale('ja')
dayjs.tz.setDefault('Asia/Tokyo')
dayjs.extend(floor)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

export default dayjs
