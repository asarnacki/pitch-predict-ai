import type { AstroIntegration } from "astro";

export default function cloudflareFix(): AstroIntegration {
  return {
    name: "cloudflare-fix",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          vite: {
            resolve: {
              alias: {
                "react-dom/server": "react-dom/server.edge",
              },
            },
            ssr: {
              target: "webworker",
              noExternal: ["react-use", "@radix-ui/*", "lucide-react"],
            },
          },
        });
      },
    },
  };
}

