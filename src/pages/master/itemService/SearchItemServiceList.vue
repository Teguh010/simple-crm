<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateItemServiceModal from './UpdateItemServiceModal.vue'
import ViewItemServiceDetailModal from './ViewItemServiceDetailModal.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import useItemStore from '@/stores/items'
import { storeToRefs } from 'pinia'
import aahGlobal from '@/utils/aahGlobal'
import { useRoute, useRouter } from 'vue-router'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { typeItem } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCommonStore from '@/stores/common'
import { event_bus } from '@/utils/eventBus'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { Category, Common } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import useCategoryStore from '@/stores/categories'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'

type SearchQueryType = {
  name_item_service: string,
  flg_service: boolean,
  id_cm_type_service: number | null,
  type_item: number | null,
  id_category1: string[] | number[] | null
}

const router = useRouter()
const route = useRoute()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const itemStore = useItemStore()
const categoryStore = useCategoryStore()
const {
  getCommonTypeServiceOptionList
} = storeToRefs(commonStore)
const { getItems, getExportServiceItems } = storeToRefs(itemStore)
const { getCategories, getAllCategories } = storeToRefs(categoryStore)
const searchQuery = ref<SearchQueryType>({
  name_item_service: '',
  flg_service: true,
  id_cm_type_service: null,
  type_item: null,
  id_category1Ui: [],
  id_category1_list: null
})
const name_item_service = ref('')
const start_page = ref(0)
const itemList = ref([])
const categoryOptions = ref<Category[]>()
const categoryOptionsDefault = reactive<Category[]>([])

const flgService = ref(true)
const flgServiceTypes = [
  { label: 'サービス', value: true },
  { label: '商品', value: false }
]
const columns = [
  {
    name: 'code_item_service',
    label: 'サービス商品CD',
    field: 'code_item_service',
    align: 'left'
  },
  {
    name: 'name_item_service',
    label: '商品名',
    field: 'name_item_service',
    align: 'left'
  },
  {
    name: 'flg_service',
    label: 'サービス商品タイプ',
    field: 'flg_service',
    align: 'left'
  },
  {
    name: 'id_cm_type_service',
    label: 'サービス区分',
    field: 'id_cm_type_service',
    align: 'left'
  },
  { name: 'type_item', label: '商品区分', field: 'type_item', align: 'left' },
  {
    name: 'name_category1',
    label: '大分類',
    field: 'name_category1',
    align: 'left'
  },
  {
    name: 'name_category2',
    label: '中分類',
    field: 'name_category2',
    align: 'left'
  }
]

const onRowClick = async (id_item_service: number) => {
  router.replace({ query: { id: id_item_service } })
  await mtUtils.popup(ViewItemServiceDetailModal, { id: id_item_service })
  router.replace({ name: 'SearchItemServiceList' })
  await search()
}

const openAddModal = async () => {
  itemStore.selectItem(null)
  await mtUtils.popup(UpdateItemServiceModal)
}

const exportItemCSV = async () => {
  await itemStore.exportItems(searchQuery.value)
  const data = getExportServiceItems.value
  const fileName = `サービス製品リスト-csv-${new Date().getMonth() + 1}-${new Date().getDate()}`;

  downloadCSV(data, fileName);
}
function downloadCSV(csvString: string|null, filename: string) {    
  if(csvString !== null){
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
        // Create a link to the file
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }
}

const search = async (page = 1) => {
  start_page.value = Math.ceil(page * aahGlobal.length_pages)
  await itemStore.fetchItems(searchQuery.value)
  itemList.value = getItems.value
}

const changeFlgService = async () => {
  if (flgService.value) {
    searchQuery.value.flg_service = true
    searchQuery.value.type_item = null
  } else {
    searchQuery.value.flg_service = false
    searchQuery.value.id_cm_type_service = null
  }

  searchQuery.value.id_category1 = []

  await itemStore.fetchItems(searchQuery.value)
  await categoryStore.fetchCategories({
    name_category: '',
    flg_for_service: searchQuery.value.flg_service,
    flg_for_medicine: false,
    flg_for_disease: false,
    flg_for_task: false,
    flg_for_food: false,
    flg_for_item: !searchQuery.value.flg_service,
    flg_for_lab: false,
    flg_for_other: false
  })
  itemList.value = getItems.value
  await init()
  createCategoryOptions()
}

const init = async () => {
  if (localStorage.getItem('pageAction') === 'itemServiceDetails' || route.query.id) {
    const serviceId = localStorage.getItem('pageActionParam') ?? route.query.id
    onRowClick(parseInt(serviceId as string))
    localStorage.removeItem('pageAction')
    localStorage.removeItem('pageActionParam')
  }
}

const typeServiceName = (value: number) => {
  return getCommonTypeServiceOptionList.value.find((v: Common) => v.id_common == value)?.label
}

const typeItemName = (value: number) => {
  return typeItem.find((v) => v.value === value)?.label
}

const onUpdateTypeItem = async (value: number, type: string) => {
  searchQuery.value[type as keyof SearchQueryType] = value
  searchQuery.value.id_category1 = []
  searchQuery.value.id_category1_list = []

  const activeCategories = getAllCategories.value.filter((c) => {
    return c.flg_active
  })

  if (type == 'type_item') {
    categoryOptions.value = activeCategories.filter((cat) => {
      if (cat.type_category_layer != 1) return false

      if (value == 1 && cat.flg_for_medicine) return true
      if (value == 2 && cat.code_category.includes('FD')) return true
      if (value == 3 && cat.code_category.includes('SP')) return true
      if (value == 4 && cat.code_category.includes('MI')) return true
      if (value == 5 && cat.code_category.includes('NI')) return true

      return !!(value == 10 && cat.code_category.includes('OI'))

    })
      .map((c) => {
        return {
          ...c,
          value: c.id_category,
          label: c.name_category
        }
      })

  } else {
    categoryOptions.value = activeCategories.filter((cat) => {
      if (cat.type_category_layer != 1) return false
      
      if (value == 17501 && cat.code_category.includes('CO')) return true
      if (value == 17502 && cat.code_category.includes('TR')) return true
      if (value == 17503 && cat.code_category.includes('EZ')) return true
      if (value == 17504 && cat.code_category.includes('EX')) return true
      if (value == 17505 && cat.code_category.includes('OP')) return true
      if (value == 17506 && cat.code_category.includes('HP')) return true
      if (value == 17507 && cat.code_category.includes('RC')) return true
      if (value == 17508 && cat.code_category.includes('WB')) return true
      if (value == 17509 && cat.code_category.includes('SL')) return true
      if (value == 17510 && cat.code_category.includes('PH')) return true
      if (value == 17511 && cat.code_category.includes('VS')) return true
      if (value == 17512 && cat.code_category.includes('TL')) return true
      if (value == 17513 && cat.code_category.includes('OT')) return true
      if (value == 17514 && cat.code_category.includes('DR')) return true
      if (value == 17515 && cat.code_category.includes('IN')) return true
      if (value == 17516 && cat.code_category.includes('CR')) return true
      if (value == 17517 && cat.code_category.includes('RH')) return true
      if (value == 17518 && cat.code_category.includes('BH')) return true
      if (value == 17519 && cat.code_category.includes('MB')) return true

      return false
    })
      .map((c) => {
        return {
          ...c,
          value: c.id_category,
          label: c.name_category
        }
      })
  }

  await search()
}

const createCategoryOptions = () => {
  if (getCategories.value.length) {
    const activeCategories = getCategories.value.filter((c) => {
      return c.flg_active
    })

    categoryOptionsDefault.length = 0
    categoryOptions.value = activeCategories.map((c) => {
      return {
        ...c,
        value: c.id_category,
        label: c.name_category
      }
    })
    categoryOptionsDefault.push(...categoryOptions.value)
  }
}

const disableCategory = computed(() => {
  if (flgService.value && !searchQuery.value.id_cm_type_service) {
    return true
  }
  if (!flgService.value && !searchQuery.value.type_item) {
    return true
  }
  return false
})

const filterItems = computed(() => {
  return itemList.value
})

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    commonStore.fetchPreparationCommonList({ code_common: [11] }),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [18] }),
    categoryStore.fetchCategories({
      name_category: '',
      flg_for_service: true,
      flg_for_medicine: false,
      flg_for_disease: false,
      flg_for_task: false,
      flg_for_food: false,
      flg_for_item: false,
      flg_for_lab: false,
      flg_for_other: false,
      flg_active: true
    })
  ])

  init()
  setPageTitle('サービス商品一覧')

  createCategoryOptions()
})

event_bus.on('onAddISU', async (data) => {
  await onRowClick(data.id_item_service)
})


const onCSVPicked = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && file.type === 'text/csv') {
    uploadCSV(file);
  } else {
    alert('有効なcsvファイルを選択してください。');
  }
};

const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  itemStore.importItems(formData)
};
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          サービス商品一覧
        </q-toolbar-title>
        <div class="col-2">
          <MtFormRadiobtn
            v-for="type in flgServiceTypes"
            v-model:selected="flgService"
            :label="type.label"
            :val="type.value"
            class="q-pr-md"
            @update:selected="changeFlgService"
          />
        </div>
        <div class="col-1" v-if="flgService">
          <MtFormPullDown
            v-model:selected="searchQuery.id_cm_type_service"
            label="サービス区分"
            :options="getCommonTypeServiceOptionList"
            @update-model-value="(v) => onUpdateTypeItem(v, 'id_cm_type_service')"
          />
        </div>
        <div class="col-2" v-else>
          <MtFormPullDown
            v-model:selected="searchQuery.type_item"
            type="selection"
            label="商品区分"
            :options="typeItem"
            @update-model-value="(v) => onUpdateTypeItem(v, 'type_item')"
          />
        </div>
        <div class="col-2 q-mx-sm">
          <MtFormMultipleSelection
            v-model="searchQuery.id_category1Ui"
            :options="categoryOptions"
            label="大分類"
            :disable="disableCategory"
            dense
            @update:modelValue="(v) => searchQuery.id_category1_list = v.join(',')"
          />
        </div>
        <MtInputForm
          type="text"
          outlined
          label="サービス商品名"
          v-model="searchQuery.name_item_service"
          class="search-field q-mx-sm"
          autofocus
          tabindex="1"
          @keydown.enter="search()"
        />
        <q-btn
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mr-sm"
          @click="search()"
        >
          <q-icon name="search" size="20px" />
          検索
        </q-btn>
        <input
          ref="itemCSV"
          accept=".csv"
          style="display: none"
          type="file"
          @change="onCSVPicked($event, 'itemServiceCSV')"
        />
        <q-btn
          v-permission
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon name="add" size="20px" />
          サービス商品
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm">件</span>
      </div>
      <!-- <div class="row items-center gap-2 justify-end">
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="exportItemCSV()"
        >
          <q-icon name="download" class="q-mr-xs" />
          (調整中) CSV出力
        </q-btn>
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="$refs.itemCSV.click()"
        >
          <q-icon name="upload" class="q-mr-xs" />
          (調整中) CSV取込
        </q-btn>
      </div> -->
    </div>
    <MtTable2
      :columns="columns"
      :rows="filterItems"
      :rowsBg="true"
      :style="{ height: 'calc(100vh - 100px)', boxShadow: 'none' }"
      class="q-pt-sm"
      flat
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row.id_item_service)"
        >
          <div v-if="col.field == 'code_item_service'" auto-width key="code_item_service">
            <div class="body1 regular text-grey-900">
              {{ row['code_item_service'] }}
            </div>
          </div>
          <div v-if="col.field == 'name_item_service'" auto-width key="name_item_service">
            <div class="body1 row no-wrap regular text-grey-900">
              <span>{{ row['name_item_service'] }}</span>
            </div>
          </div>
          <div
            v-if="col.field == 'flg_service'"
            auto-width
            key="flg_service"
          >
            <div class="body1 regular text-grey-900">
              {{ row['flg_service'] ? 'サービス' : '商品' }}
            </div>
          </div>
          <div
            v-if="col.field == 'id_cm_type_service'"
            auto-width
            key="id_cm_type_service"
          >
            <div class="body1 row regular text-grey-900">
              {{ row['id_cm_type_service'] ? typeServiceName(row['id_cm_type_service'])
              : '-' }}
            </div>
          </div>
          <div
            v-if="col.field == 'type_item'"
            auto-width
            key="type_item"
          >
            <div class="row no-wrap body1 regular text-grey-900">
              {{ row['type_item'] ? typeItemName(row['type_item']) : '-' }}

            </div>
          </div>
          <div
            v-if="col.field == 'name_category1'"
            auto-width
            key="name_category1"
          >
            <div class="body1 regular text-grey-900">
              {{
                row['name_category1'] ? row['name_category1']
                  : '-' }}
            </div>
          </div>
          <div v-if="col.field == 'name_category2'" key="name_category2">
            <div class="body1 regular text-grey-900">
              {{
                row['name_category2'] ? row['name_category2']
                  : '-' }}
            </div>
          </div>

        </td>
      </template>
    </MtTable2>

  </q-page>
</template>
<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
</style>
