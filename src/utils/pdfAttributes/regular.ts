export const regularAttributes = [
  { text: '顧客表示名', value: 'id_customer.name_customer_display' },
  { text: '診察券番号', value: 'id_customer.code_customer' },
  { text: '顧客メイン住所', value: 'customer_main_address' },
  { text: '顧客メイン電話', value: 'customer_main_tel' },
  // { text: 'オーナー住所 郵便番号', value: 'id_customer.address_postal_code' },
  // { text: 'オーナー住所 都道府県', value: 'id_customer.address_prefecture' },
  // { text: 'オーナー住所 市・その他', value: 'id_customer.address_other' },
  { text: '郵便番号', value: 'id_customer.address_postal_code' },
  { text: '都道府県/市区町村', value: 'id_customer.address_prefecture' },
  { text: '番地その他住所', value: 'id_customer.address_other' },
  { text: 'メール1', value: 'id_customer.email1' },
  { text: '初回来院日', value: 'id_customer.date_first_visit' },
  { text: '最終来院日時', value: 'id_customer.date_last_visit' },
  
  { text: 'ペット名', value: 'id_pet.name_pet' },
  { text: '敬称ペット名', value: 'id_pet.name_pet_honorific' },
  { text: 'ペットCD', value: 'id_pet.code_pet' },
  { text: '生年月日', value: 'id_pet.date_birth' },
  { text: '性別', value: 'id_pet.type_pet_gender' },
  {text: '年齢', value: 'id_pet.pet_age'},
  { text: '動物種', value: 'id_pet.id_cm_animal' }, //Tariq, display the label 
  { text: '品種', value: 'id_pet.id_cm_breed' },
  { text: '毛色', value: 'id_pet.id_cm_hair' }, //Tariq, display the label 
  { text: 'ペット写真', value: 'id_pet.image_path1' },
  { text: 'ペット写真/病院', value: 'id_pet.image_path2' },
  { text: 'ペット住所', value: 'id_pet.pet_address_rabies' },

  { text: '病院名', value: 'id_clinic.name_clinic_display' },
  { text: '病院電話', value: 'id_clinic.phone1' },
  { text: '院長名', value: 'id_clinic.name_director' },
  { text: '病院ロゴ', value: 'id_clinic.logo_file_path1' },
  { text: '病院Fax', value: 'id_clinic.fax' },
  { text: '病院住所', value: 'id_clinic.complete_address' },

  { text: "予約日", value: "booking.datetime_booking_confirmed" },

]