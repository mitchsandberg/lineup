# Lineup — Apple TV App Store Listing Copy

All fields with character limits. Copy/paste directly into App Store Connect.

---

## App Name (30 char max)

```
Lineup
```

**6 / 30**

Backup options if taken:
- `Lineup TV` (9)
- `Lineup Sports` (13)
- `Lineup: Sports Guide` (20)

---

## Subtitle (30 char max)

```
Live Sports TV Guide
```

**20 / 30**

Alternatives:
- `What sports are on?` (20)
- `Find live games fast` (20)
- `Your live sports guide` (22)

---

## Promotional Text (170 char max, updatable anytime)

```
Find every live game across your streaming services. One screen, no more flipping between apps. Updated daily with MLB, NBA, NFL, NHL, soccer, UFC, and more.
```

**162 / 170**

---

## Description (4000 char max)

```
Lineup shows you every live sports game happening right now — across every streaming service you subscribe to.

No more flipping through ESPN, YouTube TV, Prime Video, and Peacock trying to figure out what's on. Pick your services and favorite teams, and Lineup tells you exactly where the game is and how to watch it.

FEATURES

• Live sports guide — MLB, NBA, NFL, NHL, soccer, UFC, college football, college basketball, tennis, golf, and more
• Smart service filtering — only see games you can actually watch
• Deep links — launch directly into the right streaming app with one click
• Favorite teams — pin your teams to the top of the list
• Regional sports networks — automatic detection of your local RSN (MASN, YES, NBC Sports Bay Area, etc.)
• Built for the big screen — focus-driven navigation, remote friendly
• Dark mode — designed for your living room

SUPPORTED SERVICES

YouTube TV, Hulu + Live TV, ESPN+, Peacock, Paramount+, Prime Video, Apple TV+, MLB.TV, NBA League Pass, NFL+, NFL Sunday Ticket, and more.

PRIVACY

Lineup doesn't require an account. Your preferences stay on your device. We don't track you, and we don't sell your data.

SUPPORT

Questions or feedback? Visit {support URL} or email {support email}.
```

**~1400 / 4000** — leaves room to grow

---

## Keywords (100 char max total, comma-separated, no spaces)

```
sports,live,tv,guide,mlb,nba,nfl,nhl,streaming,schedule,espn,hulu,ufc,soccer,games
```

**89 / 100**

Notes:
- No spaces between commas (Apple quirk)
- Don't repeat words from app name/subtitle (Apple auto-indexes those)
- Avoid trademarked service names where possible (YouTube, Peacock) — they can be rejected

---

## What's New (for each update — 4000 char max)

```
Version 1.1.0

• Improved streaming service detection for regional sports networks
• Fixed Prime Video deep linking
• Added date context ("Tomorrow", weekday) to upcoming games
• Performance and stability improvements
```

---

## URLs Required

- **Support URL**: _(need to create)_ — can be a simple page or GitHub README
  - Suggestion: `https://github.com/sandyberg/lineup/blob/main/README.md` or a landing page
- **Marketing URL** (optional): same as support for now
- **Privacy Policy URL**: _**REQUIRED**_ — must exist before submission
  - Can draft a minimal one; needs to state "we don't collect PII" clearly

---

## Category

- **Primary**: Sports
- **Secondary**: Entertainment

---

## Age Rating

Expect **4+** (no objectionable content). During the questionnaire in App Store Connect:
- Cartoon or fantasy violence: None
- Realistic violence: None
- Sexual content/nudity: None
- Profanity/crude humor: None
- Alcohol/tobacco/drugs: None
- Simulated gambling: None
- Horror/fear themes: None
- Mature/suggestive themes: None
- Medical/treatment info: None
- Frequent/intense mature themes: None
- Unrestricted web access: No
- User-generated content: No

Result: **4+**

---

## Pricing & Availability

- **Price**: Free
- **Availability**: All countries/regions (Apple default)

---

## App Privacy (App Store Connect "Privacy" tab)

Data collected:
- **None** — Lineup doesn't collect user data

If the server fetch counts as data collection (Apple is strict):
- **Diagnostics** (optional) — app crashes/errors, not linked to identity
- **Identifiers** — None
- **Usage data** — None

---

## App Review Information (shown only to Apple reviewer)

**Contact info**: your email + phone
**Demo account**: Not required (app doesn't use login)
**Notes for reviewer**:
```
Lineup does not require a login.

Onboarding:
1. Select preferred streaming services (YouTube TV, ESPN+, etc.)
2. Optionally select favorite teams
3. Select region for local sports networks
4. Browse live sports and deep-link into the right service

The deep link buttons attempt to launch third-party streaming apps. On Apple TV, if the app is installed, it opens directly. If not, nothing happens (tvOS doesn't redirect to App Store from universal links on TV).
```
