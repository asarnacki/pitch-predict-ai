// @ts-check
import { defineConfig } from "astro/config";
import process from "node:process";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig(({ command }) => ({
  output: "server",
  integrations: [react(), sitemap()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias:
        command === "build"
          ? {
              "react-dom/server": "react-dom/server.edge",
            }
          : {},
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
}));
