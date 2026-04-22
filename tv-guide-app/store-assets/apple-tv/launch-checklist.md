# Apple TV Launch Checklist

Ordered list of everything to do once Apple approves your Developer Program enrollment.

---

## Phase 1: Apple account setup (5–10 min)

- [ ] **Verify enrollment active** — https://developer.apple.com/account → should show "Apple Developer Program" membership
- [ ] **Register bundle ID**
  - https://developer.apple.com/account/resources/identifiers/list
  - `+` → App IDs → **App** → Continue
  - Description: `Lineup`
  - Bundle ID: **Explicit** → `com.sandyberg.lineup`
  - Capabilities: none needed for v1
  - Register

---

## Phase 2: App Store Connect (10 min)

- [ ] **Create app**
  - https://appstoreconnect.apple.com/apps
  - `+` → New App
  - **Platforms**: tvOS (can add iOS later if you want)
  - Name: `Lineup`
  - Primary language: English (U.S.)
  - Bundle ID: `com.sandyberg.lineup`
  - SKU: `lineup-tvos-001` (internal only, any unique string)
  - User access: Full Access
- [ ] **Fill listing copy** — from `listing-copy.md`
  - App Information
  - Pricing and Availability
  - App Privacy (answer "No" to data collection unless we add analytics)
  - App Review Information (include notes from listing-copy.md)
- [ ] **Age rating questionnaire** — all "None" → should result in 4+

---

## Phase 3: Build and submit (30 min once icons are ready)

- [ ] **Decide on icons**: flat (ship now) or parallax (see `parallax-icons-spec.md`)
- [ ] **Bump versionCode and ios.buildNumber in `app.json`** if this isn't the first build
- [ ] **If parallax**: prebuild, swap in `.imagestack` bundles, commit `ios/` folder
- [ ] **Build**
  ```bash
  cd tv-guide-app
  eas build --profile production_tv_ios --platform ios
  ```
  - First run: EAS will prompt for your Apple ID, generate cert/provisioning profile
  - Takes ~15–25 min on EAS queue
- [ ] **Submit**
  ```bash
  eas submit --profile production --platform ios --latest
  ```
  - This uploads the `.ipa` to App Store Connect
  - Appears in App Store Connect under **TestFlight** first (for your own testing)

---

## Phase 4: Capture screenshots (15 min)

- [ ] Follow `screenshots.md` to launch simulator and capture
- [ ] Save 5 screenshots to `store-assets/apple-tv/screenshots/`
- [ ] Upload in App Store Connect → Apple TV Screenshots section

---

## Phase 5: Final listing assembly (10 min)

- [ ] Attach screenshots to the listing
- [ ] Select the uploaded build (TestFlight) as the production build
- [ ] Verify all required fields have green checks on the left nav
- [ ] **Submit for Review**

---

## Phase 6: TestFlight beta (optional, do while waiting for review)

- [ ] In App Store Connect → TestFlight tab → add internal testers (up to 100, instant)
- [ ] Install TestFlight on your Apple TV and test the real build
- [ ] Recruit external beta testers via public link (goes through brief Apple review)

---

## Phase 7: Review & launch

- **Apple review time**: typically 24–48 hours for tvOS (sometimes same-day)
- **If rejected**: read the rejection notes, fix, resubmit (build number must increment)
- **If approved**: choose **Release Now** or **Scheduled Release**

---

## Common rejection reasons for tvOS

1. **Focus issues** — elements not reachable via D-pad, no visual focus indication
2. **Low-quality screenshots** — debug overlays visible, placeholder data, no live content
3. **Trademarked terms in keywords** — "YouTube" / "Peacock" may trigger rejection
4. **Missing privacy policy URL** — required even if you don't collect data
5. **Crashing on launch** — test on a real Apple TV if possible, not just simulator
6. **External purchase mentions** — don't mention subscribing to streaming services outside the app

---

## Files in this folder

- `listing-copy.md` — all text fields for App Store Connect
- `parallax-icons-spec.md` — how to build layered icons (if you want to)
- `screenshots.md` — how to capture tvOS screenshots
- `launch-checklist.md` — this file
