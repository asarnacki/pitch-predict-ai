# Plan SEO — PitchPredict AI

> Status: do realizacji. Rynek docelowy: **dwujęzyczny PL + EN** (decyzja użytkownika).
> Stack: Astro 5 (`output: "server"`) + Vue 3 + i18n własne (`useLanguage` / `useTranslation`).

## 0. Diagnoza stanu obecnego (audyt)

Co jest źle / czego brakuje (zweryfikowane w kodzie):

| Element                                          | Stan                                                    | Plik                          |
| ------------------------------------------------ | ------------------------------------------------------- | ----------------------------- |
| `<title>`                                        | jest, ale stały dla większości stron                    | `src/layouts/Layout.astro:24` |
| `meta description`                               | **brak**                                                | —                             |
| Open Graph / Twitter Card                        | **brak**                                                | —                             |
| Canonical                                        | **brak**                                                | —                             |
| `<html lang>`                                    | **zahardkodowane `"en"`** mimo apki PL/EN (bug SEO)     | `src/layouts/Layout.astro:18` |
| hreflang (PL/EN)                                 | **brak**                                                | —                             |
| `robots.txt`                                     | **brak**                                                | `public/`                     |
| `@astrojs/sitemap`                               | dodany, ale **nie działa** — brak pola `site` w configu | `astro.config.mjs`            |
| JSON-LD (structured data)                        | **brak**                                                | —                             |
| OG image                                         | **brak** (tylko `favicon.png`)                          | `public/`                     |
| Meta robots per-page (noindex dla `/login` itp.) | **brak**                                                | —                             |

Wniosek: SEO trzeba zbudować od zera, ale to głównie warstwa `<head>` + konfiguracja — nie wymaga zmiany architektury (SSR już renderuje meta serwerowo, więc boty je widzą).

## 1. Decyzje techniczne (rekomendacje)

### 1.1 Narzędzie: własny komponent `SEO.astro` zamiast pluginu

Rozważane: `astro-seo` (plugin, jeden komponent na wszystko) vs własny komponent.
**Rekomendacja: własny `src/components/seo/SEO.astro`.** Powody:

- Projekt ma własny design system (HIG) i filozofię „mało zależności" — własny komponent jest spójny i w pełni kontrolowalny.
- Musimy i tak wpiąć **nasze** i18n (`useLanguage`) do `lang`/`hreflang`/tłumaczeń meta — plugin tego nie zrobi za nas.
- ~60 linii kodu, zero nowej zależności, łatwy do testu.
  (Jeśli wolisz plugin — `astro-seo` jest OK, ale i tak owijalibyśmy go własnym wrapperem.)

### 1.2 i18n a SEO

- Język strony pochodzi z aktualnego locale. Astro renderuje `<head>` serwerowo, więc `lang` musi być ustalony **po stronie serwera** (z cookie/Accept-Language w middleware), a nie dopiero w kliencie Vue — inaczej bot zobaczy zły `lang`.
- Strategia URL: na start **bez prefiksów językowych** (`/`, `/predictions`) + przełącznik języka po stronie klienta. hreflang wskazuje tę samą ścieżkę z parametrem/cookie. **Docelowo zalecane** przejście na ścieżki `/pl/` i `/en/` (lepsze dla hreflang i indeksacji) — to osobny, większy etap; patrz §6.

### 1.3 Structured data (JSON-LD)

- `Organization` + `WebSite` (z `SearchAction`) — globalnie w layoutcie.
- `SportsEvent` / `BreadcrumbList` — opcjonalnie na widokach meczów (etap 2).
- **Bezpieczeństwo:** JSON-LD generować przez `JSON.stringify(obj)` w `set:html`, nigdy przez interpolację stringów (ryzyko XSS) — zgodne z regułą sanityzacji z `CLAUDE.md`.

## 2. Etapy wdrożenia

### Etap 1 — Fundament (must-have, najwyższy priorytet)

1. **`astro.config.mjs`**: dodać `site: "https://<domena>"` (z planu hostingu) + skonfigurować `sitemap()` z `i18n` (locales `pl`, `en`, defaultLocale `pl`).
2. **`public/robots.txt`**: `Allow` dla treści, `Disallow` dla `/api/`, `/login`, `/register`, `/reset-password`, `/update-password`; `Sitemap:` na pełny URL.
3. **`src/components/seo/SEO.astro`**: props `title`, `description`, `image?`, `noindex?`, `canonical?`. Generuje: title, description, canonical (`new URL(Astro.url.pathname, Astro.site)`), OG (title/description/image/type/locale), Twitter card, `robots` (noindex gdy trzeba), hreflang PL/EN + `x-default`.
4. **`Layout.astro`**: `lang` dynamiczny (z middleware/locale), wstawić `<SEO />`, przyjąć `description` w `Props`.
5. **Middleware**: ustalić locale serwerowo (cookie `lang` lub `Accept-Language`) i wystawić w `Astro.locals` (np. `locals.lang`), by layout znał język przy renderze.
6. **Tłumaczenia meta**: dodać klucze `seo.*` (title/description per strona) do `lib/i18n/locales/pl.json` i `en.json`.
7. **Per-strona meta**: `index.astro`, `predictions.astro` — własne `title`+`description`; strony auth (`login/register/reset/update`) → `noindex`.
8. **OG image**: dodać `public/og-image.png` (1200×630) — placeholder brandowy na start.

### Etap 2 — Wzbogacenie

9. JSON-LD `Organization` + `WebSite` w layoutcie.
10. JSON-LD `SportsEvent`/`BreadcrumbList` na widokach meczów.
11. Strona „O nas"/landing z treścią pod słowa kluczowe (PL: „typy na mecze", „prawdopodobieństwo wygranej", „analiza kursów"; EN odpowiedniki) — bilingual.
12. Performance/Core Web Vitals: audyt Lighthouse, lazy-loading obrazów, `client:visible`/`client:idle` zamiast `client:load` gdzie się da (teraz wszystko `client:load`), preload fontów.
13. Dostępność jako sygnał SEO: nagłówki H1–H3 w hierarchii, alt-y, ARIA (zgodnie z `CLAUDE.md`).

### Etap 3 — Po wdrożeniu (operacyjne)

14. Google Search Console + Bing Webmaster: weryfikacja domeny, zgłoszenie sitemap.
15. Monitoring indeksacji + Core Web Vitals.

## 3. Pliki do utworzenia / zmiany

- **Nowe:** `src/components/seo/SEO.astro`, `public/robots.txt`, `public/og-image.png`, klucze `seo.*` w `locales/{pl,en}.json`.
- **Zmiana:** `astro.config.mjs` (site + sitemap i18n), `src/layouts/Layout.astro` (lang dynamiczny + SEO + description), `src/middleware/index.ts` (locale serwerowo), `index.astro` + `predictions.astro` (+ strony auth: noindex).

## 4. Testy / weryfikacja

- Build + sprawdzenie wygenerowanego `/sitemap-index.xml`.
- `curl` strony i grep meta tagów (canonical, og:, hreflang, lang).
- Lighthouse SEO ≥ 95.
- Walidacja JSON-LD: Google Rich Results Test.
- Unit test komponentu `SEO.astro` (render meta) — opcjonalnie.

## 5. Decyzje do potwierdzenia (przed/przy realizacji)

- **Domena** — potrzebna do `site`/canonical/hreflang (pochodzi z planu hostingu).
- **Nazwa OG/brand i krótki opis (tagline) PL + EN** — do meta description i OG.
- **Słowa kluczowe** — czy masz listę fraz, czy mam zaproponować na podstawie rynku?
- **Strategia URL i18n** teraz vs później (bez prefiksu → docelowo `/pl//en/`).

## 6. Uwaga: czy potrzebny LaTeX / treść „O nas"

Strona „O nas" z opisem matematyki (LaTeX) jest częścią odłożonego tematu #4 (zob. memory `odds-math-probability-feature`) — ale sam **landing/treść SEO** warto zrobić wcześniej (etap 2, pkt 11), bez matematyki.

## Źródła

- [Astro SEO complete guide — Joost.blog](https://joost.blog/astro-seo-complete-guide/)
- [Complete Guide to Astro Website SEO — BetterLink](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/)
- [Astro SEO Guide 2026 — NodeAscend](https://nodeascend.com/blog/astro-js-seo-guide-2026/)
- [Add JSON-LD Structured Data in Astro](https://johndalesandro.com/blog/astro-add-json-ld-structured-data-to-your-website-for-rich-search-results/)
- [Astro i18n complete guide 2026 — EdgeKits](https://edgekits.dev/en/blog/astro-i18n-complete-guide-2026/)
