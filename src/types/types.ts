import {
  type CalendarClinicPlanDetail,
  type CalendarInjectDetail,
  type CalendarPrescriptionDetail,
  type CalendarServiceDetail
} from '@/stores/business-calendar-days'
import { type CSSProperties } from 'vue'

export type BasicApiResponseType<T> = {
  data: T
  message: string
  code: string
  status: string
}

export type GenericArrayType<T> = {
  [k: string]: boolean | number | string | T
}

export type ValueOf<T> = T[keyof T]

export type GenericValueLabelType = {
  value: number
  label: string
  enLabel?: string
}

export interface LoginInput {
  id_ticket_login: string
  password: string
}

export type AddressType = {}

export type CustomerType = {
  id: number
  id_customer: number
  id_clinic: string
  flg_customer: boolean
  flg_employee: boolean
  id_employee: string
  id_employee_doctor: string
  flg_supplier: boolean
  code_customer_ex: string
  code_customer: number
  flg_unpaid: boolean
  flg_complaint: boolean
  type_customer_color: number
  flg_second_opinion: boolean
  flg_referral: boolean
  memo_referral: string
  datetime_referral_visit: string
  status_customer: number
  type_customer: number
  name_customer_display: string
  id_discount_rate: string
  name_family: string
  name_first: string
  name_kana_family: string
  name_kana_first: string
  name_customer_search: string
  name_corporate: string
  name_kana_corporate: string
  url_supplier: string
  name_supplier: string
  name_kana_supplier: string
  email_title1: string
  email1: string
  email_title2: string
  email2: string
  type_gender: number
  flg_group_account: boolean
  id_customer_master: string
  type_group_account: number
  phone_title1: string
  phone1: string
  phone_title2: string
  phone2: string
  phone_emergency: string
  memo_customer: string
  memo_alert: string
  pps_login_id: string
  password: string
  flg_login_access: boolean
  datetime_last_login_updated: string
  name_customer_updated: string
  phone_customer_updated: string
  email_customer_updated: string
  type_notification_settings: number
  flg_push_notification: boolean
  flg_display_loss: boolean
  flg_payment_method: boolean
  id_stripe: string
  id_paypay: string
  datetime_register: string
  datetime_last_visit: string
  flg_dm: boolean
  line_user_id: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  pets: PetType[]
  address: AddressType[]
  customer_tel: CustomerTelephoneType[]
  label?: string
  value?: string | number
}

export interface EmployeeType {
  id_employee: string | number
  id_clinic: string
  code_employee: string
  type_employee: number
  type_department: number
  type_occupation: number
  type_position: number
  name_display: string
  name_family: string
  name_first: string
  name_kana_family: string
  name_kana_first: string
  birthday: string
  type_gender: number
  zip_code: string
  address_prefecture: string
  address_city: string
  address_other: string
  phone_title1: string
  phone1: string
  phone_title2: string
  phone2: string
  phone_emergency: string
  email_title1: string
  email1: string
  email_title2: string
  email2: string
  memo_employee: string
  login_id: string
  password: string
  datetime_login_pw_updated: string
  flg_login_disabled: boolean
  image_path1: string
  image_public_path1: string
  date_joined: string
  flg_calendar: boolean
  flg_resignation: boolean
  date_resignation: string
  flg_cart_approver: number
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type LabResultValue = {
  result: string
  dateRegistered: string
}

export type LabResult = {
  seq_processed: number
  id_lab_result: number
  name_unit_result: string
  name_unit_device: string
  name_device: string
  name_lab: string
  val_result: string
  low_critical: string
  low: string
  high: string
  high_critical: string
  qualifier: string
  flg_from_device_range: boolean
  datetime_registered: string
  memo_alert: string
  instacc_no: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_employee_insert: number
  id_employee_registered: number
  id_employee_update: number
  id_lab: number
  id_pet: number
  id_pet_illness_history: number
  id_service_detail: string
  accession_no: string
  id_cm_device: number
  id_cm_unit: number
  id_category2_lab: number
  id_category2_lb2: number
  value: Array<LabResultValue>
}

export type PaymentRequest = {
  id: number
  id_payment_request: string
  amount: number
  flg_paid: boolean
  memo: string
  datetime_insert: string
  datetime_update: string
  id_employee_insert_id: string
  customer_id: number
}
export type Payment = {
  id_payment: string
  number_payment: string
  flg_payment_advance: boolean
  flg_refund: boolean
  type_payment: string
  type_payment_category: number
  type_payment_method: number
  type_cc_brand: number
  number_cc_last_four_digits: string
  datetime_bill: string
  datetime_refund_conducted: string
  amount_payment: number
  amount_payment_paid: number
  amount_change: number
  type_payment_status: number
  id_payment_link1: string
  id_payment_link2: string
  name_customer_full: string
  name_kana_customer_full: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_cart: string
  id_customer: string
  id_pet: string
}

export type PaymentReceipt = {
  id_payment_receipt: string
  number_payment_receipt: string
  number_payment_receipt_reissue: number
  id_payment: string
  id_cart: string
  number_cart: string
  id_customer: string
  id_pet: string
  amount_receipt: number
  vat08_amount_receipt: number
  vat10_amount_receipt: number
  tax08_amount: number
  tax10_amount: number
  id_clinic: string
  datetime_publish: Date
  id_customer_name: string
  flg_proviso_medical_treatment: boolean
  flg_proviso_prescription: boolean
  flg_proviso_vaccine: boolean
  memo_proviso: string
  flg_cash: boolean
  breakdown_cash: number
  date_publish_cash: Date
  abstract_cash: string
  flg_cc: boolean
  breakdown_cc: number
  date_publish_cc: Date
  abstract_cc: string
  flg_bank_transfer: boolean
  breakdown_bank_transfer: number
  date_publish_bank_transfer: Date
  abstract_bank_transfer: string
  flg_payment_method: boolean
  name_payment_method: string
  breakdown_payment_method: number
  date_publish_payment_method: Date
  abstract_payment_method: string
  flg_download: boolean
  datetime_download: Date
  flg_payment_receipt_reissue: boolean
  datetime_payment_receipt_reissue: Date
  reason_payment_receipt_reissue: string
  remarks: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: Date
  id_employee_update: string
  datetime_update: Date
}

export type CartBalance = {
  id_cart_balance: string
  name_customer: string
  datetime_paid_last: Date
  flg_delete: boolean
  id_customer: string
  amount_adjustment: number | null
  bal_last: number | null
  bal_updated: number | null
  datetime_insert: Date
  datetime_update: Date
  id_employee_insert: string
  id_employee_update: string
}

export interface CartDetailAssort {
  id_cart_detail_assort: string
  quantity: number
  unit_sales: number | null
  amount_sales: number | null
  unit_price: number | null
  amount_price: number | null
  flg_delete: boolean
  datetime_insert: Date
  datetime_update: Date
  id_cart: string
  id_cart_detail: string
  id_employee_insert: string | null
  id_employee_update: string | null
  id_item_service_unit: string | null
  id_prescription_detail_assort: string | null
  id_service_detail: string | null
}

export type BreedType = {
  id_breed: string
  code_breed: string
  name_breed: string
  name_abbr: string
  type_animal: number
  life_span_average: number
  memo_nature: string
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  value?: string
  label?: string
}

export type CageType = {
  id_cage: string
  id_clinic: string
  id_room: string
  code_cage: string
  name_cage: string
  display_order: number
  flg_icu: boolean
  flg_usable: boolean
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type PetBioInfoType = {
  id_pet_bio_info: number | string
  id_customer: string
  id_pet: string
  val_weight: string
  val_temperature: number
  val_pressure_systolic: number
  val_pressure_diastolic: number
  val_pressure_mean_arterial: number
  val_blood_oxygen_level: number
  val_blood_carbon_dioxide_level: number
  val_respiration_rate: number
  val_heartbeat_rate: number
  datetime_measure: string
  type_measure_place: number
  memo_measure: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  id_feed?: string
  type_body_weight: number
}

export type PetBioConditionType = {
  id_pet_bio_condition: string
  id_customer: string
  id_pet: string
  type_review_food: number
  type_review_water: number
  type_review_feces: number
  type_review_urine: number
  type_review_vomit: number
  type_review_respiration: number
  type_review_wellness: number
  type_review_body_temperature: number
  datetime_record: number
  memo_record: string
  flg_delete: number
  datetime_insert: string
  datetime_update: boolean
  id_employee_insert: string
  id_employee_reviewed: string
  id_employee_update: string
  id_service_detail: string
  id_clinic?: string
}

export type RequestDetailPageType = {
  id_request: string
  title_request: string
  number_request: string
  id_pet: string
  id_customer: string
  code_customer: string
  name_customer: string
  name_pet: string
  id_employee_staff: string
  id_employee_doctor: string
  date_start: string
  date_end: string
  date_request_start: string
  date_request_goal: string
  memo_request: string
  flg_non_charge: boolean
  flg_in_app_payment: boolean
  id_employee_request: string
  flg_booking: boolean
  flg_complete: boolean
}

export type CartePerDateListType = {
  clinical_file: boolean
  date: string
  lab_result: boolean
  memo: string
  memo_carte_list: Array<Number>
  order: boolean
}

export type RoomType = {
  id_room: string
  level_floor: number
  name_room: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: string
  id_employee_insert: string
  id_employee_update: string
  clinic_facility: string
  cage_list: CageType[]
}

export type PetType = {
  id_pet: string
  image_path1: string
  image_path2?: string | null
  code_pet: string
  code_pet_ex?: string | null
  name_pet: string
  name_kana_pet: string
  name_kana_family: string
  name_pet_customer_updated: string
  type_title_pet_customer_updated: number
  flg_insurance_plan: boolean
  date_birth: string
  flg_unknown_dob: boolean
  type_pet_gender: number
  status_pet?: null
  flg_deceased: boolean
  type_animal: number
  memo_pet_by_customer: string
  flg_delete_by_customer: boolean
  type_blood?: null
  flg_transfusion_ok: boolean
  memo_transfusion?: null
  id_breed: string
  datetime_deceased: string
  type_pet_revised?: null
  status_ope_gender: number
  date_ope_gender: string
  flg_microchip: boolean
  microchip_id?: null
  date_register?: null
  date_last_visit?: null
  pet_alert: string
  memo_pet: string
  code_city_hall: string
  name_registered?: null
  datetime_licensed?: null
  license_id: string
  flg_existence: boolean
  flg_send_flower: boolean
  memo_send_flower: string
  date_send_flower?: null
  flg_pet_excluded: boolean
  flg_unlist: boolean
  flg_dm: boolean
  display_order: number
  memo_pet_info: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_customer: string
  id_cm_breed: number
  id_cm_hair: string
  id_employee_main_doctor: string
  id_employee_main: string
  id_discount_rate?: null
  id_cm_animal: number | string
  id_employee_insert: string
  id_employee_update: string
  label?: string
  value?: string
  pet_insurance?: Array<PetInsurance>
  last_service_detail?: ServiceDetailType
}

export type PetInsurance = {
  id_pet_insurance: string
  code_pet_x: string
  code_insurer: string
  c_sname: string
  ani_name: string
  pet_birthday: string
  code_insurance: string
  date_insurance_start: string
  date_insurance_end: string
  limit_amount_normal: number
  limit_amount_hospitalization: number
  limit_amount_surgery: number
  max_normal: number
  max_hospitalization: number
  max_surgery: number
  flg_insurance_main: boolean
  memo_insurance: string
  flg_delete: boolean
  display_order: number
  datetime_insert: string
  datetime_update: string
  coverage: string
  id_clinic: string
  id_cm_insurer: string
  id_employee_insert: string
  id_employee_update: string
  id_insurance_plan: string
  id_pet: string
  id_disease_insurer_out1: string
  id_disease_insurer_out2: string
  id_disease_insurer_out3: string
}

export type InsurancePlanType = {
  id_insurance_plan: string
  flg_available_insurance: boolean
  name_insurance_plan: string
  code_insurance_plan: string
  memo_insurance_plan: string
  url_insurance_plan: string
  term_insurance: string
  coverage: string
  limit_amount_normal: number
  limit_amount_hospitalization: number
  limit_amount_surgery: number
  max_normal: number
  max_hospitalization: number
  max_surgery: number
  flg_unavailable: boolean
  date_insurance_end: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: string
  id_cm_insurer: string
  id_employee_insert: string
  id_employee_update: string
  value?: string
  label?: string
}

export interface ServiceDetailType {
  id_service_detail: string
  number_service_detail: string
  type_service: number
  code_category2: string
  name_category1: string
  name_category2: string
  name_item_service: string
  quantity: number
  type_booking: number
  datetime_service_start: string
  datetime_service_end: string
  date_service_start: string
  date_service_end: string
  date_schedule: string
  flg_surgery: boolean
  flg_anesthesia: boolean
  flg_prevention: boolean
  type_prevention: number
  flg_pet_custody_control: boolean
  code_customer: string
  name_disease: string
  flg_complete: boolean
  flg_non_charge: boolean
  flg_next_cart: boolean
  memo_service: string
  flg_cancel: boolean
  memo_cancel: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  code_item_service: string
  id_category1: string
  id_category2: string
  id_clinic: string
  id_customer: string
  id_employee_doctor: string
  id_employee_insert: string
  id_employee_staff: string
  id_employee_update: string
  id_item_service_unit: string
  id_pet: string
  id_req_status: string
  id_request: string
  id_service_group: string
}

export type RequestType = {
  id_request?: string
  number_request: string | null
  title_request: string | null
  date_request_start: string | undefined | null
  date_request_goal: string | undefined | null
  flg_complete_payment: boolean
  flg_complete: boolean
  flg_non_charge?: boolean
  flg_in_app_payment?: boolean
  name_customer: string
  code_ahmics_customer?: null
  code_customer: string | null
  name_pet?: string
  flg_booking?: boolean
  flg_queue_ticket?: boolean
  memo_queue_ticket?: null
  memo_request?: string | null
  flg_cancel?: boolean
  datetime_cancel?: string | null
  memo_cancel?: string | null
  flg_request_update?: boolean
  flg_delete?: boolean
  datetime_insert?: string
  datetime_update?: string | null
  id_employee_request?: string
  id_employee_doctor?: string
  id_employee_staff?: string | null
  id_customer: string | null
  id_clinic: string | null
  id_pet: string | null
  id_queue_ticket?: string
  id_employee_cancel?: string | null
  id_employee_insert?: string
  id_employee_update?: string | null
  id_cm_animal_list?: string | null
  id_cm_breed_list?: string | null
  json?: boolean
}

export type PetCustodyType = {
  datetime_goal: string | null
  datetime_goal_plan: string
  datetime_insert: string
  datetime_start: string
  datetime_start_plan: string
  datetime_update: string | null
  feed_list: []
  flg_delete: boolean
  flg_hospitalization: boolean
  id_cage: string | null
  id_cage_condition: string
  id_customer: number
  id_employee_insert: string
  id_employee_update: null
  id_food_prep1: string
  id_food_prep2: string
  id_food_prep3: string | null
  id_pet: number
  id_pet_custody: string
  id_request: string
  id_room: string | null
  memo: string
  number_pet_custody: string
  number_request: string
  pet: PetType
  pet_bio_condition_list: []
  pet_bio_info_list: []
  request: RequestType
  room: RoomType
  task_list: []
  title_request: string
  flg_iv_catheter_remove: boolean
  flg_iv_catheter_exchange: boolean
  flg_temperature: boolean
  flg_walk: boolean
  flg_assisted_urination: boolean
  flg_scheduled_hydration: boolean
  flg_assisted_feeding: boolean
  flg_feed: boolean
  id_clinic: number | null
  customer: CustomerType
}

export type TermType = {
  id_term: string
  type_reserve: number
  title_term: string
  memo_term: string
  flg_available: boolean
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type TaskType = {
  id_task: string
  id_request: string
  type_link1: number
  id_link1: string
  number_link1: string
  id_task_copied: string
  place_task: string
  number_task: string
  flg_task_hospital: boolean
  code_category2: string
  name_category1: string
  name_category2: string
  id_category1: string
  id_category2: string
  title_task: string
  memo_task_todo: string
  memo_task_report: string
  datetime_plan: string
  flg_emargency: boolean
  type_task_place: number
  id_employee_request: string
  datetime_request: string
  flg_unassigned: boolean
  id_employee_staff: string
  name_employee_staff: string
  id_employee_created: string
  datetime_created: string
  flg_prepared: boolean
  flg_started: boolean | number
  flg_start_arroval_required: boolean
  flg_approved: boolean
  datetime_approved: string
  id_employee_approved: string
  flg_checked: boolean
  datetime_checked: string
  id_employee_checked: string
  datetime_started: string
  id_employee_started: string
  flg_completed: boolean
  datetime_completed: string
  id_employee_completed: string
  type_task_review: number
  flg_task_reviewed1: boolean
  datetime_task_reviewed1: string
  id_employee_reviewed1: string
  flg_task_reviewed2: boolean
  datetime_task_reviewed2: string
  id_employee_reviewed2: string
  id_customer: string
  name_customer: string
  code_customer: string
  id_queue_ticket: string
  id_pet: string
  name_pet: string
  id_service_detail: string
  id_prescription: string
  id_prescription_detail: string
  flg_non_charge: boolean
  flg_repetitive: boolean
  val_order: number
  id_pet_custody: string
  flg_closed: boolean
  flg_cancel: boolean
  datetime_cancel: string
  id_employee_cancel: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  task_copied_list: TaskType[]
  clickedStatus?: number
}

export type TodoNotificationsType = {
  customer_message_thread_list: []
  clinic_message_thread_list: []
  task_list: []
}

export interface PrescriptionType {
  id_prescription: string
  number_prescription: string
  id_request: string
  id_prescription_copied: string
  title_prescription: string
  flg_delivered: boolean
  id_employee_delivered: string
  datetime_delivered: string
  id_customer: string
  name_customer: string
  code_customer: string
  id_pet: string
  id_pet_bio_info: string
  val_weight: number
  total_days_dose: number
  date_start: string
  date_end: string
  id_employee_doctor: string
  flg_task_created: boolean
  number_reviewed: string
  flg_all_prepared: boolean
  flg_non_charge: boolean
  type_booking: number
  datetime_pickup_plan: string
  flg_cancel: boolean
  datetime_cancel: string
  memo_cancel: string
  id_pet_illness_history: string
  name_disease: string
  memo_prescription: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  name_prescription_display: string
  customer: CustomerType
  pet: PetType
  prescription_detail_list: PrescriptionType[]
}

export type MessageThreadType = {
  type_booking_status: number
  id_clinic: number
  id_message_thread: string
  name_thread: string
  memo_goal: string
  type_thread_list: number
  type_thread: number
  flg_allowed_access_customer: boolean
  id_customer: string
  code_customer: string
  id_pet: string
  code_pet: string
  type_link1: number
  id_link1: string
  number_link1: string
  flg_pinned: boolean
  flg_emr_pinned: boolean
  flg_closed: boolean
  datetime_closed: string
  flg_hidden: boolean
  id_employee_ask: string
  type_department: number
  id_employee_answer: string
  id_employee_achieved: string
  flg_urgent: boolean
  flg_goal_achieved: boolean
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  last_message?: string
  line_user_id?: string
  messages?: MessageType[]
  pinned_threads: MessageType[]
  unpinned_threads: MessageType[]
  send_line?: boolean
  flg_read: boolean
}

export type MessageType = {
  id_message: string
  id_message_thread: string
  type_message: number
  message: string
  id_file: MessageImageFileType
  id_employee: string
  name_employee: string
  id_customer: string
  flg_is_read: boolean
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type IllnessHistoryType = {
  id_pet_illness_history: number
  number_pet_illness_history: string
  name_disease: string
  flg_congenital: boolean
  flg_chronical: boolean
  flg_complication: boolean
  id_pet_history1: string
  id_pet_history2: string
  id_pet_history3: string
  type_diagnosis_confidence: number | string
  diagnosis_confidence: number | string
  memo_symptoms: string
  memo_inspection: string
  memo_diagnosis: string
  memo_plan: string
  memo_after: string
  memo_other: string
  data_req_bgn: string
  flg_finished: boolean
  date_req_end: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_disease: string
  id_employee_doctor: string
  id_employee_insert: string
  id_employee_update: string
  id_employee_staff: string
  id_pet: string
  name_disease_free: string
  type_history: number
  isChecked?: boolean
  isActiveIH?: boolean
}

export type MessageAttributeListType = {
  id: string
  index: number
  isASingleEmoji: boolean
  isDayStartSeparator: string | null
  isStartToday: boolean
  isStartYesterday: boolean
  showTimestamp: boolean
}

export type MessageImageFileType = {
  content_type: string
  datetime_upload: string
  file_url: string
  id_file: string
}

export type FileType = {
  id_file: string
  id_clinic: string
  id_bucket: string
  id_object: string
  file_url: string
  display_order: number
  datetime_upload: string
  content_type: string
  flg_delete: boolean
  datetime_insert: string
  id_employee_insert: string
  datetime_update: string
  id_employee_update: string
}

export type ClinicalFile = {
  id_clinical_file: number
  name_file: string
  type_file: number
  file_path: string | File
  thumbnail_path: string
  type_provider: number
  type_diagnostic_info: string
  name_supplier_other: string
  memo_file_storage: string
  datetime_receive: string
  type_receive_format: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_customer: number
  id_employee_insert: number
  id_employee_supplier: number
  id_employee_update: number
  id_pet: number
  id_pet_illness_history: number[] | string
  code_pet_ex: string
  helper_1: number
}

export type Category = {
  id_category: number
  code_category: string
  type_category_layer: number
  id_category_parent: number
  name_category: string
  memo_category: string
  flg_active: boolean
  flg_for_medicine: string
  flg_for_service: string
  flg_for_disease: string
  flg_for_task: string
  flg_for_lab: string
  flg_for_food: string
  flg_for_item: string
  flg_for_other: string
  flg_approval_required: string
  name_prescription_detail: string
  display_order: number
  flg_delete: string
  datetime_insert: string
  datetime_update: string
  id_employee_insert: number
  id_employee_update: number
  id_clinic: number
  type_department: number
  label: string
  value: number
}

export type ClinicType = {
  id_clinic: number
  code_clinic: string
  code_ins_anicom: string
  code_ins_ipet: string
  name_clinic_display: string
  name_clinic_en: string
  flg_clinic_main: boolean
  name_legal: string
  name_clinic_short: string
  flg_facility: boolean
  id_clinic_parent: string
  name_director: string
  logo_file_path1: string
  zip_code: string
  address_prefecture: string
  address_city: string
  address_other: string
  phone_title1: string
  phone1: string
  phone_title2: string
  phone2: string
  fax: string
  email_title1: string
  email1: string
  email_title2: string
  email2: string
  url_clinic: string
  memo_consultation_hours: string
  date_closed: string
  memo_slogan: string
  type_tax_category: number
  number_invoice_register: string
  cycle_vaccine1: number
  cycle_vaccine2: number
  type_cart_round: number
  val_weight_max_dog: number
  val_weight_max_cat: number
  val_weight_max_rabbit_rodent: number
  type_dosage_calculation: number
  flg_pill_050: boolean
  flg_pill_0250: boolean
  flg_pill_0333: boolean
  flg_pill_0125: boolean
  flg_business_hour_slot1: boolean
  flg_business_hour_slot2: boolean
  flg_business_hour_slot3: boolean
  pps_agreement_petsalon: string
  pps_agreement_pethotel: string
  flg_tax_included: boolean
  id_category_task_prescription: string
  remarks: string
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  img_member_card_url: string
}

export type TextTemplateType = {
  id_text_template: string
  id_clinic: string
  type_text_template: number
  flg_title: boolean
  memo_template: string
  img_file_path_template: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  id_employee_insert: string
  datetime_update: string
  id_employee_update: string
  title: string
  attr: {
    class: string
  }
  isSelected: boolean
}

export type CageCondition = {
  id_cage_condition: number
  code_cage_condition: string
  file_path1: string
  file_path2: string
  file_path3: string
  memo_cage_condition: string
  memo_purpose: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_employee_insert: number
  id_employee_update: number
  id_clinic: number
}

export type RequestStatusType = {
  id_req_status: number
  memo_status: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  name_customer: string
  id_clinic: number
  id_customer: number
  id_employee_insert: number
  id_employee_staff: number
  id_employee_update: number
  id_pet: number
  id_queue_ticket: number
  id_status: number
  id_request: number
  datetime_check_in: string
  display_order: number
  datetime_cart: string
  flg_confirmed: boolean
  pet: PetType
  status: {
    bg_color_code: string
    color_code: string
    datetime_insert: string
    datetime_update: string
    display_order: number
    flg_category_child: boolean
    flg_delete: boolean
    id_clinic: number
    id_employee: number
    id_employee_insert: number
    id_employee_update: number
    id_status: string
    id_customer: number
    id_pet: number
    id_request: number
    name_status: string
    type_category_child: number
    type_category_parent: number
  }
}

export type MemoCarteType = {
  id_memo_carte: string
  number_memo_carte: string
  id_customer: string
  id_pet: string
  id_request: string
  id_pet_illness_history: number[]
  id_clinic: string
  type_source: number
  type_input: number
  flg_verified: boolean
  id_talk_transcribe_start: string
  flg_auto_summary: boolean
  memo_transcription_ai: string
  memo_customer_ai: string
  memo_service_ai: string
  memo_illness_ai: string
  memo_plan_ai: string
  memo_prescription_ai: string
  memo_other: string
  id_vetty_ai: string
  id_employee: string
  datetime_memo_carte: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  id_cli_common: number | null
}

export type Common = {
  id_common: number
  name_common: string
  code_common: string
  flg_func1: boolean
  flg_func2: boolean
  code_func1: string
  code_func2: string
  text1: string
  text2: string
  comment: string
  flg_etc1: boolean
  flg_etc2: boolean
  flg_etc3: boolean
  memo_etc1: string
  memo_etc2: string
  memo_etc3: string
  date_start: string
  date_end: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: string
  id_employee_insert: string
  id_employee_update: string
  value?: number | string
  label?: number | string
}
export type CliCommon = {
  id_cli_common: number
  id_clinic: number
  code_cli_common: number | string
  name_cli_common: string
  flg_func1: boolean
  flg_func2: boolean
  code_func1: string
  code_func2: string
  text1: string
  text2: string
  comment: string
  flg_etc1: boolean
  flg_etc2: boolean
  flg_etc3: boolean
  memo_etc1: string
  memo_etc2: string
  memo_etc3: string
  date_start: string
  date_end: string
  display_order: number
  flg_delete: boolean
  id_employee_insert: number
  datetime_insert: string
  id_employee_update: number
  datetime_update: string
  value?: number | string
  label?: number | string
}

export type MedCondition = {
  id_med_condition: string
  id_customer: number
  id_clinic: number
  id_pet: number
  code_cli_common: number
  type_med_condition: number
  memo_record: string
  id_employee_record: number
  datetime_record: string
  flg_delete: boolean
  id_employee_insert: number
  datetime_insert: string
  id_employee_update: number
  datetime_update: string
}

export type LabRange = {
  id_lab_range: string
  code_clinic?: string
  id_cm_device?: number
  code_lab?: string
  type_animal?: number
  pet_gender?: string | number
  min_age_mon?: number | string | undefined
  max_age_mon?: number | string | undefined
  low_critical?: string
  low?: string
  high?: string
  high_critical?: string
  date_start?: string
  date_end?: string
  ibm_extra_keycheck?: string
  flg_delete?: boolean
  id_employee_insert?: string
  datetime_insert?: string
  id_employee_update?: string
  datetime_update?: string
  id_cm_animal?: number
}

// use this type inside table data in SearchCustodyChecklistList page
export type CustodyList = {
  id_custody_checklist: number
  id_customer: string
  id_pet: string
  id_custody: string | number | null
  name_custody: string | number | null
  date_custody_receive: string
  quantity: number
  memo_custody: string
  id_employee_custody: string
  flg_need_return: boolean
  date_custody_return_plan: string
  flg_custody_returned: number
  date_custody_return_result: string | number | null
  id_employee_custody_return: string | number | null
  id_file: string | number | null
  id_request: string | number | null
  id_employee_insert: string
  id_employee_update: string | number | null
}

// use this type for table data in SearchCustodyChecklistList page
export type CustodyType = {
  id_custody: string
  id_clinic: string
  code_custody: string
  name_custody: string
  file_path_icon: string
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  quantity: number
  memo_custody: string
  flg_need_return: boolean
  icon: string
  date_custody_receive: string
  id_customer: number
  name_customer_display: string
  total_return_item_plan: number
  total_return_item_result: number
  name_pet: string
  id_cm_breed_name: string
  id_cm_animal_name: string
  type_customer_color: string
  // id_customer: number
  custody_list: CustodyList[]
}

// use this type for data add/update case modal in SearchCustodyChecklistList page
export type CustodyChecklistType = {
  id_common: Pick<Common, 'id_common'>
  name_common: Pick<Common, 'name_common'>
  code_func1: Pick<Common, 'code_func1'>
  file_path_icon?: string
  id_custody_checklist: string
  id_customer: number
  id_pet: number
  name_pet: string
  id_clinic: string
  id_custody: string
  type_custody_item: number
  name_custody: string
  date_custody_receive: string
  quantity: number
  memo_custody: string
  id_employee_custody: string
  flg_need_return: boolean
  date_custody_return_plan: string
  flg_custody_returned: boolean
  date_custody_return_result: string
  id_employee_custody_return: string
  id_file: string
  id_request: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  custody_list: CustodyList[]
  datetime_update: string
}

export type QueueTicketType = {
  id_queue_ticket: string
  number_queue_ticket: string
  id_customer: string
  customer: CustomerType
  code_customer: string
  code_pet: string
  id_request: string
  id_clinic: string
  id_next_visit: string
  type_status_queue_ticket: number
  type_visit_purpose_ticket: number
  flg_appointment: boolean
  flg_new_customer: boolean
  flg_tel_requested: boolean
  flg_parking_wait: boolean
  flg_visit_for_pet: boolean
  flg_next_notified: boolean
  datetime_issued: string
  datetime_next_notified: string
  datetime_check_in: string
  datetime_service_start: string
  datetime_absent: string
  flg_auto_absent_updated: boolean
  flg_absent_confirmed: boolean
  datetime_cancel: string
  datetime_bin: string
  memo_customer: string
  memo_admin: string
  flg_from_customer: boolean
  flg_web_payment_requested: boolean
  id_employee_doctor: string
  type_process_time: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  id_pet: number[]
  petList: PetType[]
  process_order: number
  datetime_estimate: string
}

export type ClinicPlanType = {
  id_clinic_plan: string
  id_clinic: string
  title_clinic_plan: string
  memo_clinic_plan: string
  datetime_clinic_plan_start: string
  datetime_clinic_plan_end: string
  id_employee: string
  type_plan_status: number
  memo_place: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type EmpInfoReadType = {
  id_emp_info_read: number
  flg_delete: boolean
  flg_read: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_emp_info: number
  id_employee: number
  id_employee_insert: number
  id_employee_update: number
}

export type empInfoType = {
  id_emp_info: string
  id_clinic: string
  type_emp_info: number
  type_display: number
  type_department: number
  type_emp_info_read: number
  title: string
  datetime_posted: string
  memo_emp_info: string
  file_path1: string
  id_employee_posted: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
  emp_info_read: EmpInfoReadType[]
}

export type PrintType = {
  id_print: string
  id_clinic: string
  code_print: string
  name_print: string
  type_print: number
  type_print_size: number
  bg_color_code: string
  pdf_path: string
  flg_landscape: boolean
  font_family: string
  item1: string
  xy_hw1: string
  type_print_output1: number
  font_size1: number
  item2: string
  xy_hw2: string
  type_print_output2: number
  font_size2: number
  item3: string
  xy_hw3: string
  type_print_output3: number
  font_size3: number
  item4: string
  xy_hw4: string
  type_print_output4: number
  font_size4: number
  item5: string
  xy_hw5: string
  type_print_output5: number
  font_size5: number
  item6: string
  xy_hw6: string
  type_print_output6: number
  font_size6: number
  item7: string
  xy_hw7: string
  type_print_output7: number
  font_size7: number
  item8: string
  xy_hw8: string
  type_print_output8: number
  font_size8: number
  item9: string
  xy_hw9: string
  type_print_output9: number
  font_size9: number
  item10: string
  xy_hw10: string
  type_print_output10: number
  font_size10: number
  item11: string
  xy_hw11: string
  type_print_output11: number
  font_size11: number
  item12: string
  xy_hw12: string
  type_print_output12: number
  font_size12: number
  item13: string
  xy_hw13: string
  type_print_output13: number
  font_size13: number
  item14: string
  xy_hw14: string
  type_print_output14: number
  font_size14: number
  item15: string
  xy_hw15: string
  type_print_output15: number
  font_size15: number
  item16: string
  xy_hw16: string
  type_print_output16: number
  font_size16: number
  item17: string
  xy_hw17: string
  type_print_output17: number
  font_size17: number
  item18: string
  xy_hw18: string
  type_print_output18: number
  font_size18: number
  item19: string
  xy_hw19: string
  type_print_output19: number
  font_size19: number
  item20: string
  xy_hw20: string
  type_print_output20: number
  font_size20: number
  thumbnail_img_path: string
  display_order: number
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type ReqStatusType = {
  id_req_status: number
  status: null
  pet: PetType
  count_available_sd: number
  count_complete_sd: number
  count_available_ph: number
  count_complete_ph: number
  id_employee_doctor: string
  name_display: string
  name_pet: string
  name_customer: string
  datetime_check_in: string
  datetime_cart: string
  flg_confirmed: boolean
  memo_status: string | null
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string | null
  display_order: number | null
  id_request: number
  id_queue_ticket: number | null
  id_status: number | null
  id_customer: number
  id_clinic: number
  id_pet: number
  id_employee_staff: number
  id_employee_insert: number | null
  id_employee_update: number | null
}

export type aiSummaryType = {
  ai_summary: string
  id_ai_summary: number
  id_question_detail: number
  question_display_title: string | null
  question_raw: string | null
}

export type RabiesType = {
  id_rabies: number
  license_id: string
  code_city_hall: string
  num_tag: string
  date_tag_issued: string
  memo_exemption_rabies: string
  date_exempt_start: string
  date_exempt_end: string
  type_rabies_process: string
  memo_process: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_request: number
  id_service_detail: number
  id_inject: number
  id_inject_detail: number
  id_employee_registered: number
  id_employee_processed: number
  id_employee_insert: 1
  id_employee_update: number
  request: RequestType
  customer: CustomerType
  pet: PetType
}

export type MemoCustomerType = {
  id_memo_customer: number
  id_customer: number
  id_clinic: number
  type_memo_customer: number
  memo_text: string
  flg_pin: boolean
  flg_complete: boolean
  date_complete: string
  date_memo_customer: string
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type InfoListType = {
  checked: boolean
  code_customer: number
  code_pet: number
  date_end: string
  date_start: string
  datetime_insert: string
  datetime_update: string
  flg_all_customer: boolean
  flg_delete: boolean
  flg_read: boolean
  id_clinic: number
  id_customer: number
  id_employee_insert: number
  id_employee_update: number
  id_info_detail: number
  id_notification: number
  name_customer: number
  name_pet: number
  title: string
  type_display: number
  type_info: number
}

export type CustomerTelephoneType = {
  datetime_insert: string
  datetime_update: string
  flg_delete: boolean
  flg_emergency: boolean
  flg_main_tel: boolean
  id_clinic: number
  id_customer: number
  id_employee_insert: number
  id_employee_update: number
  id_tel: number
  tel1: string
  tel2: string
  tel3: string
  tel_full: string
  title_tel: string
  type_tel: number
}

export type DmCustomerPetListType = {
  id: number
  customer: CustomerType
  pet: PetType
  date_start: string
  date_end: string
  type_prevention: number
  item_service_name: string
  name_category1: string
  name_category2: string
  date_booking: string
  id_pet: number
  id_customer: number
  id_item_service: number
  id_service_detail: string
  id_prescription_detail: string
  id_inject_detail: string
}

export interface InjectDetailType {
  id_inject_detail: string
  name_inject_display: string
  code_category2: string
  name_category1: string
  name_category2: string
  val_weight: number
  val_dosage_suggested: number
  val_dosage_decided: number
  val_used_portion: number
  val_efficacyingredient: number
  val_used_liquid: number
  datetime_processed: string
  speed_process: number
  type_speed_unit: number
  time_process: number
  type_process_time: number
  date_start: string
  date_end: string
  time_start: string
  type_inject_route: number
  num_conduct: number
  flg_non_charge: boolean
  flg_next_cart: boolean
  flg_detailed_cart_name: boolean
  type_booking: number
  name_disease: string
  memo_inject: string
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_category1: number
  id_category2: number
  id_clinic: number
  id_employee_doctor: number
  id_employee_insert: number
  id_employee_update: number
  id_inject: string
  id_inject_detail_parent: string
  id_item_service: number
  id_item_service_unit: number
  id_pet: number
  id_customer: number
  type_medicine_dosage: number
  val_efficacy_strength_doctor: number
  flg_prevention: boolean
  id_employee_staff: number
  type_prevention: number
  flg_etc1: boolean
  flg_etc2: boolean
  flg_group_title: boolean
  lot_number1: string
  lot_number2: string
  memo_etc1: string
  memo_etc2: string
  row: number
  name_medicine_format: string
  flg_apply_insurance: string
  datetime_start: string
  datetime_end: string
}

export type BookingType = {
  id_booking: number
  id_clinic: number
  id_customer: number
  id_pet: number
  type_booking_genre: number
  type_thread_booking: number
  type_prevention: number
  datetime_booking1: string
  datetime_booking2: string
  datetime_booking3: string
  datetime_booking_confirmed: string
  id_request: number
  id_request_booking: number
  id_message_thread: number
  id_service_detail: number
  id_inject: number
  id_prescription: number
  id_prescription_detail: number
  days_repeat: number
  date_next: string
  flg_conducted: boolean
  flg_continue: boolean
  flg_exempt: boolean
  flg_end: boolean
  type_booking_source: number
  flg_etc1: boolean
  flg_etc2: boolean
  text_booking1: string
  text_booking2: string
  flg_delete: boolean
  id_employee_insert: number
  datetime_insert: string
  id_employee_update: number
  datetime_update: string
  customer: CustomerType
  pet: PetType
  request: RequestType
  service_detail: ServiceDetailType
}

export type LabSet = {
  id_lab_set: number
  id_category2_lb1: string
  id_category2_lb2: string
  name_lab_set: string
  date_start: string
  date_end: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_employee_insert: number
  id_employee_update: number
  id_lab: number
}

export type LabDevice = {
  id_lab_device: number
  id_category2_lb1: string
  id_category2_lb2: string
  name_lab_set: string
  date_start: string
  date_end: string
  display_order: number
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_employee_insert: number
  id_employee_update: number
  id_lab: number
}

export type InjectType = {
  id_inject_copied: string
  title_inject: string
  id_customer: string
  name_customer: string
  code_customer: string
  id_pet: string
  id_pet_bio_info: string
  type_inject: number
  val_weight: number
  date_start: string
  time_start: string
  date_end: string
  id_employee_doctor: string
  flg_task_created: boolean
  flg_completed: boolean
  flg_apply_insurance: boolean
  flg_non_charge: boolean
  flg_next_cart: boolean
  type_booking: number
  id_pet_illness_history: number[]
  name_disease: string
  memo_inject: string
  flg_detailed_cart_name: boolean
  flg_delete: boolean
  id_employee_insert: string
  datetime_insert: string
  id_employee_update: string
  datetime_update: string
}

export type PrescriptionDetailType = {
  id_prescription_detail: string
  id_prescription: {
    id_prescription: string
    number_prescription: string
    id_prescription_copied: string
    title_prescription: string
    datetime_confirmed: string | null
    flg_delivered: boolean
    datetime_delivered: string | null
    name_customer: string | null
    code_customer: string | number | null
    val_weight: string
    total_days_dose: string
    date_start: string
    date_end: string
    flg_task_created: boolean
    number_reviewed: string
    flg_all_prepared: boolean
    flg_non_charge: boolean
    flg_next_cart: boolean
    flg_prescription_order: boolean
    type_booking: 1
    datetime_pickup_plan: string | null
    flg_cancel: boolean
    datetime_cancel: string | null
    memo_cancel: string | null
    name_disease: string | null
    memo_prescription: string
    flg_apply_insurance: true
    flg_delete: boolean
    datetime_insert: string
    datetime_update: string | null
    datetime_pickup: string | null
    id_request: number | null
    id_clinic: number | null
    id_employee_delivered: number | null
    id_customer: number | null
    id_pet: number | null
    id_pet_bio_info: number | null
    id_employee_doctor: number | null
    id_employee_insert: number | null
    id_employee_update: number | null
    id_pet_illness_history: number[]
  }
  name_prescription_display: string
  code_category2: string | null
  name_category1: string
  name_category2: string
  val_weight: string
  date_start: string
  date_end: string
  total_days_dose: string
  flg_prevention: boolean
  type_prevention: number
  val_efficacy_strength_doctor: number
  type_medicine_format: string | number | null
  name_medicine_format: string
  type_medicine_dosage: 4
  total_amount_dose: string
  val_total_efficacyingredient: string | number | null
  flg_overdosing: boolean
  flg_risk_animal: true
  memo_dose_display: string | null
  flg_non_charge: boolean
  flg_hospitalization_usage: boolean
  process_drip: {
    isPlusItem: boolean
    flg_drip_carrier: boolean
    id_prescription_detail: string
    id_prescription_detail_ref: string
  }
  memo_alert: string
  flg_group_title: boolean
  row: 1
  memo_dose: string | null
  flg_cancel: boolean
  datetime_cancel: string | null
  flg_etc1: boolean
  memo_etc1: string | null
  flg_etc2: boolean
  memo_etc2: string | null
  flg_apply_insurance: true
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string | null
  id_prescription_detail_ref: string
  id_item_service: number | null
  id_service_detail: string | number | null
  id_clinic: number | null
  id_category1: number | null
  id_category2: number | null
  id_pet: number | null
  id_employee_doctor: number | null
  id_employee_staff: number | null
  id_dosage_frequency: number
  id_employee_insert: number
  id_employee_update: number
}

export type CartDetailListType = {
  id_cart_detail_parent: string
  id_cart: string
  id_clinic: string
  row: number
  id_disease: string
  type_cart_detail: number
  type_source_cart: number
  id_service_detail: string
  id_prescription: string
  id_prescription_detail: string
  id_item_service: string
  name_category1: string
  name_category2: string
  type_insurer: number
  code_category2: string
  id_pet: string
  name_pet: string
  type_insurance: number
  flg_group_title: boolean
  date_order_start: string
  date_order_end: string
  name_cart_item_display: string
  type_tax: number
  tax_rate: number
  vat08_amount_sales: number
  vat10_amount_sales: number
  tax_exempt_amount_sales: number
  memo_cart_detail: string
  flg_pet_insurance: boolean
  flg_discount: boolean
  sales_ratio: number
  amount_detail_discounted: number
  flg_temp_cash: boolean
  flg_refund: boolean
  date_refund: string
  memo_refund: string
  memo_service: string
  id_employee_sales: number
  flg_merged: boolean
  flg_delete: boolean
  id_employee_insert: number
  datetime_insert: string
  id_employee_update: number
  datetime_update: string
}

export const CalendarEventTypes = {
  SERVICE: 'service',
  PRESCRIPTION: 'prescription',
  INJECT: 'inject',
  CLINIC_PLAN: 'clinicPlan'
}

export type CalendarEventType = ValueOf<typeof CalendarEventTypes>

export interface CalendarEvent {
  id: string | number
  data: CalendarServiceDetail | CalendarInjectDetail | CalendarPrescriptionDetail | CalendarClinicPlanDetail
  type: CalendarEventType
  start: string
  end: string
}

export interface CalendarEventStyle extends CSSProperties {
  width: string
  left: string
  top?: number
  height?: number
}

export type CarteGroup = {
  date_insert: string;
  grouped_cartes: boolean;
  lab_result_list: LabResult | {};
  medical_condition: MedCondition[];
  memo_carte_list: MemoCarteType[];
  pet_bio: PetBioInfoType | {};
}

export type DateRangeItem = {
  [key: string]: any
  datetime_service_start?: string | Date
  datetime_service_end?: string | Date
  date_order_start?: string | Date
  date_order_end?: string | Date
  date_start?: string | Date
  date_end?: string | Date
}

export type LabPrint = {
  id_lab_print: number;
  id_clinic: number;
  code_lab_print: string;
  name_button_lab_print: string | undefined;
  id_lab_print_ref: number | undefined;
  id_pet_bio_info : number | undefined;
  id_lab_set: number | undefined;
  id_lab_device: number | undefined;
  id_lab_ref: number | undefined;
  flg_above_blank_row: boolean;
  flg_indent: boolean;
  flg_per_day: boolean;
  display_order: number;
  flg_delete: boolean;
  id_employee_insert: number;
  datetime_insert: Date;
  id_employee_update: number;
  datetime_update: Date;
}

export type Project = {
  id_project: number;
  id_clinic: number;
  name_project: string;
  memo_project: string;
  default_days: number;
  id_employee_mentor: number;
  type_project_purpose: number;
  type_project_class: number;
  type_pj_workhour: number;
  flg_complete_required: boolean;
  memo_pj_explanation: string;
  display_order: number;
  flg_delete: boolean;
  id_employee_insert: number;
  datetime_insert: string;
  id_employee_update: number;
  datetime_update: string;
}