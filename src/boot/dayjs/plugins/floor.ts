import type { PluginFunc, UnitType } from 'dayjs'
import type inst from 'dayjs'

declare module 'dayjs' {
  interface Dayjs {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    floor(unit: UnitType, amount: number): inst.Dayjs
  }
}
const floor: PluginFunc = (option, dayjsClass) => {
  dayjsClass.prototype.floor = function (unit, amount) {
    const mod = this.get(unit as UnitType) % amount

    return this.subtract(mod, unit).startOf(unit)
  }
}
export default floor
