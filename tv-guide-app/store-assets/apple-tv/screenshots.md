# Apple TV Screenshot Capture

## Requirements

| Field | Value |
|-------|-------|
| Resolution | **1920×1080** (landscape) |
| Format | PNG or JPG |
| Minimum count | 1 |
| Maximum count | 10 |
| Recommended | 5 |

## Recommended shots (5)

Match what we submitted to Google Play / Fire TV so the story is consistent:

1. **Main guide** — the all-sports view with live games visible
2. **Single-sport filter** — e.g. NBA filter showing filtered games
3. **Service selection** — onboarding step or settings showing service picker
4. **Event detail / service picker modal** — user about to tap a service
5. **Settings / favorites** — favorite teams pinned

## Capture workflow

### 1. Build for tvOS simulator
```bash
cd tv-guide-app
EXPO_TV=1 npx expo run:ios --device "Apple TV 4K (3rd generation)"
```
(First run prompts to install tvOS simulator. ~2 GB download.)

### 2. Take screenshot in simulator
- **Cmd + S** in the Simulator window saves a PNG to the Desktop
- Or: **File → Screenshot** menu
- Default filename: `Simulator Screenshot - Apple TV - <timestamp>.png`

The simulator is natively 1920×1080, so no resizing needed.

### 3. Save in store-assets/apple-tv/screenshots/

Organize as:
- `01-main-guide.png`
- `02-sport-filter.png`
- `03-services.png`
- `04-service-picker.png`
- `05-settings.png`

### 4. Upload in App Store Connect

App Store Connect → Your app → tvOS tab → **Apple TV Screenshots** section → drag and drop.

## Tips

- **Use real-looking data**: make sure live/upcoming games are showing (not just empty states)
- **Avoid status bar artifacts**: tvOS doesn't have one anyway, but make sure no simulator debug overlays are visible
- **Show focus state**: at least one screenshot should show a focused tile (the "raised" look) so reviewers know the app uses proper tvOS focus
- **No device frames**: Apple will auto-add the Apple TV device frame on the product page, don't pre-add one
