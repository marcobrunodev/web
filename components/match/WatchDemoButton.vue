<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Play, FolderOpen, Loader2, AlertCircle, Check } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Progress } from "~/components/ui/progress";
import { useDemoPlayer } from "~/composables/useDemoPlayer";

const props = defineProps<{
  downloadUrl: string;
  filename: string;
}>();

const { state, initialize, watchDemo, getSuggestedPaths, isSupported } =
  useDemoPlayer();

const showSetupModal = ref(false);
const isWatching = ref(false);
const watchSuccess = ref(false);

onMounted(async () => {
  await initialize();
});

const handleWatch = async () => {
  if (!isSupported()) {
    // Fallback: just open download URL
    window.open(props.downloadUrl, "_blank");
    return;
  }

  if (!state.value.hasPermission) {
    showSetupModal.value = true;
    return;
  }

  isWatching.value = true;
  watchSuccess.value = false;

  const success = await watchDemo(props.downloadUrl, props.filename);

  if (success) {
    watchSuccess.value = true;
    setTimeout(() => {
      watchSuccess.value = false;
    }, 3000);
  }

  isWatching.value = false;
};

const handleSetupAndWatch = async () => {
  isWatching.value = true;

  const success = await watchDemo(props.downloadUrl, props.filename);

  if (success) {
    showSetupModal.value = false;
    watchSuccess.value = true;
    setTimeout(() => {
      watchSuccess.value = false;
    }, 3000);
  }

  isWatching.value = false;
};

const suggestedPaths = getSuggestedPaths();
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          size="sm"
          variant="outline"
          :disabled="isWatching || state.isDownloading"
          @click="handleWatch"
        >
          <Loader2
            v-if="isWatching || state.isDownloading"
            class="w-4 h-4 animate-spin"
          />
          <Check v-else-if="watchSuccess" class="w-4 h-4 text-green-500" />
          <Play v-else class="w-4 h-4" />
          <span v-if="state.isDownloading" class="ml-1">
            {{ state.downloadProgress }}%
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p v-if="!isSupported()">
          {{ $t("match.watch_demo_unsupported") }}
        </p>
        <p v-else-if="watchSuccess">
          {{ $t("match.watch_demo_launching") }}
        </p>
        <p v-else>
          {{ $t("match.watch_demo") }}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <!-- Setup Modal -->
  <Dialog v-model:open="showSetupModal">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ $t("match.demo_setup_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("match.demo_setup_description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Suggested paths -->
        <div class="text-sm text-muted-foreground">
          <p class="font-medium mb-2">{{ $t("match.demo_setup_paths") }}</p>
          <div class="space-y-1 font-mono text-xs bg-muted p-3 rounded-md">
            <div v-for="path in suggestedPaths" :key="path.platform">
              <span class="text-primary">{{ path.platform }}:</span>
              <br />
              <span class="text-muted-foreground break-all">{{
                path.path
              }}</span>
            </div>
          </div>
        </div>

        <!-- Progress bar when downloading -->
        <div v-if="state.isDownloading" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>{{ $t("match.demo_downloading") }}</span>
            <span>{{ state.downloadProgress }}%</span>
          </div>
          <Progress :model-value="state.downloadProgress" />
        </div>

        <!-- Error message -->
        <div
          v-if="state.error"
          class="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle class="w-4 h-4" />
          <span>{{ state.error }}</span>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showSetupModal = false">
          {{ $t("common.cancel") }}
        </Button>
        <Button :disabled="isWatching || state.isDownloading" @click="handleSetupAndWatch">
          <FolderOpen v-if="!isWatching && !state.isDownloading" class="w-4 h-4 mr-2" />
          <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
          {{ $t("match.demo_select_folder") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
