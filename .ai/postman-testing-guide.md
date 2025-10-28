# Postman Testing Guide - GET /api/profile

## 📋 Setup

### 1. Uruchom dev server
```bash
npm run dev
```
Powinien działać na: `http://localhost:3000`

### 2. Upewnij się że Supabase działa
```bash
supabase status
```

---

## 🔑 Krok 1: Zaloguj się i zdobądź JWT token

### Request w Postman:

**Method:** `POST`
**URL:** `http://127.0.0.1:54321/auth/v1/token?grant_type=password`

**Headers:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "testowy@test.pl",
  "password": "qwerty1!"
}
```

### ✅ Oczekiwana odpowiedź (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "testowy@test.pl",
    ...
  }
}
```

**WAŻNE:** Skopiuj wartość `access_token` - użyjesz jej w kolejnych requestach!

---

## ✅ Test 1: GET /api/profile BEZ autentykacji (oczekiwany: 401)

### Request w Postman:

**Method:** `GET`
**URL:** `http://localhost:4321/api/profile`

**Headers:**
```
(żadnych headers)
```

### ✅ Oczekiwana odpowiedź (401 UNAUTHORIZED):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Status Code:** `401 Unauthorized`

---

## ✅ Test 2: GET /api/profile Z autentykacją (oczekiwany: 200)

### Request w Postman:

**Method:** `GET`
**URL:** `http://localhost:4321/api/profile`

**Headers:**
```
Authorization: Bearer <TUTAJ_WKLEJ_ACCESS_TOKEN>
```

**Przykład:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjk4MzQyNDAwLCJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlc3Rvd3lAdGVzdC5wbCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNjk4MzM4ODAwfV0sInNlc3Npb25faWQiOiI..."}
```

### ✅ Oczekiwana odpowiedź (200 OK):
```json
{
  "data": {
    "id": "11111111-1111-1111-1111-111111111111",
    "created_at": "2025-10-25T14:00:00.000Z"
  }
}
```

**Status Code:** `200 OK`

### ✅ Weryfikacja:
- ✅ `data.id` powinno być UUID
- ✅ `data.created_at` powinno być timestampem
- ✅ `data.id` powinno się zgadzać z `user.id` z login response

---

## 🎯 Postman Collection (opcjonalnie)

Możesz zaimportować tę kolekcję do Postmana:

```json
{
  "info": {
    "name": "PitchPredict API - Profile",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login (Get Token)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "apikey",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"testowy@test.pl\",\n  \"password\": \"qwerty1!\"\n}"
        },
        "url": {
          "raw": "http://127.0.0.1:54321/auth/v1/token?grant_type=password",
          "protocol": "http",
          "host": ["127", "0", "0", "1"],
          "port": "54321",
          "path": ["auth", "v1", "token"],
          "query": [
            {
              "key": "grant_type",
              "value": "password"
            }
          ]
        }
      }
    },
    {
      "name": "2. GET Profile (Without Auth) - 401",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:4321/api/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4321",
          "path": ["api", "profile"]
        }
      }
    },
    {
      "name": "3. GET Profile (With Auth) - 200",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
            "description": "Paste your access_token from login response"
          }
        ],
        "url": {
          "raw": "http://localhost:4321/api/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4321",
          "path": ["api", "profile"]
        }
      }
    }
  ]
}
```

**Jak zaimportować:**
1. Otwórz Postman
2. Kliknij "Import"
3. Wybierz "Raw text"
4. Wklej powyższy JSON
5. Kliknij "Import"

---

## 🐛 Troubleshooting

### Problem: Login zwraca 404
**Rozwiązanie:** Sprawdź czy Supabase działa:
```bash
supabase status
```

### Problem: Login zwraca "Invalid login credentials"
**Rozwiązanie:** Zrób reset bazy z seedem:
```bash
supabase db reset
```

### Problem: GET /api/profile zwraca 404
**Rozwiązanie:** Sprawdź czy dev server działa:
```bash
npm run dev
```

### Problem: GET /api/profile zwraca 500
**Rozwiązanie:** Sprawdź logi serwera w terminalu gdzie uruchomiłeś `npm run dev`

### Problem: Token expired
**Rozwiązanie:** Token wygasa po 1h. Zaloguj się ponownie i zdobądź nowy token.

---

## ✅ Checklist testów

- [ ] Uruchomiony dev server (`npm run dev`)
- [ ] Uruchomiony Supabase (`supabase status`)
- [ ] Zalogowany i mam `access_token`
- [ ] Test 1: GET /api/profile bez auth → 401 ✅
- [ ] Test 2: GET /api/profile z auth → 200 ✅
- [ ] Response ma poprawną strukturę `{ data: { id, created_at } }`
- [ ] `data.id` zgadza się z user ID z loginu

---

## 🎉 Sukces!

Jeśli wszystkie testy przeszły, endpoint **GET /api/profile** działa poprawnie! 🚀

Możesz przejść do implementacji kolejnych endpointów.
