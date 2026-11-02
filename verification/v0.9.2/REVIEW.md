# Sharingan 0.9.2 — TV performance update

Installed and launched the final package on LG 55NU870BPLA. Both Naruto/Kurama scenes compiled and rendered through WebGL. The new renderer uses a 1280×720 target, 1,372 unique indexed vertices, precomputed tail/face/glow weights, one texture read per pixel, and a maximum 15 background mesh updates per second. User interface and CSS animations are independent of that cap.

Hinata's live SVG turbulence/displacement was replaced with cropped, cached scenery layers for wind, lake movement and water glints. The moon is also cropped to a small viewport. Character faces remain static beneath tracking-eye overlays. Cloud/fog blur filters were removed, particles reduced, inactive themes paused, eye geometry read only for the visible theme, duplicate focus selection avoided, and the app spotlight moved through a compositor transform. Seven independent flame wisps replace nineteen flame layers; a targeted on-device isolation test identified those layers as Chakra's main remaining bottleneck.

## On-device timing

Four-second animation callback samples using the same inspector script before and after the final update:

| Theme | Median callback gap, ms (before → after) | 95th percentile gap, ms (before → after) |
| --- | --- | --- |
| rain | 33.3 → 16.7 | 100 → 50 |
| hinata | 50 → 33.3 | 150 → 50 |
| kurama | 16.8 → 16.7 | 33.4 → 33.4 |
| chakra | 16.8 → 16.8 | 66.6 → 50 |

These measure callback pacing, rather than displayed-frame FPS, and include theme-switch initialization. Short samples vary with TV activity. Raw results are in before.json and after.json; reproduce with `node profile-tv.mjs <inspector-base-url> <report.json> [theme,csv]`. The profiler restores the saved dashboard options.

## Verification

The complete on-device review passed (review.json): Left/Right and footer navigation, nested panels, app checkbox/last-app guard, all 17-app carousel access, eight loaded themes and background motion, tracking eyes, static Itachi pose, seven crows and cleanup, Hinata moon/foliage/lake motion plus Off/hidden pause and return, six character powers and cleanup, Rasengan cleanup, theme-gallery fit, seven everyday Settings, bundled looping music, screensaver registration, no loader replay, and the Home note. No runtime exceptions were reported. This tests dispatched key events; it does not claim a separate physical-remote session.

Local checks passed: scene lifecycle/frame-cap/resolution/context-loss/fallback/face-protection tests, ambient audio lifecycle tests, screensaver lifecycle tests, JavaScript syntax and Git whitespace checks. Native Home-helper code and TV permissions were not changed.
