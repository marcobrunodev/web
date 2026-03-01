<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/AuthStore";
import { useRouter } from "vue-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { toast } from "~/components/ui/toast";
import { ExclamationTriangleIcon, CheckCircledIcon, ReloadIcon } from "@radix-icons/vue";

const authStore = useAuthStore();
const router = useRouter();

const steamId = ref("");
const isLoading = ref(false);
const error = ref("");
const showTutorial = ref(false);

// Validate SteamID64 format
const isValidSteamId = computed(() => {
  return /^7656119\d{10}$/.test(steamId.value);
});

const steamIdError = computed(() => {
  if (!steamId.value) return "";
  if (!isValidSteamId.value) {
    return "Invalid SteamID64 format. It should be 17 digits starting with 7656119";
  }
  return "";
});

async function handleSubmit() {
  if (!isValidSteamId.value) {
    error.value = "Please enter a valid SteamID64";
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    const success = await authStore.linkSteam(steamId.value);

    if (success) {
      toast({
        title: "Success!",
        description: "Your Steam account has been linked successfully.",
      });

      // Refresh user data
      await authStore.getMe();

      // Redirect to home or intended destination
      router.push("/");
    }
  } catch (err: any) {
    error.value = err.message || "Failed to link Steam account. Please try again.";

    toast({
      variant: "destructive",
      title: "Error",
      description: error.value,
    });
  } finally {
    isLoading.value = false;
  }
}

function openTutorial() {
  showTutorial.value = true;
  // Open Steam ID finder in new tab
  window.open("https://www.youtube.com/watch?v=_0rE9y4Hsxg", "_blank");
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle>
        {{ $t('components.link_steam_form.title') || 'Enter Your SteamID64' }}
      </CardTitle>
      <CardDescription>
        {{ $t('components.link_steam_form.description') || 'Your SteamID64 is a 17-digit number that uniquely identifies your Steam account.' }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Error Alert -->
      <Alert v-if="error" variant="destructive">
        <ExclamationTriangleIcon class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Success Message -->
      <Alert v-if="authStore.me?.steam_id" variant="default">
        <CheckCircledIcon class="h-4 w-4" />
        <AlertTitle>Already Linked</AlertTitle>
        <AlertDescription>
          Your Steam account is already linked. Redirecting...
        </AlertDescription>
      </Alert>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="steam-id">
            {{ $t('components.link_steam_form.steam_id_label') || 'SteamID64' }}
          </Label>
          <Input
            id="steam-id"
            v-model="steamId"
            type="text"
            placeholder="76561198123456789"
            :disabled="isLoading"
            maxlength="17"
            pattern="[0-9]{17}"
            class="font-mono"
            :class="{ 'border-destructive': steamIdError }"
          />
          <p v-if="steamIdError" class="text-sm text-destructive">
            {{ steamIdError }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ $t('components.link_steam_form.example') || 'Example: 76561198123456789' }}
          </p>
        </div>

        <!-- How to find SteamID -->
        <div class="bg-secondary/50 rounded-lg p-4 space-y-2">
          <h3 class="font-semibold text-sm">
            {{ $t('components.link_steam_form.how_to_find') || 'How to find your SteamID64?' }}
          </h3>
          <ol class="text-sm space-y-1 text-muted-foreground">
            <li>1. Open Steam and go to your profile</li>
            <li>2. Right-click and select "Copy Page URL"</li>
            <li>3. Visit <a href="https://steamid.io" target="_blank" class="text-primary hover:underline">steamid.io</a></li>
            <li>4. Paste your profile URL</li>
            <li>5. Copy the SteamID64 number</li>
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="openTutorial"
            class="w-full"
          >
            <svg
              class="w-4 h-4 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
            </svg>
            {{ $t('components.link_steam_form.watch_tutorial') || 'Watch Video Tutorial' }}
          </Button>
        </div>

        <!-- Submit Button -->
        <div class="flex gap-2">
          <Button
            type="submit"
            class="flex-1"
            :disabled="isLoading || !steamId || !!steamIdError"
          >
            <ReloadIcon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading
              ? ($t('components.link_steam_form.linking') || 'Linking...')
              : ($t('components.link_steam_form.link_steam') || 'Link Steam Account') }}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>