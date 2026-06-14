import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import pluginVue from "eslint-plugin-vue";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
  },
});

const browserGlobalsConfig = tseslint.config({
  files: ["**/*.{js,ts}"],
  languageOptions: {
    globals: {
      window: true,
      document: true,
    },
  },
});

const vueConfig = tseslint.config({
  files: ["**/*.vue"],
  extends: [pluginVue.configs["flat/recommended"]],
  languageOptions: {
    globals: {
      window: true,
      document: true,
      navigator: true,
      localStorage: true,
      fetch: true,
      requestAnimationFrame: true,
      console: true,
      Node: true,
      HTMLElement: true,
      HTMLDivElement: true,
      HTMLInputElement: true,
      HTMLTextAreaElement: true,
      KeyboardEvent: true,
      MouseEvent: true,
    },
    parserOptions: {
      parser: tseslint.parser,
      extraFileExtensions: [".vue"],
      sourceType: "module",
    },
  },
  rules: {
    // Single-word names (Button, Input, ...) are the shadcn-vue convention for UI primitives
    "vue/multi-word-component-names": "off",
    "vue/require-default-prop": "off",
    // Allow the `const { class: _, ...delegated } = props` prop-forwarding pattern
    "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  baseConfig,
  browserGlobalsConfig,
  vueConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier
);
