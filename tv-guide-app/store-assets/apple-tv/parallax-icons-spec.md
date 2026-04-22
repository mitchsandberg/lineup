# Parallax Icon Spec for Apple TV

Your existing flat icons in `tv-guide-app/assets/tv_icons/` work as-is. This doc is for when you want to upgrade to layered parallax icons for the focus animation on Apple TV.

## What the current icon looks like

Blue gradient background + faint cross-hatch pattern + white chevron mark.

## 3-layer split (recommended)

| Layer | Content | Transparency |
|-------|---------|--------------|
| **Back** | Blue gradient, no other content | Opaque |
| **Middle** | Cross-hatch pattern (+  + + +) | Transparent outside pattern |
| **Front** | White chevron | Transparent outside chevron |

All layers must be **the exact same dimensions** per asset.

## Required asset sizes

All 5 of these need their own 3-layer set:

| Asset | Dimensions |
|-------|-----------|
| App Store Icon | 1280×768 |
| Home Screen Icon @1x | 400×240 |
| Home Screen Icon @2x | 800×480 |
| Top Shelf @1x | 1920×720 |
| Top Shelf @2x | 3840×1440 |
| Top Shelf Wide @1x | 2320×720 |
| Top Shelf Wide @2x | 4640×1440 |

Note: Top shelf images are **horizontal banner art**, not the icon. Usually the logo + app name laid out wide — different composition from the icon.

## Content safe area

Keep critical content (chevron, text) inset **~10% from edges**. Parallax shift can reveal edges up to ~8%, so content too close to the edge gets cropped out during focus animation.

## How to produce

### Option A: Figma (fastest)
1. Open your existing icon source (or rebuild from the flat PNG)
2. Separate into 3 layers on the Figma canvas
3. Export each layer as a PNG, same frame size, with transparency for layers 2 and 3
4. Save as `layer1.png`, `layer2.png`, `layer3.png` in this folder, per asset size

### Option B: Photoshop/Sketch
Same idea — separate layers, export each as PNG with transparency.

### Option C: AI generation
Can prompt for each layer separately, but requires careful masking and often manual cleanup. Not recommended for final assets.

## Packaging in Parallax Previewer

1. Install **Additional Tools for Xcode** from https://developer.apple.com/download/all/
2. Open **Parallax Previewer.app**
3. File → New → choose size (e.g. App Icon - Extra Large for 1280×768)
4. Drag your 3 layers in (back to front)
5. Adjust Z-depth sliders to taste (usually default is fine)
6. File → Export → save as `.imagestack` bundle
7. Repeat for each of the 7 asset sizes listed above

You end up with 7 `.imagestack` bundles.

## Integrating into Expo build

Since the `@react-native-tvos/config-tv` plugin expects flat PNGs, we need to prebuild and swap in the imagestacks:

```bash
cd tv-guide-app
EXPO_TV=1 npx expo prebuild --platform ios --clean
```

Then in Xcode, open `ios/Lineup.xcodeproj` → `Images.xcassets` and:
1. Delete the flat `App Icon - tvOS` and `Top Shelf Image` entries
2. Drag your `.imagestack` bundles into the asset catalog
3. Commit the `ios/` folder (so EAS uses it instead of re-generating)

After that, `eas build --profile production_tv_ios` will produce a build with parallax icons.

## Quick path if you just want it DONE

Skip all this, ship flat icons, move on. It's not a rejection issue.
