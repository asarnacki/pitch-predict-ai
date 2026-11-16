# Plan — Ochrona przed nadużyciem predykcji (rate limiting / abuse)

> Powód: ryzyko, że bot wykona setki żądań do `/api/predictions/generate` i wyczerpie kredyty OpenRouter.
> Werdykt: **obecny cache NIE jest wystarczający.** Poniżej diagnoza + warstwowa obrona.

## 0. Diagnoza (zweryfikowane w kodzie)

| Problem                       | Dowód                                                                         | Skutek                                                              |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Brak auth na generate         | `pages/api/predictions/generate.ts` — brak `if (!locals.user)`                | anonimowy bot woła bez przeszkód                                    |
| Middleware nie chroni API     | `middleware/index.ts:35` → `if (pathname.startsWith("/api/")) return next();` | każdy handler musi bronić się sam; generate tego nie robi           |
| Cache obchodzony              | klucz `prediction:${match_id}`, a `match_id` = `z.string().min(1)` z body     | zmienny match_id ⇒ każdy = cache miss ⇒ realne wywołanie OpenRouter |
| Cache ulotny/per-proces       | `cache.service.ts` = `new Map()` (in-memory singleton)                        | ginie po restarcie/deployu; na CF per-instancja                     |
| Brak rate limitu              | brak jakiegokolwiek licznika żądań                                            | nic nie ogranicza tempa                                             |
| `PredictionLimitError` nie tu | `prediction.service.ts` — limit 50 dot. ZAPISU, nie generowania               | nie chroni generate                                                 |

**Wniosek:** cache to optymalizacja wydajności, nie kontrola bezpieczeństwa — i łatwo go ominąć.

## 1. Stan konta OpenRouter a rodzaj ryzyka

**Obecnie: plan darmowy, BEZ podpiętej karty.** Model w użyciu: `meta-llama/llama-3.1-70b-instruct` (płatny, zjada kredyty).

- ✅ **Brak ryzyka finansowego teraz:** bez karty nie można naliczyć opłaty. Po wyczerpaniu kredytów OpenRouter zwraca `402 insufficient credits` — apka zwraca błąd, ale **żadnego długu**. (Wcześniejsza rada „ustaw twardy limit wydatków" NIE dotyczy konta bez karty — nie ma czego ustawiać.)
- ⚠️ **Ryzyko dostępności (UX) zostaje:** bot może wypompować darmowe/próbne kredyty lub wbić się w dzienny limit → **predykcje przestają działać dla prawdziwych użytkowników**.
- 🔴 **Ryzyko wraca jako finansowe, gdy podepniesz kartę** (konieczne do produkcji po wyczerpaniu kredytów próbnych). Dlatego warstwy ochrony (§2) trzeba wdrożyć **zanim** podepniesz kartę / włączysz auto-topup.

**Do zrobienia dziś:** nic w panelu OpenRouter (brak karty = brak ekspozycji). Gdy/jeśli podepniesz kartę → wtedy ustaw twardy limit kredytów + wyłącz auto-topup do czasu wdrożenia §2. Opcjonalnie: na dev używać modelu `:free`, by nie palić kredytów próbnych.

## 2. Warstwowa obrona (od najtańszej/najskuteczniejszej)

### Warstwa 1 — Auth guard (must, 1 linia, największy zysk)

Dodać na początku `generate.ts`:

```ts
if (!locals.user) throw new UnauthorizedError();
```

Jeśli predykcje mają być funkcją **dla zalogowanych** — to usuwa ~90% ryzyka (bot musi mieć konto). ⚠️ Decyzja produktowa: czy generowanie ma być publiczne (na stronie głównej) czy tylko po zalogowaniu? (patrz §4)

### Warstwa 2 — Walidacja realnego meczu (odcina fałszywe match_id)

Przed wywołaniem OpenRouter sprawdzić, że `match_id` odpowiada **prawdziwemu, nadchodzącemu meczowi** z football-data (te dane i tak są cache'owane). Fałszywe ID → `404`, zero kosztu OpenRouter. To zamyka główną metodę omijania cache.

### Warstwa 3 — Rate limiting per użytkownik / IP (trwały)

- Najlepiej **oparty o Postgres/Supabase** (macie go): tabela `rate_limits` albo zliczanie żądań w oknie czasowym (np. `N` generacji / godzinę / użytkownika; dla anonima per IP). Trwałe, przeżywa restart, współdzielone między instancjami.
- Alternatywa: **Redis lokalnie na VPS** (jedna polska faktura) — szybki licznik (token bucket). Upstash Redis ma darmowy tier, ale to faktura zagraniczna.
- ❌ In-memory na serverless/multi-instancja jest nieskuteczny; na pojedynczym VPS Node działa, ale ginie po restarcie — traktować jako dodatek, nie podstawę.

### Warstwa 4 — Globalny bezpiecznik budżetu (circuit breaker)

Globalny licznik wywołań OpenRouter (np. max `X`/dzień dla całej apki). Po przekroczeniu — zwracać komunikat „chwilowo niedostępne" / wersję z cache, zamiast palić kredyty. Chroni portfel nawet gdy inne warstwy zawiodą.

### Warstwa 5 — CAPTCHA (jeśli generate ma zostać publiczne)

- ✅ **Cloudflare Turnstile** — darmowy, przyjazny prywatności (bez ciasteczek śledzących → zgodny z planem cookies), niezależny od hostingu. Weryfikacja tokenu po stronie serwera w `generate.ts`.
- ❌ **Google reCAPTCHA** — Google = ciasteczka/zgody marketingowe → kłóci się z planem cookies. Odradzam.
- Uwaga: CAPTCHA to tarcie dla użytkownika. Lepiej najpierw auth + rate limit; CAPTCHA tylko gdy świadomie zostawiasz anonimowy dostęp.

### Warstwa 6 — Cloudflare przed VPS (darmowy WAF/anti-bot)

Mimo przejścia na polski VPS, można ustawić **Cloudflare (darmowy plan) jako proxy/CDN/WAF przed VPS** (DNS proxied). Daje: anty-DDoS, Bot Fight Mode, rate limiting na brzegu, Turnstile. **Darmowe = brak faktury, nie psuje VAT.** Bardzo dobra warstwa zewnętrzna niezależna od kodu.

### Warstwa 7 — Utwardzenie cache (trwałość)

Przenieść cache predykcji do trwałego store (DB/Redis) zamiast `Map()`, by przeżywał restart i był współdzielony. Można też po prostu **zapisywać wygenerowane predykcje w DB** i serwować z bazy (trwały cache + historia).

## 3. Rekomendowana kolejność wdrożenia

1. **Teraz:** twardy limit w OpenRouter (§1) + Cloudflare przed VPS (§2.6, darmowe).
2. **Sprint 1:** Warstwa 1 (auth guard) + Warstwa 2 (walidacja meczu) — taniutkie, ogromny efekt.
3. **Sprint 2:** Warstwa 3 (rate limit w Postgres) + Warstwa 4 (globalny bezpiecznik).
4. **Wg potrzeby:** Warstwa 5 (Turnstile — jeśli zostaje anonimowo) + Warstwa 7 (trwały cache).

## 4. Decyzja produktowa (PODJĘTA): model hybrydowy

**Wybór: hybryda — niezalogowani mają limitowany podgląd, pełny dostęp po zalogowaniu.**

Konsekwencje dla warstw (wszystkie potrzebne — to najszerszy wariant):

- **Warstwa 1 (auth guard) → zmieniona w „tryb dwupoziomowy":** zalogowany = wyższy limit; anonim = niski limit darmowych predykcji. Zamiast twardego `throw UnauthorizedError`, rozgałęzienie wg `locals.user`.
- **Warstwa 2 (walidacja meczu)** — wymagana (anonim wysyła body, trzeba odciąć fałszywe `match_id`).
- **Warstwa 3 (rate limit)** — **dwa progi**: per `user.id` dla zalogowanych, per IP dla anonimów (np. anonim: 3 predykcje / dzień / IP; zalogowany: wyższy). Trwałe w Postgres.
- **Warstwa 4 (globalny bezpiecznik budżetu)** — wymagana.
- **Warstwa 5 (Cloudflare Turnstile)** — wymagana dla ścieżki anonimowej (po przekroczeniu/od pierwszego żądania anonima).
- **Warstwa 6 (Cloudflare WAF przed VPS)** — zalecana.
- **Warstwa 7 (trwały cache w DB)** — zalecana.

Kolejność z §3 pozostaje, ale Warstwa 5 (Turnstile) przechodzi z „wg potrzeby" do **wymaganych** (Sprint 2), bo dostęp anonimowy zostaje.

## 5. Pliki do zmiany (przy realizacji)

- `src/pages/api/predictions/generate.ts` (auth guard, walidacja meczu, rate limit, ew. Turnstile).
- `src/lib/services/` — nowy `rate-limit.service.ts`; rozważyć trwały cache (DB) w `cache.service.ts` lub `prediction.service.ts`.
- Migracja Supabase: tabela `rate_limits` (+ RLS) — jeśli wariant DB.
- Infra: konfiguracja Cloudflare (proxy + rules) + sekret Turnstile w env.
