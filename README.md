# Lineup - Live Sports TV Guide

**What sports are on right now, and where can I watch them?**

Lineup is a TV-first app that shows live and upcoming sports events across your streaming services. Pick which services you subscribe to, and Lineup shows you what's on -- then launches the right app with one click.

## Platforms

| Platform | Technology | Status |
|----------|-----------|--------|
| Android TV / Fire TV | React Native (Expo) | ✅ Built |
| Apple TV (tvOS) | React Native (Expo) | ✅ Built |
| Roku | BrightScript / SceneGraph | ✅ Store-ready |
| Web | React Native Web (Expo) | ✅ Built |
| iOS / Android (phone) | React Native (Expo) | Bonus (same codebase) |

## Supported Streaming Services

### Major Services (pre-selected)
- YouTube TV
- Hulu + Live TV
- ESPN+
- Peacock
- Paramount+
- Prime Video
- Apple TV+

### League Packages (opt-in)
- MLB.TV
- NBA League Pass
- NFL+
- NFL Sunday Ticket

## Features

- Live and upcoming sports events for today and tomorrow
- 11 sport categories: NFL, NBA, MLB, NHL, Soccer, College Football, College Basketball, MMA, Golf, Tennis, Racing
- "All Sports" view groups events by sport; single-sport views group by time (Live / Starting Soon / Later Today / Tomorrow)
- Shows which streaming services carry each game
- One-click deep links to launch the right streaming app on your TV
- Auto-enrichment: MLB games get MLB.TV, NBA games get League Pass, NFL gets NFL+, MMA/Golf get ESPN+
- Live scores and game status indicators
- First-launch onboarding to select your streaming services
- "Press OK to watch on [service]" hints when focusing a game card
- Dark theme optimized for TV viewing (10-foot UI)
- D-pad / remote navigation with visible focus states
- User preferences saved locally (no account required)
- All event times shown in user's local time zone
- 404 automated tests (204 app unit + 184 server unit/integration + 16 E2E)
- CI pipeline: all tests must pass before deployment

## Live

- **Web App** -- [lineupguide.tv](https://lineupguide.tv) (Cloudflare Pages)
- **Backend API** -- [Render](https://render.com) (`lineup-api-31li.onrender.com`)
- **Privacy Policy** -- [GitHub Pages](https://sandyberg.github.io/lineup/)
- Production apps use the hosted API; local development falls back to `localhost:3001`

## Project Structure

```
tv-guide/
├── tv-guide-app/           React Native app (Apple TV + Android TV + Web)
│   ├── src/
│   │   ├── app/              Expo Router screens (index, settings)
│   │   ├── components/       UI components (event cards, onboarding, etc.)
│   │   ├── data/             Channel + service definitions
│   │   ├── hooks/            Custom React hooks (preferences)
│   │   └── lib/              API client, types, utilities
│   └── server/               Backend API server (Express + TypeScript)
│       ├── index.ts           Server entry point + enrichment logic
│       ├── sports-api.ts      ESPN + TheSportsDB clients
│       ├── channel-mapping.ts Channel → service mapping
│       ├── cache.ts           In-memory cache
│       └── __tests__/         Server test suite
├── roku-app/               Roku channel (BrightScript/SceneGraph)
│   ├── source/               BrightScript source files
│   ├── components/           SceneGraph XML + BRS components
│   ├── images/               Icons, splash screens, store art
│   └── Makefile              Build and deploy
├── docs/                   Privacy policy (GitHub Pages)
├── render.yaml             Render deployment blueprint
└── .github/workflows/      CI: tests → deploy (Render + Cloudflare Pages)
```

## Getting Started

### 1. Start the backend server

```bash
cd tv-guide-app/server
npm install
npm run dev
```

The API server runs on `http://localhost:3001`. In production, the app uses the hosted Render instance.

### 2a. Run the React Native app (Web)

```bash
cd tv-guide-app
npm install --legacy-peer-deps
npx expo start --web
```

### 2b. Run the React Native app (Android TV)

```bash
cd tv-guide-app
npm install --legacy-peer-deps
npx expo run:android
```

### 2c. Run the Roku app

See [roku-app/README.md](roku-app/README.md) for Roku-specific setup (developer mode, sideloading).

```bash
cd roku-app
make build
ROKU_IP=192.168.1.X ROKU_PASS=yourpassword make deploy
```

### 3. Run tests

```bash
# App unit tests (204 tests)
cd tv-guide-app && npx jest --no-coverage

# Server unit + integration tests (184 tests)
cd tv-guide-app/server && npx jest --no-coverage

# E2E tests (11 tests, requires web server running)
cd tv-guide-app && npx playwright test

# Coverage reports
cd tv-guide-app && npx jest --coverage
cd tv-guide-app/server && npx jest --coverage
```

## CI/CD

Pushes to `main` trigger the full pipeline via GitHub Actions:

1. **App unit tests** -- data, API, hooks, coverage thresholds (99%+ lines)
2. **Server unit tests** -- channel mapping, fetch logic, endpoints
3. **Server integration tests** -- rate limiting, auth, cache, error handling
4. **E2E tests** -- Playwright browser tests (onboarding, guide, settings)
5. **Coverage thresholds** -- enforced globally for app and server
6. **Deploy** -- only if all above pass: API to Render, web to Cloudflare Pages

## Data Sources

- **ESPN API** (unofficial) -- US league schedules (NFL, NBA, MLB, NHL, MLS, EPL, CFB, CBB, UFC, PGA, LPGA)
- **TheSportsDB API** (free tier) -- Additional sports (Soccer, Golf, Tennis, Fighting, Motorsport) + TV channel lookups

## Architecture

The backend server aggregates data from multiple sports APIs, normalizes it, deduplicates events, maps broadcast channels to streaming services, auto-enriches with league-specific services, and serves it as a single endpoint. All client apps consume the same API.

```
[ESPN API] ──┐                                              ┌── [Apple TV]
             ├──→ [Backend Server] ──→ /api/events ──→──────┼── [Android TV]
[SportsDB] ──┘        ↑                                    ├── [Roku]
              [Channel Mapping]                             └── [Web]
              [League Enrichment]
              [Sport Enrichment]
```

## Privacy

Lineup collects no personal data. Preferences are stored locally on the device. See the full [privacy policy](https://sandyberg.github.io/lineup/).

## License

MIT
