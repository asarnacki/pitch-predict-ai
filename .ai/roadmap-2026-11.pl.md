# Roadmapa i podsumowanie sesji - 2026-11-16

> Punkt wejścia po przerwie. Projekt był zawieszony od czerwca 2026. Ten plik zbiera: stan repo,
> wyniki przeglądu bezpieczeństwa, znane błędy modelu, podjęte decyzje i plan na kolejne miesiące.
> Szczegóły poszczególnych tematów są w sąsiednich planach (`security-rate-limiting-plan.pl.md`,
> `odds-math-probability-plan.pl.md`, `deployment-hosting-plan.pl.md`, `seo-implementation-plan.pl.md`,
> `cookies-privacy-plan.pl.md`).

## 1. Stan repo na 2026-11-16

- Testy jednostkowe: 28/28 przechodzą. Lint czysty. Build przechodzi.
- `tsc --noEmit` wywala się na importach `.vue` (potrzebny `vue-tsc`); CI nie sprawdza typów.
- Silnik predykcji jest w pół kroku: `generate.ts` woła model Poissona + kursy z API-Football,
  ale UI nie pokazuje `modelOdds` / `bookmaker` / `value`, brak tłumaczeń i testów obu nowych serwisów.
- `ai-prediction.service.ts` (LLM przez OpenRouter) jest odpięty od `generate.ts`, ale zostaje w repo.
- Anonim na stronie głównej dostaje 401 przy generowaniu (twardy auth guard), mimo że `/` jest publiczne.
- E2E nie pokrywa ścieżki predykcji i nie ma mocka `/api/predictions/generate`.
- Projekt Supabase nie odpowiadał (timeout), najpewniej wstrzymany po bezczynności na planie Free.
  **RLS na żywej bazie nie zostało zweryfikowane.**

## 2. Decyzje podjęte w tej sesji

| Temat         | Decyzja                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Cel           | Teraz portfolio i nauka. W przyszłości publikacja i subskrypcja dla klientów.                      |
| Silnik        | Zostają oba: Poisson i LLM. Wybiera użytkownik aplikacji.                                          |
| Czas          | 1-2 godziny dziennie.                                                                              |
| Kursy / value | Nierozstrzygnięte. Propozycja: pokazywać jako "model kontra rynek", bez sformułowań "value bet".   |
| Hosting       | Nierozstrzygnięte. Założenie robocze: Cloudflare do etapu portfolio, VPS dopiero przy subskrypcji. |

Konsekwencje decyzji o dwóch silnikach:

- `POST /api/predictions/generate` dostaje parametr `engine: "poisson" | "llm"`.
- Klucz cache musi zawierać silnik.
- Tabela `predictions` potrzebuje kolumny `engine` (nowa migracja + regeneracja typów).
- LLM kosztuje kredyty OpenRouter, więc rate limit musi wejść **przed** ponownym włączeniem LLM w UI.
- Limit osobny per silnik: luźny dla Poissona, ciasny dla LLM.

## 3. Przegląd bezpieczeństwa

### Wysoka waga

- **Zatruwanie cache** (`generate.ts`): klucz to `match_id` z body, a odpowiedź zawiera drużyny z body.
  Zalogowany użytkownik może podać prawdziwe ID z fałszywymi drużynami i przez 6 h inni dostaną jego wynik.
  Poprawka: przyjmować tylko `match_id` + `league`, drużyny i datę brać z własnej listy meczów.
- **Brak rate limitu**: każde zmyślone `match_id` to 2 zapytania do API-Football (limit 100/dzień),
  więc 50 żądań wyłącza kursy na dobę. `Map` w `cache.service.ts` nie ma limitu rozmiaru.
- **Zależności**: 26 podatności w zależnościach produkcyjnych, 2 krytyczne (`astro`, `tar`).
  Większość naprawi `npm audit fix`; `@astrojs/cloudflare` wymaga skoku major (12 -> 14).

### Średnia waga

- Rejestracja bez potwierdzenia e-maila i bez CAPTCHA w `supabase/config.toml` (ustawienia produkcyjne
  nie były sprawdzone). Auth guard nie zatrzyma bota, który sam zakłada konta.
- Minimalna długość hasła: 6 w Supabase, 8 w Zod. Klucz anon jest publiczny, więc Zod da się ominąć.
- Brak nagłówków bezpieczeństwa (CSP, `X-Frame-Options`, HSTS).

### Niska waga

- Endpointy `api/auth/*` omijają `formatError`, mają hardkodowane polskie komunikaty, zwracają surowy
  `error.message` z Supabase i przez 409 ujawniają, czy e-mail istnieje.
- Notatka jest escapowana dwa razy (`sanitizeNote` + Vue), więc użytkownik widzi `&lt;` zamiast `<`.
- `logger.ts` milczy na produkcji: brak wglądu w błędy i nadużycia.
- Limit 50 predykcji to "policz, potem wstaw" bez blokady (możliwy wyścig).

### W porządku

- `.env` ignorowany, nigdy nie był w repo, kluczy w historii nie znaleziono.
- `user_id` zawsze z JWT, Zod na wejściach, brak `v-html`.
- Końcowa migracja włącza RLS z izolacją per użytkownik (sprawdzone w plikach, nie na żywej bazie).

## 4. Znane błędy modelu Poissona i kursów

- `season = getFullYear()` w `odds-provider.service.ts`: dla meczów styczeń-maj daje zły sezon.
- Start sezonu: `playedGames = 0` daje dzielenie przez zero i `NaN`; `p = 0` daje kurs `Infinity`.
- Nieznana drużyna po cichu dostaje siłę 1.0. Dopasowanie nazw między football-data a API-Football
  jest po dokładnym stringu, więc będzie się zdarzać często.
- Błąd API kursów jest cache'owany jako "brak kursów" na 6 h.
- Mundial: kod bierze tylko pierwszą tabelę `TOTAL` (jedną grupę). Zakładka WC jest po turnieju martwa.
- Przewaga gospodarzy to sztywne 1.15/0.85; football-data udostępnia tabele HOME/AWAY.
  Komentarz "Dixon-Coles baseline" w kodzie jest nieścisły.

## 5. Pomysły na rozwój

1. **Publiczna skuteczność modelu**: zapis każdej predykcji, rozliczanie cronem, strona z Brier score
   i wykresem kalibracji. Przy dwóch silnikach: porównanie Poisson kontra LLM na tych samych meczach.
2. **Ty kontra model**: `user_choice` już jest w bazie; statystyki trafień, serie, później ligi znajomych.
3. **Więcej z macierzy Poissona**: najbardziej prawdopodobny wynik, over/under 2.5, BTTS, heatmapa wyników.
4. **Model v2**: tabele HOME/AWAY, korekta Dixona-Colesa, ważenie formą, backtest na poprzednich sezonach.
5. **Kupony**: prawdopodobieństwo akumulatora (jest w `odds-math-probability-plan.pl.md`).
6. **Podział na plany**: Poisson za darmo, LLM w subskrypcji.

## 6. Plan (sesje po 1-2 h)

### Tydzień 1 - porządek

- [x] WIP z `master` na gałąź, commit, merge.
- [ ] Wznowić Supabase, sprawdzić RLS i advisory na żywo.
- [ ] `npm audit fix` i `astro` do najnowszego 5.x.
- [ ] `vue-tsc` w CI.

### Tygodnie 2-3 - bezpieczny Poisson

- [ ] Serwer sam rozwiązuje mecz po `match_id` (koniec zatruwania cache).
- [ ] Poprawki modelu: sezon, start sezonu, nieznana drużyna, cache błędów kursów.
- [ ] Testy jednostkowe `prediction-model.service` i `odds-provider.service`.

### Tygodnie 4-5 - UI i drugi silnik

- [ ] Kursy modelu i bukmachera w `PredictionResult.vue`, tłumaczenia PL/EN.
- [ ] Parametr `engine`, przełącznik w UI, migracja z kolumną `engine`.
- [ ] E2E ścieżki predykcji z mockiem `/api/predictions/generate`.

### Tygodnie 6-7 - ochrona (warunek dla LLM)

- [ ] Rate limit w Postgresie, osobne progi dla Poissona i LLM.
- [ ] Turnstile i limitowany podgląd dla anonimów (model hybrydowy).
- [ ] Nagłówki bezpieczeństwa, potwierdzanie e-maila, hasło min. 8 w Supabase.
- [ ] Endpointy auth na `formatError` + i18n.

### Miesiąc 3 - wyróżnik

- [ ] Trwały zapis każdej predykcji i automatyczne rozliczanie wyników.
- [ ] Strona skuteczności: Poisson kontra LLM, Brier score, kalibracja.
- [ ] Statystyki "Ty kontra model".

### Miesiąc 4 - publikacja portfolio

- [ ] Wdrożenie, SEO (`site` w `astro.config.mjs`, bo sitemap się nie generuje), cookies, logowanie błędów.
- [ ] README z opisem architektury i modelu.

### Później - przed subskrypcją

- [ ] Decyzja prawna o kursach i "value bet" (przepisy o reklamie hazardu), płatności, plany, ew. VPS.
- [ ] Model v2 z backtestem, dodatkowe rynki, kupony.

## 7. Otwarte pytania

1. Hosting: Cloudflare czy polski VPS z adapterem Node? Wpływa na sposób zrobienia rate limitu i crona.
2. Kursy: narzędzie dla typujących czy ciekawostka dla kibica?
3. Zakładka World Cup: usunąć, czy zastąpić inną rozgrywką (np. Liga Mistrzów)?

## 8. Jak wrócić do pracy

1. Przeczytaj sekcje 2 i 6 tego pliku.
2. `npm install && npm run test:unit:run && npm run lint && npm run build`.
3. Sprawdź, czy projekt Supabase działa (panel Supabase), zanim uruchomisz e2e.
4. Weź pierwszy nieodhaczony punkt z sekcji 6.
