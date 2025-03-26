export const injectDetailAttributes = [

  //MCustomer
  { text: '顧客表示名', value: 'id_customer.name_customer_display' },
  { text: 'メール1', value: 'id_customer.email1' },
  { text: '初回来院日', value: 'id_customer.date_first_visit' },
  { text: '最終来院日時', value: 'id_customer.date_last_visit' },
  { text: 'メイン住所', value: 'customer_main_address' },
  { text: 'メイン電話', value: 'customer_main_tel' },
  { text: '診察券番号', value: 'id_customer.code_customer' },

  //MPet
  { text: 'ペット名', value: 'id_pet.name_pet' },
  { text: '敬称ペット名', value: 'id_pet.name_pet_honorific' },
  { text: 'ペットCD', value: 'id_pet.code_pet' },
  { text: '生年月日', value: 'id_pet.date_birth' },  
  { text: '性別', value: 'id_pet.type_pet_gender' },
  {text: '年齢', value: 'id_pet.pet_age'},
  { text: '動物種', value: 'id_pet.id_cm_animal' }, 
  { text: '品種', value: 'id_pet.id_cm_breed' },
  { text: '毛色', value: 'id_pet.id_cm_hair' }, 
  { text: 'ペット写真', value: 'id_pet.image_path1' },
  { text: 'ペット写真/病院', value: 'id_pet.image_path2' },
  { text: 'ペット住所', value: 'id_pet.pet_address_rabies' },

  //TInject
  { text: '注射CD', value: 'id_item_service_unit.code_item_service_unit' },
  { text: '注射名', value: 'id_item_service_unit.name_service_item_unit' },
  { text: '備考1', value: 'id_item_service_unit.memo_etc1' },
  { text: '備考2', value: 'id_item_service_unit.memo_etc2' },
  
  { text: 'サービス商品名', value: 'id_item_service.name_item_service' },
  
  { text: '大分類', value: 'name_category1' },
  { text: '中分類', value: 'name_category2' },
  { text: '数量', value: 'num_conduct', },  
  { text: '実施日', value: 'date_start' },

  { text: '担当医', value: 'id_employee_doctor' },
  { text: '主担当者', value: 'id_employee_staff' },
  { text: '投与経路', value: 'type_inject_route' }, 
  { text: 'ロット番号1', value: 'lot_number1' }, 
  { text: 'ロット番号2', value: 'lot_number2' }, 
  { text: 'メモ', value: 'memo_inject' }, 

  { text: 'リクエスト番号', value: 'id_request.number_request' },
  // { text: '予備フィールド3', value: 'id_item_service_unit.memo_etc3' },

  
  //MClinic
  { text: '病院名', value: 'id_clinic.name_clinic_display' },
  { text: '病院電話', value: 'id_clinic.phone1' },
  { text: '院長名', value: 'id_clinic.name_director' },
  { text: '病院ロゴ', value: 'id_clinic.logo_file_path1' },
  { text: '病院Fax', value: 'id_clinic.fax' },
  { text: '病院住所', value: 'id_clinic.complete_address' },
  
  //TBooking
  { text: "予約日", value: "booking.datetime_booking_confirmed" },

  //TRabies
  { text: "鑑札番号/登録番号", value: "rabies.license_id" },
  { text: "保健所CD", value: "rabies.code_city_hall" },
  { text: "済票番号", value: "rabies.num_tag" },
  { text: "済票発行日", value: "rabies.date_tag_issued" },
  { text: "猶予理由", value: "rabies.memo_exemption_rabies" },
  { text: "猶予開始日", value: "rabies.date_exempt_start" },
  { text: "猶予終了日", value: "rabies.date_exempt_end" },
  { text: "狂犬病申請処理区分", value: "rabies.type_rabies_process" },
  { text: "登録担当者", value: "rabies.id_employee_registered" },
  { text: "申請担当者", value: "rabies.id_employee_processed" },
  { text: "処理メモ", value: "rabies.memo_process" }

]
