<script setup lang="ts">
import { useAuthStore } from "~/stores/AuthStore";

const authStore = useAuthStore();
const isLoggedIn = computed(() => !!authStore.me);
</script>

<template>
  <NuxtLayout :name="isLoggedIn ? 'default' : 'public'">
    <slot />
  </NuxtLayout>
</template>