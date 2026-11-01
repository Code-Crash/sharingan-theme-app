# Sharingan Theme App

Private source repository: `code-crash/sharingan-theme-app`. An animated Naruto-themed app dashboard for LG webOS TVs.

Personal dashboard for LG 55NU870BPLA, app ID `com.dextor.sharingan`, version 0.8.1. Runs locally on the TV without root, a background computer, or remote artwork downloads. An optional Home-button helper is installed for device testing; see [Home helper](home-helper/README.md).

## Use

- Left/right selects apps; OK opens the selected app with its theme’s power.
- Down focuses Themes in the bottom right. Left/right switches to the gear.
- Yellow opens Themes; Blue opens Settings where the remote has those keys.
- Arrows navigate panels; OK applies or toggles; Back closes a panel.
- Settings → Apps on home screen has a checkbox list of 17 user-facing apps. At least one remains enabled. More than six use a scrolling app row.

The default row is YouTube, Netflix, Prime Video, JioHotstar, and Crunchyroll, in that order. Other apps start unchecked. Changes save across reopening and theme changes. This five-app default migrates once; subsequent checkbox edits are retained.

## Six themes

| Theme | Animation and power |
| --- | --- |
| Itachi — Midnight Rain | Tracking Sharingan eyes, blinking, rain, occasional soft lightning, crows flying to the selected app |
| Itachi — Crimson Moon | Static two-handed jutsu pose, tracking eyes, rotating background Sharingan, seven larger crows on selection and opening |
| Naruto — Golden Hour | Closer portrait, tracking blue eyes, drifting sky and chakra sparks, Rasengan flying from his hand to the selected app on opening |
| Hinata — Moonlit Byakugan | Tracking lavender eyes, water-texture displacement limited to the lake, mist and fireflies, Twin Lion chakra pulse |
| Sasuke — Violet Storm | Tracking Sharingan and Rinnegan eyes, storm glow, Chidori lightning toward the selected app |
| Sakura — Blossom Sanctuary | Tracking green eyes, falling petals, healing chakra pulse toward the selected app |

Crimson Moon’s hands never rotate, scale, or change pose with selection. The complete jutsu artwork is one static image; crows supply the interaction. Original Artwork was removed from the picker; legacy selections migrate to Hinata.

Settings includes animation, eye blinking, 12-hour time, and background rotation every 1 minute or 30 seconds while the dashboard is visible. This update enables 1-minute rotation once; later choices are retained. Rotation waits while a panel is open. Disabling animations also pauses Hinata’s SVG water animation and clears flying effects.

## Soundtrack

The user-provided **Naruto Beautiful Music Mix** is bundled as `app/assets/naruto-ambient.mp3` for offline playback. The complete 54:16 track repeats indefinitely. The original Downloads file remains unchanged; the bundled copy is stereo MP3 at 128 kbps with cover artwork removed. Playback pauses before app handover, while hidden, or when disabled, and resumes on return. Low/Medium/High use app-local gain without changing the TV system volume.

Settings contains eight everyday controls. Background rotation combines Off / 30 seconds / 1 minute into one row. Home is enabled automatically, with a note at the bottom left and a separate LG Home button beside Settings. No helper/test rows appear in Settings.

## Keep dashboard visible

Automatically enabled while the dashboard is visible. The app subscribes to `com.webos.service.tvpower/power/registerScreenSaverRequest` and declines Active requests using the TV's exact timestamp. It cancels that subscription before launching another app or LG Home, when hidden, on page exit, or when the setting is switched off. It reacquires on foreground return. No global screensaver timer, fake video, or remote input is used.

This is an undocumented webOS mechanism also used by [Kodi](https://github.com/xbmc/xbmc/blob/master/xbmc/windowing/wayland/OSScreenSaverWebOS.cpp), so compatibility must be checked on other firmware. The standard browser Screen Wake Lock API was denied on this TV. On this TV, a real Active screensaver request was declined and webOS returned success after about 3 minutes idle. Actual idle-test results are in `verification/v0.6.3/`.

## Limits

- Developer Mode must remain enabled and its timer renewed before expiry.
- A read-only Home-button observer attempts to return to the dashboard after briefly showing LG Home. Return from Netflix is currently unreliable: the user observed the dashboard appearing and then disappearing; this remains under investigation. It never grabs or forwards ordinary remote keys. Automatic startup after cold boot is not established. See [Home helper](home-helper/README.md).
- `app/catalog.js` is an installed-app inventory snapshot. Availability of known entries is checked on launch. Newly installed apps need a refreshed catalog from this computer. System shortcuts can be restricted by firmware.
- The one-time local inventory helper requested READ_INSTALLED_APPS and did not retain its remote client key. No credentials belong in this project.

## Develop and install

Requires Node.js and the official `@webos-tools/cli` npm package. Device pairing is stored outside the repository by the CLI.

```sh
node --check app/app.js
node home-helper/test-screensaver.cjs
ZIG=/path/to/zig-0.14.1/zig node home-helper/build.mjs
npm exec --yes --package=@webos-tools/cli -- ares-install -d lg-tv dist/home-helper/com.dextor.sharingan_0.8.1_all.ipk
npm exec --yes --package=@webos-tools/cli -- ares-install -d lg-tv dist/home-helper/com.mbs.communityhomehelper_0.4.0_arm.ipk
npm exec --yes --package=@webos-tools/cli -- ares-launch -d lg-tv com.dextor.sharingan
```

Preview with `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765/app/`. App launching works on the installed TV app.

## Artwork and implementation

Final bitmap assets in `app/assets/`: `itachi-rain.png`, `itachi-jutsu.png`, `red-background.png`, `naruto-eyes-base.png`, `hinata-moon.png`, `sasuke-storm.png`, and `sakura-blossom.png`.

These are built-in imagegen outputs. Prompts are in `artwork-prompt.txt`, `themes-artwork-prompts.txt`, and `artwork-v0.5-prompts.txt`. Superseded cutouts are retained in `references/`. SVG eyes and effects are code assets. Apple TV, Crunchyroll, Jellyfin, and AirPlay icons use Simple Icons (CC0); the license is in `app/assets/simple-icons-LICENSE.md`.

`mountEyes` contains measured eye apertures and iris positions. Tracking maps icon coordinates into each eye SVG’s actual transformed bounds, including Naruto’s closer framing. Hands are never articulated in the final version. Hinata’s water effect is clipped to the lake; the face and landscape remain undistorted.

## Verification

`review-tv.mjs` runs the current deep TV review, restoring saved preferences afterward. It checks navigation, nested panels, app toggles, the expanded app row, six themes, eyes, static Itachi artwork, crows, water, powers, compact Settings, offline looping music, and screensaver registration. Current results are in `verification/v0.8.1/`; older folders document historical builds. Physical remote behavior is validated separately.

The historical `review-v0.5.mjs` connects to the app inspector URL printed by `ares-inspect` and checks six themes, eye tracking, five-app defaults, static hands, crow count and size, water timing, reduced motion, power animations, Rasengan sequencing, and gallery layout. Actual-TV screenshots and machine-readable results are in `verification/v0.5/`. Older artifacts document previous versions.
