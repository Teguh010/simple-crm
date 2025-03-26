import aahMessages from './aahMessages'
import mtUtils from '@/utils/mtUtils'
import zxcvbn from 'zxcvbn'

export default {
  validationRequired(val: any) {
    if (!val || val.length === 0) return aahMessages.required
  },
  validationMaxLength(val: any) {
    if (val.length > 500) return '最大入力数は500文字です。'
  },
  validationEmail(val: any, rules: any) {
    if (!val || val.length === 0) return 
    if (!rules.email(val)) return aahMessages.email
  },

  validationNumberWithDecimal(val: any) {
    if (isNaN(val)) {
      return '数字を入力してください。'
    }
  },

  validationFormattedNumber(val: any) {
    // Remove commas from the value
    const numericVal = val.replace(/,/g, '')

    // Check if the value is a valid number after removing commas
    if (isNaN(numericVal)) {
      return '数字を入力してください。'
    }

  },
  
  validationNumber(val: any) {
    if (isNaN(val)) {
      return '数字を入力してください。'
    }

  },
  validationPositiveNumber(val: any) {
    if (val <= 0) return '正の数字を入力してください。'
  },
  validationNonNegativeNumber(val: any) {
    if (val < 0) return '正の数字かゼロを入力してください。'
  },
  validationNonZeroNumber(val: any) {
    if (val == 0) return 'ゼロ以外の数字を入力してください。'
  },
  validationInBetween(val: any) {
    const min: any = 10, max: any = 120
    if (val == 0) return 'ゼロ以外の数字を入力してください。'
    if (val && (min > val) || (val > max)) return `次の範囲で指定してください。\n${min}  ～  ${max} .`
  },
  validationSmallInt(val: any) {
    const min: any = 10, max: any = 32990
    if (val == 0) return 'ゼロ以外の数字を入力してください。'
    if (val && (min > val) || (val > max)) return `次の範囲で指定してください。\n${min}  ～  ${max} .`
  },
  validationInteger(val: any) {
    if (val.includes('.') || val % 1 !== 0) return '整数を入力してください。'
  },
  validationPhone(val: any) {
    if (isNaN(val) || val.length <= 11) return aahMessages.required
  },
  validationSelection(val: any) {
    if (val === null) return aahMessages.required
    if (val?.length === 0) return aahMessages.required
  },
  validationPassword(val: any) {
    if (val === null) return ''
    if (val?.length === 0) return ''
    if (val?.length < 8 || val?.length > 20) return ''
    if (val?.search(/\d/) == -1) return ''
    if (val?.search(/[a-z]/) == -1) return ''
    if (val?.search(/[A-Z]/) == -1) return ''
    // if(val?.search(/.*[!@#$%^&*()_+].*/  ) == -1) return aahMessages.password_has_no_special_character
  },
  async checkForm(
    checkForms: any,
    formValues: any,
    conditionalFields: any = []
  ) {
    if (
      conditionalFields &&
      conditionalFields.length &&
      conditionalFields.length > 0
    ) {
      conditionalFields.forEach((field: any) => {
        let fieldItem = checkForms.find(
          (i: any) =>
            JSON.stringify(i.fieldList) == JSON.stringify(field.fieldList)
        )

        if (fieldItem) {
          checkForms.splice(checkForms.indexOf(fieldItem), 1)
        }

        if (field.validatedOn) {
          checkForms.push(field)
        }
      })
    }

    if (checkForms && checkForms.length && checkForms.length > 0) {
      for (const checkForm of checkForms) {
        if (
          checkForm.fieldList &&
          checkForm.fieldList.length &&
          checkForm.fieldList.length > 0
        ) {
          //未入力チェック
          for (const field of checkForm.fieldList) {
            //入力済みが存在する場合
            if (!formValues[field] && formValues[field] != '0') {
              await mtUtils.alert(checkForm.msg, checkForm.title)
              return false
            }
          }
        }
      }
    }
    return true
  },
  async prescriptionDetailValidation(PD: any) {
    const prescriptionDetailValidation = [
      {
        fieldList: ['date_start'],
        title: '未入力項目があります。',
        msg: '服用開始日を入力してください。'
      }
    ]
    const conditionValidation = [
      {
        validatedOn: PD.type_medicine_dosage in ['1', '2'] && PD.type_detail != 4,
        fieldList: ['date_end'],
        title: '未入力項目があります。',
        msg: '服用終了日を入力してください。'
      },
      {
        validatedOn: PD.type_medicine_dosage in ['1', '2'] && PD.type_detail != 4,
        fieldList: ['val_weight'],
        title: '未入力項目があります。',
        msg: '体重が未設定の為、早見表及び可変範囲による投与が利用できません。'
      },
      {
        validatedOn: !(PD.type_medicine_dosage == 4) && PD.type_detail != 4,
        fieldList: ['id_dosage_frequency'],
        title: '未入力項目があります。',
        msg: '服用頻度を選択してください。'
      }
    ]
    return await this.checkForm(
      prescriptionDetailValidation,
      PD,
      conditionValidation
    )
  },

  async injectHeaderValidation(iH: any) {

    const injectHeaderValidation = [
      {
        fieldList: ['id_employee_doctor'],
        title: 'エラー',
        msg: '担当医を選択してください。'
      }
    ]
    const conditionValidation = []


    return await this.checkForm(
      injectHeaderValidation,
      iH,
      conditionValidation
    )
  },

  validatePassword(password: string): { valid: boolean; score: number; feedback: string } {
    const result = zxcvbn(password);
    
    return {
      valid: result.score >= 2,
      score: result.score,
      feedback: result.feedback.suggestions.join(' ') || 'Strong password.',
    };
  },
  
  async injectDetailValidation(iD: any) {

    const injectDetailValidation = [
      {
        fieldList: ['id_employee_registered'],
        title: 'エラー',
        msg: '担当者を選択してください。'
      },
      {
        fieldList: ['num_conduct'],
        title: 'エラー',
        msg: '回数指定を選択してください。'
      }
    ]
    const conditionValidation = [
      {
        validatedOn: iD.rabies.flg_exempt,
        fieldList: ['date_exempt_start', 'date_exempt_end', 'memo_exemption_rabies', 'id_employee_doctor'],
        title: 'エラー',
        msg: '猶予理由と期間を記入してください'
      }
    ]

    return await this.checkForm(
      injectDetailValidation,
      { ...iD.rabies, ...iD },
      conditionValidation
    )
  }
}
