import mtUtils from './mtUtils'

export default {
  required: '入力必須項目です',
  email: 'emailの入力を確認してください',

  success: '更新しました',
  failed: 'データ更新ができません。',

  successWithHeader: {
    header: 'フィードバックを送信しました',
    content: '頂いたフィードバックは文字起こし機能の精度向上に役立てさせていただきます。'
  },

  delete_ask: '本当に削除しますか？',
  delete: '確認',

  task_is_completed: 'このタスクは完了しました',

  password_length: '常に 8 ～ 20 文字',
  password_has_no_number: '数字を含める必要があります',
  password_contain_upper_and_lower_char: '大文字と小文字を含める必要があります',
  password_has_no_special_character: '特殊文字を含める必要があります',
  password_must_be_same: 'パスワードが一致しません',

  successAlert() {
    mtUtils.autoCloseAlert(this.success)
  }
}
