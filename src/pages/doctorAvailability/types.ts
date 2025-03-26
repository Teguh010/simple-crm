import type { ValueOf } from '@/types/types'

export enum CalendarTypeKey {
  MONTHLY = 'monthly',
  PER3DAYS = 'per3days',
  PER1DAY = 'per1day',
  DOCTOR = 'doctor'
}

export const CalendarTypes = {
  [CalendarTypeKey.MONTHLY]: '月間',
  [CalendarTypeKey.PER3DAYS]: '3日間',
  [CalendarTypeKey.PER1DAY]: '1日',
  [CalendarTypeKey.DOCTOR]: '不在'
} as const

export type CalendarType = ValueOf<typeof CalendarTypes>

export const CalendarBadgeTypes = {
  検: '検',
  診: '診',
  入: '入',
  他: '他',
  注射: '注射',
  処方箋: '処方箋',
  院: '院'
}

export type CalendarBadgeType = ValueOf<typeof CalendarBadgeTypes>

export const ServiceDetailBackgroundColors = {
  [CalendarBadgeTypes.検]: '#D3E9FF',
  [CalendarBadgeTypes.診]: '#FFEEF9',
  [CalendarBadgeTypes.入]: '#DBF1D5',
  [CalendarBadgeTypes.他]: '#ECECEC',
  [CalendarBadgeTypes.注射]: '#f7e3ff',
  [CalendarBadgeTypes.処方箋]: '#d6ddf3',
  [CalendarBadgeTypes.院]: '#f5f5ec'
}
