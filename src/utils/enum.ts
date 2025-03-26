export const typeStatus = [
  { label: 'Approved', value: 1, enLabel: 'APPROVED' },
  { label: 'Reject', value: 0, enLabel: 'REJECT' }
]
export const typeEmployee = [
  { label: '正社員', value: 1, enLabel: 'FULLTIME' },
  { label: '派遣社員', value: 2, enLabel: 'TEMPORAL' },
  { label: 'パート・アルバイト', value: 3, enLabel: 'PARTTIME' },
  { label: '業務委託', value: 4, enLabel: 'FREELANCE' },
  { label: '役員', value: 50, enLabel: 'BOARD_MEMBER' },
  { label: 'その他', value: 99, enLabel: 'OTHER' }
]

export const typeOccupation = [
  { label: 'システム管理者', value: 1107, enLabel: 'SYS_ADMIN' },
  { label: '獣医師', value: 1, enLabel: 'VETERINARIAN' },
  { label: '動物看護師', value: 2, enLabel: 'VETERINARY_TECHNICIAN' },
  { label: '薬剤師', value: 3, enLabel: 'PHARMACIST' },
  { label: '受付', value: 4, enLabel: 'RECEPTIONIST' },
  { label: '臨床検査技師', value: 5, enLabel: 'LAB_TECHNICIAN' },
  { label: 'トリマー', value: 6, enLabel: 'SALON_EMPLOYEE' },
  { label: '事務', value: 7, enLabel: 'GENERAL_EMPLOYEE' },
  { label: '研修医', value: 8, enLabel: 'RESIDENT' },
  { label: 'システム保守', value: 1000, enLabel: 'SYS_MAINTENANCE' },
  { label: 'マネージャー', value: 9, enLabel: 'MANAGER' },
  { label: 'グループ管理者', value: 100, enLabel: 'GROUP_ADMIN' },
  { label: '施設管理者', value: 110, enLabel: 'FACILITY_ADMIN' }
]
export const typePosition = [
  { label: '閲覧', value: 1, enLabel: 'MINIMUM_ROLE' },
  { label: '通常A', value: 2, enLabel: 'STANDARD_ROLE' },
  { label: '通常B', value: 10, enLabel: 'STANDARD_PLUS_ROLE' },
  { label: '病院管理者補佐', value: 90, enLabel: 'SUB_ADMIN_ROLE' },
  { label: '病院管理者', value: 99, enLabel: 'ADMIN_ROLE' },
  { label: 'MOTOCLE', value: 1107, enLabel: 'MOTOCLE_SE' }
]
export const typeEmployeeGender = [
  { label: '男', value: 1, enLabel: 'MAN' },
  { label: '女', value: 2, enLabel: 'WOMAN' },
  { label: 'その他', value: 3, enLabel: 'OTHER' }
]
export const typePetGender = [
  { label: 'オス♂', value: 1, enLabel: 'MALE', className: 'pet-gender-male' },
  {
    label: 'メス♀',
    value: 2,
    enLabel: 'FEMALE',
    className: 'pet-gender-female'
  },
  // { label: '不明', value: 3, enLabel: 'UNKNOWN' },
  {
    label: 'オス♂/去勢',
    value: 4,
    enLabel: 'M_NEUTERED',
    className: 'pet-gender-male'
  },
  {
    label: 'メス♀/避妊',
    value: 5,
    enLabel: 'F_SPAYED',
    className: 'pet-gender-female'
  },
  {
    label: '不明',
    value: 10,
    enLabel: 'UNKNOWN',
    className: 'pet-gender-unknown'
  }
]
export const typePetPhysic = [
  { label: '大型', value: 1, enLabel: 'LARGESIZE' },
  { label: '中型', value: 2, enLabel: 'MEDIUMSIZE' },
  { label: '小型', value: 3, enLabel: 'SMALLSIZE' }
]
export const typeCustomer = [
  { label: '個人', value: 1, enLabel: 'INDIVIDUAL' },
  { label: '法人', value: 2, enLabel: 'CORPORATION' }
]
export const typeGroupAccount = [
  { label: '家族', value: 1, enLabel: 'FAMILY' },
  { label: '親戚', value: 2, enLabel: 'RELATIVES' },
  { label: 'その他グループ管理', value: 3, enLabel: 'OTHER_GROUP' }
]
export const typeNotificationSettings = [
  { label: '連絡を希望', value: 1, enLabel: 'NOTIFICATION_YES' },
  { label: '連絡を希望しない', value: 2, enLabel: 'NOTIFICATION_NO' }
]
export const typeTitlePetCustomerUpdated = [
  { label: 'ちゃん', value: 1, enLabel: 'CHAN' },
  { label: 'くん', value: 2, enLabel: 'KUN' },
  { label: 'さん', value: 3, enLabel: 'SAN' },
  { label: '敬称なし', value: 4, enLabel: 'NOTHING' }
]
export const typeBlood = [
  { label: 'A', value: 1, englishLabel: 'A' },
  { label: 'B', value: 2, englishLabel: 'B' },
  { label: 'O', value: 3, englishLabel: 'O' },
  { label: 'AB', value: 4, englishLabel: 'AB' },
  { label: 'DEA1.1+', value: 5, englishLabel: 'DEA1.1+' },
  { label: 'DEA1.1-', value: 6, englishLabel: 'DEA1.1-' },
  { label: 'DEA1.2+', value: 7, englishLabel: 'DEA1.2+' },
  { label: 'DEA1.2-', value: 8, englishLabel: 'DEA1.2-' },
  { label: 'DEA3+', value: 9, englishLabel: 'DEA3+' },
  { label: 'DEA3-', value: 10, englishLabel: 'DEA3-' },
  { label: 'DEA4+', value: 11, englishLabel: 'DEA4+' },
  { label: 'DEA4-', value: 12, englishLabel: 'DEA4-' },
  { label: 'DEA5+', value: 13, englishLabel: 'DEA5+' },
  { label: 'DEA5-', value: 14, englishLabel: 'DEA5-' },
  { label: 'DEA6+', value: 15, englishLabel: 'DEA6+' },
  { label: 'DEA6-', value: 16, englishLabel: 'DEA6-' },
  { label: 'DEA7+', value: 17, englishLabel: 'DEA7+' },
  { label: 'DEA7-', value: 18, englishLabel: 'DEA7-' },
  { label: 'DEA8+', value: 19, englishLabel: 'DEA8+' },
  { label: 'DEA8-', value: 20, englishLabel: 'DEA8-' }
]
export const typePetRevised = [
  { label: 'ペット名', value: 1, enLabel: 'PET_NAME' },
  { label: '生年月日', value: 2, enLabel: 'DATE_OF_BIRTH' },
  { label: '性別', value: 4, enLabel: 'GENDER' },
  { label: '飼い主メモ', value: 8, enLabel: 'CUSTOMER_MEMO' },
  {
    label: '管理ステータス',
    value: 128,
    enLabel: 'MANAGEMENT_STATUS'
  },
  { label: '亡くなりました', value: 256, enLabel: 'PASSED_AWAY' }
]

export const searchInsCartOption = [
  { label: '全て', value: 1, enLabel: 'ALL_CART' },
  { label: '保険適用のみ対象（全社）', value: 2, enLabel: 'ALL_INSURED_CART' },
  {
    label: '保険適用のみ対象（アニコム社）',
    value: 3,
    enLabel: 'ANICOM_APPLIED_CART_ONLY'
  },
  {
    label: '保険適用のみ対象（iPet社）',
    value: 4,
    enLabel: 'IPET_APPLIED_CART_ONLY'
  },
  { label: '保険非適用のみ対象', value: 5, enLabel: 'ALL_NON_INSURED_CART' }
]

export const searchCartProcessStatusOption = [
  { label: '全て', value: 1, enLabel: 'ALL_CART' },
  { label: '締め処理前のみ', value: 2, enLabel: 'UN_COMPLETED_CART_ONLY' },
  { label: '締め処理後のみ', value: 3, enLabel: 'COMPLETED_CART_ONLY' },
  { label: '締め後の変更歴あり会計', value: 4, enLabel: 'UPDATED_CART_ONLY' }
]

export const typeInsurer = [
  { label: 'アニコム損保', value: 1, enLabel: 'ANICOM' },
  { label: 'iPet保険', value: 2, enLabel: 'IPET_INSURANCE' }
]
export const typeInsurancePurpose = [
  { label: '保険適用外', value: 1, enLabel: 'OUT_OF_COVERAGE' },
  { label: '通院', value: 2, enLabel: 'NORMAL_SERVICE' },
  { label: '入院', value: 3, enLabel: 'HOSPITALIZATION' },
  { label: '手術', value: 4, enLabel: 'SURGERY' }
]
export const typeRelation = [
  { label: '疾患分類', value: 1, enLabel: 'DISEASE_CLASSIFICATION' },
  { label: '傷病', value: 2, enLabel: 'ILLNESS' }
]

export const typeItem = [
  { label: '医薬品', value: 1, enLabel: 'MEDICINE' },
  { label: 'フード・サプリ', value: 2, enLabel: 'FOOD_SUPPLEMENTS' },
  { label: 'シャンプー', value: 3, enLabel: 'SHAMPOO' },
  { label: '医療商品', value: 4, enLabel: 'MEDICAL_PRODUCTS' },
  { label: '一般商品', value: 5, enLabel: 'GENERAL_PRODUCTS' },
  { label: 'その他', value: 10, enLabel: 'OTHER' }
]

export const typeDose = [
  { label: '日単位', value: 1, enLabel: 'DAILY' },
  { label: '週単位', value: 2, enLabel: 'WEEKLY' },
  { label: '月単位', value: 3, enLabel: 'MONTHLY' },
  { label: '頓服', value: 10, enLabel: 'ON_DEMAND' },
  { label: 'その他', value: 99, enLabel: 'OTHER' }
]
export const intervalUnit = [
  { label: '日', value: '日', enLabel: 'DAILY' },
  { label: '週', value: '週', enLabel: 'WEEKLY' },
  { label: '月', value: '月', enLabel: 'MONTHLY' },
  { label: '年', value: '年', enLabel: 'Year' }
]

export const typeGroupItem = [
  { label: '処方箋', value: 1, enLabel: 'PRESCRIPTION' },
  { label: '治療サービス', value: 2, enLabel: 'SERVICE_DETAIL' },
  { label: '注射・点滴', value: 3, enLabel: 'INJECT_DRIP' },
  { label: 'その他サービス', value: 99, enLabel: 'OTHER_SERVICE' }
]
export const typePriceTarget = [
  { label: 'サービス', value: 1, enLabel: 'SERVICE' },
  { label: '処方箋', value: 2, enLabel: 'PRESCRIPTION' },
  { label: '医療系物品', value: 3, enLabel: 'MEDICAL_PRODUCTS' },
  { label: 'その他商品', value: 4, enLabel: 'OTHER_PRODUCTS' }
]
export const typePrevention = [
  { label: '狂犬病', value: 1, enLabel: 'RABIES' },
  { label: 'ノミ・ダニ', value: 2, enLabel: 'FLEAS AND TICKS' },
  { label: 'フィラリア', value: 4, enLabel: 'FILARIA' },
  { label: 'ワクチン', value: 8, enLabel: 'VACCINES' },
  { label: 'フィラリア・ノミ・ダニ', value: 14, enLabel: 'ALL_IN_ONE' },
  { label: '健診', value: 32, enLabel: 'CHECKUP' }
]
export const typeTaxApply = [
  { label: '通常（10%）', value: 1, enLabel: 'NORMAL' },
  { label: '軽減税率（8%）', value: 2, enLabel: 'REDUCED_TAX_RATE' }
]
export const typeTax = [
  { label: '通常（10%）', value: 1, enLabel: 'NORMAL' },
  { label: '軽減税率（8%）', value: 2, enLabel: 'REDUCED_TAX_RATE' },
  { label: '非課税', value: 3, enLabel: 'TAX_EXEMPTION' }
]
export const typeCategoryLayer = [
  { label: '大分類（親カテゴリ）', value: 1, enLabel: 'PARENT_CATEGORY' },
  { label: '中分類（子カテゴリ）', value: 2, enLabel: 'SUB_CATEGORY' }
]
export const typeTaskReview = [
  { label: '不要', value: 99, enLabel: 'NOT_REQUIRED' },
  {
    label: '最終確認必要（1名）',
    value: 1,
    enLabel: 'FINAL_CONFIRMATION_REQUIRED（1PERSON）'
  },
  {
    label: '最終確認必要（2名）',
    value: 2,
    enLabel: 'FINAL_CONFIRMATION_REQUIRED（2PERSON）'
  }
]
export const typeTaskTodoList = [
  { label: 'ペット', value: 1, enLabel: 'PER_PET' },
  { label: '大分類', value: 2, enLabel: 'PER_PARENT_CATEGORY' },
  { label: 'ステータス', value: 3, enLabel: 'PER_STATUS' }
]
export const typeFloor = [
  { label: '1F', value: 1, enLabel: '1F' },
  { label: '2F', value: 2, enLabel: '2F' },
  { label: '3F', value: 3, enLabel: '3F' }
]
export const typeCageRoom = [
  { label: '犬舎1', value: 1, enLabel: 'KENNEL1' },
  { label: '犬舎2', value: 2, enLabel: 'KENNEL2' },
  { label: 'ICU室', value: 3, enLabel: 'ICU_ROOM' },
  { label: '猫舎', value: 4, enLabel: 'CAT_KENNEL' },
  {
    label: '手術室脇通路',
    value: 20,
    enLabel: 'CORRIDOR_BY_THE_OPERATING_ROOM'
  },
  { label: '美容室', value: 50, enLabel: 'BEAUTY_SALON' },
  { label: '屋外', value: 70, enLabel: 'OUTDOORS' },
  { label: '移動ケージ', value: 80, enLabel: 'MOBILE_CAGE' },
  { label: 'その他', value: 100, enLabel: 'OTHERS' }
]

export const typeStatusSharing = [
  { label: '共有中', value: 1, enLabel: 'SHARED' },
  {
    label: 'オーナーアクセス停止',
    value: 2,
    enLabel: 'CUSTOMER_ACCESS_SUSPENDED'
  }
]
export const typeSource = [
  { label: '音声入力', value: 1, enLabel: 'VOICE_INPUT' },
  { label: '直接入力', value: 2, enLabel: 'DIRECT_INPUT' }
]
export const typeThread = [
  { label: '報告', value: 1, enLabel: 'REPORT' },
  { label: '承認が必要', value: 2, enLabel: 'APPROVAL_REQUIRED' },
  { label: '指示の要求', value: 3, enLabel: 'REQUEST_FOR_INSTRUCTIONS' },
  { label: 'その他', value: 10, enLabel: 'OTHER' }
]
export const typeThreadMessageList = [
  { label: '院内スレッド', value: 1, enLabel: 'INTERNAL' },
  { label: '顧客スレッド', value: 2, enLabel: 'WITH_CUSTOMER' }
]
export const typeLink1 = [
  { label: 'リクエスト', value: 1, enLabel: 'REQUEST' },
  { label: 'サービス', value: 2, enLabel: 'SERVICE' },
  { label: '処方箋', value: 3, enLabel: 'PRESCRIPTION' },
  { label: 'メモカルテ', value: 4, enLabel: 'MEMO_MEDICAL_RECORD' },
  { label: 'タスク', value: 5, enLabel: 'TASK' },
  { label: '会計', value: 6, enLabel: 'ACCOUNTING' }
]
export const typeMessage = [
  { label: 'メッセージ', value: 1, enLabel: 'MESSAGE' },
  { label: '添付ファイル', value: 2, enLabel: 'ATTACHMENT_FILE' }
]
export const typePayment = [
  {
    label: 'アプリ内カード決済',
    value: 1,
    enLabel: 'IN-APP_CARD_PAYMENT'
  },
  {
    label: 'アプリ内PayPay決済',
    value: 2,
    enLabel: 'IN-APP_PAYPAY_PAYMENT'
  },
  { label: '院内決済', value: 3, enLabel: 'IN-HOSPITAL_PAYMENT' }
]
export const typeTaxation = [
  { label: '課税', value: 1, enLabel: 'TAXABLE' },
  { label: '非課税', value: 2, enLabel: 'NON-TAXABLE' }
]
export const typeTaxCategory = [
  { label: '内税', value: 1, enLabel: 'INCLUSIVE_TAX' },
  { label: '外税', value: 2, enLabel: 'EXCLUSIVE_TAX' }
]
export const typePriceAdjustment = [
  { label: '減額', value: 1, enLabel: 'DECREASE' },
  { label: '増額', value: 2, enLabel: 'INCREASE' }
]
export const typeDisplayControll = [
  {
    label: '通常の診療明細',
    value: 1,
    enLabel: 'REGULAR_MEDICAL_STATEMENT'
  },
  { label: 'グループタイトル', value: 51, enLabel: 'GROUP_TITLE' }
]
export const typeSourceCart = [
  {
    label: 'リクエストから自動反映',
    value: 1,
    enLabel: 'AUTOMATIC_REFLECTION_FROM_REQUEST'
  },
  { label: '直接入力', value: 20, enLabel: 'DIRECT_INPUT' }
]
export const typeReceive = [
  { label: '銀行振込', value: 1, enLabel: 'BANK_TRANSFER' },
  { label: 'Square', value: 2, enLabel: 'SQUARE' },
  { label: 'おてがるPay', value: 3, enLabel: 'OTEGARU_PAY' },
  {
    label: 'Paypay for Business',
    value: 4,
    enLabel: 'PAYPAY_FOR_BUSINESS'
  },
  { label: 'POS', value: 11, enLabel: 'POS' },
  { label: '手入力', value: 99, enLabel: 'MANUAL_INPUT' }
]
export const typeCcPayment = [
  { label: '前受金', value: 1, enLabel: 'ADVANCE_PAYMENT' },
  { label: '売掛金', value: 2, enLabel: 'ACCOUNTS_RECEIVABLE' }
]
export const typePaymentMethod = [
  { label: '現金', value: 1, enLabel: 'CASH' },
  { label: 'クレジットカード', value: 2, enLabel: 'CREDIT_CARD' },
  { label: '振込み', value: 3, enLabel: 'BANK_TRANSFER' },
  { label: 'PayPay', value: 4, enLabel: 'PAYPAY' },
  { label: 'QUICKPay', value: 5, enLabel: 'QUICKPAY' },
  { label: 'iD', value: 6, enLabel: 'ID' },
  { label: 'ICOCA', value: 7, enLabel: 'ICOCA' },
  { label: 'nanaco', value: 8, enLabel: 'NANACO' },
  { label: '楽天Edy', value: 9, enLabel: 'RAKUTEN_EDY' },
  { label: 'WAON', value: 10, enLabel: 'WAON' },
  { label: '金券', value: 11, enLabel: 'VOUCHER' },
  { label: '手形', value: 12, enLabel: 'PROMISSORY_NOTE' },
  { label: '小切手', value: 13, enLabel: 'CHEQUE' },
  { label: '代引', value: 30, enLabel: 'CASH_ON_DELIVERY' },
  { label: 'その他', value: 99, enLabel: 'OTHER' }
]
export const typePaymentStatus = [
  { label: '入金済', value: 1, enLabel: 'PAID', color: 'bg-positive' },
  { label: '返金済', value: 2, enLabel: 'REFUNDED', color: 'bg-negative' },
  { label: '保留', value: 3, enLabel: 'PENDING', color: 'bg-accent-700' },
  {
    label: '支払い待ち',
    value: 4,
    enLabel: 'AWAITING_PAYMENT',
    color: 'bg-accent-700'
  },
  { label: '失敗', value: 5, enLabel: 'FAILED', color: 'bg-negative' }
]
export const typePaymentCategory = [
  { label: '受付会計', value: 1, enLabel: 'Hospital counter payment' },
  { label: 'myVetty決済', value: 2, enLabel: 'Deferred payment' },
  { label: 'その他', value: 3, enLabel: 'Transfer payment' }
]
export const typePaymentClassification = [
  { label: '前受金', value: 1, enLabel: 'Advance payment' },
  { label: '売掛金', value: 2, enLabel: 'Accounts receivable' },
  { label: '調整金', value: 3, enLabel: 'Adjustment fee' },
  { label: '返金', value: 4, enLabel: 'refund' }
]
export const typeCcBrand = [
  { label: '', value: 0, enLabel: '' },
  { label: 'VISA', value: 1, enLabel: 'VISA' },
  { label: 'Mastercard', value: 2, enLabel: 'mastercard' },
  { label: 'JCB', value: 3, enLabel: 'JCB' },
  { label: 'Diners Club', value: 4, enLabel: 'Diners Club' },
  { label: 'AMERICAN EXPRESS', value: 5, enLabel: 'AMERICAN EXPRESS' }
]
export const typeExclusion = [
  { label: '取引区分が出金のため', value: 1, enLabel: 'WITHDRAWAL' }
]

export const typeReconciliation = []
export const typeCustomerGender = [
  { label: '男性', value: 1, enLabel: 'MALE' },
  { label: '女性', value: 2, enLabel: 'WOMAN' },
  { label: 'その他', value: 3, enLabel: 'OTHERS' }
]
export const typeBusinessDay = [
  { label: '通常(A)', value: 1, enLabel: 'NORMAL(A)' },
  { label: '通常(B)', value: 2, enLabel: 'NORMAL(B)' },
  { label: '半日(A)', value: 3, enLabel: 'HALF_DAY_A' },
  { label: '半日(B)', value: 4, enLabel: 'HALF_DAY_B' },
  { label: '夜間(A)', value: 20, enLabel: 'NIGHT_A' },
  { label: '夜間(B)', value: 21, enLabel: 'NIGHT_B' },
  { label: '特別スケジュール(A)', value: 50, enLabel: 'SPECIAL_SCHEDULE_A' },
  { label: '特別スケジュール(B)', value: 51, enLabel: 'SPECIAL_SCHEDULE_B' },
  { label: '休診日', value: 90, enLabel: 'CLOSED' }
]
export const daysShort = ['日', '月', '火', '水', '木', '金', '土']
export const typeWeekday = [
  { label: '日', value: 1, enLabel: 'SUNDAY' },
  { label: '月', value: 2, enLabel: 'MONDAY' },
  { label: '火', value: 3, enLabel: 'TUESDAY' },
  { label: '水', value: 4, enLabel: 'WEDNESDAY' },
  { label: '木', value: 5, enLabel: 'THURSDAY' },
  { label: '金', value: 6, enLabel: 'FRIDAY' },
  { label: '土', value: 7, enLabel: 'SATURDAY' }
]
export const employeeReviewed = [
  { label: 'カメラを起動', value: 1, enLabel: 'LAUNCH_CAMERA' },
  { label: 'アルバムから選択', value: 2, enLabel: 'SELECT_FROM_ALBUM' }
]
export const typeCategoryChild = [
  { label: '準備', value: 1, enLabel: 'PREPARATION' },
  { label: '診察', value: 2, enLabel: 'EXAMINATION' },
  { label: '検/処', value: 3, enLabel: 'TESTING' },
  { label: '説明', value: 4, enLabel: 'EXPLANATION' },
  { label: 'サービス', value: 5, enLabel: 'TREATMENT' },
  { label: '薬予約', value: 10, enLabel: 'PRESCRIPTION_RESERVATION' },
  { label: '会計', value: 20, enLabel: 'BILLING' },
  { label: '完了', value: 21, enLabel: 'COMPLETED' }
]
export const typeCategoryParent = [
  { label: '診療対応中', value: 1, enLabel: 'PROCESSING_SERVICE' },
  { label: '処方箋', value: 11, enLabel: 'PROCESSING_PPRESCRIPTION' },
  { label: '会計', value: 21, enLabel: 'PROCESSING_PAYMENT' }
]
export const typeBodyWeight = [
  { label: 'kg', value: 1, enLabel: 'kg' },
  { label: 'g', value: 2, enLabel: 'g' }
]
export const typeBodyWeightUnit = [
  { label: 'kg', value: 1, enLabel: 'kg' },
  { label: 'g', value: 2, enLabel: 'g' },
  { label: '頭', value: 3, enLabel: 'per head' }
]

export const statusQueueTicket = [
  { label: '整理券', value: 1, enLabel: 'TICKET' },
  { label: '受付済', value: 2, enLabel: 'WAITING_ROOM' },
  { label: '呼出済', value: 3, enLabel: 'COMPLETED' },
  { label: '不在', value: 4, enLabel: 'ABSENT' },
  { label: 'キャンセル', value: 90, enLabel: 'CANCELLED' },
  { label: 'ゴミ箱', value: 99, enLabel: 'TRASH CAN' }
]
export const typeProcessTime = [
  { label: '0分', value: 1, enLabel: '0MINUTES' },
  { label: '5分', value: 2, enLabel: '5MINUTES' },
  { label: '10分', value: 3, enLabel: '10MINUTES' },
  { label: '15分', value: 4, enLabel: '15MINUTES' },
  { label: '20分', value: 5, enLabel: '20MINUTES' },
  { label: '30分', value: 6, enLabel: '30MINUTES' },
  { label: '45分', value: 7, enLabel: '45MINUTES' },
  { label: '60分', value: 8, enLabel: '60MINUTES' },
  { label: '75分', value: 9, enLabel: '75MINUTES' },
  { label: '90分', value: 10, enLabel: '90MINUTES' },
  { label: '120分', value: 11, enLabel: '120MINUTES' }
]
export const typeDiagnosisConfidence = [
  { label: '未設定', value: 4 },
  { label: '疑い：低', value: 1 },
  { label: '疑い：中', value: 2 },
  { label: '高', value: 3 }
]
export const typeMedicineDosage = [
  { label: '固定量', value: 1 },
  { label: '可変量', value: 2 },
  { label: '個体', value: 3 },
  { label: '単純数量', value: 4 }
]
export const typeDosageCalculation = [
  { label: '無処理（そのまま計算）', value: 1 },
  { label: '1錠以下を1錠計算', value: 2 },
  { label: '服用総量でまとめて計算', value: 3 },
  { label: '1/2以下を1/2錠、1/2以上はそのまま計算（服用単位）', value: 6 },
  { label: '1/2以下を1/2錠計算', value: 4 },
  { label: '1以下を1錠計算', value: 5 }
]
export const typePrescriptionOptimization = [
  { label: '品名包装単位を跨ぐ', value: 1 },
  { label: '品名包装単位を跨がない', value: 2 }
]
export const typeMedicineCategory = [
  { label: '生物学的製剤', value: 1 },
  { label: '抗生物質製剤', value: 2 },
  { label: '神経系用薬', value: 3 },
  { label: '循環・呼吸器官用薬', value: 4 },
  { label: '消化器官用薬', value: 5 },
  { label: '繁殖用薬', value: 6 },
  { label: '外用剤', value: 7 },
  { label: 'ビタミン剤', value: 8 },
  { label: '肝臓疾患用・解毒剤', value: 9 },
  { label: '代謝性用薬', value: 10 },
  { label: 'サルファ剤', value: 11 },
  { label: 'ニトロフラン系製剤', value: 12 },
  { label: '合成抗菌剤', value: 13 },
  { label: '抗原虫剤', value: 14 },
  { label: '内寄生虫駆除剤', value: 15 },
  { label: '防虫剤・殺虫剤', value: 16 },
  { label: '治療を主目的としない医薬品', value: 17 },
  { label: '治療を主目的としない', value: 18 },
  { label: 'その他', value: 19 }
]
export const typeMedicineRegulation = [
  { label: '毒薬', value: 1 },
  { label: '劇薬', value: 2 },
  { label: '指定医薬品', value: 3 },
  { label: '要指示医薬品', value: 4 },
  { label: '使用基準が定められた医薬品', value: 5 },
  { label: '高度管理医療機器', value: 6 },
  { label: '管理医療機器', value: 7 },
  { label: '一般医療機器', value: 8 }
]
export const typeMedicineFormat = [
  { label: '錠', value: 1 },
  { label: 'カプセル', value: 2 },
  { label: '粉', value: 3 },
  { label: 'クリーム状', value: 4 },
  { label: '液状', value: 5 },
  { label: 'エアロゾル', value: 6 },
  { label: 'チュアブル', value: 7 }
]
export const statusCustomer = [
  { label: '6か月以内の来院', value: 1 },
  { label: '12か月以内の来院', value: 2 },
  { label: '24か月以内の来院', value: 3 },
  { label: '36か月以内の来院', value: 4 },
  { label: 'それ以外', value: 5 }
]
// export const typeStatusOpeGender = [
//   { label: '未対応', value: 1 },
//   { label: '当院対応済', value: 2 },
//   { label: '他院対応済', value: 3 }
// ]
export const typeTextTemplate = [
  { label: 'リクエスト', value: 11, enLabel: 'REQUEST' },
  { label: 'リクエストステータス', value: 12, enLabel: 'RQ_STATUS' },
  { label: 'メモカルテ', value: 21, enLabel: 'MEMO_CARTE' },
  { label: 'サービス明細', value: 31, enLabel: 'SERVICE_DETAIL' },
  { label: '検査結果の説明', value: 32, enLabel: 'LAB_RESULT_EXPLANATION' },
  { label: '処方箋', value: 41, enLabel: 'PRESCRIPTION' },
  { label: '処方箋：服用メモ', value: 42, enLabel: 'PD_DOSE' },
  { label: '処方箋：効果効能', value: 43, enLabel: 'PD_EFFECT' },
  { label: '処方箋：注意事項', value: 44, enLabel: 'PD_ALERT' },
  { label: '検査結果符号', value: 45, enLabel: 'LAB_SIGN' },
  { label: '処方箋：調剤指示', value: 46, enLabel: 'PD_CLINIC_PREP' },
  { label: '注射・点滴：注射メモ', value: 51, enLabel: 'IND_DOSE' },
  { label: '注射・点滴：その他', value: 52, enLabel: 'IND_EFFECT' },
  { label: '院内メッセージ：ゴール', value: 61, enLabel: 'THREAD_GOAL' },
  {
    label: '院内メッセージ：テキスト',
    value: 62,
    enLabel: 'MESSAGE_CLINIC_TEXT'
  },
  {
    label: 'オーナーメッセージ：テキスト',
    value: 72,
    enLabel: 'MESSAGE_CUSTOMER_TEXT'
  },
  { label: 'タスク：TODO', value: 81, enLabel: 'TASK_TODO' },
  { label: '一包化', value: 91, enLabel: 'GROUP_MEDICINE' },
  // { label: 'シェーマ図', value: 100, enLabel: 'IMAGE_MEMO_CARTE' },
  { label: 'お知らせ', value: 110, enLabel: 'INFO' },
  { label: '受付通知', value: 120, enLabel: 'RECEPTION_NOTIFICATION' },
  { label: '診療明細送付', value: 130, enLabel: 'RECEPTION_NOTIFICATION' }
]
export const typeFoodPrep = [
  { label: 'ドライフード', value: 1, enLabel: 'DRY_FOOD' },
  { label: '缶フード', value: 2, enLabel: 'CANNED_FOOD' },
  { label: 'ドライ75%：缶25%', value: 20, enLabel: 'MIX_DRY75_CAN25' },
  { label: 'ドライ50%：缶50%', value: 21, enLabel: 'MIX_DRY50_CAN50' },
  { label: 'ドライ25%：缶75%', value: 22, enLabel: 'MIX_DRY25_CAN75' }
]
export const typeFoodAmount = [
  { label: '少量', value: 1, enLabel: 'SMALL' },
  { label: '普通', value: 20, enLabel: 'NORMAL' },
  { label: '多め', value: 40, enLabel: 'LARGE' }
]
export const typeProvider = [
  { value: 1, label: '院内', enLabel: 'HOSPITAL' },
  { value: 2, label: '他院', enLabel: 'OTHER_HOSPITAL' },
  { value: 3, label: '検査機関', enLabel: 'TESTING_FACILITY' },
  { value: 4, label: '大学', enLabel: 'UNIVERSITY' },
  { value: 5, label: '顧客', enLabel: 'CUSTOMER' },
  { value: 6, label: '保険会社', enLabel: 'INSURANCE_COMPANY' },
  { value: 9, label: '製薬会社', enLabel: 'PHARMACEUTICAL_COMPANY' },
  { value: 99, label: 'その他', enLabel: 'OTHER' }
]
export const typeReceiveFormat = [
  { value: 1, label: '紙媒体', enLabel: 'PRINT_MEDIA' },
  { value: 2, label: '電子媒体', enLabel: 'ELECTRONIC_MEDIA' },
  { value: 3, label: 'メール', enLabel: 'EMAIL' },
  { value: 4, label: 'FAX', enLabel: 'FAX' },
  { value: 99, label: 'その他', enLabel: 'OTHER' }
]
export const typeTel = [
  { value: 1, label: '自宅', enLabel: 'HOME' },
  { value: 2, label: '携帯', enLabel: 'MOBILE' },
  { value: 3, label: '職場', enLabel: 'OFFICE' },
  { value: 5, label: 'FAX番号', enLabel: 'FAX' },
  { value: 6, label: '勤務先', enLabel: 'WORK' },
  { value: 7, label: 'お父さん', enLabel: 'WORK' },
  { value: 8, label: 'お母さん', enLabel: 'WORK' },
  { value: 9, label: '息子', enLabel: 'WORK' },
  { value: 10, label: '娘', enLabel: 'WORK' },
  { value: 11, label: '実家', enLabel: 'WORK' },
  { value: 12, label: 'おじいちゃん/おばあちゃん', enLabel: 'WORK' },
  { value: 999, label: 'その他', enLabel: 'OTHER' }
]
export const typeDiagnosticInfo = [
  { label: 'レントゲン検査', value: 1, enLabel: 'X-RAY_EXAMINATION' },
  { label: 'CT検査', value: 2, enLabel: 'CT_SCAN' },
  { label: 'エコー検査', value: 3, enLabel: 'ULTRASOUND_EXAMINATION' },
  { label: 'MRI検査', value: 4, enLabel: 'MRI_SCAN' },
  { label: '血液検査（一般）', value: 21, enLabel: 'BLOOD_TEST (GENERAL)' },
  {
    label: '血液検査（生化学）',
    value: 22,
    enLabel: 'BLOOD_TEST (BIOCHEMISTRY)'
  },
  {
    label: '血液検査（一般、生化学、その他）',
    value: 23,
    enLabel: 'BLOOD_TEST (GENERAL, BIOCHEMISTRY, OTHER)'
  },
  {
    label: '血液検査（反応性蛋白濃度）',
    value: 24,
    enLabel: 'BLOOD_TEST (REACTIVE PROTEIN CONCENTRATION)'
  },
  {
    label: '血液検査（血液凝固系検査）',
    value: 25,
    enLabel: 'BLOOD_TEST (COAGULATION)'
  },
  {
    label: '血液検査（内分泌系（ホルモン）検査）',
    value: 26,
    enLabel: 'BLOOD_TEST (ENDOCRINE SYSTEM / HORMONES)'
  },
  {
    label: '血液検査（血液寄生虫検査）',
    value: 27,
    enLabel: 'BLOOD_TEST (BLOOD PARASITES)'
  },
  {
    label: '血液検査（免疫 / アレルギーテスト）',
    value: 28,
    enLabel: 'BLOOD_TEST (IMMUNE / ALLERGY TEST)'
  },
  { label: '血液検査（その他）', value: 29, enLabel: 'BLOOD_TEST (OTHER)' },
  { label: '検便検査', value: 50, enLabel: 'FECAL_TEST' },
  { label: '尿検査', value: 51, enLabel: 'URINE_TEST' },
  { label: '身体検査', value: 52, enLabel: 'PHYSICAL_EXAMINATION' },
  { label: '聴診', value: 53, enLabel: 'AUSCULTATION' },
  { label: '眼圧検査', value: 54, enLabel: 'EYE_PRESSURE_TEST' },
  { label: '耳検査', value: 55, enLabel: 'EAR_EXAMINATION' },
  { label: '神経学的検査', value: 56, enLabel: 'NEUROLOGICAL_EXAMINATION' },
  { label: '皮膚検査', value: 57, enLabel: 'SKIN_EXAMINATION' },
  { label: '肛門検査', value: 58, enLabel: 'ANUS_EXAMINATION' },
  { label: '診断書', value: 70, enLabel: 'DIAGNOSTIC_REPORT' },
  { label: '紹介状', value: 71, enLabel: 'REFERRAL_LETTER' },
  { label: '手術情報', value: 72, enLabel: 'SURGICAL_INFORMATION' },
  { label: '薬剤情報', value: 73, enLabel: 'MEDICATION_INFORMATION' },
  { label: 'オーナーメモ', value: 74, enLabel: 'CLIENT_NOTES' },
  { label: 'その他', value: 99, enLabel: 'OTHER' }
]
export const typeFile = [
  { value: 1, label: '画像', enLabel: 'IMAGE' },
  { value: 2, label: '動画', enLabel: 'VIDEO' },
  { value: 3, label: 'DICOM', enLabel: 'DICOM' },
  { value: 99, label: 'その他', enLabel: 'OTHER' }
]
export const typeCartRound = [
  { value: 1, label: '切り捨て', enLabel: 'Round down or Truncate' },
  { value: 2, label: '切り上げ', enLabel: 'Round up' },
  {
    value: 3,
    label: '四捨五入',
    enLabel: 'Round to the nearest or simply Round'
  }
]

export const typeCartRoundUnit = [
  { value: 1, label: '自動まるめなし', enLabel: 'Round up' },
  {
    value: 2,
    label: '1',
    unit: 10,
    enLabel: 'Round to the nearest or simply Round'
  },
  {
    value: 3,
    label: '10',
    unit: 100,
    enLabel: 'Round to the nearest or simply Round'
  },
  {
    value: 4,
    label: '100',
    unit: 1000,
    enLabel: 'Round to the nearest or simply Round'
  },
  {
    value: 5,
    label: '1000',
    unit: 10000,
    enLabel: 'Round to the nearest or simply Round'
  }
]
export const typePlanStatus = [
  { label: '計画中', value: 1, enLabel: 'PLANNING' },
  { label: '確定', value: 2, enLabel: 'CONFIRMED_PLAN' },
  { label: 'キャンセル', value: 10, enLabel: 'CANCELLED' }
]

export const typeConversationStatus = [
  { label: '診察中', value: 1, enLabel: 'started' },
  { label: '終了', value: 2, enLabel: 'ended' },
  { label: '一時停止中', value: 3, enLabel: 'paused' },
  { label: '要約中', value: 4, enLabel: 'summary-request' },
  { label: 'エラー', value: 99, enLabel: 'expired' }
]
export const typePrint = [
  { label: 'DMはがき 宛名（表）', value: 1, enLabel: 'MAIL1' },
  { label: 'DMはがき 文面（裏）', value: 2, enLabel: 'MAIL2' },
  { label: '薬袋（小）', value: 11, enLabel: 'BAG_S' },
  { label: '薬袋（中）', value: 12, enLabel: 'BAG_M' },
  { label: '薬袋（大）', value: 13, enLabel: 'BAG_L' },
  // {
  //   label: '狂犬病ワクチン接種証明書',
  //   value: 21,
  //   enLabel: 'CERTIFICATE_RABIES'
  // },
  // {
  //   label: '混合ワクチン予防接種証明書',
  //   value: 22,
  //   enLabel: 'CERTIFICATE_VACCINATION'
  // },
  // {
  //   label: 'ノミダニ予防証明書',
  //   value: 23,
  //   enLabel: 'CERTIFICATE_PREVENTATIVE'
  // },
  // { label: 'その他証明書１', value: 31, enLabel: 'CERTIFICATE_OTHER1' },
  // { label: 'その他証明書２', value: 32, enLabel: 'CERTIFICATE_OTHER2' },
  // // { label: '診察券', value: 51, enLabel: 'CUSTOMER_CARD' },
  // { label: 'タックシール', value: 60, enLabel: 'TACK_SEAL' },
  { label: '治療サービス明細', value: 70, enLabel: 'SERVICE_DETAIL' },
  { label: '処方箋明細', value: 80, enLabel: 'PRESCRIPTION_DETAIL' },
  { label: '注射明細', value: 90, enLabel: 'RABIES_DETAIL' }
]
export const typePdfPrint = [
  {
    label: '帳票レイアウト-Case1',
    value: 'update_print_canvas_modal',
    enLabel: 'UPDATE_PRINT_CANVAS_MODAL'
  }
]
export const typeModalButton = [
  { label: 'IDEXX院内検査', value: 'order_idexx', enLabel: 'ORDER_IDEX' },
  {
    label: '未連携検査項目',
    value: 'open_lab_prep_list',
    enLabel: 'OPEN_LAB_PREP_LIST'
  }
]
export const typePrintSize = [
  { label: 'A4', value: 1, enLabel: 'A4' },
  { label: 'A5', value: 2, enLabel: 'A5' },
  { label: 'A6', value: 3, enLabel: 'A6' },
  { label: '管製はがき', value: 4, enLabel: 'POST_CARD' },
  { label: '薬袋 12x15', value: 5, enLabel: 'BAG_S' },
  { label: '薬袋 14x17', value: 6, enLabel: 'BAG_M' },
  { label: '薬袋 16x20.5', value: 7, enLabel: 'BAG_L' },
  { label: '薬袋 XL', value: 8, enLabel: 'BAG_XL' },
  { label: 'カード', value: 21, enLabel: 'CARD' }
]
export const typePrintBag = [
  { label: '仕様なし', value: 1, enLabel: 'NONE' },
  { label: '旧システム', value: 2, enLabel: 'EX_SYSTEM' }
]
export const typePrintBagTitle = [
  { label: 'おくすり', value: 1, enLabel: 'MEDICINE' },
  { label: '外用薬', value: 2, enLabel: 'EXTERNAL_MEDICINE' },
  { label: '内服薬', value: 3, enLabel: 'INTERNAL_MEDICINE1' },
  { label: 'のみ薬', value: 4, enLabel: 'INTERNAL_MEDICINE2' },
  { label: 'ぬり薬', value: 5, enLabel: 'CREAM' },
  { label: '点眼薬', value: 6, enLabel: 'EYE_DROP' }
]
export const typeInfo = [
  { label: 'お知らせ', value: 1, enLabel: 'BASIC' },
  { label: 'ご案内', value: 2, enLabel: 'INFO' },
  { label: '予防のご案内', value: 3, enLabel: 'INFO_PREVENT' },
  { label: '検査報告', value: 10, enLabel: 'LAB_REPORT' },
  { label: '会計・お支払いのご案内', value: 20, enLabel: 'INFO_PAYMENT' },
  { label: 'キャンペーン', value: 50, enLabel: 'CAMPAIGN' }
]
export const typeDisplay = [
  { label: '下書き', value: 1, enLabel: 'DRAFT', color: '#ffab00' },
  { label: '非表示', value: 2, enLabel: 'HIDE', color: '#344563' },
  { label: '公開中', value: 3, enLabel: 'SHARE', color: '#36b37e' }
]
// export const typeMemoCarte = [
//   { label: '病院問診', value: 1, enLabel: 'Q_CLINIC', color: 'orange' },
//   { label: '患者問診', value: 2, enLabel: 'Q_CUSTOMER', color: 'pink' },
//   { label: '診察', value: 5, enLabel: 'SERVICE', color: 'orange' },
//   { label: '手術/麻酔', value: 6, enLabel: 'OPE', color: 'pink' },
//   { label: '電話', value: 10, enLabel: 'PHONE', color: 'deep-orange' },
//   { label: '美容', value: 15, enLabel: 'SALON', color: 'brown' },
//   { label: '他', value: 20, enLabel: 'OTHER', color: 'brown' },
//   { label: '他2', value: 21, enLabel: 'OTHER', color: 'brown' }
// ]
export const noAutoCorrect = -100
export const typeMemoCarteSource = [
  { label: '連携なし', value: 1, enLabel: 'NONE', color: 'orange' },
  { label: '入院', value: 2, enLabel: 'HOSPITALIZATION', color: 'pink' },
  { label: '手術/麻酔', value: 5, enLabel: 'OPE', color: 'orange' },
  { label: '美容', value: 6, enLabel: 'SHAMPOO', color: 'pink' },
  { label: 'フード', value: 10, enLabel: 'FOOD', color: 'deep-orange' }
]
export const typeLabProcess = [
  { label: 'ペット連携済', value: 1, enLabel: 'CONNECTED_PET_CONVERTED' },
  { label: 'ペット未連携', value: 2, enLabel: 'PRE_PET_CONVERTED' },
  { label: '検査結果未連携', value: 3, enLabel: 'CONNECTED_PET_UNCONVERTED' },
  { label: 'ペット&検査結果未連携', value: 4, enLabel: 'PRE_PET_UNCONVERTED' }
]
export const typeYearPeriod = [
  { label: '今年', value: 1, enLabel: 'THISYEAR' },
  { label: '去年', value: 2, enLabel: 'LASTYEAR' },
  { label: '全期間', value: 3, enLabel: 'WHOLEPERIOD' }
]
export const timeHourMinute = [
  { label: '07:00', value: '07:00', enLabel: '07:00' },
  { label: '07:15', value: '07:15', enLabel: '07:15' },
  { label: '07:30', value: '07:30', enLabel: '07:30' },
  { label: '07:45', value: '07:45', enLabel: '07:45' },
  { label: '08:00', value: '08:00', enLabel: '08:00' },
  { label: '08:15', value: '08:15', enLabel: '08:15' },
  { label: '08:30', value: '08:30', enLabel: '08:30' },
  { label: '08:45', value: '08:45', enLabel: '08:45' },
  { label: '09:00', value: '09:00', enLabel: '09:00' },
  { label: '09:15', value: '09:15', enLabel: '09:15' },
  { label: '09:30', value: '09:30', enLabel: '09:30' },
  { label: '09:45', value: '09:45', enLabel: '09:45' },
  { label: '10:00', value: '10:00', enLabel: '10:00' },
  { label: '10:15', value: '10:15', enLabel: '10:15' },
  { label: '10:30', value: '10:30', enLabel: '10:30' },
  { label: '10:45', value: '10:45', enLabel: '10:45' },
  { label: '11:00', value: '11:00', enLabel: '11:00' },
  { label: '11:15', value: '11:15', enLabel: '11:15' },
  { label: '11:30', value: '11:30', enLabel: '11:30' },
  { label: '11:45', value: '11:45', enLabel: '11:45' },
  { label: '12:00', value: '12:00', enLabel: '12:00' },
  { label: '12:15', value: '12:15', enLabel: '12:15' },
  { label: '12:30', value: '12:30', enLabel: '12:30' },
  { label: '12:45', value: '12:45', enLabel: '12:45' },
  { label: '13:00', value: '13:00', enLabel: '13:00' },
  { label: '13:15', value: '13:15', enLabel: '13:15' },
  { label: '13:30', value: '13:30', enLabel: '13:30' },
  { label: '13:45', value: '13:45', enLabel: '13:45' },
  { label: '14:00', value: '14:00', enLabel: '14:00' },
  { label: '14:15', value: '14:15', enLabel: '14:15' },
  { label: '14:30', value: '14:30', enLabel: '14:30' },
  { label: '14:45', value: '14:45', enLabel: '14:45' },
  { label: '15:00', value: '15:00', enLabel: '15:00' },
  { label: '15:15', value: '15:15', enLabel: '15:15' },
  { label: '15:30', value: '15:30', enLabel: '15:30' },
  { label: '15:45', value: '15:45', enLabel: '15:45' },
  { label: '16:00', value: '16:00', enLabel: '16:00' },
  { label: '16:15', value: '16:15', enLabel: '16:15' },
  { label: '16:30', value: '16:30', enLabel: '16:30' },
  { label: '16:45', value: '16:45', enLabel: '16:45' },
  { label: '17:00', value: '17:00', enLabel: '17:00' },
  { label: '17:15', value: '17:15', enLabel: '17:15' },
  { label: '17:30', value: '17:30', enLabel: '17:30' },
  { label: '17:45', value: '17:45', enLabel: '17:45' },
  { label: '18:00', value: '18:00', enLabel: '18:00' },
  { label: '18:15', value: '18:15', enLabel: '18:15' },
  { label: '18:30', value: '18:30', enLabel: '18:30' },
  { label: '18:45', value: '18:45', enLabel: '18:45' },
  { label: '19:00', value: '19:00', enLabel: '19:00' },
  { label: '19:15', value: '19:15', enLabel: '19:15' },
  { label: '19:30', value: '19:30', enLabel: '19:30' },
  { label: '19:45', value: '19:45', enLabel: '19:45' },
  { label: '20:00', value: '20:00', enLabel: '20:00' },
  { label: '20:15', value: '20:15', enLabel: '20:15' },
  { label: '20:30', value: '20:30', enLabel: '20:30' },
  { label: '20:45', value: '20:45', enLabel: '20:45' },
  { label: '21:00', value: '21:00', enLabel: '21:00' },
  { label: '21:15', value: '21:15', enLabel: '21:15' },
  { label: '21:30', value: '21:30', enLabel: '21:30' },
  { label: '21:45', value: '21:45', enLabel: '21:45' },
  { label: '22:00', value: '22:00', enLabel: '22:00' },
  { label: '22:15', value: '22:15', enLabel: '22:15' },
  { label: '22:30', value: '22:30', enLabel: '22:30' },
  { label: '22:45', value: '22:45', enLabel: '22:45' },
  { label: '23:00', value: '23:00', enLabel: '23:00' },
  { label: '23:15', value: '23:15', enLabel: '23:15' },
  { label: '23:30', value: '23:30', enLabel: '23:30' },
  { label: '23:45', value: '23:45', enLabel: '23:45' },
  { label: '00:00', value: '00:00', enLabel: '00:00' },
  { label: '00:15', value: '00:15', enLabel: '00:15' },
  { label: '00:30', value: '00:30', enLabel: '00:30' },
  { label: '00:45', value: '00:45', enLabel: '00:45' },
  { label: '01:00', value: '01:00', enLabel: '01:00' },
  { label: '01:15', value: '01:15', enLabel: '01:15' },
  { label: '01:30', value: '01:30', enLabel: '01:30' },
  { label: '01:45', value: '01:45', enLabel: '01:45' },
  { label: '02:00', value: '02:00', enLabel: '02:00' },
  { label: '02:15', value: '02:15', enLabel: '02:15' },
  { label: '02:30', value: '02:30', enLabel: '02:30' },
  { label: '02:45', value: '02:45', enLabel: '02:45' },
  { label: '03:00', value: '03:00', enLabel: '03:00' },
  { label: '03:15', value: '03:15', enLabel: '03:15' },
  { label: '03:30', value: '03:30', enLabel: '03:30' },
  { label: '03:45', value: '03:45', enLabel: '03:45' },
  { label: '04:00', value: '04:00', enLabel: '04:00' },
  { label: '04:15', value: '04:15', enLabel: '04:15' },
  { label: '04:30', value: '04:30', enLabel: '04:30' },
  { label: '04:45', value: '04:45', enLabel: '04:45' },
  { label: '05:00', value: '05:00', enLabel: '05:00' },
  { label: '05:15', value: '05:15', enLabel: '05:15' },
  { label: '05:30', value: '05:30', enLabel: '05:30' },
  { label: '05:45', value: '05:45', enLabel: '05:45' },
  { label: '06:00', value: '06:00', enLabel: '06:00' },
  { label: '06:15', value: '06:15', enLabel: '06:15' },
  { label: '06:30', value: '06:30', enLabel: '06:30' },
  { label: '06:45', value: '06:45', enLabel: '06:45' }
]
export const typeAudioSpeedOptions = [
  { label: '0.5', value: 0.5 },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
  { label: '2.5', value: 2.5 }
]
export const timeHour = [
  { label: '07', value: '07', enLabel: '07' },
  { label: '08', value: '08', enLabel: '08' },
  { label: '09', value: '09', enLabel: '09' },
  { label: '10', value: '10', enLabel: '10' },
  { label: '11', value: '11', enLabel: '11' },
  { label: '12', value: '12', enLabel: '12' },
  { label: '13', value: '13', enLabel: '13' },
  { label: '14', value: '14', enLabel: '14' },
  { label: '15', value: '15', enLabel: '15' },
  { label: '16', value: '16', enLabel: '16' },
  { label: '17', value: '17', enLabel: '17' },
  { label: '18', value: '18', enLabel: '18' },
  { label: '19', value: '19', enLabel: '19' },
  { label: '20', value: '20', enLabel: '20' },
  { label: '21', value: '21', enLabel: '21' },
  { label: '22', value: '22', enLabel: '22' },
  { label: '23', value: '23', enLabel: '23' },
  { label: '00', value: '00', enLabel: '00' },
  { label: '01', value: '01', enLabel: '01' },
  { label: '02', value: '02', enLabel: '02' },
  { label: '03', value: '03', enLabel: '03' },
  { label: '04', value: '04', enLabel: '04' },
  { label: '05', value: '05', enLabel: '05' },
  { label: '06', value: '06', enLabel: '06' }
]
export const timeMinute = [
  { label: '00', value: '00', enLabel: '00' },
  { label: '05', value: '05', enLabel: '05' },
  { label: '10', value: '10', enLabel: '10' },
  { label: '15', value: '15', enLabel: '15' },
  { label: '20', value: '20', enLabel: '20' },
  { label: '25', value: '25', enLabel: '25' },
  { label: '30', value: '30', enLabel: '30' },
  { label: '35', value: '35', enLabel: '35' },
  { label: '40', value: '40', enLabel: '40' },
  { label: '45', value: '45', enLabel: '45' },
  { label: '50', value: '50', enLabel: '50' },
  { label: '55', value: '55', enLabel: '55' },
  { label: '60', value: '60', enLabel: '60' }
]
export const audioSpeedOptions = [
  { label: '0.5', value: 0.5 },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
  { label: '2.5', value: 2.5 }
]
export const typeThreadClassification = [
  { label: '報告', value: 1, enLabel: 'REPORT' },
  { label: '承認が必要', value: 2, enLabel: 'APPROVAL_REQUIRED' },
  { label: '指示の要求', value: 3, enLabel: 'REQUEST_FOR_INSTRUCTIONS' },
  { label: 'その他', value: 10, enLabel: 'OTHERS' }
]
export const typeCustomerThread = [
  { label: 'すべて', value: null, enLabel: 'ALL' },
  { value: 50, label: '処方箋の予約', enLabel: 'BOOKING_PRESCRIPTION' },
  { value: 60, label: 'ホテルの予約', enLabel: 'BOOKING_HOTEL' },
  { value: 70, label: '美容の予約', enLabel: 'BOOKING_SALON' },
  { value: 80, label: 'オンライン相談', enLabel: 'BOOKING_WEB' },
  { value: 90, label: 'メッセージ相談', enLabel: 'BOOKING_MESSAGE' }
]
export const typeLinkCategory = [
  { label: 'なし', value: 0, enLabel: 'NONE' },
  { label: 'リクエスト', value: 1, enLabel: 'REQUEST' },
  { label: 'サービス', value: 2, enLabel: 'SERVICE' },
  { label: '処方箋', value: 3, enLabel: 'PRESCRIPTION' },
  { label: 'メモカルテ', value: 4, enLabel: 'MEMO_CHART' },
  { label: 'タスク', value: 5, enLabel: 'TASK' },
  { label: '会計', value: 6, enLabel: 'TOTAL' }
]
export const typeBooking = [
  { label: '予約なし', value: 1, enLabel: 'NO_BOOKING' },
  { label: '予約', value: 2, enLabel: 'CONFIRMED_BOOKING' },
  { label: '予約（未確定）', value: 3, enLabel: 'UNCONFIRMED_BOOKING' }
]
export const typeRepeatRangeUi = [
  { label: '5分', value: 1, enLabel: '5M' },
  { label: '10分', value: 2, enLabel: '10M' },
  { label: '15分', value: 3, enLabel: '15M' },
  { label: '20分', value: 4, enLabel: '20M' },
  { label: '30分', value: 5, enLabel: '30M' },
  { label: '45分', value: 6, enLabel: '45M' },
  { label: '1時間', value: 11, enLabel: '1H' },
  { label: '1.5時間', value: 12, enLabel: '1.5H' },
  { label: '2時間', value: 13, enLabel: '2H' },
  { label: '3時間', value: 14, enLabel: '3H' },
  { label: '4時間', value: 15, enLabel: '4H' },
  { label: '5時間', value: 16, enLabel: '5H' },
  { label: '6時間', value: 17, enLabel: '6H' },
  { label: '7時間', value: 18, enLabel: '7H' },
  { label: '8時間', value: 19, enLabel: '8H' },
  { label: '1日', value: 31, enLabel: '1D' },
  { label: '2日', value: 32, enLabel: '2D' },
  { label: '3日', value: 33, enLabel: '3D' },
  { label: '4日', value: 34, enLabel: '4D' },
  { label: '5日', value: 35, enLabel: '5D' },
  { label: '6日', value: 36, enLabel: '6D' },
  { label: '1週', value: 41, enLabel: '1W' },
  { label: '2週', value: 42, enLabel: '2W' },
  { label: '3週', value: 43, enLabel: '3W' },
  { label: '1ヵ月', value: 61, enLabel: '1MO' }
]
export const typeRepeatTimeUi = [
  { label: '1', value: 1, enLabel: '1' },
  { label: '2', value: 2, enLabel: '2' },
  { label: '3', value: 3, enLabel: '3' },
  { label: '4', value: 4, enLabel: '4' },
  { label: '5', value: 5, enLabel: '5' },
  { label: '6', value: 6, enLabel: '6' },
  { label: '7', value: 7, enLabel: '7' },
  { label: '8', value: 8, enLabel: '8' },
  { label: '9', value: 9, enLabel: '9' },
  { label: '10', value: 10, enLabel: '10' },
  { label: '11', value: 11, enLabel: '11' },
  { label: '12', value: 12, enLabel: '12' },
  { label: '13', value: 13, enLabel: '13' },
  { label: '14', value: 14, enLabel: '14' },
  { label: '15', value: 15, enLabel: '15' },
  { label: '16', value: 16, enLabel: '16' },
  { label: '17', value: 17, enLabel: '17' },
  { label: '18', value: 18, enLabel: '18' },
  { label: '19', value: 19, enLabel: '19' },
  { label: '20', value: 20, enLabel: '20' }
]
export const fixedCode = {
  category_hospitalization: 'IBM_ISC201'
}
export const codeCommonList = [
  { label: '動物種', value: 1, enLabel: 'ANIMAL_SPECIES' },
  { label: '動物品種', value: 2, enLabel: 'ANIMAL_BREED' },
  // { label: '★毛色', value: 3, enLabel: 'HAIR_COLOR' }, //=> Cli-CM : 941 ; m_pet
  { label: '単位', value: 4, enLabel: 'UNIT' },
  { label: '錠剤分割', value: 5, enLabel: 'PILL_DIVISION' },
  { label: '保険傷病', value: 6, enLabel: 'INS_DISEASE' },
  { label: '検査機器', value: 7, enLabel: 'MEDICAL_DEVICE' },
  // { label: '★預かり品', value: 8, enLabel: 'CUSTODY_ITEM' }, //=> Cli-CM : 935 ; t-custody-checklist and m-custody
  // { label: '★病院部門', value: 9, enLabel: 'DEPARTMENT_TYPE' },
  // { label: '★ペット注意事項', value: 10, enLabel: 'TYPE_PET_NATURE' }, //=> Cli-CM : 942 ; m_pet, ViewPetDetail modal
  { label: '治療サービス区分', value: 11, enLabel: 'TYPE_ITEM_SERVICE' },
  { label: '薬品形状', value: 12, englishLabel: 'TYPE_MEDICINE_FORMAT' },
  { label: '★支払方法', value: 14, enLabel: 'TYPE_PAYMENT_METHOD' }, //=> Cli-CM : 939 ; t-payment , payment mdoal
  { label: '資料提供元', value: 15, enLabel: 'TYPE_FILE_PROVIDER' },
  // { label: '★会員', value: 25, enLabel: 'CUSTOMER_COLOR' }, //=> Cli-CM : 936 ; m_customer
  { label: '★保健所', value: 26, enLabel: 'PUBLIC_HEALTH_CENTER' }, //=> Cli-CM : 938 ; not yet used
  { label: '★投与経路', value: 27, enLabel: 'TYPE_MED_ROUTE' }, //=> Cli-CM : 946 ; not yet used
  { label: '印刷サイズ', value: 28, enLabel: 'PRINT_SIZE' },
  { label: '保険会社', value: 29, enLabel: 'INSURER' },
  // { label: '★デフォルト割引率', value: 30, enLabel: 'DISCOUNT_RATE' } //=> Cli-CM : 940 ; m_customer & m_pet
  { label: 'IDEXX検査', value: 31, enLabel: 'INSURER' }
]
export const codeCliCommonList = [
  { label: '病院部門', value: 1, enLabel: 'TYPE_DEPARTMENT' },
  { label: '預かり品', value: 2, enLabel: 'CUSTODY_ITEM' },
  { label: '会員', value: 3, enLabel: 'CUSTOMER_COLOR' },
  { label: '受付区分', value: 4, enLabel: 'QT_VISITING_PURPOSE' },
  { label: '保健所', value: 5, enLabel: 'PUBLIC_HEALTH_CENTER' },
  { label: '支払方法', value: 6, enLabel: 'TYPE_PAYMENT_METHOD' },
  { label: '割引率', value: 7, enLabel: 'DISCOUNT_RATE' },
  { label: '毛色', value: 8, enLabel: 'HAIR_COLOR' },
  { label: 'ペット注意事項', value: 9, enLabel: 'TYPE_PET_NATURE' },
  { label: '診断情報', value: 10, enLabel: 'TYPE_DIAGNOSIS' },
  { label: 'カルテ区分', value: 11, enLabel: 'TYPE_CARTE_SOURCE' },
  { label: '来院理由', value: 12, enLabel: 'QUESTIONNAIRE_VISIT' },
  { label: '投与経路', value: 13, enLabel: 'TYPE_MED_ROUTE' },
  { label: '診療評価', value: 14, enLabel: 'TYPE_MED_REVIEW' },
  { label: '食事状態', value: 51, englishLabel: 'TYPE_REVIEW_FOOD' },
  { label: '水分摂取', value: 52, enLabel: 'TYPE_REVIEW_WATR' },
  { label: '排便状態', value: 53, enLabel: 'TYPE_REVIEW_FECES' },
  { label: '排尿状態', value: 54, enLabel: 'TYPE_REVIEW_URINE' },
  { label: '嘔吐状態', value: 55, enLabel: 'TYPE_REVIEW_VOMIT' },
  { label: '呼吸状態', value: 56, enLabel: 'TYPE_REVIEW_RESPIRATION' },
  { label: '活動状態', value: 57, enLabel: 'TYPE_REVIEW_WELLNESS' },
  { label: '体温状態', value: 58, enLabel: 'TYPE_REVIEW_TEMPERATURE' },
  { label: 'BCS', value: 201, enLabel: 'MED_CON_BCS' },
  { label: '心雑音', value: 202, enLabel: 'MED_CON_HEART_NOISE' },
  { label: '肺音', value: 203, enLabel: 'MED_CON_LUNG_NOISE' },
  { label: '体表リンパ節', value: 204, enLabel: 'MED_CON_LYMPH_NODE' },
  { label: 'CRT', value: 205, enLabel: 'MED_CON_CRT' },
  { label: '可視粘膜', value: 206, enLabel: 'MED_CON_MEMBRANE' },
  { label: '脱水評価', value: 207, enLabel: 'MED_CON_DEHYDRATION' },
  { label: '心音', value: 208, enLabel: 'MED_CON_HEART_BEAT' }
]

export const typeUnitBit = [
  { label: '検査 単位', value: 1024, checked: false },
  { label: '医薬品 単位', value: 512, checked: false },
  { label: '商品・サービス 単位', value: 256, checked: false },
  { label: 'efficacy', value: 128, checked: false }
]

export const anicomProgC = [
  { value: 1, label: '治ゆ' },
  { value: 2, label: '継続' },
  { value: 3, label: '転移' },
  { value: 4, label: '死亡' }
]

export const typeStatusApplication = [
  { value: 1, label: '準備中', enLabel: 'Prepare' },
  { value: 11, label: '一時保留', enLabel: 'Pending' },
  { value: 20, label: '請求済', enLabel: 'Submitted' }
  //   { value: 30, label: '請求後・更新', enLabel: 'Update' },
  //   { value: 40, label: '承認', enLabel: 'Approved' },
  //   { value: 50, label: '部分承認', enLabel: 'Approved Partially' },
  //   { value: 80, label: 'キャンセル', enLabel: 'Cancelled' },
  //   { value: 99, label: '拒絶', enLabel: 'Rejected' }
]

export const typeReserved = [
  { value: 1, label: 'ホテル', enLabel: 'HOTEL' },
  { value: 2, label: '薬', enLabel: 'MEDICINE' },
  { value: 3, label: '美容', enLabel: 'BEAUTY' },
  { value: 4, label: '相談', enLabel: 'CONSULTATION' },
  { value: 5, label: '有料相談', enLabel: 'PAID_QUESTION' }
]

export const typeEmpInfo = [
  { value: 1, label: '連絡', enLabel: 'NORMAL' },
  { value: 2, label: 'スケジュール', enLabel: 'SCHEDULE' },
  { value: 3, label: 'いただきもの', enLabel: 'GIFTS' },
  { value: 4, label: '幸せ・成果共有', enLabel: 'HAPPY' },
  { value: 5, label: 'お叱り・CL', enLabel: 'BAD' },
  { value: 6, label: '緊急', enLabel: 'URGENT' },
  { value: 7, label: 'シャウト', enLabel: 'SHOUT' },
  { value: 8, label: 'その他', enLabel: 'OTHER' }
]

export const typeEmpInfoRead = [
  { value: 1, label: '指定なし', enLabel: 'NO_EMP' },
  { value: 2, label: '全員', enLabel: 'ALL' },
  { value: 3, label: '部署', enLabel: 'DEPARTMENT' },
  { value: 4, label: '個人', enLabel: 'INDIVIDUAL' }
]

export const typePpsQt = [
  { label: 'myVetty整理券を使用しない', value: 0 },
  { label: '獣医師選択可・myVetty決済可', value: 1 },
  { label: '獣医師選択可・myVetty決済不可', value: 2 },
  { label: '獣医師選択不可・myVetty決済可', value: 3 },
  { label: '獣医師選択不可・myVetty決済不可', value: 4 }
]

export const typeCheckinQt = [
  { label: 'ペットのみ選択', value: 0 }, //pet only
  { label: 'ペット・受付区分・担当の全て選択', value: 1 }, //all process
  { label: 'ペット・受付区分の選択', value: 2 } //Pet & purpose
  // {label: 'ペット・担当の選択', value: 3}
]

export const typeCarteConfig = [
  { label: 'TPR', value: 1 },
  { label: '生体情報全て', value: 2 },
  { label: 'メモカルテ [S] 主観的情報', value: 4 },
  { label: 'メモカルテ [O] 客観的情報', value: 8 },
  { label: '診察状態情報', value: 16 },
  { label: '[不使用]検査', value: 32 },
  { label: 'メモカルテ [A] 評価', value: 64 },
  { label: 'メモカルテ [P] 計画（共通表示）', value: 128 },
  { label: '関連資料', value: 256 }
]

export const typeDays = [
  { label: '日', value: 1 },
  { label: '週', value: 2 },
  { label: '月', value: 3 }
]

export const typeHistoryConfig = [
  { label: '既往歴', value: 1, checked: false },
  { label: '予防/健診', value: 2, checked: false },
  { label: '美容', value: 4, checked: false },
  { label: 'その他', value: 8, checked: false },
  { label: 'ホテル', value: 16, checked: false }
]

export const typeRabiesProcess = [
  { label: '院内処理前', value: 1 },
  { label: '院内登録済', value: 2 },
  { label: '申請済', value: 10 }
]

export const typeRabiesRound = [
  { label: '継続', value: 1 },
  { label: '新規', value: 2 }
]
export const preventativeCategoryList = ['MD10_1']

export const typeMemoCustomer = [
  { label: 'メモ', value: 1 },
  { label: 'TODO', value: 2 }
]

export const typePetExcludeReason = [
  { label: '譲渡', value: 2, enLabel: 'TRANSFERED' },
  { label: '転居', value: 3, enLabel: 'MOVED' },
  { label: '長期未来院', value: 4, enLabel: 'NO_SHOW' },
  { label: '販売', value: 10, enLabel: 'SOLD' },
  { label: '行方不明', value: 11, enLabel: 'LOST' },
  { label: 'その他', value: 99, enLabel: 'OTHER' }
]

export const typeCartDetailDefaultName = [
  { label: '商品名（親商品名）', value: 1, enLabel: 'IS_NAME' },
  { label: '品名包装単位名', value: 2, enLabel: 'ISU_NAME' },
  { label: '大分類名', value: 3, enLabel: 'CAT1_NAME' },
  { label: '子分類名', value: 4, enLabel: 'CAT2_NAME' },
  { label: '商品/サービス区分名', value: 5, enLabel: 'IS_TYPE_NAME' }
]

export const typePreventionV1 = [
  { label: '狂犬病', value: 1, enLabel: 'Rabies ' },
  { label: 'ノミ', value: 2, enLabel: 'Flea ' },
  { label: 'ダニ', value: 4, enLabel: 'Tick ' },
  { label: 'フィラリア', value: 8, enLabel: 'Filaria ' },
  { label: 'ワクチン', value: 16, enLabel: 'Vaccine ' },
  { label: '健康診断', value: 32, enLabel: 'Checkup ' }
]

export const typeDefaultGroupCartDetails = [
  { label: '自動グループ化なし', value: 1, enLabel: 'NO_GROUP' },
  { label: '処方箋単位', value: 2, enLabel: 'GROUP_PER_PH' },
  { label: '親分類単位', value: 3, enLabel: 'GROUP_PER_CAT1' },
  { label: '中分類単位', value: 4, enLabel: 'GROUP_PER_CAT2' },
  { label: '一包化単位', value: 5, enLabel: 'GROUP_PER_PD_TITLE' }
]

export const typeInsertedBodyPart = [
  { label: '首', value: 1 },
  { label: '右肩', value: 2 },
  { label: '左肩', value: 3 },
  { label: '背中', value: 4 },
  { label: '腹部', value: 5 },
  { label: '腰', value: 6 },
  { label: '臀部', value: 7 },
  { label: '左太もも', value: 8 },
  { label: '右太もも', value: 9 },
  { label: 'その他', value: 99 }
]

// export const typeInsertedBodyPart = [
//   { label: '首', value: 1 },
//   { label: '右肩', value: 2 },
//   { label: '左肩', value: 3 },
//   { label: '背中', value: 4 },
//   { label: '腹部', value: 5 },
//   { label: '腰', value: 6 },
//   { label: '臀部', value: 7 },
//   { label: '左太もも', value: 8 },
//   { label: '右太もも', value: 9 },
//   { label: 'その他', value: 99 },
// ]

export const typeCartBarCode = [
  { label: '表示なし', value: 1 },
  { label: 'QRコード', value: 2 },
  { label: 'CODE 128', value: 3 },
  { label: 'MSI', value: 4 },
  { label: 'Pharmacode', value: 5 },
  { label: 'EAN 13', value: 6 }
]

export const typePlusItemDefaultQuantity = [
  { label: '1', value: 1 },
  { label: '日数で指定', value: 2 },
  { label: '回数で指定', value: 3 }
]

export const printingSetting = [
  {
    label: 'まとめて印刷',
    binaryValue: 1,
    field: 'flg_print_all_in_one',
    value: true
  },
  { label: '表示医薬品名', binaryValue: 2, field: 'type_name', value: '5' },
  { label: '写真', binaryValue: 4, field: 'flg_show_image', value: true },
  {
    label: '薬剤分類名',
    binaryValue: 8,
    field: 'flg_display_classification_name',
    value: true
  },
  {
    label: '服用期間',
    binaryValue: 16,
    field: 'flg_display_duration_use',
    value: true
  },
  {
    label: '服用回数',
    binaryValue: 32,
    field: 'flg_display_doses_taken',
    value: true
  },
  {
    label: '服用メモ',
    binaryValue: 64,
    field: 'flg_memo_dose_display',
    value: true
  },
  {
    label: '効果効能',
    binaryValue: 128,
    field: 'flg_display_memo_efficacy',
    value: true
  },
  {
    label: '注意事項',
    binaryValue: 256,
    field: 'flg_display_memo_sideeffect',
    value: true
  },
  {
    label: '担当医',
    binaryValue: 512,
    field: 'flg_display_doctor',
    value: true
  },
  {
    label: '薬袋タイトル',
    binaryValue: 1024,
    field: 'type_print_bag_title',
    value: 1
  },
  {
    label: '一回服用分',
    binaryValue: 2048,
    field: 'flg_dosage_detail',
    value: true,
  },
  {
    label: '総数',
    binaryValue: 4096,
    field: 'flg_fraction',
    value: true,
  }
]

export const typeMedConditionColor = [
  {
    label: '普通/異常なし',
    value: 1,
    color: '#222222',
    backgroundColor: '#e0e0e0'
  },
  {
    label: 'やや低値/注意/青',
    value: 2,
    color: '#0084f0',
    backgroundColor: '#ffffff'
  },
  {
    label: '低値/異常/要注意/濃青',
    value: 3,
    color: '#0061b1',
    backgroundColor: '#c2f3ff'
  },
  {
    label: 'やや高値/注意/薄赤',
    value: 4,
    color: '#dd0000',
    backgroundColor: '#ffffff'
  },
  {
    label: '高値/異常/要注意/濃赤',
    value: 5,
    color: '#9f0000',
    backgroundColor: '#ecf100'
  }
]

export const wholePillOptions = [
  { label: '', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: '11', value: 11 },
  { label: '12', value: 12 },
  { label: '13', value: 13 },
  { label: '14', value: 14 },
  { label: '15', value: 15 },
  { label: '16', value: 16 },
  { label: '17', value: 17 },
  { label: '18', value: 18 },
  { label: '19', value: 19 },
  { label: '20', value: 20 }
]

export const partialPillOptions = [
  { label: '', value: 0 },
  { label: '1/2', value: 0.5 },
  { label: '1/3', value: 0.33334 },
  { label: '2/3', value: 0.667 },
  { label: '1/4', value: 0.25 },
  { label: '3/4', value: 0.75 },
  { label: '1/5', value: 0.2 },
  { label: '2/5', value: 0.4 },
  { label: '3/5', value: 0.6 },
  { label: '4/5', value: 0.8 },
  { label: '1/6', value: 0.1666 },
  { label: '5/6', value: 0.833 },
  { label: '1/7 ', value: 0.1428 },
  { label: '2/7 ', value: 0.2857 },
  { label: '3/7 ', value: 0.4285 },
  { label: '4/7', value: 0.5714 },
  { label: '5/7', value: 0.7142 },
  { label: '6/7 ', value: 0.8571 },
  { label: '1/8', value: 0.125 },
  { label: '3/8', value: 0.375 },
  { label: '5/8', value: 0.625 },
  { label: '7/8', value: 0.875 },
  { label: '1/11', value: 0.0909 },
  { label: '2/11 ', value: 0.1818 },
  { label: '3/11', value: 0.2727 },
  { label: '4/11', value: 0.3636 },
  { label: '5/11', value: 0.4545 },
  { label: '6/11', value: 0.5454 },
  { label: '7/11', value: 0.6363 },
  { label: '8/11', value: 0.7272 },
  { label: '9/11', value: 0.8181 },
  { label: '10/11', value: 0.9090 },
  { label: '1/12', value: 0.083 },
  { label: '5/12', value: 0.416 },
  { label: '7/12', value: 0.583 },
  { label: '11/12', value: 0.916 },
  { label: '1/13', value: 0.0769 },
  { label: '2/13', value: 0.1538 },
  { label: '3/13', value: 0.2307 },
  { label: '4/13', value: 0.3076 },
  { label: '5/13', value: 0.3846 },
  { label: '6/13', value: 0.4615 },
  { label: '7/13', value: 0.5384 },
  { label: '8/13', value: 0.6153 },
  { label: '9/13', value: 0.6923 },
  { label: '10/13', value: 0.7692 },
  { label: '11/13', value: 0.8461 },
  { label: '12/13', value: 0.9230 },
  { label: '1/14', value: 0.0714 },
  { label: '3/14', value: 0.2142 },
  { label: '5/14', value: 0.3571 },
  { label: '9/14', value: 0.6428 },
  { label: '11/14', value: 0.7857 },
  { label: '13/14', value: 0.9285 },
  { label: '1/15', value: 0.0667 },
  { label: '4/15', value: 0.2667 },
  { label: '7/15', value: 0.4667 },
  { label: '8/15', value: 0.5334 },
  { label: '11/15', value: 0.7334 },
  { label: '13/15', value: 0.8667 },
  { label: '14/15', value: 0.9334 },
  { label: '1/16', value: 0.0625 },
  { label: '3/16', value: 0.1875 },
  { label: '5/16', value: 0.3125 },
  { label: '7/16', value: 0.4375 },
  { label: '11/16', value: 0.6875 },
  { label: '13/16', value: 0.8125 },
  { label: '15/16', value: 0.9375 }
]
export const CONFIRM_MESSAGES = {
  COMPLETE_REQUEST: {
    title: 'リクエストを完了しますか？',
    message: '以下の変更を適用します。\n' +
           '①会計対象項目は追加できなくなります\n' +
           '②未完了の項目を完了ステータスに更新します',
    button: 'OK'
  },
  UNDO_REQUEST: {
    title: 'リクエストを未完了にします。',
    message: 'リクエストを未完了にしますか？',
    button: 'OK'
  }
};

export const TYPE_QT_REQUEST = [
  { label: 'オーナー単位で既存RQ1つあればそのRQを使用', value: 0 },
  { label: 'オーナー単位で毎回新規RQ', value: 1 },
  { label: 'ペット単位で毎回新規RQ', value: 2 }
]

export const typeProjectPurpose = [
  { label: '入社', value: 1 },
  { label: 'スキル', value: 2 },
  { label: '接遇・マナー', value: 3 },
  { label: '知識', value: 4 },
  { label: '顧客', value: 5 },
  { label: 'プロジェクト', value: 6 },
  { label: 'チェックリスト', value: 7 },
  { label: 'その他', value: 99 }
]

export const typePjWorkhour = [
  { label: '勤務時間内', value: 1 },
  { label: '時間外', value: 2 },
  { label: '時間内及び時間外', value: 3 }
]

export const typeProjectClass = [
  { label: '初級', value: 1 },
  { label: '中級', value: 2 },
  { label: '上級', value: 3 }
]