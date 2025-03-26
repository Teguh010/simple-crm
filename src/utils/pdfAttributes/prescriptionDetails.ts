export const prescriptionDetailAttributes = [
  //MCustomer
  { text: '顧客表示名', value: 'id_customer.name_customer_display' },
  { text: 'メール1', value: 'id_customer.email1' },
  { text: '初回来院日', value: 'id_customer.date_first_visit' },
  { text: '最終来院日時', value: 'id_customer.date_last_visit' },
  { text: '顧客メイン住所', value: 'customer_main_address' },
  { text: '顧客メイン電話', value: 'customer_main_tel' },
  { text: '診察券番号', value: 'id_customer.code_customer' },

  //MPet
  { text: 'ペット名', value: 'id_pet.name_pet' },
  { text: '敬称ペット名', value: 'id_pet.name_pet_honorific' },
  { text: 'ペットCD', value: 'id_pet.code_pet' },
  { text: '生年月日', value: 'id_pet.date_birth' },
  {text: 'ペットの年齢', value: 'id_pet.pet_age'},  
  { text: '性別', value: 'id_pet.type_pet_gender' },
  { text: '動物種', value: 'id_pet.id_cm_animal' }, //Tariq, display the label 
  { text: '品種', value: 'id_pet.id_cm_breed' },
  { text: '毛色', value: 'id_pet.id_cm_hair' }, //Tariq, display the label 
  { text: 'ペット写真', value: 'id_pet.image_path1' },
  { text: 'ペット写真/病院', value: 'id_pet.image_path2' },
  { text: 'ペット住所', value: 'id_pet.pet_address_rabies' },

   //T_ITEM_SERVICE_UNIT
   { text: 'サービス商品CD', value: 'id_item_service_unit.code_item_service_unit' },
   { text: '商品名', value: 'id_item_service_unit.name_service_item_unit' },

  //TPrescriptionDetail
  { text: '処方箋明細名', value: 'name_prescription_display'},
  { text: '大分類', value: 'name_category1' },
  { text: '中分類', value: 'name_category2' },
  { text: '開始日', value: 'date_start' },
  { text: '終了日', value: 'date_end' },
  { text: '担当医', value: 'id_employee_doctor' },
  { text: '主担当者', value: 'id_employee_staff' },
  { text: '注意事項', value: 'memo_alert' },
  { text: 'リクエスト番号', value: 'id_request.number_request' },
  
  //TBooking
  { text: "次回来院", value: "booking.datetime_booking_confirmed" },
  
  //MClinic
  { text: '病院名', value: 'id_clinic.name_clinic_display' },
  { text: '病院電話', value: 'id_clinic.phone1' },
  { text: '院長名', value: 'id_clinic.name_director' },
  { text: '病院ロゴ', value: 'id_clinic.logo_file_path1' },
  { text: '病院Fax', value: 'id_clinic.fax' },
  { text: '病院住所', value: 'id_clinic.complete_address' },

]
