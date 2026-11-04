# Sharingan 0.9.3 — dashboard brightness

Installed and launched on LG 55NU870BPLA, firmware 43.21.87 / SDK 11.2.0.

Settings now includes Dashboard brightness from 20–100% in 10% steps. Left/Right decreases/increases within those bounds, OK cycles down and wraps from 20% to 100%, and Back closes Settings. The saved value survives theme changes, closing/reopening Settings, and a real page reload. The default is 100% for existing installations.

A black opacity layer dims Sharingan content without filtering the animated scene or changing the TV's hardware picture settings. Settings remains above the dimmer and pointer input passes through it. Brightness changes save directly without restarting the scene renderer/audio lifecycle. Settings spacing accommodates eight rows.

Focused TV verification passed (brightness.json): Left reached 90% with measured opacity 0.1, the minimum reached 20% with opacity 0.8, Right and OK behaved correctly, both limits held, all eight settings fit, Settings remained accessible, and 60% was restored after a real reload with opacity 0.4 and the matching label. Preferences were restored afterward. The reload test waits for the document and app globals to be ready instead of assuming a fixed boot delay.

The complete TV review passed on retry (review.json): navigation, nested panels, app checkboxes/carousel, all eight themes and tracking eyes, background motion, static Itachi/crows, Hinata motion lifecycle, all six character powers and Rasengan cleanup, brightness/persistence, eight Settings controls, looping local music, screensaver registration and no loader replay. No runtime exceptions were reported. The initial general review timed out waiting for Naruto's existing power animation; the subsequent complete review passed. Checks use dispatched key events rather than a separate physical-remote session.

Local checks passed: JavaScript syntax, renderer/audio/screensaver lifecycle checks, documentation links, and whitespace. No TV-wide brightness settings, native Home-helper code or permissions changed.
