# CLAUDE.md — PitchPredict AI

Operacyjny przewodnik implementacji dla Claude. Opisuje **jak pisać kod w tym repo**.
Kontekst produktu/biznesu → `README.md` i `.ai/prd.md`. Tutaj tylko reguły i wzorce.

> Uwaga: przestarzałe pliki reguł React/Shadcn (`.windsurfrules`, `.github/copilot-instructions.md`
> oraz `.cursor/rules/{shared,react,frontend,backend,ui-shadcn-helper,api-supabase-astro-init}.mdc`)
> zostały **usunięte** — projekt jest na **Vue 3 + reka-ui**, a ten plik jest jedynym źródłem prawdy
> dla reguł kodu. W `.cursor/rules/` zostają nadal aktualne, wyspecjalizowane reguły: testy
> (`unit-testing`, `e2e-testing`, `test-plan`), migracje (`db-supabase-migrations`), CI
> (`github-action`), diagramy (`mermaid-diagram-*`) oraz `astro` (generyczne wskazówki Astro).

## Stack (stan faktyczny)

Astro 5 (`output: "server"`, adapter Cloudflare) · Vue 3 Composition API (`<script setup lang="ts">`) ·
TypeScript 5 (strict) · Tailwind 4 · reka-ui (`components/ui/`) · vee-validate + Zod ·
vue-sonner · Supabase (PostgreSQL + Auth + RLS) · OpenRouter.ai (predykcje) ·
football-data.org (dane meczowe). Testy: Vitest + Playwright. Hosting: Cloudflare Pages.

## Komendy

```bash
npm run dev               # serwer dev (port 3000)
npm run build             # build produkcyjny
npm run lint  / lint:fix  # ESLint
npm run format            # Prettier
npm run test:unit         # Vitest (watch)  | test:unit:run, test:unit:coverage
npm run test:e2e          # Playwright       | test:e2e:ui, test:e2e:debug
```

Pre-commit (`husky` → `lint-staged`) odpala lint/format na zmienionych plikach.

## Struktura — gdzie co trafia

```
src/
├─ pages/             Astro pages (.astro)
│  └─ api/            endpointy REST (zob. "Backend")
├─ layouts/           layouty Astro
├─ middleware/index.ts  auth + ustawia locals.supabase / locals.user
├─ components/        komponenty Vue (.vue)
│  ├─ ui/             prymitywy reka-ui (shadcn-style) — NIE edytować ręcznie bez powodu
│  ├─ hig/            własny design system "HIG" na bazie ui/ (HIGButton, HIGCard, ...)
│  └─ hooks/          composables Vue (use*.ts) — mimo nazwy "hooks" to Vue, nie React
├─ services/api/      KLIENT: woła nasze /api/* z przeglądarki (matches, auth, predictions)
├─ lib/
│  ├─ services/       SERWER: logika biznesowa + zewnętrzne API (football-data, ai-prediction, ...)
│  ├─ validation/     schematy Zod (.schemas.ts)
│  ├─ errors/         klasy błędów (api-errors.ts) + formatError (formatter.ts)
│  └─ i18n/           tłumaczenia PL/EN (useTranslation, useLanguage, locales/*.json)
├─ db/                supabase.server.ts (createServerClient), database.types.ts
└─ types.ts           wspólne typy: DTO, Command Models, Entities (frontend + backend)
```

**Dwie warstwy „services" — nie mylić:**

- `src/services/api/*` → kod klienta (fetch do własnego API), rzuca `ApiError` z `client.ts`.
- `src/lib/services/*` → kod serwera (DB, OpenRouter, football-data), wołany z `pages/api/*`.

## Backend — endpointy API (`src/pages/api/`)

Wzorzec (zob. `src/pages/api/predictions/index.ts`):

```ts
export const prerender = false; // ZAWSZE w route'ach API

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    if (!locals.user) throw new UnauthorizedError(); // guard clause najpierw
    const body = await request.json();
    const data = createPredictionBodySchema.parse(body); // walidacja Zod
    const result = await createPrediction(locals.supabase, locals.user.id, data); // logika w service
    return new Response(JSON.stringify({ data: result }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const { status, body } = formatError(error); // jednolite mapowanie błędów
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }
};
```

Reguły:

- Handlery: `GET`, `POST`, `PATCH`, `DELETE` (wielkie litery), zawsze `export const prerender = false`.
- **Cała logika w `src/lib/services/*`** — handler tylko: auth → walidacja → service → response.
- Supabase wyłącznie przez `locals.supabase` (ma kontekst JWT). Nigdy nie importuj klienta wprost.
- `user_id` **zawsze z `locals.user.id`** (JWT), nigdy z request body.
- Walidacja wejścia tylko przez Zod (`src/lib/validation/*`).
- Błędy: rzucaj klasy z `lib/errors/api-errors.ts` (`UnauthorizedError`, `ValidationError`,
  `PredictionLimitError`, `ExternalServiceError`, ...) i zawsze kończ `catch → formatError(error)`.
  Nie ujawniaj internals w wiadomościach błędów.
- Odpowiedź sukcesu owijaj w `{ data: ... }`.

## Frontend — Vue + Astro

- Statyczna treść i layout → `.astro`. Interaktywność → komponenty Vue (wyspy, hydratowane na kliencie).
- Komponenty Vue: zawsze `<script setup lang="ts">`, `defineProps<...>()` / `defineEmits<...>()` z typami.
- Logikę wielokrotnego użytku wynoś do composables w `src/components/hooks/` (`use*.ts`,
  `ref` / `computed` / `watch`). Wzór: `useMatches.ts`, `usePredictions.ts`.
- UI: buduj z `components/hig/*` (nasz design system); `components/ui/*` to prymitywy reka-ui — nie
  modyfikuj ich bez potrzeby. Klasy łącz przez `cn()` z `src/lib/utils.ts`.
- **i18n obowiązkowe — żadnych hardkodowanych stringów UI.** Użyj `useTranslation()` (zwraca
  `computed` ze słownikiem) lub `useLanguage()`; teksty dodawaj do `lib/i18n/locales/pl.json` i `en.json`.
- Dostępność: ARIA landmarks, `aria-expanded`/`aria-controls`, `aria-live` dla dynamicznych treści.
- Tailwind: warianty responsywne (`sm:`/`md:`), stanowe (`hover:`/`focus-visible:`), `dark:`.

## Bezpieczeństwo (must-check przed commitem)

- `user_id` z JWT (`locals.user.id`), nie z inputu.
- Walidacja Zod na każdym wejściu API.
- RLS włączone na każdej tabeli z danymi użytkownika; izolacja per-user.
- Sekrety w `.env` / `import.meta.env` (lub `locals.runtime.env` na Cloudflare). Nigdy w kodzie/kliencie.
- Sanityzacja treści od użytkownika (np. `note`) — ochrona przed XSS.
- Komunikaty błędów bez wewnętrznych szczegółów.

## Baza danych / migracje

- Migracje Supabase w `supabase/migrations/`, nazwa `YYYYMMDDHHmmss_opis.sql` (UTC).
- SQL małymi literami, nagłówek-komentarz z celem, komentarze przy operacjach destrukcyjnych.
- Nowa tabela → **włącz RLS** + granularne polityki (osobno `select`/`insert`/`update`/`delete`,
  osobno dla `anon` i `authenticated`). Pełne reguły: `.cursor/rules/db-supabase-migrations.mdc`.
- Po zmianie schematu regeneruj `src/db/database.types.ts`.

## Testy

- **Unit/integration (Vitest):** testy obok plików (`x.ts` → `x.test.ts`). Priorytet: `lib/services`
  (≥80%) i `lib/validation`. ZAWSZE mockuj zewnętrzne API (football-data, OpenRouter) i Supabase w unitach.
  Pełne reguły: `.cursor/rules/unit-testing.mdc`.
- **E2E (Playwright):** ZAWSZE mockuj `/api/predictions/generate` (każde realne wywołanie kosztuje w
  OpenRouter). Lokatory user-facing (`getByRole`/`getByLabel`/`getByText`), Page Object Model w
  `e2e/page-objects`, testy też na mobile. Pełne reguły: `.cursor/rules/e2e-testing.mdc`.

## Konwencje kodu i pracy

- Clean code: guard clauses i early returns na początku funkcji, happy path na końcu, bez zbędnych `else`.
- Prettier: podwójne cudzysłowy, średniki, 2 spacje, szerokość 120. ESLint strict + `no-console: warn`.
- Import alias: `@/*` → `src/*`.
- Commity: Conventional Commits z zakresem, np. `feat(vue): ...`, `fix(api): ...`, `docs(readme): ...`.
- **Nie dodawaj `Co-Authored-By: Claude` ani trailerów Claude do commitów.**
- **Implementuj zadanie do końca** — nie zostawiaj `TODO(human)` do dokończenia przez użytkownika;
  decyzje projektowe wyjaśniaj w podsumowaniu.
- **`//CLAUDECHECK: <pytanie>`** w kodzie = pytanie do Claude. Gdy je napotkasz, odpowiedz w czacie
  (nie usuwaj komentarza bez potwierdzenia użytkownika).

## Narzędzia pomocnicze

- **context7** — używaj do pobierania aktualnej dokumentacji bibliotek i frameworków (Vue, Astro,
  Vitest, Zod, Tailwind, reka-ui itp.). Zawsze sprawdzaj przez context7 zamiast polegać na pamięci
  modelu — API mogło się zmienić. Wywołaj `mcp__context7__resolve-library-id` + `mcp__context7__query-docs`.

## Dokumentacja referencyjna (`.ai/`)

`prd.md` (wymagania) · `api-plan.md` (spec endpointów) · `db-plan.md` (schemat + RLS) ·
`implementation-plan.md` (szczegółowy guide) · `auth-spec.md` · `ui-plan.md` ·
`vue3-migration-plan.md` · `test-plan.md`. Czytaj relevantną sekcję zamiast wymyślać od nowa.
