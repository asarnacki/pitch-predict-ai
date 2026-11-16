# Plan wdrożenia — Hosting, domena, baza danych

> Decyzja użytkownika: **polski VPS + adapter Node** (wygoda rozliczeń VAT — faktura z NIP).
> Baza danych: użytkownik prosi o rekomendację + pytanie czy na start potrzebny płatny plan.
> Zastępuje wcześniejszą rekomendację z `hosting-analysis.pl.md` (Cloudflare) — powód: VAT.

## 0. Kontekst i konsekwencja decyzji

Obecnie: adapter `@astrojs/cloudflare`, `output: "server"`, sekrety przez `locals.runtime?.env`.
Przejście na polski VPS oznacza:

- zmianę adaptera na **`@astrojs/node`** (tryb `standalone`),
- czytanie sekretów z `process.env` / `astro:env` zamiast Cloudflare runtime,
- własny serwer (reverse proxy + proces Node + SSL + deploy).

**Dobra wiadomość:** kod już ma fallback `locals.runtime?.env?.X || import.meta.env.X` w każdym miejscu czytającym sekrety (middleware, `matches.ts`, `predictions/generate.ts`, `fetch-result.ts`). Po usunięciu Cloudflare `runtime` = `undefined` i fallback zadziała — migracja jest **niskiego ryzyka**.

## 1. Rekomendacja: baza danych (odpowiedź na „doradź mi")

**Rekomendacja: zostać na hostowanym Supabase, na DARMOWYM planie (Free), na start. NIE kupować planu Pro $25/mies.**

Uzasadnienie:

- Supabase Auth + RLS są **wpięte głęboko w kod** (`locals.supabase`, `createServerClient`, polityki RLS, cały auth-flow). Migracja na samodzielny Postgres = przepisanie autentykacji i polityk = duży, ryzykowny nakład pracy bez korzyści na etapie MVP.
- Plan **Free** wystarcza na start: 500 MB DB, 50k MAU auth, social/email auth. Dla MVP bez ruchu to nadmiar.
- **Haczyk planu Free:** projekt jest **pauzowany po 7 dniach bezczynności**. Dla publicznej, „żywej" strony to problem (pierwsze wejście po pauzie = błąd). Dlatego:
  - dopóki testujesz/przed premierą → Free OK,
  - **w momencie realnej premiery** → albo Pro ($25, bez pauzowania, codzienne backupy), albo (tańszy/„polski" wariant) self-host Supabase.

**Ścieżka oszczędności / pełnego VAT-PL (opcja na później, nie na teraz):**
Cały stack Supabase jest open-source i **self-hostowalny przez Docker na tym samym polskim VPS**. Daje to: jedną polską fakturę za wszystko + dane w PL + brak pauzowania + zgodność API (kod prawie bez zmian, bo to to samo `supabase-js`). Koszt: większy nakład ops (backupy, aktualizacje, monitoring). **Rekomendacja: rozważyć po premierze**, gdy koszt/VAT zaczną realnie boleć. Na start: hostowany Free.

> Podsumowanie: **start = Supabase Free (0 zł). Premiera = Pro $25 lub self-host na VPS.** Nie wydawać $25 zanim jest ruch.

## 2. Rekomendacja: dostawca VPS (polska faktura VAT)

| Dostawca                      | Faktura PL/NIP        | Plus                                                              | Minus                            | Dla kogo                                                 |
| ----------------------------- | --------------------- | ----------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| **OVHcloud (OVH Sp. z o.o.)** | ✅ polska faktura VAT | dojrzały panel, DC w PL (Warszawa), VPS od ~20 zł/mies, anty-DDoS | trochę „korpo" UX                | **rekomendacja główna** — profesjonalny + polska faktura |
| **cyber_Folks / Zenbox**      | ✅                    | bardzo dobry support PL, prosty panel                             | droższe za zasoby                | jeśli chcesz wsparcie po polsku                          |
| **Mikr.us**                   | ✅                    | bardzo tanio (~kilkadziesiąt zł/rok), polski, hobbystyczny        | małe zasoby, mniej „produkcyjny" | najtańszy start / pet-project                            |
| **Atman / Hetzner-PL?**       | Atman ✅ PL           | Atman: enterprise PL                                              | drożej / nadmiarowo              | większa skala                                            |

**Rekomendacja:** zacznij od **OVHcloud VPS (najmniejszy, ~20-40 zł/mies)** — polska faktura VAT, DC w Warszawie (niskie opóźnienia + dane w PL), miejsce na Node + ewentualnie self-host Supabase później. Alternatywa „na maksa tanio": **Mikr.us**.

**Linki do porównania cen (wszystkie faktura PL z NIP):**

- OVHcloud (rekomendacja) — https://www.ovhcloud.com/pl/ (VPS)
- Mikr.us (najtaniej, rozliczenie roczne) — https://mikr.us
- cyber_Folks (support PL) — https://cyberfolks.pl
- Zenbox (support PL) — https://zenbox.pl
- nazwa.pl (VPS + domeny w jednym) — https://nazwa.pl
- home.pl — https://home.pl
- Atman (enterprise PL) — https://www.atman.pl
- _Benchmark (NIE PL, faktura DE / odwrotne obciążenie):_ Hetzner — https://www.hetzner.com (tani, mocny — tylko do porównania ceny)

**Na co patrzeć przy wyborze:** RAM ≥ 1-2 GB (celuj w 2 GB pod Node + ew. Redis/self-host Supabase), dysk NVMe SSD, transfer, lokalizacja DC w PL, anty-DDoS.

## 3. Rekomendacja: domena

- **Rejestrator z polską fakturą:** OVHcloud, home.pl, nazwa.pl, cyber_Folks — wszystkie wystawiają fakturę VAT z NIP. Najwygodniej kupić domenę **u tego samego dostawcy co VPS** (OVH) — jedna faktura, łatwiejsze DNS.
- **TLD:**
  - `.pl` — sygnał lokalny dla polskiego SEO, tanio, ale słabszy dla rynku EN.
  - `.com` — neutralny, najlepszy dla dwujęzycznego (PL+EN) zasięgu. **Rekomendacja** przy decyzji „PL+EN".
  - `.ai` — pasuje do nazwy/brandu („PitchPredict AI"), ale drogie (~kilkaset zł/rok) i bez przewagi SEO.
- **Rekomendacja:** kup `.com` (główna, kanoniczna dla SEO PL+EN) + opcjonalnie `.pl` jako przekierowanie 301 na `.com`.

## 4. Etapy wdrożenia

### Etap 1 — Zmiany w kodzie (adapter Node)

1. `npm rm @astrojs/cloudflare && npm i @astrojs/node`.
2. `astro.config.mjs`: `adapter: node({ mode: "standalone" })`, usunąć `platformProxy`, dodać `site`.
3. Sekrety na runtime: przejść na **`astro:env`** (schemat `env` w configu, `getSecret()`/`import("astro:env/server")`) — czysty, typowany sposób na Node; alternatywnie `process.env`. Uprościć fallbacki `locals.runtime?.env || ...` w: `middleware/index.ts`, `pages/api/matches.ts`, `pages/api/predictions/generate.ts`, `pages/api/predictions/[id]/fetch-result.ts`, `db/supabase.server.ts`, `db/supabase.client.ts`.
4. `env.d.ts`: usunąć typ `runtime` (Cloudflare) jeśli zbędny.
5. Weryfikacja: `npm run build` + lokalny `node ./dist/server/entry.mjs`.

### Etap 2 — Provisioning VPS

6. Zamówić VPS (OVH), system: Ubuntu LTS. Utworzyć usera non-root, SSH key-only, `ufw` (22/80/443), `fail2ban`.
7. Node 22 (zgodnie z `.nvmrc`), opcjonalnie przez `nvm`.
8. **Reverse proxy: Caddy** (rekomendacja — automatyczny Let's Encrypt SSL, prostszy niż nginx) → proxy na port Node (np. 3000/4321).
9. **Proces aplikacji: systemd** (lub PM2) — auto-restart, logi, start po reboocie.

### Etap 3 — Domena + DNS + SSL

10. Kupić domenę (OVH), ustawić rekordy A/AAAA na IP VPS.
11. Caddy automatycznie wystawi certyfikat SSL dla domeny.
12. Przekierowanie `www` → bezdomenowe (lub odwrotnie) + `.pl` → `.com` (301), spójne z canonical z planu SEO.

### Etap 4 — Sekrety i baza

13. Plik `.env` na serwerze (poza repo, `chmod 600`) lub sekrety w systemd: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`, `FOOTBALL_DATA_API_KEY`.
14. Supabase: zostaje hostowany (Free na start — §1). W ustawieniach Supabase dodać domenę produkcyjną do **Auth → Redirect URLs / Site URL** (inaczej reset hasła / linki auth nie zadziałają).

### Etap 5 — CI/CD (deploy: ręcznie vs automatycznie — do decyzji)

**Co to znaczy „ręcznie czy od razu (automatycznie)":** chodzi o sposób, w jaki kod z komputera trafia na serwer produkcyjny.

|            | **Ręcznie**                                                                       | **Automatycznie (CI/CD od razu)**                                            |
| ---------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Jak działa | Ty odpalasz build i wgrywasz pliki na VPS (skrypt / SSH+rsync), kiedy zdecydujesz | Po `git push` do `master` GitHub Actions **sam** buduje i wgrywa na serwer   |
| Plus       | Pełna kontrola _kiedy_ coś idzie na produkcję; prostsza konfiguracja na start     | Zero klikania; spójność; szybkie poprawki                                    |
| Minus      | Żmudne, łatwo o błąd, trzeba pamiętać kroki                                       | Zły commit od razu ląduje na produkcji (potrzebne testy jako zabezpieczenie) |

**Rekomendacja:** zacznij od **skryptu deploy „jedną komendą"** (ręcznie, ale powtarzalnie) — szybko jesteś online i rozumiesz pipeline. Gdy się ustabilizuje, dołóż auto-deploy. Złoty środek: workflow w GitHub uruchamiany **przyciskiem** (`workflow_dispatch`) — automatyzacja, ale Ty decydujesz kiedy.

15. **GitHub Actions**: na push do `master` (lub `workflow_dispatch`) → build → deploy przez SSH (rsync `dist/` + restart systemd). Sekrety w GitHub Secrets.
16. (Opcja) staging na osobnym porcie/subdomenie.

> **DO PRZEMYŚLENIA (sesja zakończona tutaj):** wybór dostawcy VPS (§2 + linki), TLD/nazwa domeny (§3), oraz tryb deployu (ręczny skrypt vs auto GitHub Actions). Reszta implementacji i temat #4 (prawdopodobieństwo) — następnego dnia.

### Etap 6 — Operacje

17. Backupy: snapshot VPS (OVH) + (jeśli self-host DB później) `pg_dump` cron.
18. Monitoring: uptime (np. UptimeRobot), logi systemd, alerty.

## 5. Pliki do zmiany

- `package.json` (adapter), `astro.config.mjs`, `src/env.d.ts`, `src/middleware/index.ts`, `src/db/supabase.server.ts`, `src/db/supabase.client.ts`, 3× endpointy API z `runtime?.env`.
- Nowe (infra, nie w repo aplikacji): `Caddyfile`, unit systemd, workflow `.github/workflows/deploy.yml`.

## 6. Koszty (szacunek startowy)

- VPS OVH najmniejszy: ~20-40 zł/mies (faktura PL).
- Domena `.com`: ~50-60 zł/rok (faktura PL).
- Supabase: **0 zł** (Free) na start; $25/mies dopiero przy premierze (lub 0 zł jeśli self-host na VPS).
- **Razem na start: ~⩽40 zł/mies + domena rocznie.**

## 7. Decyzje do potwierdzenia

1. **TLD domeny** — `.com` (rekomendacja), `.pl`, `.ai`, czy konkretna nazwa którą już masz?
2. **VPS** — OVH (rekomendacja) czy Mikr.us (taniej)? Jaki budżet miesięczny akceptujesz?
3. **DB** — akceptujesz „Free na start, decyzja Pro vs self-host przy premierze"? (rekomendacja §1)
4. **CI/CD** — chcesz auto-deploy z GitHub od razu, czy najpierw deploy ręczny?
5. Czy zależy Ci, by **dane (DB) fizycznie były w Polsce** (RODO/marketing) — to przesuwa wagę ku self-host Supabase na VPS wcześniej.

## Źródła / referencje

- Istniejąca analiza: `.ai/hosting-analysis.pl.md` (rekomendowała Cloudflare — zmienione przez wymóg VAT).
- Astro Node adapter: dokumentacja `@astrojs/node` (tryb standalone), `astro:env` dla sekretów runtime.
- Supabase self-hosting (Docker) — docs.supabase.com/guides/self-hosting.
