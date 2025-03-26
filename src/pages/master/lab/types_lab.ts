export interface LAB_RANGE {
  id_lab_range: string;
  code_clinic?: string;
  id_cm_device?: string;
  code_lab?: string;
  type_animal?: number;
  pet_gender?: string;
  min_age_mon?: number | string;
  max_age_mon?: number | string;
  low_critical?: string;
  low?: string;
  high?: string;
  high_critical?: string;
  date_start?: string;
  date_end?: string;
  ibm_extra_keycheck?: string;
  flg_delete?: boolean;
  id_employee_insert?: string;
  datetime_insert?: string;
  id_employee_update?: string;
  datetime_update?: string;
  id_lab?: string
  id_cm_animal?: string | null
  id_category2_lb1?: string
}

export interface LAB {
  id_lab: string
  lab_range?: LAB_RANGE[]
  code_lab?: string
  name_category1?: string
  name_category2?: string
  id_category1?: string
  id_category2_lab?: string
  code_labcat2?: string
  name_lab?: string
  name_lab_en?: string
  name_short?: string
  search_keyword1?: string
  id_cm_unit?: string
  flg_output_text?: boolean
  memo_lab?: string
  flg_relate_other?: boolean
  memo_use_case?: string
  datetime_imported?: string
  flg_etc1?: boolean
  flg_etc2?: boolean
  memo_etc1?: string
  memo_etc2?: string
  date_start?: string
  date_end?: string
  ibm_extra_keycheck?: string
  display_order?: number
  flg_delete?: boolean
  datetime_insert?: string
  datetime_update?: string
  id_employee_insert?: string
  id_employee_update?: string
}

export interface LABCOMMON {
  id_common?: string,
  name_common?: string,
  code_common?: string,
  flg_func1?: boolean,
  flg_func2?: boolean,
  code_func1: string,
  code_func2?: string,
  text1?: string,
  text2?: string,
  comment?: string, 
  flg_etc1?: boolean,
  flg_etc2?: boolean,
  flg_etc3?: boolean,
  memo_etc1?: string,
  memo_etc2?: string,
  memo_etc3?: string,
  date_start?: string,
  date_end?: string,
  display_order?: number,
  flg_delete?: boolean,
  datetime_insert?: string,
  datetime_update?: string,
  code_clinic?: string,
  id_employee_insert?: string,
  id_employee_update?: string
}

export interface LABGROUP {
  id_lab_group: string
  code_clinic?: string
  name_category1?: string
  name_category2?: string
  id_category1?: string
  id_category2_labgrp?: string
  code_labgrpcat2?: string
  code_lab?: string
  date_start?: string
  date_end?: string
  ibm_extra_keycheck?: string
  display_order?: number
  flg_delete?: boolean
  id_employee_insert?: string
  datetime_insert?: string
  id_employee_update?: string
  datetime_update?: string
}

export interface LAB_CATEGORY {
    id_category: string;
    code_category: string;
    name_category: string;
}

export interface LABGROUPQPARAM {
  type_animal: string
  code_labgrpcat2: string
  lab_set: string
  device: number
}

export const labRangeColumns = [
    {
      name: 'id_cm_device',
      label: '検査機器',
      field: 'id_cm_device',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'type_animal',
      label: '動物種',
      field: 'type_animal',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'pet_gender',
      label: 'ペット性別',
      field: 'pet_gender',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'min_age_mon',
      label: '最小月齢',
      field: 'min_age_mon',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'max_age_mon',
      label: '最大月齢',
      field: 'max_age_mon',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'low_critical',
      label: 'パニック下限値',
      field: 'low_critical',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'low',
      label: '基準下限値',
      field: 'low',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'high',
      label: '基準上限値',
      field: 'high',
      align: 'left',
      style: 'width: 100px'
    },
    {
      name: 'high_critical',
      label: 'パニック上限値',
      field: 'high_critical',
      align: 'left',
      style: 'width: 100px'
    }
  ]