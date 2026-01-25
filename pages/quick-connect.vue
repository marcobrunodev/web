<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">{{ $t('quickConnect.title') }}</h1>
      <p class="mb-4">{{ $t('quickConnect.redirecting') }}</p>
      <p class="text-sm text-muted-foreground">
        {{ $t('quickConnect.manualConnect') }}
      </p>
      <code class="block mt-2 p-2 bg-muted rounded">{{ link }}</code>
      <button
        v-if="link"
        @click="window.location.href = link"
        class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Connect Now
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const link = computed(() => {
  const queryLink = route.query.link as string
  if (!queryLink) return ''

  // Decodificar o link (pode vir com encoding duplo do Discord)
  try {
    return decodeURIComponent(queryLink)
  } catch {
    return queryLink
  }
})

onMounted(() => {
  if (link.value) {
    // Redireciona para o link Steam automaticamente
    window.location.href = link.value
  }
})
</script>
