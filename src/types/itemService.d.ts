export interface ItemService {
    /** Unique identifier for the item service */
    id_item_service: number;

    /** Path to the primary image of the item */
    image_path1: string;

    /** Flag indicating if the item is not available */
    flg_not_available: boolean;

    /** List of available options for the item */
    option_list: any[];

    /** Service item code identifier */
    code_item_service: string;

    /** Primary name of the item service */
    name_item_service: string;

    /** Secondary name of the item service */
    name_item_service2: string;

    /** Name of the item service in Kana (Japanese phonetic) */
    name_kana_item_service: string;

    /** Short/abbreviated name of the item */
    name_short: string;

    /** Supplier item code */
    code_item_supplier: string;

    /** Flag indicating if this is a service item */
    flg_service: boolean;

    /** Type of service */
    type_service: number | null;

    /** Type of item */
    type_item: number;

    /** Secondary category code */
    code_category2: string;

    /** Primary category name */
    name_category1: string;

    /** Secondary category name */
    name_category2: string;

    /** Auto-generated keywords */
    auto_gen_kw: string;

    /** Auto-generated keywords in pipe-separated format */
    auto_gen_kw1: string;

    /** First search key */
    search_key1: string | null;

    /** Second search key */
    search_key2: string | null;

    /** Third search key */
    search_key3: string | null;

    /** Flag indicating if this is a surgery item */
    flg_surgery: boolean;

    /** Flag indicating if this is an anesthesia item */
    flg_anesthesia: boolean;

    /** Flag indicating if this is a prevention item */
    flg_prevention: boolean;

    /** Type of prevention */
    type_prevention: number | null;

    /** Value for top 30 ranking */
    val_top30: number | null;

    /** Flag for pet custody control */
    flg_pet_custody_control: boolean;

    /** Flag indicating if this is a plus item */
    flg_plus_item: boolean;

    /** Unit-related memo */
    memo_unit: string;

    /** Tax type */
    type_tax: number;

    /** Flag for calendar-related item */
    flg_calendar: boolean;

    /** Flag for temporary cash item */
    flg_temp_cash: boolean;

    /** Flag indicating if discount is applicable */
    flg_discount: boolean;

    /** Maximum discount rate */
    rate_discount_max: number | null;

    /** Type of insurer */
    type_insurer: number;

    /** Type of animal */
    type_animal: number | null;

    /** Flag for price merging */
    flg_merge_price: boolean;

    /** Flag indicating if options are available */
    flg_options_available: boolean;

    /** Flag indicating if item is unsellable */
    flg_unsellable: boolean;

    /** Flag indicating if purchase is stopped */
    flg_stop_purchase: boolean;

    /** Date when purchase was stopped */
    date_stop_purchase: string | null;

    /** Flag indicating if item is discontinued */
    flg_discontinued: boolean;

    /** Date when item was discontinued */
    date_discontinued: string | null;

    /** Description memo for the item */
    memo_item_description: string;

    /** Rules-related memo */
    memo_rule: string;

    /** Alert-related memo */
    memo_alert: string;

    /** Display order */
    display_order: number | null;

    /** Flag indicating if item is deleted */
    flg_delete: boolean;

    /** Timestamp of insertion */
    datetime_insert: string;

    /** Timestamp of last update */
    datetime_update: string;

    /** Clinic identifier */
    id_clinic: number;

    /** Primary category identifier */
    id_category1: number;

    /** Secondary category identifier */
    id_category2: number;

    /** Service type identifier */
    id_cm_type_service: number | null;

    /** Manufacturer identifier */
    id_manufacturer: number | null;

    /** Supplier customer identifier */
    id_customer_supplier: number | null;

    /** Employee identifier who inserted the record */
    id_employee_insert: number;

    /** Employee identifier who last updated the record */
    id_employee_update: number;
}

export interface ItemServiceUnit {
    /** Unique identifier for the item service unit */
    id_item_service_unit: number;

    /** Path to the image associated with the unit */
    image_path: string;

    /** Flag indicating if options are available for this unit */
    flg_options_available: boolean;

    /** Code identifier for the item service unit */
    code_item_service_unit: string;

    /** Name of the service item unit */
    name_service_item_unit: string;

    /** Value of efficacy ingredient */
    val_efficacyingredient: number | null;

    /** Value of liquid content */
    val_liquid: number | null;

    /** Tax type */
    type_tax: number;

    /** Flag indicating if count should be decreased */
    flg_minus_count: boolean;

    /** Flag indicating if this is a non-chargeable item */
    flg_non_charge: boolean;

    /** Flag indicating if tax is included in the price */
    flg_tax_included: boolean;

    /** Unit price of the item */
    unit_price: number;

    /** Purchase price of the item */
    purchase_price: number;

    /** Interval specification */
    interval: string;

    /** List of IDEXX test related items */
    list_idexx_test: any[];

    /** List of test related items */
    list_test: null;

    /** Additional flag for custom use */
    flg_etc1: boolean;

    /** Additional memo field 1 */
    memo_etc1: string;

    /** Additional memo field 2 */
    memo_etc2: string | null;

    /** Additional memo field 3 */
    memo_etc3: string;

    /** Display order of the item */
    display_order: number;

    /** Flag indicating if item is deleted */
    flg_delete: boolean;

    /** Timestamp of insertion */
    datetime_insert: string;

    /** Timestamp of last update */
    datetime_update: string | null;

    /** Start date of validity */
    date_start: string;

    /** End date of validity */
    date_end: string;

    /** Reference to parent item service */
    id_item_service: number;

    /** Common identifier reference */
    id_common: number;

    /** Reference to medicine unit type */
    id_cm_unit_medicine: number | null;

    /** Employee identifier who inserted the record */
    id_employee_insert: number;

    /** Employee identifier who last updated the record */
    id_employee_update: number | null;

    /** List of associated clinic IDs */
    id_clinic_list: number[];
}

