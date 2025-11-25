# Testing Quick Reference

## Środowiska i porty

| Środowisko | Komenda | Port | Plik env | Baza danych |
|------------|---------|------|----------|-------------|
| **Development** | `npm run dev` | 3000 | `.env` | Localhost Docker (54321) |
| **E2E Tests** | `npm run test:e2e` | 3001 | `.env.test` | Testowa Supabase (cloud) |
| **Unit Tests** | `npm run test:unit` | - | mock | Mockowany Supabase |

## Kluczowe punkty

### ✅ Możesz pracować i testować jednocześnie
```bash
# Terminal 1 - Development
npm run dev
# → Port 3000, baza z .env (localhost:54321)

# Terminal 2 - E2E Tests (w tym samym czasie!)
npm run test:e2e
# → Port 3001, baza z .env.test (testowa Supabase)
```

### 🔑 Konfiguracja portów

**astro.config.mjs:**
```javascript
server: { 
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000 
}
```

**playwright.config.ts:**
```typescript
webServer: {
  command: 'PORT=3001 npm run dev',  // Wymusza port 3001
  url: 'http://localhost:3001',
  env: testEnv, // Zmienne z .env.test
}
```

## Wymagane pliki

### `.env` (nie commituj!)
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-local-key
# ... inne zmienne dla lokalnego developmentu
```

### `.env.test` (nie commituj!)
```env
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_KEY=your-test-anon-key
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
# ... inne zmienne dla testów
```

## Komendy testowe

```bash
# Unit tests
npm run test:unit              # Watch mode
npm run test:unit:run          # Run once
npm run test:unit:coverage     # With coverage

# E2E tests
npm run test:e2e              # Headless mode
npm run test:e2e:ui           # UI mode
npm run test:e2e:debug        # Debug mode
```

## Troubleshooting

### Problem: Port zajęty
```bash
# Port 3000 (dev)
lsof -ti:3000 | xargs kill -9

# Port 3001 (e2e)
lsof -ti:3001 | xargs kill -9
```

### Problem: Testy łączą się z złą bazą
1. Sprawdź czy `.env.test` istnieje i ma poprawne dane
2. Sprawdź czy Playwright używa portu 3001 (nie 3000)
3. Sprawdź logi - powinien pokazać testową URL Supabase

## Więcej informacji

- Szczegóły E2E: [.ai/e2e-test-environment.md](./.ai/e2e-test-environment.md)
- Plan testowy: [.ai/test-plan.md](./.ai/test-plan.md)
- Reguły E2E: [.cursor/rules/e2e-testing.mdc](../.cursor/rules/e2e-testing.mdc)
- Reguły Unit: [.cursor/rules/unit-testing.mdc](../.cursor/rules/unit-testing.mdc)

