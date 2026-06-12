<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, LogOut, User as UserIcon, Bookmark } from "lucide-vue-next";
import { toast } from "vue-sonner";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n";

defineProps<{ user: User | null }>();

const isLoggingOut = ref(false);
const t = useTranslation();

const handleLogout = async () => {
  isLoggingOut.value = true;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    toast.success(t.value.nav.logoutSuccess);
    // Redirect to home page
    window.location.href = "/";
  } catch {
    toast.error(t.value.nav.logoutError);
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <!-- If user is not logged in, show login and register buttons -->
  <nav v-if="!user" class="flex items-center gap-2 sm:gap-3">
    <Button variant="ghost" size="sm" as-child class="text-xs sm:text-sm">
      <a href="/login" data-testid="nav-login-link">
        <LogIn class="sm:mr-2 size-4" />
        <span class="hidden sm:inline">{{ t.nav.login }}</span>
      </a>
    </Button>
    <Button variant="default" size="sm" as-child class="text-xs sm:text-sm">
      <a href="/register" data-testid="nav-register-link">
        <UserPlus class="sm:mr-2 size-4" />
        <span class="hidden sm:inline">{{ t.nav.register }}</span>
      </a>
    </Button>
  </nav>

  <!-- If user is logged in, show user info, predictions link, and logout button -->
  <nav v-else class="flex items-center gap-2 sm:gap-3">
    <Button variant="ghost" size="sm" as-child class="text-xs sm:text-sm">
      <a href="/predictions" data-testid="nav-predictions-link">
        <Bookmark class="sm:mr-2 size-4" />
        <span class="hidden sm:inline">{{ t.nav.saved }}</span>
      </a>
    </Button>
    <div class="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-md" data-testid="nav-user-email">
      <UserIcon class="size-4 text-muted-foreground" />
      <span class="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">{{ user.email }}</span>
    </div>
    <Button
      variant="outline"
      size="sm"
      :disabled="isLoggingOut"
      class="text-xs sm:text-sm"
      data-testid="nav-logout-button"
      @click="handleLogout"
    >
      <LogOut class="sm:mr-2 size-4" />
      <span class="hidden sm:inline">{{ isLoggingOut ? t.nav.logoutProcessing : t.nav.logout }}</span>
    </Button>
  </nav>
</template>
