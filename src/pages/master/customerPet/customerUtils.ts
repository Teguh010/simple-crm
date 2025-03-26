import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import AdditionCustomerCode from '@/pages/master/customerPet/AdditionCustomerCode.vue'


async function checkCustomerCode(formData: any, code_available: any) {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `mst/search_available_code`,
    {
      code_customer: formData.code_customer
    }
  )

  if (response && response.length > 0) {
    await mtUtils.autoCloseAlert('この番号は利用可能です！')
    code_available.value = true
  }
  if (response && response.length === 0) {
    await mtUtils.autoCloseAlert('この番号は使用中です。')
    code_available.value = false
    await mtUtils.smallPopup(AdditionCustomerCode, {
      callBack: (value: any) => {
        if (value) {
          formData['code_customer'] = value
        }
      }
    })
  }
}

async function getNextCustomerCode(formData: any, code_available: any) {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `mst/get_available_code`
  )
  if (response) {
    formData['code_customer'] = response.id
    code_available.value = true
  }
}

async function getTotalAvailableCodeCount(count) {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `mst/get_total_available_code_count`
  )
  if (response) {
    count.value = response.count
  }
}

async function addMoreCustomerCode() {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `mst/search_available_code`, {}
  )
}


export default {
  checkCustomerCode,
  getNextCustomerCode,
  getTotalAvailableCodeCount,
  addMoreCustomerCode
}