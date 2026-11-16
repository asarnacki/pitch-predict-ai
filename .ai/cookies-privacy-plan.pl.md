# Plan — Cookies, zgody i prywatność (RODO)

> Kontekst: użytkownik dopiero startuje, brak analityki/reklam/GA. Prosi o rekomendację.
> Apka przetwarza dane osobowe (e-mail, konto, predykcje, notatki) → obowiązki RODO istnieją niezależnie od cookies.

## 0. Najważniejsze rozróżnienie (żeby nie przekombinować)

Dwie osobne sprawy, często mylone:

1. **Baner zgody na cookies** — wymagany **tylko** gdy używasz cookies/technologii **nie-niezbędnych** (analityka, marketing, reklamy). Dla samych ciasteczek **niezbędnych** (sesja/auth Supabase) zgoda **nie jest wymagana** — wystarczy informacja.
2. **Polityka prywatności** — wymagana **zawsze**, gdy przetwarzasz dane osobowe (a przetwarzasz: e-mail przy rejestracji, dane konta). To obowiązek z RODO (art. 13), **niezależny od cookies**.

Wniosek: na Twoim etapie **polityka prywatności jest obowiązkowa**, a **rozbudowany baner zgód — jeszcze nie**.

## 1. Rekomendacja (odpowiedź na „co doradzasz?")

**Start (teraz):**

- ✅ **Tylko ciasteczka niezbędne** (auth/sesja). **Bez** GA, bez reklam, bez pikseli.
- ✅ Zamiast banera zgody → **lekki pasek informacyjny o cookies** („Używamy tylko niezbędnych ciasteczek" + link do polityki). Bez przycisku „odrzuć", bo nie ma czego odrzucać. Minimalne tarcie dla użytkownika.
- ✅ **Polityka prywatności** + **Polityka cookies** (mogą być jedną stroną z sekcjami) — dwujęzyczne PL/EN.

**Gdy dojdzie analityka (zalecane jako pierwszy dodatek):**

- ✅ **Plausible lub Umami** — analityka **bez ciasteczek** (cookieless), zgodna z RODO, zwykle **nie wymaga zgody**. **Umami można self-hostować na tym samym polskim VPS** (jedna faktura, dane w PL). To najlepszy kompromis: masz statystyki, nie budujesz CMP.

**Dopiero gdyby kiedyś GA4 / reklamy / piksele:**

- wtedy (i tylko wtedy) potrzebny **pełny baner zgody z kategoriami** (Niezbędne / Analityczne / Marketingowe), zapis zgody, Google Consent Mode v2.

> TL;DR: **Teraz — pasek info + polityka prywatności. Później — Umami (cookieless). Pełny CMP — tylko jeśli wejdą reklamy/GA.**

## 2. Własny komponent vs zewnętrzny dostawca (CMP)

|                      | Własny komponent                    | Zewnętrzny CMP (Cookiebot, Iubenda, CookieYes…)        |
| -------------------- | ----------------------------------- | ------------------------------------------------------ |
| Koszt                | 0 zł                                | płatny przy większym ruchu / pełnych funkcjach         |
| Złożoność            | mała (przy „tylko niezbędne")       | gotowe, ale obcy skrypt + zwykle faktura zagraniczna   |
| Kontrola/UX          | pełna, spójna z design systemem HIG | ograniczona, „obcy" wygląd                             |
| Skalowanie do reklam | trzeba dopisać logikę kategorii     | obsłużone out-of-the-box (Consent Mode, skany cookies) |

**Rekomendacja:** **napisać własny komponent.** Na Twoim etapie (tylko niezbędne + ew. cookieless analytics) własny komponent jest prostszy, darmowy, polski i spójny z HIG. Zewnętrzny CMP ma sens **dopiero** przy reklamach/GA i wymogu audytowalnych zgód — wtedy można podmienić.
**Zaprojektuj komponent „category-ready"** (struktura zgód gotowa na rozszerzenie), żeby późniejsze dodanie kategorii nie wymagało przepisywania od zera.

## 3. Etapy wdrożenia

### Etap 1 — Polityki (obowiązkowe, najpierw)

1. Strony Astro: `src/pages/privacy.astro` (Polityka prywatności) + `src/pages/cookies.astro` (Polityka cookies) — lub jedna strona z sekcjami. Treść dwujęzyczna przez i18n.
2. Treść polityki prywatności (RODO art. 13): administrator danych (Ty/firma + NIP), cel i podstawa przetwarzania (rejestracja/konto), jakie dane (e-mail, predykcje, notatki), odbiorcy/procesorzy (**Supabase**, **OpenRouter**, **football-data.org**, hosting VPS), czas przechowywania, prawa (dostęp, sprostowanie, usunięcie, sprzeciw), kontakt, info o cookies.
   - ⚠️ **Ważne:** masz **subprocesorów poza PL/EU** (Supabase, OpenRouter w USA) — trzeba to ujawnić + podstawę transferu. To kolejny argument, by docelowo rozważyć self-host Supabase w PL (patrz plan hostingu).
3. Link do polityk w stopce (dodać/utworzyć `Footer`) + w formularzu rejestracji (checkbox akceptacji / informacja).

### Etap 2 — Komponent cookies

4. `src/components/hig/CookieConsent.vue` (lub `components/`): pasek na dole, `aria-live`, przyciski wg trybu. Wariant startowy: „OK, rozumiem" + link do polityki cookies.
5. Zapis decyzji: cookie/`localStorage` (np. `cookie-consent` z wersją i datą), żeby nie pokazywać paska ponownie. Struktura gotowa na kategorie (`{ necessary: true, analytics: false, marketing: false }`).
6. Wpięcie w `Layout.astro` (`client:idle` — nie blokuje renderu/SEO).
7. i18n: klucze `cookies.*`, `privacy.*` w `locales/{pl,en}.json`.

### Etap 3 — (Później) Analityka cookieless

8. Dodać **Umami** (self-host na VPS) lub Plausible. Skrypt ładować **bez zgody** (cookieless) — albo, dla pełnej ostrożności, warunkowo po akceptacji.

### Etap 4 — (Tylko jeśli reklamy/GA) Pełny CMP

9. Rozszerzyć komponent o kategorie + przyciski „Akceptuj / Odrzuć / Ustawienia”, blokadę skryptów przed zgodą, Google Consent Mode v2, log zgód.

## 4. Pliki do utworzenia / zmiany

- **Nowe:** `src/pages/privacy.astro`, `src/pages/cookies.astro`, `src/components/.../CookieConsent.vue`, komponent `Footer`, klucze `cookies.*`/`privacy.*` w locales.
- **Zmiana:** `Layout.astro` (CookieConsent + footer + linki), `register.astro` (info/checkbox zgody), `robots.txt` (polityki — indeksować; tak).

## 5. Zastrzeżenie prawne

To wskazówki techniczno-organizacyjne, **nie porada prawna**. Treść polityki prywatności warto skonsultować z prawnikiem lub użyć rzetelnego generatora (np. wzory UODO), szczególnie ze względu na transfer danych do USA (Supabase/OpenRouter).

## 6. Decyzje do potwierdzenia

1. Forma prawna działalności (osoba fizyczna / JDG z NIP / spółka) — wpływa na zapis „administratora danych".
2. Polityka prywatności: piszemy szkic sami (do konsultacji), czy używasz generatora/prawnika?
3. Analityka od startu (Umami self-host) czy świadomie zero analityki na początku?
4. Jedna strona „Prywatność i cookies" czy dwie osobne?

## Powiązania

- Transfer danych do USA → argument za self-host Supabase w PL (zob. `.ai/deployment-hosting-plan.pl.md` §1).
- Linki do polityk i stopka → spójne z nawigacją/SEO (zob. `.ai/seo-implementation-plan.pl.md`).
