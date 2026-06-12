<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEAGUE_CODES } from "@/types";
import type { LeagueCode } from "@/services/api/matches.service";

defineProps<{ selectedLeague: LeagueCode }>();

const emit = defineEmits<{ leagueChange: [league: LeagueCode] }>();

const LEAGUE_LABELS: Record<LeagueCode, string> = {
  PREMIER_LEAGUE: "Premier League",
  LA_LIGA: "La Liga",
  BUNDESLIGA: "Bundesliga",
  WC: "World Cup",
};

const leagues = Object.keys(LEAGUE_CODES) as LeagueCode[];

const handleChange = (value: string | number | undefined) => {
  if (value) {
    emit("leagueChange", value as LeagueCode);
  }
};
</script>

<template>
  <div class="mb-8 sm:mb-12">
    <Tabs :model-value="selectedLeague" @update:model-value="handleChange">
      <TabsList class="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
        <TabsTrigger v-for="league in leagues" :key="league" :value="league" class="text-sm sm:text-base">
          {{ LEAGUE_LABELS[league] }}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>
