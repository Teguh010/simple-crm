import usePrescriptionStore from '@/stores/prescription'
import mtUtils from '@/utils/mtUtils'
import { defineAsyncComponent } from 'vue'

// import OptionItemServiceUnitModalUI from '@/pages/request/serviceDetail/OptionItemServiceUnitModalUI.vue'
import { random } from 'lodash'
import { decimalToFraction } from '@/utils/aahUtils'
import useDoseStore from '@/stores/dose-frequencies'

const OptionItemServiceUnitModalUI = defineAsyncComponent(async () => {
  return await import('../serviceDetail/OptionItemServiceUnitModalUI.vue')
})

const ViewItemServiceDetailModal = defineAsyncComponent(async () => {
  return await import(
    '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
  )
})

export default {
  computeFlowRate(prescriptionDetailForm: any) {
    const dripDetails = prescriptionDetailForm.process_drip
    const volume = usePrescriptionStore().getPrescriptionAssortVolume
    if (dripDetails.calculation_fixed_unit == 2) {
      return
    }

    if (dripDetails.time > 0 && volume > 0) {
      let timeAccordingToUnit =
        dripDetails.time_unit == 1 ? dripDetails.time * 60 : dripDetails.time

      if (dripDetails.flow_rate_unit == 1) {
        timeAccordingToUnit /= 60 // Convert hours to minutes
      }

      console.log(
        '#22',
        volume,
        timeAccordingToUnit,
        volume / timeAccordingToUnit
      )
      let flowRate = volume / timeAccordingToUnit // Basic time calculation
      prescriptionDetailForm.process_drip.flow_rate = parseFloat(
        flowRate.toFixed(2)
      )
    } else {
      // Handle cases where volume or flow rate is not valid (0 or negative)
      console.error('Invalid volume or flow rate.')
      return null
    }
  },

  computeTime(prescriptionDetailForm: any) {
    const dripDetails = prescriptionDetailForm.process_drip
    const volume = usePrescriptionStore().getPrescriptionAssortVolume // Assuming this is a function call to get the volume

    if (dripDetails.calculation_fixed_unit == 1) {
      return
    }

    if (
      dripDetails.calculation_fixed_unit == 3 ||
      dripDetails.calculation_fixed_unit == 2
    ) {
      if (dripDetails.flow_rate > 0 && volume > 0) {
        let time = volume / dripDetails.flow_rate // Basic time calculation

        if (dripDetails.time_unit == 1) {
          time /= 60 // Convert hours to minutes
        }
        if (dripDetails.time_unit == 2) {
          time *= 60 // Convert hours to minutes
        }

        prescriptionDetailForm.process_drip.time = parseFloat(time.toFixed(2))
      } else {
        return null
      }
    }
  },
  computeVolume(prescriptionDetailForm: any) {
    const dripDetails = prescriptionDetailForm.process_drip

    if (dripDetails.calculation_fixed_unit == 3) {
      return
    }

    if (
      dripDetails.calculation_fixed_unit == 1 ||
      dripDetails.calculation_fixed_unit == 2
    ) {
      if (dripDetails.flow_rate > 0 && dripDetails.time > 0) {
        let timeAccordingToUnit =
          dripDetails.time_unit == 1 ? dripDetails.time * 60 : dripDetails.time

        if (dripDetails.flow_rate > 0 && dripDetails.time > 0) {
          let timeAccordingToUnit =
            dripDetails.time_unit == 1
              ? dripDetails.time * 60
              : dripDetails.time

          if (dripDetails.flow_rate_unit == 1) {
            timeAccordingToUnit /= 60 // Convert hours to minutes
          }

          let volume = timeAccordingToUnit * dripDetails.flow_rate // Basic time calculation
          usePrescriptionStore().setAssortVolume(volume)
          prescriptionDetailForm.process_drip.volume = volume
        } else {
          return null
        }
      }
    }
  },

  async processDripAssort(
    prescriptionDetailForm: any,
    response: any,
    medicineObj: any,
    receivedISU: any
  ) {
    const flowRate = (prescriptionDetailForm.value.val_weight / 1000 ?? 1) * 2
    if (
      response &&
      response.length &&
      response.length > 0 &&
      medicineObj.value.flg_drip_carrier
    ) {
      const prescription =
        usePrescriptionStore().getPrescriptionListByRequest.find(
          (v: any) =>
            v.id_prescription == prescriptionDetailForm.value.id_prescription
        )
      prescriptionDetailForm.value.prescription_detail_assort_list.length = 0
      receivedISU.value.selected = false
      prescriptionDetailForm.value.drip_calculation_UI = '1'
      if (
        prescription.prescription_detail_list.find(
          (p: any) =>
            p.process_drip &&
            p.process_drip.isDrip &&
            p.id_prescription_detail !=
              prescriptionDetailForm.value.id_prescription_detail &&
            !p.flg_cancel
        )
      ) {
        await mtUtils.autoCloseAlert('Drip Carrier already exists.')
        return true
      }
      await mtUtils.smallPopup(OptionItemServiceUnitModalUI, {
        itemServiceUnitList: response
      })
      if (!receivedISU.value.selected) return

      usePrescriptionStore().setAssortVolume(
        receivedISU.value.val_efficacyingredient
      )
      prescriptionDetailForm.value.process_drip = {
        calculation_fixed_unit: '3',
        time: 1,
        time_unit: '1',
        flow_rate: flowRate,
        flow_rate_unit: '1',
        id_cm_med_route: null,
        flg_drip_carrier: true,
        volume: receivedISU.value.val_efficacyingredient
      }

      prescriptionDetailForm.value.prescription_detail_assort_list.push({
        id_prescription_detail_assort: random(10000, 100000),
        id_prescription: prescriptionDetailForm.value.id_prescription,
        id_prescription_detail:
          prescriptionDetailForm.value.id_prescription_detail,
        id_item_service_unit: receivedISU.value.id_item_service_unit,
        type_medicine_dosage: receivedISU.value.type_medicine_dosage,
        id_cm_unit_medicine: receivedISU.value.id_cm_unit_medicine,
        type_dosage_calculation: medicineObj.value.type_dosage_calculation,
        val_efficacyingredient: receivedISU.value.val_efficacyingredient,
        val_dosage_suggested: 1,
        flg_drip_carrier: true
      })
    }
  },
  async openItemServiceModal(idItemService: number) {
    if(!idItemService) return false
    await mtUtils.popup(ViewItemServiceDetailModal, { id: idItemService })
  }
}


export const fullCircles = (value: any) => {
  return parseInt(Number(value))
}

export const partialCircle = (value: any) => {
  // Fractional part of the value represents the partial circle
  let temValue = null
  temValue = value.toString()
  if (
    temValue &&
    temValue.includes('.') &&
    temValue.split('.').length &&
    temValue.split('.').length >= 2
  ) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`)
    return fractionalPart > 0 ? fractionalPart : 0 // Ensure there is a fractional part
  }
}

export function getFractionForm(totalDosage: any) {
  let full = fullCircles(totalDosage)
  let partial = partialCircle(totalDosage)
  return `${full ? full : ''} ${full && partial ? ' + ' : ''}   ${
    partial ? decimalToFraction(partial) : ''
  }`
}

export const getTypeDosageUI = (prescriptionDetail) => {
  let tempDosageFrequencyDosage: any = useDoseStore().getAllDoses.find(
    (dFObj: any) =>
      dFObj.value == prescriptionDetail.id_dosage_frequency
  )
  if (tempDosageFrequencyDosage) {
    const typeDoseUI = tempDosageFrequencyDosage.type_dose

    if (typeDoseUI == '1') {
      return '日間'
    }
    if (typeDoseUI == '2') {
      return '週間'
    }
    if (typeDoseUI == '3') {
      return 'ヵ月間'
    }
    if (typeDoseUI == '10' || typeDoseUI == '99') {
      return '回'
    }
  }
  return '日間'
}
