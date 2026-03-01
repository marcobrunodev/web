<script setup lang="ts">
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Video, Eye, EyeOff } from "lucide-vue-next";
import PageTransition from "~/components/ui/transitions/PageTransition.vue";

definePageMeta({
  layout: "application-settings",
});
</script>

<template>
  <PageTransition :delay="0">
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-medium">
          {{ $t("pages.settings.application.clips.title") }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ $t("pages.settings.application.clips.description") }}
        </p>
        <a
          href="https://developer.allstar.gg/dashboard/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
        >
          {{ $t("pages.settings.application.clips.allstar_dashboard") }}
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <form @submit.prevent="updateSettings" class="grid gap-6">
        <!-- Enable Clips Toggle -->
        <div
          class="flex flex-row items-center justify-between rounded-lg border p-4 cursor-pointer"
          @click="toggleClipsEnabled"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <Video class="w-5 h-5" />
              <h4 class="text-base font-medium">
                {{ $t("pages.settings.application.clips.enable_clips") }}
              </h4>
            </div>
            <p class="text-sm text-muted-foreground">
              {{
                $t("pages.settings.application.clips.enable_clips_description")
              }}
            </p>
          </div>
          <Switch
            :model-value="clipsEnabled"
            @update:model-value="toggleClipsEnabled"
          />
        </div>

        <!-- API Key -->
        <FormField v-slot="{ componentField }" name="allstar_api_key">
          <FormItem>
            <FormLabel class="text-lg font-semibold">{{
              $t("pages.settings.application.clips.api_key")
            }}</FormLabel>
            <FormDescription>
              {{ $t("pages.settings.application.clips.api_key_description") }}
            </FormDescription>
            <FormControl>
              <div class="relative">
                <Input
                  v-bind="componentField"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="sk_xxxxxxxxxxxxxxxxxxxx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  @click="showApiKey = !showApiKey"
                >
                  <Eye v-if="!showApiKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Webhook URL -->
        <FormField v-slot="{ componentField }" name="allstar_webhook_url">
          <FormItem>
            <FormLabel class="text-lg font-semibold">{{
              $t("pages.settings.application.clips.webhook_url")
            }}</FormLabel>
            <FormDescription>
              {{
                $t("pages.settings.application.clips.webhook_url_description")
              }}
            </FormDescription>
            <FormControl>
              <Input
                v-bind="componentField"
                type="url"
                :placeholder="webhookPlaceholder"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Webhook Auth String -->
        <FormField v-slot="{ componentField }" name="allstar_webhook_auth">
          <FormItem>
            <FormLabel class="text-lg font-semibold">{{
              $t("pages.settings.application.clips.webhook_auth")
            }}</FormLabel>
            <FormDescription>
              {{
                $t("pages.settings.application.clips.webhook_auth_description")
              }}
            </FormDescription>
            <FormControl>
              <div class="relative">
                <Input
                  v-bind="componentField"
                  :type="showWebhookAuth ? 'text' : 'password'"
                  placeholder="your-secret-auth-string"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  @click="showWebhookAuth = !showWebhookAuth"
                >
                  <Eye v-if="!showWebhookAuth" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="flex justify-start">
          <Button
            type="submit"
            :disabled="Object.keys(form.errors).length > 0"
            class="my-3"
          >
            {{ $t("pages.settings.application.clips.update") }}
          </Button>
        </div>
      </form>

      <!-- Info Box -->
      <div class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4">
        <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          {{ $t("pages.settings.application.clips.how_it_works") }}
        </h4>
        <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>{{ $t("pages.settings.application.clips.how_it_works_1") }}</li>
          <li>{{ $t("pages.settings.application.clips.how_it_works_2") }}</li>
          <li>{{ $t("pages.settings.application.clips.how_it_works_3") }}</li>
          <li>{{ $t("pages.settings.application.clips.how_it_works_4") }}</li>
        </ul>
      </div>
    </div>
  </PageTransition>
</template>

<script lang="ts">
import { settings_constraint, settings_update_column } from "~/generated/zeus";
import { generateMutation } from "~/graphql/graphqlGen";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { toast } from "@/components/ui/toast";

export default {
  data() {
    return {
      showApiKey: false,
      showWebhookAuth: false,
      form: useForm({
        validationSchema: toTypedSchema(
          z.object({
            allstar_api_key: z.string().optional(),
            allstar_webhook_url: z.string().url().optional().or(z.literal("")),
            allstar_webhook_auth: z.string().optional(),
          }),
        ),
      }),
    };
  },
  computed: {
    settings() {
      return useApplicationSettingsStore().settings;
    },
    clipsEnabled() {
      const setting = this.settings.find(
        (s: { name: string; value: string | null }) => s.name === "clips_enabled",
      );
      return setting?.value === "true";
    },
    webhookPlaceholder() {
      if (typeof window !== "undefined") {
        return `${window.location.origin}/clips/webhook/allstar`;
      }
      return "https://your-domain.com/clips/webhook/allstar";
    },
  },
  watch: {
    settings: {
      immediate: true,
      handler(newVal: Array<{ name: string; value: string | null }>) {
        for (const setting of newVal) {
          if (
            setting.name === "allstar_api_key" ||
            setting.name === "allstar_webhook_url" ||
            setting.name === "allstar_webhook_auth"
          ) {
            (this.form.setFieldValue as any)(setting.name, setting.value || "");
          }
        }
      },
    },
  },
  methods: {
    async toggleClipsEnabled() {
      await (this as any).$apollo.mutate({
        mutation: generateMutation({
          insert_settings_one: [
            {
              object: {
                name: "clips_enabled",
                value: this.clipsEnabled ? "false" : "true",
              },
              on_conflict: {
                constraint: settings_constraint.settings_pkey,
                update_columns: [settings_update_column.value],
              },
            },
            {
              __typename: true,
            },
          ],
        }),
      });

      toast({
        title: this.clipsEnabled
          ? this.$t("pages.settings.application.clips.clips_disabled")
          : this.$t("pages.settings.application.clips.clips_enabled_toast"),
      });
    },
    async updateSettings() {
      const values = this.form.values as any;

      const objects = [];

      if (values.allstar_api_key !== undefined) {
        objects.push({
          name: "allstar_api_key",
          value: values.allstar_api_key || "",
        });
      }

      if (values.allstar_webhook_url !== undefined) {
        objects.push({
          name: "allstar_webhook_url",
          value: values.allstar_webhook_url || "",
        });
      }

      if (values.allstar_webhook_auth !== undefined) {
        objects.push({
          name: "allstar_webhook_auth",
          value: values.allstar_webhook_auth || "",
        });
      }

      if (objects.length === 0) {
        return;
      }

      await (this as any).$apollo.mutate({
        mutation: generateMutation({
          insert_settings: [
            {
              objects,
              on_conflict: {
                constraint: settings_constraint.settings_pkey,
                update_columns: [settings_update_column.value],
              },
            },
            {
              __typename: true,
            },
          ],
        }),
      });

      toast({
        title: this.$t("pages.settings.application.clips.updated"),
      });
    },
  },
};
</script>
