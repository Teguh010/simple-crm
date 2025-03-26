export default {
  computeFlowRate(injectDetailForm: any) {
    const dripDetails = injectDetailForm
    const volume = dripDetails.val_used_liquid

    if (dripDetails.calculation_fixed_unit == 2) {
      return
    }


    if (dripDetails.time_process > 0 && volume > 0) {
      let timeAccordingToUnit =
        dripDetails.type_process_time == 1 ? dripDetails.speed_process * 60 : dripDetails.speed_process

      if (dripDetails.type_speed_unit == 1) {
        timeAccordingToUnit /= 60 // Convert hours to minutes
      }

      let flowRate = volume / timeAccordingToUnit // Basic time calculation
      injectDetailForm.speed_process = parseFloat(
        flowRate.toFixed(2)
      )
    } else {
      // Handle cases where volume or flow rate is not valid (0 or negative)
      console.error('Invalid volume or flow rate.')
      return null
    }
  },

  computeTime(injectDetailForm: any) {
    const dripDetails = injectDetailForm
    const volume = dripDetails.val_used_liquid

    if (dripDetails.calculation_fixed_unit == 1) {
      return
    }

    if (
      dripDetails.calculation_fixed_unit == 3 ||
      dripDetails.calculation_fixed_unit == 2
    ) {
      if (dripDetails.speed_process > 0 && volume > 0) {
        let time = volume / dripDetails.speed_process // Basic time calculation


        if (dripDetails.type_process_time == 1 && dripDetails.type_speed_unit != 1) {
          time /= 60 // Convert hours to minutes
        }
        if (dripDetails.type_process_time == 2) {
          time *= 60 // Convert hours to minutes
        }

        injectDetailForm.time_process = parseFloat(time.toFixed(2))
      } else {
        return null
      }
    }
  },
  computeVolume(injectDetailForm: any) {
    const dripDetails = injectDetailForm

    if (dripDetails.calculation_fixed_unit == 3) {
      return
    }

    if (
      dripDetails.calculation_fixed_unit == 1 ||
      dripDetails.calculation_fixed_unit == 2
    ) {
      if (dripDetails.speed_process > 0 && dripDetails.time_process > 0) {
        let timeAccordingToUnit = dripDetails.time_process
        if (dripDetails.type_process_time == 2) timeAccordingToUnit /= 60

        let speedProccess = dripDetails.speed_process
        if (dripDetails.type_speed_unit == 2) speedProccess /= 60

        injectDetailForm.val_used_liquid = timeAccordingToUnit * speedProccess // Basic time calculation
      } else {
        return null
      }
    }
  },
}
