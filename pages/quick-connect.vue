<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">{{ $t('quickConnect.title') }}</h1>
      <p class="mb-4">{{ $t('quickConnect.redirecting') }}</p>
      <p class="text-sm text-muted-foreground">
        {{ $t('quickConnect.manualConnect') }}
      </p>
      <code class="block mt-2 p-2 bg-muted rounded">{{ link }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const link = route.query.link as string

onMounted(() => {
  if (link) {
    // Redireciona para o link Steam automaticamente
    window.location.href = link
  }
})
</script>
