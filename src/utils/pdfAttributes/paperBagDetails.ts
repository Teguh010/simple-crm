export const paperBagAttributes = [

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

    //MClinic
    { text: '病院名', value: 'id_clinic.name_clinic_display' },
    { text: '病院電話', value: 'id_clinic.phone1' },
    { text: '院長名', value: 'id_clinic.name_director' },
    { text: '病院ロゴ', value: 'id_clinic.logo_file_path1' },
    { text: '病院Fax', value: 'id_clinic.fax' },
    { text: '病院住所', value: 'id_clinic.complete_address' },
    
    // Paper bag attributes
    { text: '服用開始日', value: 'id_paper_bag.start_date' },
    { text: '処方箋明細名', value: 'id_paper_bag.name_prescription_display' },
    { text: '総服用日数', value: 'id_paper_bag.total_days_dose' },
    { text: '投与回数', value: 'id_paper_bag.dose_frequency' },
    { text: 'total amount', value: 'id_paper_bag.total_amount' },
  
  ]
  