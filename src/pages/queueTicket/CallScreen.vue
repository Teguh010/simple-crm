<script setup lang="ts">
</script>
<template>
 <div class="call_screen ">
    <div class="text-weight-bold row items-center">
        <q-btn
          label="1101"
          class="text-weight-bold q-mt-xl q-ml-xs q-pa-none"
        />
      <p class="text-bold number_people q-pl-xl q-pa-lg">番の方</p>
    </div>
    <div class="text-bold footer-text q-mt-md q-pa-lg text-center">お待たせいたしました。<br> 診察室へお入りください。</div>
 </div>
</template>
<style lang="scss" scoped>
.call_screen{
  background: rgb(221, 232, 247);
  border-radius: 10px;
  height:100%;
  width:100%;
.q-btn{
  font-size: 150px;
  width:600px;
  background:white;
  border-radius: 20px;
  margin-left: 80px;
}
.number_people{
  color:#306671;
  font-size: 120px;
  margin-top:140px;
  margin-left: 50px;
}
.footer-text{
  color:#306671;
  font-size:65px;
  margin-left: 70px;
}
}
</style>