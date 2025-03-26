<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useCommonStore from '@/stores/common'
import useCustomerStore from '@/stores/customers'
import {
  concatenate,
  dateFormat,
  formatDate,
  getCurrentPetAgeInMonth,
  getCustomerNameHonorific,
  getImage,
  getPetFirstName,
  isNumeric
} from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import { onMounted, ref, reactive, nextTick, computed, onUnmounted } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import { date } from 'quasar'
import { typePetGender } from '@/utils/enum'
import { Category, ClinicType, LabResult } from '@/types/types'
import useCategoryStore from '@/stores/categories'
import useClinicStore from '@/stores/clinics'
import useLabStore from '@/stores/labs'
import useLabResultStore from '@/stores/lab-results'
import { forEach, groupBy, orderBy } from 'lodash'

const props = defineProps({ 
  labCategoryList: Object, 
  dateCheckList: Object, 
  itemCheckList: Object, 
  groupedData: Object, 
  callback: Function,

  id_pet: String,

  isSingle: Boolean,
  data: Object,
})
const emits = defineEmits(['close']);

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const clinicStore = useClinicStore()
const labResultStore = useLabResultStore()
const labStore = useLabStore()
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } = storeToRefs(commonStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getAllSubCategories } = storeToRefs(categoryStore)

const filteredData = ref([])
const sort = ref('asc')
const exportPdf = ref()
const dateSelected = ref<any>([])
const tempRenderedData = ref<any>([]) // For lab range process in the lab result
const renderedData = ref(<any>[])
const generateProcess = ref(false)
const clinic = ref<ClinicType>()
const logoClinic = ref<string | null>('')
const filterSearchLab = ref([])
const isAlignDatesMode = ref(false)
const isHourlyComparisonMode = ref(false)

const pdfStyles = reactive({
  flgUpDown: true,
  flgCellBg: true,
  flgRedBlueFont: true,
  flgMemoCol: true
})

const comparisonFormatMode = computed(() => {
  return isHourlyComparisonMode.value ? 'MM/DD HH:mm' : 'YY/MM/DD'
})

const synchronizeMultipleDateArrays = (syncDateArr: string[]): string[] => {
  // Merge all dates into a single set, ignoring time
  const datesSet = new Set(
    syncDateArr.map((dateItem) => dateItem)
  );

  // Sort the unique dates from latest to oldest
  const sortedDates = Array.from(datesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return sortedDates
};

const labResultData = computed(() => {
  if (!isAlignDatesMode.value) return [...renderedData.value];

  let syncDateColumnArr: string[] = []
  let groupedData = {}
  renderedData.value.forEach((data: LabResult) => {
    if (data.value) {
      data.value.forEach((v, key) => {
        // Creating new variable based on the mapping key of value
        if (!groupedData[key]) groupedData[key] = []
        groupedData[key].push(v)
      })
    } else {
      data.column.forEach((dateString: string, key: number) => {
        if (!groupedData[key]) groupedData[key] = []
        groupedData[key].push('')

        if (!syncDateColumnArr.find(v => formatDate(v) == formatDate(dateString)))
          syncDateColumnArr.push(formatDate(dateString))
      })
    }
  });

  const syncedDate = synchronizeMultipleDateArrays(syncDateColumnArr)
  const newObject = {}
  Object.keys(groupedData).forEach((key) => {
    // Grouping the data by date and date time
    const dateKey = formatDate(groupedData[key].find(v => v)?.dateRegistered)

    if (!newObject[dateKey]) newObject[dateKey] = []
    newObject[dateKey].push(groupedData[key])
  })
  
  const labResultMode2 = renderedData.value.map((data, key) => {
    const reorderedValue = syncedDate.reduce((acc, date) => {
      // Check if lab result exist on the new object
      if (newObject[formatDate(date)]?.length > 0) {
        // Get the latest lab result data only (key = 0)
        const data = newObject[formatDate(date)]?.[0]?.[key]
        acc.push(data);
      } else {
        acc.push({ result: "", dateRegistered: date });
      }
      return acc;
    }, [] as { result: string; dateRegistered: string }[]);
    
    if (data.column) {
      return {
        ...data,
        column: [...syncedDate]
      };
    } else {
      return {
        ...data,
        value: [...reorderedValue]
      };
    }
  });

  return labResultMode2
});

const calculateElementHeight = (element: HTMLElement) => {
  return element.getBoundingClientRect().height; // Height in pixels
}

const generateReport = async (action: 'download' | 'print' | 'send') => {
  generateProcess.value = true
  let imagePDFOptions = {quality: .95}, jsPDFOptions:any = {}, pagesNumber:Number = 0
  const pdfTitle = `${date.formatDate(Date.now(), 'YYYYMMDD')}_検査結果推移_${getCustomer.value.name_customer_display}様`

  if (action === 'send') {
    exportPdf.value.getPdfBlob(pdfTitle, pagesNumber, jsPDFOptions, imagePDFOptions).then((blob) => {
      props.callback(blob)
    })
  } else {
    dynamicPageBreaks()

    const clinicAddress = concatenate(
      (clinic.value?.address_prefecture || ''),
      (clinic.value?.address_city || ''),
      (clinic.value?.address_other || '')
    )
    const pdfCustomFooter = ` ${clinic.value?.name_clinic_display} 〒${clinic.value?.zip_code} ${clinicAddress} `

    await exportPdf.value.generateReportDynamicPageBreak(
      pdfTitle,
      jsPDFOptions,
      imagePDFOptions,
      pdfCustomFooter,
      action
    )
    const content = document.getElementById('element-to-print')
    content?.classList.remove('pdf-print')
    const pageHeaderElements = document.querySelectorAll('.page-header');
    pageHeaderElements.forEach((element) => {
      element.remove();
    });

    const pageBreakElements = document.querySelectorAll('.break-before')
    pageBreakElements.forEach((element) => {
      element.classList.remove('break-before')
    })
  }
  generateProcess.value = false
}

const closeModal = () => { emits('close'); }

const getTypeAnimal = (id_cm_animal: number) => getCommonTypeAnimalOptionList.value.find((v: any) => v.id_common == id_cm_animal)?.name_common;
const getBreed = (id_cm_breed: number) => getCommonBreedOptionList.value.find((v: any) => v.id_common == id_cm_breed)?.name_common;
const getCategoryName = (id_category: number) => getAllSubCategories.value.find((item: Category) => item.id_category == id_category)?.name_category
const getPetGenderType = (type_pet_gender: number) => typePetGender.find((v: any) => v.value == type_pet_gender)?.label;
const changeSorting = (value: string) => init()

const createPdfHeader = (logoClinic: string, marginTop: number = 0) => {
  const section = document.createElement('section');
  section.className = 'row items-center pdf-row-item q-pb-xs page-header';
  section.style.borderBottom = '2px solid';
  if (marginTop) section.style.marginTop = `${marginTop}px`;

  const colDiv = document.createElement('div');
  colDiv.className = 'col flex justify-between';

  const textDiv = document.createElement('div');
  textDiv.className = 'text-grey-900';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'flex items-center';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'title1 bold q-mr-sm';
  titleSpan.textContent = '《 検査結果 》';
  titleDiv.appendChild(titleSpan);

  if (logoClinic) {
    const img = document.createElement('img');
    img.src = logoClinic;
    img.style.height = '30px';
    img.style.objectFit = 'contain';
    img.className = 'q-mr-sm';
    titleDiv.appendChild(img);
  } else {
    const clinicSpan = document.createElement('span');
    clinicSpan.className = 'title2 regular q-mr-sm';
    clinicSpan.textContent = clinicStore.getClinic.name_clinic_display;
    titleDiv.appendChild(clinicSpan);
  }

  textDiv.appendChild(titleDiv);
  colDiv.appendChild(textDiv);

  const flexDiv = document.createElement('div');
  flexDiv.className = 'flex';

  const customerDiv = document.createElement('div');
  customerDiv.className = 'q-ml-md';
  customerDiv.textContent = `${getCustomer.value.code_customer} ${getCustomerNameHonorific(getCustomer.value)}`;
  flexDiv.appendChild(customerDiv);
  
  const petDiv = document.createElement('div');
  petDiv.className = 'q-ml-md';
  petDiv.textContent = `${getPet.value.code_pet} ${getPetFirstName(getPet.value)}`;
  flexDiv.appendChild(petDiv);

  if (getPet.value.id_cm_animal) {
    const animalDiv = document.createElement('div');
    animalDiv.className = 'q-ml-sm';
    animalDiv.textContent = `/ ${getTypeAnimal(getPet.value.id_cm_animal)}`;
    flexDiv.appendChild(animalDiv);
  }

  if (getPet.value.id_cm_breed) {
    const breedDiv = document.createElement('div');
    breedDiv.className = 'q-ml-xs';
    breedDiv.textContent = `${getBreed(getPet.value.id_cm_breed)} /`;
    flexDiv.appendChild(breedDiv);
  }

  if (getPet.value.type_pet_gender) {
    const genderDiv = document.createElement('div');
    genderDiv.className = 'q-ml-sm';
    genderDiv.textContent = getPetGenderType(getPet.value.type_pet_gender);
    flexDiv.appendChild(genderDiv);
  }

  colDiv.appendChild(flexDiv);
  section.appendChild(colDiv);

  return section;
}
const dynamicPageBreaks = () => {
  const usableHeight = 870; // A4 landscape usable height in pixels
  const content = document.getElementById("element-to-print");
  content?.classList.add("pdf-print")
  const elements = content?.querySelectorAll(".pdf-row-item");
  let currentHeight = 0;

  elements?.forEach((element, index) => {
    if (index == 0) {
      element.prepend(createPdfHeader(logoClinic.value));
    }
    const isCategoryHeader = element.querySelector('.category-header') !== null;
    const isHeaderLogo = element.querySelector('.header-logo') !== null;
    const height = calculateElementHeight(element as HTMLElement);

    // If the element is a category header, add extra margin (except for the first one)
    let effectiveHeight = height;

    // Add margin only for logo
    if (index == 0 || isHeaderLogo) effectiveHeight += 20;

    // Add margin only for subsequent category headers
    if (isCategoryHeader) effectiveHeight += 30;

    currentHeight += effectiveHeight;

    // If adding this element exceeds usable height, insert a page break
    if (currentHeight >= usableHeight) {
      // const unusedPixel = usableHeight - currentHeight;
      element.classList.add("break-before");
      element.prepend(createPdfHeader(logoClinic.value));
      currentHeight = 0; // Reset for the new page
    }
  });
}

const checkQualifierValue = (value: LabResult) => {
  if (!value.val_result && value.qualifier && value.qualifier !== 'null') {
    return {
      result: value.qualifier,
      dateRegistered: value.datetime_registered
    }
  }
  return ''
}
const showValResult = (value: Array<LabResult>, id_lab: number | string) => {
  if (value) {
    const findData = value.find(element => element.id_lab == id_lab)
    if (findData) {
      if ((findData.val_result == 'null' || !findData.val_result)) {
        return checkQualifierValue(findData)
      }

      let labRange, labRangeLow, labRangeHigh
      if (!findData.low && !findData.high) {
        labRange = getLabRanges(findData.id_lab, findData.id_cm_device)
      }


      labRangeLow = labRange?.split(' ~ ')[0]
      labRangeHigh = labRange?.split(' ~ ')[1]

      const v1 = findData.val_result?.toString()?.replace(',', '')
      if (parseFloat(v1) > parseFloat(findData.high) || (labRangeHigh && parseFloat(v1) > parseFloat(labRangeHigh))) {
        return {
          result: `<span class="val-result" style="color: #cc0000; background: #ffd9d9;">${findData.qualifier ? findData.qualifier : ''} ${findData.val_result} <small class="val-result-icon">▲</small></span>`,
          dateRegistered: findData.datetime_registered
        }
      } else if (parseFloat(v1) < parseFloat(findData.low) || (labRangeLow && parseFloat(v1) < parseFloat(labRangeLow))) {
        return {
          result: `<span class="val-result" style="color: #0073db; background: #d9efff;">${findData.qualifier ? findData.qualifier : ''} ${findData.val_result} <small class="val-result-icon">▼</small></span>`,
          dateRegistered: findData.datetime_registered
        }
      }
      return {
        result: `${findData.qualifier ? findData.qualifier + ' ' : ''}${findData.val_result}`,
        dateRegistered: findData.datetime_registered
      }
    }
  }
  return ''
}
const showLabName = (row: LabResult) => {
  if (row?.lab?.name_lab) return row?.lab?.name_lab
  if (row?.name_lab) return row?.name_lab
  if (row?.lab?.name_lab_en) return row?.lab?.name_lab_en?.replace('%',' ')
  if (row?.name_lab_en) return row?.name_lab_en?.replace('%',' ')

  return  ''
}
const typeLabUnitName = (value) => useCommonStore().getCommonUnitOptionList.find(item => item.id_common === value)?.name_common
const init = async () => {
  renderedData.value = []

  if (props.groupedData && props.dateCheckList && props.itemCheckList) {
    Object.entries(props.groupedData).forEach((category) => {
      const [ id_category, device ] = category

      Object.entries(device).forEach((device) => {
        const [ deviceIndex, lab_result ] = device
        const hasDateCheckList =
          props.dateCheckList &&
          props.dateCheckList[id_category] &&
          props.dateCheckList[id_category][deviceIndex]
        const hasItemCheckList =
          props.itemCheckList &&
          props.itemCheckList[id_category] &&
          props.itemCheckList[id_category][deviceIndex]

        // Push the category name row and date columns to the renderedData
        if (hasDateCheckList) {
          const labResultDates = Object.entries(props.dateCheckList[id_category][deviceIndex])
            .filter((v) => !!v[1])
            .map((v) => v[0])
          if (labResultDates.length > 0) {            
            renderedData.value.push({
              id_category: id_category,
              flgNameRow: true,
              column: [...labResultDates]
            })
          }
        }
        
        // Push the lab results to the renderedData
        if (lab_result && lab_result.lr_value) {
          Object.values(lab_result.lr_value)
          .forEach((lablist) => {
            const filteredLabList = lablist?.filter((result) => {
              if (hasItemCheckList && hasDateCheckList) {
                return Object.entries(props.itemCheckList[id_category][deviceIndex])
                    ?.filter((v) => v[1])?.map((v) => parseInt(v[0]))
                    ?.includes(result.id_lab) && 
                  Object.entries(props.dateCheckList[id_category][deviceIndex])
                    ?.filter((v) => !!v[1])?.map((v) => v[0])
                    ?.includes(result.datetime_registered)
              } else return false
            })

            const orderedLabResult = orderBy(filteredLabList, ['lab_set_device.display_order', 'lab_set.display_order', 'lab_device.display_order'])

            forEach(orderedLabResult, (result) => {
              if (!result.high && !result.low) filterSearchLab.value.push(result.id_lab)

              // Process selected date from props.dateCheckList
              const dateSelectedCurrentTable = Object.entries(props.dateCheckList[id_category][deviceIndex]).filter((v) => !!v[1]).map((v) => v[0])
              const exists = dateSelected.value?.some((entry) => {
                  return JSON.stringify(entry.dates) === JSON.stringify(dateSelectedCurrentTable)
                }
              );
              if (!exists) {
                dateSelected.value.push({
                  dates: dateSelectedCurrentTable,
                  idCategoryLab: result.id_category2_lab,
                });
              }

              const isIdLabExist = renderedData.value.find(
                (v) => v.id_lab === result.id_lab
              )
              const isSameIdLabResult = renderedData.value.find(
                (v) => v.id_lab_result === result.id_lab_result
              )
              const labResultValue = dateSelectedCurrentTable.map((date) => showValResult(lab_result?.lr_value?.[date], result?.id_lab))

              if (!isIdLabExist || (isIdLabExist && !isSameIdLabResult)) {
                tempRenderedData.value.push({
                  result: {...result},
                  labResult: {...lab_result},
                  value: labResultValue,
                  ranges: {
                    low_critical: result.low_critical,
                    low: result.low,
                    high: result.high,
                    high_critical: result.high_critical
                  }
                })
                renderedData.value.push({
                  ...result,
                  value: labResultValue,
                  ranges: {
                    low_critical: result.low_critical,
                    low: result.low,
                    high: result.high,
                    high_critical: result.high_critical
                  }
                })
              }
            })
          })
        }
        
      })
    })

    // Filtered out duplicate data from the renderedData and tempRenderedData
    const filterUniqueByValue = (data: any[]) => {
      const seen = new Set();
      return data.filter((item) => {
        if (!item.flgNameRow) {
          const valueKey = JSON.stringify(item.id_category2_lab) + JSON.stringify(item.id_lab);
          if (seen.has(valueKey)) {
            return false; // Duplicate found, filter out
          } else {
            seen.add(valueKey);
            return true;
          }
        }
        return true;
      });
    };
    renderedData.value = filterUniqueByValue(renderedData.value)
    tempRenderedData.value = filterUniqueByValue(tempRenderedData.value)

    // fetch lab for getting the lab range
    await handleLabFiltering()
    // Re-enter the value for the lab result (renderedData)
    renderedData.value.forEach((data: any) => {
      const findResultData = tempRenderedData.value.find((v) => {
        return (
          v.result.id_lab === data.id_lab &&
          v.result.val_result === data.val_result &&
          v.result.datetime_registered === data.datetime_registered
        )
      })
      if (findResultData) {
        let dateToProcess: string[] = []
        dateSelected.value.forEach((itemDate) => {
          itemDate.dates.forEach((date) => {
            if (
              itemDate.idCategoryLab === findResultData.result.id_category2_lab &&
              date === findResultData.result.datetime_registered
            ) {
              dateToProcess = itemDate.dates
            }
          });
        });


        const processedValResult = dateToProcess.map((date) => {
          const valResult = showValResult(findResultData.labResult?.lr_value?.[date], findResultData.result.id_lab)
          if (valResult) {
            return valResult
          }
          return ''
        })
        data.value = processedValResult
        dateToProcess = []
      }
    })
  } else if (props.isSingle && props.data && props.data.length > 0) {
    await labResultStore.fetchOtherLabResults({
      id_pet: props.id_pet,
      id_pet_illness_history: props.data?.[0]?.id_pet_illness_history,
      id_category2_lab: props.data?.[0]?.id_category2_lab ?? null,
      id_cm_device: props.data?.[0]?.id_cm_device ?? null,
      is_filtering_device: props.data?.[0]?.id_cm_device ? true : false,
    })

    const labResultList = labResultStore.getLabResultOther
    if (labResultList) {
      const id_category = labResultList?.find(v => v.id_category)?.id_category
      const dates = [...new Set(labResultList?.filter(v => v.datetime_registered).map(v => formatDate(v.datetime_registered)))].slice(0, 6)
      renderedData.value.push({
        id_category,
        flgNameRow: true,
        column: dates
      })

      forEach(groupBy(labResultList, 'id_lab'), (lab, id_lab) => {
        const labs = labResultList.find(v => v.id_lab == id_lab)
        if (labs) {
          renderedData.value.push({
            ...labs,
            value: dates.map((date) => {
              const currentLab = labResultList.filter(v => formatDate(v.datetime_registered) == date)
              return showValResult(currentLab, id_lab)
            }),
            ranges: {
              low_critical: labs.low_critical,
              low: labs.low,
              high: labs.high,
              high_critical: labs.high_critical
            }
          })
        }
      })
    }
  }
  sortData()
  await handleLabFiltering()
}
const handleHourlyComparison = () => {
  isAlignDatesMode.value = false
}
const handleAlignDate = () => {
  isHourlyComparisonMode.value = false
}

const sortData = () => {
  if (sort.value === 'desc') {
    renderedData.value.map((data) => {
      if (data && data.flgNameRow) {
        return {...data, column: data.column.reverse()}
      } else if (data && !data.flgNameRow) {
        return {...data, value: data.value.reverse()}
      }
    })
  }
}

const handleLabFiltering = async () => {
  if (filterSearchLab.value.length > 0) {
    await labStore.fetchLabsWithIDs(filterSearchLab.value)
  }
}

const getLabRanges = (id_lab: number, id_cm_device: number) => {
  const findLab = labStore.getAllLabs.find(v => v.id_lab == id_lab)
  if (findLab) {
    let index = -1
    if (findLab.lab_range?.length > 0) {
      const findPet = findLab.lab_range?.findIndex((v) => {
        let pet_gender = true
        if (v.pet_gender && v.pet_gender != '@' && getPet.value?.type_pet_gender) pet_gender = v.pet_gender == getPet.value?.type_pet_gender

        let min_age_mon = true
        if (v.min_age_mon && v.min_age_mon != '-1' && getCurrentPetAgeInMonth(getPet.value)) min_age_mon = v.min_age_mon <= getCurrentPetAgeInMonth(getPet.value)

        let max_age_mon = true
        if (v.max_age_mon && v.max_age_mon != '-1' && getCurrentPetAgeInMonth(getPet.value)) max_age_mon = v.max_age_mon >= getCurrentPetAgeInMonth(getPet.value)

        let filter_id_cm_device = true
        if (v.id_cm_device && v.id_cm_device != '-1' && id_cm_device) filter_id_cm_device = v.id_cm_device == id_cm_device

        return (pet_gender && min_age_mon && max_age_mon && filter_id_cm_device)
      })
      if (findPet != -1) index = findPet
    }

    if (findLab.lab_range?.[index]?.low || findLab.lab_range?.[index]?.high)
      return `${findLab.lab_range?.[index]?.low || '-'} ~ ${findLab.lab_range?.[index]?.high || '-'}`
  }
}

const handleValResult = (event, mode) => {
  if(mode === 'icons') {
    let icons = document.querySelectorAll('.val-result-icon')
    icons.forEach((icon) => icon.style.display = event ? 'inline-block' : 'none')
  }
  else if(mode === 'font-color') {
    let elements = document.querySelectorAll('.val-result')
    elements.forEach((el) => event ? el.classList.remove('text-black') : el.classList.add('text-black'))
  }
}
const handleCellBg = (event) => {
  let elements = document.querySelectorAll('.val-result')
  if(elements) elements.forEach((el) => event ? el.classList.remove('no-bg') : el.classList.add('no-bg'))
}

const checkUserPreference = () => {
  const userPreference = localStorage.getItem('lab-result-preference')
  if (userPreference) {
    const userPrefObj = JSON.parse(userPreference)
    isAlignDatesMode.value = userPrefObj.isAlignDatesMode
    isHourlyComparisonMode.value = userPrefObj.isHourlyComparisonMode
  } else {
    isAlignDatesMode.value = false
    isHourlyComparisonMode.value = true

  }
}

const saveUserPreference = () => {
  const userPreference = {
    pdfStyles: pdfStyles,
    isAlignDatesMode: isAlignDatesMode.value,
    isHourlyComparisonMode: isHourlyComparisonMode.value
  }

  localStorage.setItem('lab-result-preference', JSON.stringify(userPreference))
}

const computedLabResultCol = computed(() => {
  return pdfStyles.flgMemoCol ? 6 : 9
})

const getLabEnName = (data) => {
  return data?.lab?.name_lab_en
    ? data?.lab?.name_lab_en?.replace('%', ' ')
    : data?.name_lab_en.replace(
        '%',
        ' '
      )
}
const getLabName = (data) => {
  return data?.lab?.name_lab_en || data?.lab?.name_lab
    ? (data?.lab?.name_lab_en == data?.lab?.name_lab
      ? ''
      : data?.lab?.name_lab)
    : (data?.name_lab_en == data?.name_lab
      ? ''
      : data?.name_lab)
}

onMounted(async () => {
  checkUserPreference()
  await clinicStore.fetchClinicById(getCustomer.value.id_clinic)
  clinic.value = clinicStore.getClinic
  logoClinic.value = await getImage(clinicStore.getClinic.logo_file_path2)
  await nextTick()

  init()
})

onUnmounted(() => {
  saveUserPreference()
})
</script>
<template>
  <q-form>
    <PdfExport :generateOnePDF="false" orientationMode="landscape" ref="exportPdf" sheetName="lab_result" />
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          検査結果 比較
        </q-toolbar-title>
        <div class="flex q-mr-xs">
          <div class="q-ml-md">
            {{ getCustomer.code_customer }} {{ getCustomerNameHonorific(getCustomer) }}
          </div>
          <div class="q-ml-sm">
            {{ getPet.code_pet }} {{ getPetFirstName(getPet) }}
          </div>
          <div v-if="getPet.id_cm_animal" class="q-ml-md">
            {{ getTypeAnimal(getPet.id_cm_animal) }}
          </div>
          <div v-if="getPet.id_cm_breed" class="q-ml-sm">
            {{ '/ ' + getBreed(getPet.id_cm_breed) }}
          </div>
          <div v-if="getPet.type_pet_gender" class="q-ml-md">
            {{ getPetGenderType(getPet.type_pet_gender) }}
          </div>
        </div>
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="flex justify-end">
        <MtFormCheckBox label="時間別比較" v-model:checked="isHourlyComparisonMode" @update:checked="handleHourlyComparison" />
        <MtFormCheckBox label="日付を揃える" v-model:checked="isAlignDatesMode" @update:checked="handleAlignDate" />
        <MtFormCheckBox label="記号表示" v-model:checked="pdfStyles.flgUpDown" @update:checked="($event) => handleValResult($event, 'icons')" />
        <MtFormCheckBox label="基準値外 背景色" v-model:checked="pdfStyles.flgCellBg" @update:checked="handleCellBg" />
        <MtFormCheckBox label="基準値外 文字色" v-model:checked="pdfStyles.flgRedBlueFont" @update:checked="($event) => handleValResult($event, 'font-color')" />
        <MtFormCheckBox label="説明欄表示" v-model:checked="pdfStyles.flgMemoCol" />
        <MtFormRadiobtn label="日時昇順" v-model:selected="sort" @update:selected="changeSorting" val="asc" />
        <MtFormRadiobtn label="降順" v-model:selected="sort" @update:selected="changeSorting" val="desc" /> 
      </div>
      <section class="flex justify-center">
        <div id="element-to-print" class="print-content text-caption">
          <div v-for="(data, index) in labResultData" :key="index" class="pdf-row-item">
            <div v-if="data.flgNameRow">
              <div class="row category-header q-pt-sm">
                <div class="col-12 q-ml-sm">{{ getCategoryName(data.id_category) }}</div>
              </div>
              <div class="row q-bb-solid">
                <div class="text-center col-2 q-br">項目</div>
                <div v-for="col in computedLabResultCol" class="text-center col" :class="dateFormat(data.column[col - 1], comparisonFormatMode) != null ? 'q-br' : ''">
                  <span class="text-center font-11px" style="text-wrap: nowrap;">
                    {{ dateFormat(data.column[col - 1], comparisonFormatMode) }}
                  </span>
                </div>
                <div class="text-center col-1 q-br" :class="dateFormat(data.column[5], comparisonFormatMode) != null ? '' : 'q-bl'">単位</div>
                <div class="text-center col-1 q-br">基準値</div>
                <div class="text-center col-3" v-if="pdfStyles.flgMemoCol">備考</div>
              </div>
            </div>
            <template v-else>
              <div
                :class="[
                  (index % 2) == 0 ? '' : 'bg-grey-200',
                  data.lab_set_device?.flg_above_blank_row || data.lab_set?.flg_above_blank_row || data.lab_device?.flg_above_blank_row ? 'q-mt-xs q-bt-dotted' : ''
                ]"
                class="row items-center q-bb-dotted"
                style="line-height: 1.2;"
              >
                <div class="col-2 q-br">
                  <div class="flex q-pl-sm">
                    <div
                      class="font-11px flex text-wrap items-center"
                      :class="data.lab_set_device?.flg_indent || data.lab_set?.flg_indent || data.lab_device?.flg_indent ? 'q-pl-md' : ''"
                    >
                      <div class="q-mr-md">
                        <b>{{ getLabEnName(data) }}</b>
                      </div>
                      <div class="ellipsis" :class="getLabName(data).length + getLabEnName(data).length > 12 ? 'font-8px' : 'font-11px'">
                        {{ getLabName(data) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  v-for="col in computedLabResultCol"
                  class="text-center col"
                  :class="data.value[col - 1] ? 'q-br' : ''"
                >
                  <span
                    class="text-center font-11px"
                    style="text-wrap: nowrap"
                    v-html="
                      data.value[col - 1]
                        ? data.value[col - 1].result !== ''
                          ? data.value[col - 1].result
                          : '-'
                        : data.value[col - 1]
                    "
                  ></span>
                </div>              
                <div class="text-center col-1 font-11px q-br" :class="data.value[5] ? '' : 'q-bl'">
                  {{ typeLabUnitName((data.lab_set_device ? data.lab_set_device : (data.lab_device ? data.lab_device : data.lab_set) ?? data.lab)?.id_cm_unit ?? data.id_cm_unit) }}
                </div>
                <div class="text-center col-1 q-br">
                  <div class="flex no-wrap items-center justify-center font-11px q-pl-xs">
                    <template v-if="data.low && data.high">
                      {{ data.low }} ~ {{ data.high }}
                    </template>
                    <template v-else-if="data.ranges.low && data.ranges.high">
                      {{ data.ranges.low }} ~ {{ data.ranges.high }}
                    </template>
                    <template v-else>
                      {{ getLabRanges(data.id_lab, data.id_cm_device) }}
                    </template>
                  </div>
                </div>
                <div class="text-left col-3 q-px-sm" v-if="pdfStyles.flgMemoCol">
                  <span class="font-10px" v-html="(data.lab_set_device ? data.lab_set_device : (data.lab_device ? data.lab_device : data.lab_set) ?? data.lab)?.memo_lab"></span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" @click="generateReport('download')">
          <span>PDFダウンロード</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" @click="generateReport('print')">
          <span>印刷</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md no-uppercase" @click="generateReport('send')">
          <span>myVetty送信</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style scoped lang="scss">
.print-content {
  width: 100%;
  font-family: 'Noto Sans JP';
}
.print-content.pdf-print {
  width: 289mm;
}
.category-header {
  background-color: #fff;
  border-top: 2px solid;
  border-bottom: 4px double;
}
.custom-col {
  flex: 0 0 calc(100% / 9 / 2);
  max-width: calc(100% / 9 / 2);
  text-align: center; /* Just for visualization */
}
.font-9px {
  font-size: 9px !important;
}
.font-10px {
  font-size: 10px !important;
}
:deep(.val-result) {
  display: inline-block;
  width: 100%;
}
:deep(.no-bg) {
  background: transparent !important;
}
.q-bb-solid {
  border-bottom: 1px solid #9f9f9f;
}
.header-logo {
  margin-top: 10px;
}
.font-8px {
  font-size: 8px !important;
}
</style>
