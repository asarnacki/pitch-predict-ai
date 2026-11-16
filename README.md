# PitchPredict AI

A web application MVP for casual football fans that provides statistical match outcome predictions for Europe's top three leagues: Premier League, La Liga, and Bundesliga.

## Overview

PitchPredict AI addresses the problem of fragmented football statistics and complex analytical services by providing a simple, free tool that aggregates key data and presents quick, understandable predictions.

Users can:

- Browse upcoming matches from three major leagues
- Generate predictions with probability distributions (Poisson statistical model)
- See fair odds (model) alongside bookmaker odds and a value indicator
- Save predictions with personal notes
- Track their prediction history
- Verify actual match results

## Tech Stack

### Frontend

- **Astro 5** - Static site generation with islands architecture
- **Vue 3** - Interactive components (Composition API)
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **reka-ui** - Accessible headless primitives (shadcn-style components)
- **vee-validate + Zod** - Form handling and validation
- **vue-sonner** - Toast notifications

### Backend

- **Supabase** - PostgreSQL database, authentication, and Row Level Security
- **Astro API Routes** - Server-side endpoints

### Prediction Engine

- **Poisson model** - Statistical bivariate Poisson distribution computing `P(home win)`, `P(draw)`, `P(away win)` from league standings (football-data.org)
- **Bookmaker odds** - Pre-match 1X2 odds from API-Football with overround removal
- **Value indicator** - `p_model × odds_book − 1` per outcome; positive = value bet

### Data Sources

- **football-data.org** - Match data, standings, and results
- **API-Football (api-sports.io)** - Pre-match bookmaker odds (free plan: 100 req/day)

### Deployment

- **Cloudflare Pages** - Edge function hosting

## Getting Started

### Prerequisites

- Node.js 22.14.0 (see `.nvmrc`)
- npm package manager
- Supabase account and project
- football-data.org API key (free tier available)
- API-Football key from api-sports.io (optional; free plan, no card required — enables bookmaker odds)

### Installation

1. Clone the repository:

```bash
git clone git@github.com:asarnacki/pitch-predict-ai.git
cd pitch-predict-ai
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Configure the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FOOTBALL_DATA_API_KEY=your_football_data_api_key

# Optional — enables bookmaker odds and value indicator (api-sports.io free plan)
ODDS_API_KEY=your_api_football_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open http://localhost:3000 in your browser.

## Available Scripts

| Script              | Description                |
| ------------------- | -------------------------- |
| `npm run dev`       | Start development server   |
| `npm run build`     | Build for production       |
| `npm run preview`   | Preview production build   |
| `npm run lint`      | Check code quality         |
| `npm run lint:fix`  | Auto-fix linting issues    |
| `npm run format`    | Format code with Prettier  |
| `npm run test:unit` | Run unit tests (Vitest)    |
| `npm run test:e2e`  | Run E2E tests (Playwright) |

## Features

### Core Functionality

- **User Authentication** - Registration, login, logout, and password reset via Supabase Auth
- **Match Browsing** - View upcoming matches with league filtering (Premier League, La Liga, Bundesliga)
- **Statistical Predictions** - Poisson model generates `home / draw / away` probabilities from live league standings; requires login
- **Fair Odds** - Model-derived decimal odds (`1 / p`) displayed alongside each prediction
- **Bookmaker Odds** - When `ODDS_API_KEY` is set, real 1X2 odds from API-Football are fetched; implied probabilities computed after overround removal
- **Value Indicator** - Badge shown when `p_model × odds_book > 1` (positive expected value)
- **Prediction Management** - Save up to 50 predictions per user with optional notes
- **Match Results** - Fetch actual results for completed matches

### Technical Features

- **API Caching** - 1-hour cache for match data, 6-hour for predictions, 24-hour for standings
- **Graceful degradation** - No `ODDS_API_KEY` or fixture not found → response includes only model output, no error
- **Row Level Security** - Database-level data isolation
- **Responsive Design** - Mobile-first approach (360px - 1440px+)
- **Dark/Light Mode** - Theme toggle with smooth transitions
- **Form Validation** - Client and server-side validation with Zod
- **Internationalization (i18n)** - Typed UI translations (`pl` / `en`) shared reactively across islands

## Internationalization (i18n)

The app supports Polish and English UI via typed translation objects in `src/lib/i18n/translations.ts`.

Key points:

- **Type-safe translations**: all locales conform to the shared `Translation` type (`src/lib/i18n/types.ts`).
- **Language switcher**: implemented as a dropdown (`src/components/LanguageSwitcher.vue`).
- **Astro islands compatibility**: language state is a module-level `ref` (`src/lib/i18n/language.ts`), so it is reactive and shared across all islands even though each island is a separate Vue app.
- **Stable E2E tests**: interactive Vue islands expose `data-hydrated="true"` once mounted; Playwright waits for this attribute before interacting.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/update-password` - Set new password

### Data

- `GET /api/profile` - Get user profile
- `GET /api/matches?league={PL|PD|BL1}` - Fetch upcoming matches

### Predictions

- `POST /api/predictions/generate` - Generate prediction (auth required)
- `GET /api/predictions` - List saved predictions (paginated)
- `POST /api/predictions` - Save prediction
- `GET /api/predictions/:id` - Get single prediction
- `PATCH /api/predictions/:id` - Update note
- `DELETE /api/predictions/:id` - Remove prediction
- `POST /api/predictions/:id/fetch-result` - Get match result

## Project Structure

```
src/
├── pages/           # Astro pages and API routes
│   ├── api/         # REST API endpoints
│   └── *.astro      # Page templates
├── components/      # Vue components (SFC)
│   ├── hooks/       # Composables (useMatches, usePredictions, useAuthForm)
│   ├── hig/         # HIG design system components
│   └── ui/          # shadcn-style primitives built on reka-ui
├── lib/             # Utilities and services
│   ├── services/    # Business logic (football-data, prediction-model, odds-provider, ...)
│   ├── validation/  # Zod schemas
│   └── errors/      # Error handling
├── db/              # Supabase configuration
├── layouts/         # Astro layouts
├── styles/          # Global CSS
└── types.ts         # Shared TypeScript types
```

## Documentation

Detailed documentation is available in the `.ai/` folder:

- `prd.md` - Product Requirements Document
- `tech-stack.md` - Technology decisions
- `db-plan.md` - Database schema and RLS policies
- `api-plan.md` - API specification
- `auth-spec.md` - Authentication architecture
- `test-plan.md` - Testing strategy

## Development Guidelines

- Follow TypeScript strict mode conventions
- Use Zod schemas for all request validation
- Handle errors with custom ApiError classes
- Sanitize user inputs to prevent XSS
- Maintain separation between services, composables, and components

## License

This project is unlicensed. Contact the maintainers for licensing information.
