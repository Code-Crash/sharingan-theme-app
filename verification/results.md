# Prototype verification — 1 November 2026

- JavaScript syntax check passed.
- Packaged and installed successfully with official webOS CLI.
- Confirmed actual TV rendering at 1920 × 1080, wallpaper loaded, PalmServiceBridge available.
- TV reports YouTube, Netflix, Prime Video, and Web Browser installed.
- Dispatched left/right keys on the actual TV app: selection moved 0 → 1 → 0,
  with corresponding gaze CSS updates.
- Browser preview: arrow navigation, settings panel, 12-hour clock toggle, and
  preference persistence across reload passed.
- Saved actual app rendering from the TV's debug target as `tv-dashboard.png`.
- Triggered YouTube via the dashboard's own launch function. The dashboard's
  execution context was destroyed during the app switch. User explicitly
  confirmed **“Yes, YouTube opened”** on the physical TV.

Netflix, Prime Video, and Browser launches have not been exercised individually.
Automatic startup and Home replacement are outside this prototype.

## Version 0.3.0 — themes, powers, and app selection

- Official CLI packaged, installed, and launched version 0.3.0 successfully.
- Retrieved installed app inventory through LG's local interface after the user
  accepted the TV pairing prompt. Included 17 user-facing apps in the checklist;
  excluded internal overlays, advertisements, factory tools, and boot services.
- Actual TV checks passed for independent left/right eye gaze based on the icon
  center, keyboard navigation into the app checklist, toggling JioHotstar,
  retaining app visibility across a theme switch, saving preferences, and
  scrolling to the last app with all 17 enabled. Restored the original four
  checked apps after verification.
- All theme images loaded on the TV. Captured actual rendered screenshots for
  Midnight Rain, Crimson Moon, Golden Hour, Original Artwork, gallery, and
  app checklist. Evidence: `theme-*.png`, `app-checklist.png`,
  `theme-app-checks.json`.
- Reopened the app's page and verified current theme and app choices restored
  from storage, with all images loaded. Evidence: `reopen-persistence.json`.
- Left the TV running Crimson Moon with its rotating iris and pointing hand.
- Optional theme rotation is configured for five minutes while the dashboard
  is visible and no settings panel is open; the full five-minute interval was
  not waited out during verification.
- Newer installed apps require a refreshed `catalog.js`; known app availability
  is checked on each dashboard launch. Individual system-app launch permissions
  remain firmware-dependent.

## Version 0.3.1 — corrected arm anatomy

- Replaced the upright palm-facing hand with a downward-pointing dorsal-view
  arm with a straight wrist and naturally tucked thumb.
- Moved the pivot from the wrist to the upper sleeve/shoulder and adjusted
  foreshortening based on distance to the selected icon. The arm no longer
  rotates through upside-down poses.
- Browser visual checks covered both ends of a nine-app scrolling row.
- Packaged, installed, and launched 0.3.1 on the TV. Actual-TV screenshots and
  pose geometry are saved as `arm-corrected-*.png` and
  `arm-correction-checks.json`.
- Generated replacement asset: `app/assets/red-arm-natural.png`; full edit
  prompt: `arm-correction-prompt.txt`. The prior asset is retained separately.
