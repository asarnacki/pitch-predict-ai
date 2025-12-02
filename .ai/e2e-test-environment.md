# E2E Testing Environment Configuration

## Problem

Podczas testów E2E musimy łączyć się z **testową bazą danych Supabase**, a nie z produkcyjną lub lokalną.

Dodatkowo, gdy mamy uruchomiony `npm run dev` (port 3000 z `.env`), testy E2E nie powinny używać tego samego serwera - powinny uruchomić własny serwer z `.env.test`.

## Rozwiązanie - Separacja portów

Testy E2E działają na **porcie 3001** (zamiast 3000), co pozwala:

- Pracować normalnie: `npm run dev` na porcie 3000 z lokalną bazą
- Testować równocześnie: `npm run test:e2e` na porcie 3001 z testową bazą
- Brak konfliktów - każde środowisko ma swój port i swoją bazę danych

## Jak to działa?

### Struktura plików .env

```
.env            # Zmienne dla lokalnego developmentu (localhost lub prod)
.env.test       # Zmienne dla testów E2E (testowa baza Supabase)
```

### Konfiguracja Playwright

W `playwright.config.ts`:

```typescript
// 1. Załaduj zmienne z .env.test do obiektu
const testEnv = dotenv.config({ path: '.env.test' }).parsed || {};

// 2. Przekaż je do webServer przez właściwość env
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  env: testEnv, // Zmienne z .env.test
}
```

**Jak to działa:**

- `dotenv.config()` parsuje `.env.test` do obiektu JavaScript
- `webServer.env` przekazuje te zmienne jako environment variables do procesu serwera
- Serwer Astro używa tych zmiennych zamiast z `.env`
- Proste, bez dodatkowych zależności!

## Wymagane zmienne w .env.test

```env
# Testowa baza Supabase
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_KEY=your-test-anon-key

# Public zmienne (jeśli używane)
PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key

# Test user credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123

# Inne zmienne używane przez aplikację...
```

## Dostępne komendy

### Testy E2E (automatycznie uruchomi serwer z .env.test)

```bash
npm run test:e2e          # Uruchom wszystkie testy
npm run test:e2e:ui       # Uruchom w trybie UI
npm run test:e2e:debug    # Uruchom w trybie debug
```

## Workflow testów E2E

1. **Uruchom testy:** `npm run test:e2e`
2. Playwright automatycznie:
   - Ładuje zmienne z `.env.test`
   - Uruchamia serwer dev na porcie **3001** z tymi zmiennymi
   - Wykonuje testy na `http://localhost:3001`
   - Zatrzymuje serwer po testach

3. Serwer łączy się z **testową bazą Supabase** (nie lokalną/prod)

**Ważne:** Testy E2E działają na porcie 3001, więc możesz mieć równocześnie:

- `npm run dev` na porcie 3000 (z `.env` - lokalna/prod baza)
- `npm run test:e2e` na porcie 3001 (z `.env.test` - testowa baza)

## Troubleshooting

### Problem: Testy używają lokalnej bazy zamiast testowej

**Sprawdź:**

1. Czy plik `.env.test` istnieje i zawiera poprawne zmienne
2. Czy w `.env.test` są ustawione `SUPABASE_URL` i `SUPABASE_KEY` dla testowej bazy
3. Czy pakiet `dotenv` jest zainstalowany (powinien być w devDependencies)

### Problem: "Cannot connect to Supabase"

**Sprawdź:**

1. Czy testowa baza Supabase jest uruchomiona i dostępna
2. Czy URL i KEY w `.env.test` są poprawne
3. Czy testowy użytkownik (`E2E_USERNAME`/`E2E_PASSWORD`) istnieje w testowej bazie

### Problem: Port 3001 zajęty

**Rozwiązanie:**

```bash
# Zabij proces na porcie 3001
lsof -ti:3001 | xargs kill -9
```

**Uwaga:** Testy E2E działają na porcie 3001, więc port 3000 może być zajęty przez `npm run dev` - to jest OK!

## Best Practices

1. **Nigdy nie commituj `.env.test`** - zawiera credentials
2. **Używaj osobnej bazy** dla testów E2E (nie tej samej co prod)
3. **Stwórz dedykowanego test usera** w testowej bazie
4. **Regularnie czyść testową bazę** z danych testowych
5. **Używaj `webServer.env` w Playwright** - prosty sposób na przekazanie zmiennych

## Weryfikacja konfiguracji

Sprawdź czy wszystko działa:

```bash
# Uruchom testy - Playwright automatycznie wystartuje serwer na porcie 3001 z .env.test
npm run test:e2e

# Jeśli chcesz zobaczyć testy w trybie UI
npm run test:e2e:ui

# Możesz też mieć uruchomione równocześnie:
# Terminal 1: npm run dev (port 3000, .env)
# Terminal 2: npm run test:e2e (port 3001, .env.test)
```

## Diagram przepływu

```
npm run test:e2e
    ↓
Playwright Config
    ↓
1. Ładuje .env.test przez dotenv
   const testEnv = dotenv.config({ path: '.env.test' }).parsed
    ↓
2. Uruchamia: PORT=3001 npm run dev
   z env: testEnv (zmienne z .env.test)
    ↓
Serwer Astro startuje na porcie 3001
i otrzymuje zmienne środowiskowe z .env.test
    ↓
Aplikacja łączy się z testową bazą Supabase
    ↓
Testy wykonują się na http://localhost:3001
    ↓
Playwright zatrzymuje serwer po testach
```

## Różnice między środowiskami

| Środowisko  | Plik        | Baza danych      | Port | Użycie             |
| ----------- | ----------- | ---------------- | ---- | ------------------ |
| Development | `.env`      | Localhost/Prod   | 3000 | `npm run dev`      |
| E2E Tests   | `.env.test` | Testowa Supabase | 3001 | `npm run test:e2e` |
| Production  | CI/CD vars  | Prod Supabase    | -    | Deploy             |
