<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormCheckBoxMultiple from '@/components/form/MtFormCheckBoxMultiple.vue'
import { storeToRefs } from 'pinia'
import useCartStore from '@/stores/carts'
import useCustomerStore from '@/stores/customers'

const cartStore = useCartStore()
const customerStore = useCustomerStore()

const { getCustomer } = storeToRefs(customerStore)
const { getCart } = storeToRefs(cartStore)

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  await cartStore.updateDiscount(getCart.value?.id_cart, data.value)
  await cartStore.fetchCart(getCart.value.id_cart)
  closeModal()
}

const data = ref({
  selected_pets: [],
})

const petOptions = ref([])

onMounted(() => {
  if (getCart.value?.cart_details) {
    const uniquePets = new Set();

    petOptions.value = getCart.value.cart_details
      .reduce((filteredPets, detail) => {
        const pet = detail.id_pet;
        
        if (pet && !uniquePets.has(pet.id_pet)) {
          uniquePets.add(pet.id_pet);
          filteredPets.push({
            label: pet.name_pet,
            value: pet.id_pet
          });
        }

        return filteredPets;
      }, []);
    }
  })

</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        デフォルト割引の適用
      </q-toolbar-title>
    </MtModalHeader>

    <q-card-section class="q-px-lg">
      <div class="q-mb-md">
        こちらのオーナーにはデフォルト割引が設定されています。<br />この操作は現在の会計明細の割引額を上書きします。    
      </div>
      <hr/>
      <div class="row q-col-gutter-md">
        <div class="col-5">
          <strong>オーナー：</strong> {{ getCustomer?.type_disc_rate }}%
        </div>
        <div class="col-7">
          <strong>ペット：</strong>
          <ul>
            <li v-for="pet in getCustomer?.pets.filter(pet => !pet.flg_unlist)" :key="pet.id_pet">
              {{ pet.name_pet }}: {{ pet.type_disc_rate !== null ? `${pet.type_disc_rate}%` : 'N/A' }}
            </li>
          </ul>  
        </div>
      </div>
      <hr/>
      <div class="q-mb-md">
        対象のペットを選択してください。
      </div>

      <div class="row q-gutter-md q-mb-md">
        <div class="col-12">
          <MtFormCheckBoxMultiple
            :items="petOptions"
            class="q-mr-md"
            v-model:checked="data.selected_pets"
          />
        </div>
      </div>

      <div class="row items-center caption1 regular text-grey-700 q-mb-md">
        <q-icon name="info" class="q-mr-xs" color="primary" />
        割引は特定の条件を満たした場合にのみ適用されます：
        <ul class="default-discount">
          <li>商品マスタで割引が有効になっている必要があります。</li>
          <li>商品マスタの最大割引率を上限として割引率を適用します。</li>
          <li>選択ペットにデフォルト割引率の設定がある場合、その数値が適用されます。設定がない場合には、オーナーの割引率が適用されます。</li>
        </ul>
      </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>デフォルト割引を適用</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>
ul.default-discount li {
  padding: 5px 0;
  line-height: 18px;
}
</style>
