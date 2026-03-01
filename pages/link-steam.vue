<script setup lang="ts">
import { useAuthStore } from "~/stores/AuthStore";
import { useRouter } from "vue-router";
import { computed, onMounted } from "vue";
import LinkSteamForm from "~/components/LinkSteamForm.vue";

const authStore = useAuthStore();
const router = useRouter();

const needsSteamLink = computed(() => {
  return authStore.me && !authStore.me.steam_id && authStore.me.discord_id;
});

onMounted(() => {
  // If user already has Steam ID, redirect to home
  if (authStore.me?.steam_id) {
    router.push("/");
  }
  // If user is not logged in at all, redirect to login
  if (!authStore.me) {
    router.push("/login");
  }
});

definePageMeta({
  layout: "public",
});
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-background px-4">
    <div class="w-full max-w-md space-y-8">
      <!-- Logo and Title -->
      <div class="text-center space-y-4">
        <NuxtImg
          src="/favicon/128.png"
          alt="5Stack"
          width="128"
          height="128"
          class="mx-auto rounded-lg"
        />
        <h1 class="text-3xl font-bold">
          {{ $t('pages.link_steam.title') || 'Link Your Steam Account' }}
        </h1>
        <p class="text-muted-foreground">
          {{ $t('pages.link_steam.description') || 'To play matches, we need to link your Steam account.' }}
        </p>
      </div>

      <!-- Link Steam Form -->
      <LinkSteamForm v-if="needsSteamLink" />

      <!-- Skip for now option -->
      <div class="text-center">
        <NuxtLink
          to="/"
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {{ $t('pages.link_steam.skip') || 'Skip for now' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>