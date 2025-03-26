<template>
  <q-page padding>
    <h5>Simple dashboard</h5>
    <div class="row q-col-gutter-md">
      <div class="col-4" v-for="card in cards" :key="card.title">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ card.title }}</div>
            <div class="text-subtitle2">{{ card.subtitle }}</div>
          </q-card-section>

          <q-card-section>
            <div class="text-h4">{{ card.data }}</div>
          </q-card-section>

          <q-card-actions>
            <q-btn class="full-width" :outline="card.btn_color === 'grey-100'" :color="card.btn_color" unelevated @click="openModal">{{ card.action }}</q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import useModalStore from '@/stores/modal'
import { ref } from 'vue'
import DashboardModal from '@/pages/dashboard/DashboardModal.vue'

const cards = ref([
  {
    title: 'Users',
    subtitle: 'Total registered users',
    data: 1200,
    action: 'PRIMARY',
    btn_color: 'primary'
  },
  {
    title: 'Orders',
    subtitle: 'Orders this month',
    data: 350,
    action: 'SECONDARY',
    btn_color: 'secondary'
  },
  {
    title: 'Revenue',
    subtitle: 'Revenue this month',
    data: '$5000',
    action: 'TERTIARY (grey-100)',
    btn_color: 'grey-100'
  }
])
const modal = useModalStore()

const openModal = () => {
  modal.open('Modal Title', DashboardModal, [
    {
      label: 'Accept',
      callback: () => {
        modal.setButtonLoading(false)
      },
      props: {

      },
      hasLoading: true
    }
  ], false)
}
</script>