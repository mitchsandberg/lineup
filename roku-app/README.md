# Lineup -- Roku Channel

Roku channel (BrightScript/SceneGraph) for **Lineup**, the live sports TV guide. Shows live and upcoming sports events across your streaming services. Companion to the React Native TV app targeting Apple TV and Android TV.

## Prerequisites

- A Roku device with Developer Mode enabled
- The backend API server running (from `../tv-guide-app/server/`)

## Setup

1. **Enable Developer Mode on your Roku:**
   - On the Roku remote, press: Home 3x, Up 2x, Right, Left, Right, Left, Right
   - Note the IP address shown and set a password

2. **Configure the API server URL:**
   - Edit `source/utils.brs` and replace `YOUR_SERVER_IP` in `GetApiBaseUrl()` with your computer's local IP address (e.g., `192.168.1.100`)

3. **Start the backend server:**
   ```bash
   cd ../tv-guide-app/server && npm run dev
   ```

## Build & Deploy

```bash
# Build the .zip package
make build

# Deploy to your Roku (set your device IP and password)
ROKU_IP=192.168.1.X ROKU_PASS=yourpassword make deploy
```

## Project Structure

```
roku-app/
  manifest                     -- App metadata, icons, splash screen
  source/
    main.brs                   -- Entry point, screen setup
    utils.brs                  -- Utility functions (time formatting, ECP, registry)
    config.brs                 -- Streaming service definitions, sport filters, prefs
  components/
    screens/
      MainScene.xml            -- Root scene layout
      MainScene.brs            -- Main scene logic (filtering, display, navigation)
    tasks/
      EventFetchTask.xml       -- Background task definition
      EventFetchTask.brs       -- API fetch + JSON parsing (runs off main thread)
    ui/
      EventCard.xml            -- Event card component layout
      EventCard.brs            -- Event card rendering logic
      EventCardNode.xml        -- Content node schema for event data
      ServiceBadge.xml         -- Streaming service badge component
      ServiceBadge.brs         -- Badge rendering
  images/                      -- Icons, splash screens, spinner
  Makefile                     -- Build and deploy commands
```

## Features

- Fetches live sports data from the shared backend API
- Groups events by sport (All Sports view) or by time (single sport view)
- Shows live scores, game times, broadcast channels
- Displays which streaming services carry each game
- Press OK on any event to launch the streaming app directly on Roku
- Settings screen to select which services you subscribe to
- Preferences saved to device registry
- D-pad remote navigation with visible focus states
- Dark theme optimized for TV viewing

## Streaming Service Channel IDs

| Service       | Roku Channel ID |
|--------------|----------------|
| YouTube TV   | 195316         |
| Hulu         | 46041          |
| ESPN+        | 34376          |
| Peacock      | 593099         |
| Prime Video  | 13             |
| Paramount+   | 31440          |
| Apple TV+    | 551012         |
| MLB.TV       | 46246          |
| NBA League Pass | 86065       |
| NFL+         | 241116         |
| Sunday Ticket | 195316        |

## Roku Store Submission Requirements

The channel works for sideloading and development. To publish to the Roku Channel Store, the following items are required:

### Required Before Submission

1. **App Icons and Splash Screens**
   - Channel poster art: 540x405 HD (required for store listing)
   - Channel icon: 336x210 FHD
   - Splash screen: 1920x1080 FHD
   - Place all images in the `images/` directory and reference in `manifest`

2. **Manifest Changes**
   - Set `bs_const=debug=false` (currently `true`)
   - Add a real `mm_icon_focus_hd` and `mm_icon_focus_fhd` pointing to actual image files
   - Add `splash_screen_hd` and `splash_screen_fhd`

3. **Hosted Backend API**
   - Deploy the backend server to a public host (e.g., Railway, Render, Fly.io, AWS)
   - Update `GetApiBaseUrl()` in `source/utils.brs` with the production URL
   - Ensure HTTPS and reasonable uptime

4. **Privacy Policy**
   - Create a hosted privacy policy page (required by Roku)
   - Must describe data collection practices (the app collects no user data beyond local prefs)

5. **Roku Developer Account**
   - Sign up at https://developer.roku.com
   - Enroll in the Roku Developer Program
   - Pay the one-time developer fee (if applicable)

6. **Static Channel Certification**
   - Roku reviews all channels before publishing
   - Must pass automated and manual testing
   - Common failure reasons: crashes, missing error handling, slow load times
   - Run the Roku Static Analysis tool locally before submitting

### Nice to Have

- **Store Description & Screenshots** -- Write compelling copy and capture screenshots for the store listing
- **Category Selection** -- "Sports" category on the Roku Channel Store
- **Customer Support Email** -- Required for published channels

### Submission Process

1. Build a release package: `make build` (with `debug=false`)
2. Log in to https://developer.roku.com/developer-channels
3. Create a new Public Channel
4. Upload the `.zip` package, icons, screenshots, and fill in metadata
5. Submit for certification review (typically 1-2 weeks)
