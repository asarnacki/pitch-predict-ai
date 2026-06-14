// @ts-check
import { defineConfig } from "astro/config";
import process from "node:process";

import vue from "@astrojs/vue";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [vue(), sitemap()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
