<script setup lang="ts">
import {onMounted, ref} from "vue";
import * as http from "http";
import {api} from "@/boot/axios";
const logs = ref('')
async function callApi(logs:any) {
  return new Promise((resolve, reject) => {
    api
        .get(`/logs`, )
        .then((response) => {
          logs.value = response.data.log_contents
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
  });
}
callApi(logs)
</script>

<template>
<pre>{{logs}}</pre>
</template>

<style scoped lang="scss">

</style>