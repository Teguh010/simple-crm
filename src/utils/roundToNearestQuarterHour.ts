import dayjs, { Dayjs } from 'dayjs'

export function roundToNearestQuarterHour(date: string | Dayjs) {
  const dayjsDate = dayjs(date)

  const totalMinutes = dayjsDate.hour() * 60 + dayjsDate.minute()
  const roundedTotalMinutes = Math.round(totalMinutes / 15) * 15

  const newHours = Math.floor(roundedTotalMinutes / 60)
  const newMinutes = roundedTotalMinutes % 60

  const roundedDate = dayjsDate
    .hour(newHours)
    .minute(newMinutes)
    .second(0)
    .millisecond(0)

  return roundedDate
}
