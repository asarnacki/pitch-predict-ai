<script setup lang="ts">
import { ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const theme = ref<"light" | "dark">("dark");
const t = useTranslation();

const toggleTheme = () => {
  const newTheme = theme.value === "dark" ? "light" : "dark";
  theme.value = newTheme;
  document.documentElement.classList.toggle("dark", newTheme === "dark");
};
</script>

<template>
  <Button variant="ghost" size="icon" :aria-label="t.common.toggleThemeAria" class="rounded-full" @click="toggleTheme">
    <Sun v-if="theme === 'dark'" class="size-5" />
    <Moon v-else class="size-5" />
  </Button>
</template>
