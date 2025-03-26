<template>
  <q-page class="flex flex-center">
    <q-card class="full-width">
      <q-card-section>
        <div class="text-h6">Register</div>

        <q-input outlined v-model="username" label="Username" class="q-mt-md" />
        <q-input outlined v-model="email" label="Email" class="q-mt-md" />
        <q-input
          outlined
          v-model="password"
          label="Password"
          type="password"
          class="q-mt-md"
        />
        <q-input
          outlined
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          class="q-mt-md"
        />

        <q-btn color="primary" class="full-width q-mt-md" @click="submitForm"
          >Register</q-btn
        >
      </q-card-section>

      <q-card-section>
        <q-btn flat color="primary" @click="login"
          >Already have an account? Login</q-btn
        >
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const submitForm = () => {
  // Add your registration logic here
};

const login = () => {
  router.push({ name: "Login" });
};
</script>

<style scoped>
.q-card {
  max-width: 400px;
}
</style>
