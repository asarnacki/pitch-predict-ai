# Plan migracji: React 19 → Vue 3 (Composition API)

> Dokument wykonawczy dla modelu AI (Sonnet/Opus). Wykonuj fazy po kolei, weryfikuj po każdej wyspie, commituj po każdej fazie. Nie przechodź do następnej fazy, dopóki bieżąca nie przejdzie weryfikacji.

## 1. Kontekst i zakres

Projekt to Astro 5 w trybie `output: "server"` (adapter Cloudflare), gdzie React działa wyłącznie jako wyspy (`client:load`). Cały backend (`src/pages/api/**`, `src/lib/services/**`, `src/middleware`, `src/db`) oraz walidacja zod (`src/lib/validation/**`) są framework-agnostyczne i **NIE podlegają migracji**.

Migracji podlega ~3300 linii w:

- `src/components/*.tsx` — 15 komponentów feature
- `src/components/hig/*.tsx` — 10 plików design systemu (HIG)
- `src/components/ui/*.tsx` — 10 prymitywów shadcn/ui (Radix)
- `src/components/hooks/*.ts` — 3 hooki (useAuthForm, useMatches, usePredictions)
- `src/lib/i18n/` — LanguageContext.tsx, useTranslation.ts (translations.ts i types.ts zostają bez zmian)
- `src/layouts/Layout.astro` + 6 stron `.astro` — tylko importy i ewentualnie dyrektywy

Punkty montowania wysp (z `Layout.astro` i stron):

| Wyspa | Strona | Złożoność |
|---|---|---|
| `ThemeToggle` | Layout | niska |
| `LanguageSwitcher` | Layout | niska |
| `UserNav` | Layout | niska |
| `LanguageProviderWrapper` | Layout | **do usunięcia** (patrz §5.3) |
| `Toaster` (sonner) | wszystkie strony | niska |
| `AuthForm` | login, register, reset-password, update-password | średnia |
| `SavedPredictionsList` | predictions | wysoka (355 linii) |
| `PredictionPanel` (+ całe drzewo: LeagueSelector, MatchList, MatchCard, PredictionResult, SavePredictionForm, BarChart, EmptyState, Spinner) | index | wysoka |

## 2. Strategia: inkrementalnie, wyspa po wyspie

Astro pozwala na jednoczesne działanie `@astrojs/react` i `@astrojs/vue`. Migrujemy **całe drzewa wysp naraz** (React nie może renderować dziecka w Vue i odwrotnie), ale wyspy między sobą — niezależnie. React usuwamy dopiero w ostatniej fazie.

Konwencja plików: komponenty Vue jako SFC `.vue` z `<script setup lang="ts">`, composables jako `src/composables/use*.ts`. Stare pliki `.tsx` usuwamy w tym samym commicie, w którym wyspa przechodzi na Vue (żeby nie utrzymywać dwóch wersji).

## 3. Mapowanie zależności

| React (usuwamy) | Vue (instalujemy) | Uwagi |
|---|---|---|
| `react`, `react-dom`, `@types/react*` | `vue` | |
| `@astrojs/react` | `@astrojs/vue` | obie integracje równolegle do Fazy 5 |
| `@radix-ui/react-*` (accordion, alert-dialog, label, slot, tabs) | `reka-ui` | dawniej radix-vue; API 1:1 z Radix |
| shadcn/ui (`src/components/ui`) | `shadcn-vue` | te same nazwy komponentów i klasy Tailwind |
| `react-hook-form` + `@hookform/resolvers` | `vee-validate` + `@vee-validate/zod` | schematy zod zostają bez zmian |
| `sonner` | `vue-sonner` | identyczne API `toast()` |
| `lucide-react` | `lucide-vue-next` | te same nazwy ikon |
| `@testing-library/react` | `@testing-library/vue` + `@vue/test-utils` | |
| `eslint-plugin-react*`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-compiler`, `eslint-plugin-react-hooks` | `eslint-plugin-vue` | + `vue-eslint-parser` |
| — | `prettier-plugin-organize-attributes` (opcjonalnie) | prettier wspiera .vue natywnie |

Zostają bez zmian: `class-variance-authority`, `clsx`, `tailwind-merge` (i `cn()` z `src/lib/utils.ts`), `zod`, `tailwindcss`, `@supabase/*`, `astro`, Playwright.

## 4. Mapowanie wzorców kodu

| React | Vue 3 Composition API |
|---|---|
| `useState(x)` | `ref(x)` / `reactive()` |
| `useEffect(fn, [deps])` | `watch`/`watchEffect`; mount/unmount → `onMounted`/`onUnmounted` |
| `useMemo`/`useCallback` | `computed()` / zwykłe funkcje (Vue nie potrzebuje memoizacji callbacków) |
| custom hook `useX()` | composable `useX()` zwracający `ref`y zamiast wartości |
| `children: ReactNode` | `<slot />` |
| render props / `asChild` (Radix Slot) | sloty + `asChild` w reka-ui |
| `className` | `class` |
| `onClick`, `onChange`, `onSubmit` | `@click`, `@input`/`v-model`, `@submit.prevent` |
| `forwardRef` | niepotrzebne — atrybuty i ref spadają automatycznie; `defineExpose` w razie potrzeby |
| props destrukturyzowane | `defineProps<Props>()` (z destrukturyzacją defaults, Vue 3.5+) |
| warunki `{cond && <X/>}` | `v-if` |
| listy `.map()` | `v-for` z `:key` |
| `typeof window === "undefined"` | bez zmian (SSR guard nadal potrzebny) |

## 5. Fazy wykonania

### Faza 0 — Setup (bez usuwania Reacta)

1. `npx astro add vue` (dodaje `vue`, `@astrojs/vue` i wpis w `astro.config.mjs`).
2. Zainstaluj: `reka-ui`, `vee-validate`, `@vee-validate/zod`, `vue-sonner`, `lucide-vue-next`, dev: `@testing-library/vue`, `@vue/test-utils`, `eslint-plugin-vue`, `vue-eslint-parser`.
3. ESLint: dodaj blok konfiguracyjny dla `*.vue` (flat config, `eslint-plugin-vue` preset `flat/recommended` + parser TS w `parserOptions.parser`). Nie ruszaj jeszcze bloków React.
4. Vitest: upewnij się, że `vitest.config.ts` (przez `getViteConfig` z Astro) obsługuje `.vue` — integracja Astro Vue dostarcza plugin; jeśli testy jednostkowe uruchamiane są poza pipeline Astro, dodaj `@vitejs/plugin-vue` jawnie.
5. **Weryfikacja:** `npm run build` przechodzi z obiema integracjami; stwórz tymczasowy `HelloVue.vue`, zamontuj na dowolnej stronie `client:load`, sprawdź `npm run dev`, usuń go.

### Faza 1 — Fundamenty: i18n + prymitywy UI

1. **i18n** (`src/lib/i18n/`): przepisz singleton z `LanguageContext.tsx` na moduł Vue:
   - moduł eksportuje `const language = ref<Language>(getInitialLanguage())` — `ref` na poziomie modułu jest naturalnym singletonem współdzielonym między wyspami (każda wyspa Vue to osobna aplikacja, ale moduły ES są wspólne), więc **cały mechanizm `listeners`/`notify` z Reacta znika**;
   - `setLanguage(lang)` aktualizuje ref, `localStorage` i `document.documentElement.lang`;
   - `useTranslation()` jako composable zwraca `{ t: computed(...), language, setLanguage }`;
   - zachowaj guardy SSR (`typeof window === "undefined"` → default `"pl"`).
2. **`src/components/ui/`**: wygeneruj odpowiedniki przez `shadcn-vue` (accordion, alert-dialog, badge, button, input, label, skeleton, sonner→vue-sonner, tabs, textarea). Po wygenerowaniu porównaj klasy Tailwind z wersją React i przenieś ewentualne lokalne modyfikacje (sprawdź git diff oryginałów względem domyślnego shadcn).
3. **`src/components/hig/`**: port ręczny 1:1 do `.vue` — to czysta warstwa prezentacyjna (cva + cn), bez stanu. `typography`, `card`, `layout`, `list`, `button`, `input`, `form`, `feedback`, `navigation`, `modal` (modal używa Radix → reka-ui). Zachowaj `index.ts` z re-eksportami.
4. **Proste komponenty bez stanu:** `Spinner.vue`, `EmptyState.vue`.
5. Przepisz testy `src/lib/i18n/__tests__/LanguageContext.test.tsx` → test composable (bez renderowania, wystarczy test modułu + `ref`).
6. **Weryfikacja:** `npm run lint && npm run test:unit:run && npm run build`. Komponenty z tej fazy nie są jeszcze montowane — to tylko biblioteka.

### Faza 2 — Wyspy proste (Layout)

1. `ThemeToggle.vue`, `LanguageSwitcher.vue`, `UserNav.vue` — porty 1:1, używają composable `useTranslation`.
2. `Toaster` → komponent `vue-sonner` (`src/components/ui/sonner` już z Fazy 1); podmień import we **wszystkich 6 stronach** `.astro`.
3. **Usuń `LanguageProviderWrapper`** z `Layout.astro` — singleton-ref z Fazy 1 nie potrzebuje providera ani wrappera nad slotem. Przenieś inicjalizację języka (ustawienie `document.documentElement.lang`) do modułu i18n.
4. Zaktualizuj importy w `Layout.astro` na pliki `.vue`, usuń stare `.tsx`.
5. Przepisz `src/components/__tests__/LanguageSwitcher.test.tsx` na `@testing-library/vue`.
6. **Weryfikacja:** lint + unit + build + `npx playwright test e2e/language-switcher.spec.ts e2e/navigation.spec.ts`. **Zachowaj wszystkie `data-testid` — testy E2E to główna siatka bezpieczeństwa migracji.**

### Faza 3 — AuthForm

1. `useAuthForm.ts` → composable na `vee-validate`: `useForm({ validationSchema: toTypedSchema(loginSchema) })`, przełączanie schematów wg `mode` bez zmian logiki; serwis `src/services/api/auth.service.ts` bez zmian.
2. `AuthForm.vue` — 4 tryby (login/register/reset-password/update-password) jak dotychczas; pola przez `useField`/`<Field>` z vee-validate; komunikaty błędów z zod renderują się identycznie (schematy zostają).
3. Podmień importy w `login.astro`, `register.astro`, `reset-password.astro`, `update-password.astro`.
4. **Weryfikacja:** lint + unit + build + `npx playwright test e2e/auth.spec.ts e2e/login-validation.spec.ts`.

### Faza 4 — Wyspy domenowe

1. Composables: `useMatches.ts`, `usePredictions.ts` → `src/composables/` (fetch przez istniejące `src/services/api/*` — bez zmian; stan na `ref`, loading/error jak dotychczas). Uwaga na pętlę refetch naprawioną w commicie `fb1e5da` — w Vue odpowiednikiem jest poprawne użycie `watch` z konkretnym źródłem zamiast `watchEffect`.
2. Drzewo `PredictionPanel`: `LeagueSelector.vue`, `MatchCard.vue`, `MatchList.vue`, `PredictionResult.vue`, `BarChart.vue`, `SavePredictionForm.vue` (vee-validate + `savePredictionSchema`), na końcu `PredictionPanel.vue`. Podmień w `index.astro` (prop `isAuthenticated` bez zmian).
3. `SavedPredictionsList.vue` (355 linii — największy komponent; alert-dialog i accordion z reka-ui/shadcn-vue). Podmień w `predictions.astro`.
4. **Weryfikacja:** lint + unit + build + pełne `npm run test:e2e`.

### Faza 5 — Usunięcie Reacta i sprzątanie

1. Usuń zależności: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@astrojs/react`, wszystkie `@radix-ui/react-*`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `lucide-react`, `@testing-library/react`, `eslint-plugin-react*`, `eslint-plugin-react-hooks`, `eslint-plugin-react-compiler`, `eslint-plugin-jsx-a11y`.
2. `astro.config.mjs`: usuń `react()` z integracji oraz **alias `react-dom/server.edge`** (workaround pod Cloudflare workerd — Vue SSR go nie potrzebuje).
3. `eslint.config.js`: usuń bloki React/JSX; `lint-staged` w `package.json`: `*.{ts,tsx,astro}` → `*.{ts,vue,astro}`.
4. `tsconfig.json`: usuń `"jsx"`/`"jsxImportSource"` jeśli ustawione.
5. Sprawdź, że nie został żaden plik `.tsx`: `find src -name "*.tsx"` musi zwrócić pustkę.
6. `components.json` (shadcn) → konfiguracja shadcn-vue lub usunięcie.
7. Zaktualizuj `README.md` i `.ai/tech-stack.md` (React → Vue 3).
8. **Weryfikacja końcowa:** `npm run lint && npm run test:unit:run && npm run build && npm run test:e2e` oraz `npm run preview:cloudflare` (smoke test na wrangler — krytyczne, bo SSR działa na workerd, nie na Node).

## 6. Twarde reguły dla modelu wykonującego

1. **Nie zmieniaj** plików w `src/pages/api/`, `src/lib/services/`, `src/lib/validation/` (poza testami), `src/db/`, `src/middleware/`, `src/services/api/`, `src/types.ts`, `supabase/`.
2. **Nie zmieniaj** `data-testid`, tekstów z `translations.ts`, struktury URL-i ani kontraktów API — E2E (Playwright) musi przechodzić bez modyfikacji testów (poza page-objects, jeśli zmieni się struktura DOM, czego należy unikać).
3. Po każdej wyspie: `npm run lint && npm run test:unit:run && npm run build`. Po każdej fazie: dodatkowo wskazane testy E2E + commit (jedna faza = jeden commit, konwencja `feat(vue): ...`).
4. Style Tailwind przenoś 1:1 — żadnych „ulepszeń" wizualnych przy okazji.
5. Migruj zawsze całe drzewo wyspy naraz; nigdy nie zostawiaj komponentu React importowanego przez `.vue` (i odwrotnie).
6. Jeśli `npm run build` padnie na Cloudflare adapterze po dodaniu Vue, sprawdź najpierw alias `react-dom/server.edge` w `astro.config.mjs` (działa tylko przy `npm run build`) — nie usuwaj go przed Fazą 5.

## 7. Znane ryzyka

- **Współdzielenie stanu między wyspami**: w Reakcie rozwiązane ręcznym singletonem + `listeners`; w Vue moduł-level `ref` daje to za darmo, ale każda wyspa to osobna instancja aplikacji — `provide/inject` NIE działa między wyspami. Wszystko współdzielone musi być ref-em na poziomie modułu.
- **vee-validate vs react-hook-form**: typowanie `useForm` różni się (input/output types przy `z.refine` — patrz `SavePredictionFormInput` vs `SavePredictionFormData` w `SavePredictionForm.tsx`); `toTypedSchema` z `@vee-validate/zod` obsługuje transformacje, ale wymaga uwagi przy typach.
- **shadcn-vue drift**: wygenerowane komponenty mogą mieć inne wersje klas niż obecne — porównuj wizualnie (dev server) stronę po stronie.
- **Hydratacja SSR**: `getInitialLanguage()` czyta `localStorage` — na serwerze zwraca `"pl"`. W Vue mismatch hydratacji wywoła warning; jeśli wystąpi, ustawiaj język w `onMounted` tak jak robi to obecny kod React w `useEffect`.
- **Edge runtime**: jedyna weryfikacja zgodności z workerd to `npm run preview:cloudflare` — sam `astro build` nie wykryje API niedostępnych w workerd.
