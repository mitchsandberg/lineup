# Lineup -- React Native App

Cross-platform React Native app (Expo) for **Lineup**, the live sports TV guide. Targets Apple TV, Android TV, Fire TV, web, and mobile from a single codebase.

## Setup

```bash
npm install --legacy-peer-deps
```

## Development

```bash
# Web
npx expo start --web

# Android TV (requires emulator or device)
npx expo run:android

# Apple TV (requires Xcode + simulator)
npx expo run:ios
```

The app connects to `localhost:3001` in dev mode. Start the backend server first:

```bash
cd server && npm install && npm run dev
```

## Testing

```bash
# Unit tests (204 tests)
npx jest --no-coverage

# With coverage (enforces 99%+ lines, 94%+ branches)
npx jest --coverage

# E2E tests (requires web server running on :8081)
npx playwright test

# E2E with UI
npx playwright test --ui
```

## Project Structure

```
src/
├── app/              Expo Router screens (index, settings)
├── components/       UI components (event cards, onboarding, filters)
├── data/             Channel + service definitions
├── hooks/            Custom hooks (preferences, responsive, theme)
├── lib/              API client, deep links, types, utilities
└── constants/        Theme, colors, layout values
e2e/                  Playwright E2E specs
server/               Backend API (see server/ for its own README)
```
