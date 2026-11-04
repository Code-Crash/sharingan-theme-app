# Development and customization

[← README](../README.md) · [LG setup](LG_WEBOS.md) · [Google TV port](GOOGLE_TV.md)

## Repository map

| Path | Purpose |
| --- | --- |
| `app/index.html`, `app/style.css` | Dashboard layout and effects |
| `app/app.js` | Themes, focus/navigation, preferences, app launch integration and measured eye apertures |
| `app/kurama-scenes.js` | Indexed WebGL tail mesh and fallback rendering |
| `app/backgrounds.js` | Clouds and cropped Hinata scenery layers |
| `app/catalog.js` | App inventory snapshot from the tested LG TV |
| `app/ambient.js`, `app/music-track.js` | Local soundtrack lifecycle and track configuration |
| `app/screensaver.js` | LG app-scoped screensaver negotiation |
| `app/appinfo.json` | webOS application metadata; current ID `com.dextor.sharingan` |
| `preview.html` | Local preview with Kurama and Chakra switch buttons |
| `home-helper/` | Experimental device-specific LG Home observer and service |
| `verification/` | Historical checks; current LG results are in `v0.9.3/`; performance comparisons are in `v0.9.2/` |

## Local workflow

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/preview.html`. Direct theme links include `preview.html?theme=kurama` and `preview.html?theme=chakra`. Click inside the dashboard; Left/Right selects, Enter previews a power. A real TV connection is needed to verify app launching, firmware permissions and physical remote behavior.

No frontend package installation or bundler is needed. Optional inventory tooling uses `npm ci --prefix tooling`; the main dashboard is a static web app. Node.js is needed for the webOS CLI and checks; the inspector scripts use built-in WebSocket support and were run with Node.js 24.

## Themes, eyes and animation

Register a theme in `THEMES` in `app/app.js`, add its artwork/stage in `app/index.html`, and style it in `app/style.css`. Reuse the visibility and Animations Off lifecycle. The eight current themes are Itachi Rain, Itachi Crimson Moon, Naruto Golden Hour, Hinata, Sasuke, Sakura, Kurama and Naruto Chakra Sync.

`mountEyes` uses measured eye outlines, iris centers and motion ranges. When changing artwork, remeasure those coordinates rather than reusing another portrait’s measurements. Tracking maps the selected icon into the visible eye SVG’s coordinates. Keep faces and hands stable; use a character’s power for selection feedback. Itachi’s two-handed jutsu pose stays static and sends seven crows.

The mesh renderer caps background updates at 15 fps and 1280×720 on the tested TV. It uses 1,372 unique vertices, precomputed weights and one texture lookup per pixel; UI animation has its own timing. Hinata uses cached scenery movement instead of live turbulence. Seven flame wisps and reduced particle counts limit composition cost. Hidden/inactive scenes and Animations Off pause rendering. Recheck performance on other GPUs; fallback behavior can differ.

Artwork-generation prompts are in the root `artwork-*.txt`, `themes-artwork-prompts.txt` and `artwork-prompt.txt` files; older references are in `references/`. Rights to distribute generated character art still need consideration; see [publication notes](PUBLIC_RELEASE.md).

## Apps and platform integration

The default row is YouTube, Netflix, Prime Video, JioHotstar and Crunchyroll. Other catalog entries begin unchecked. App checkboxes preserve at least one enabled app and scroll when the row grows. Preferences use local storage; one-time migration markers preserve later user choices.

For another LG model, check app IDs and regional availability before editing `app/catalog.js`, `BASE_APPS` or `DEFAULT_APP_IDS`. `read-tv-apps.mjs` is an optional read-only inventory utility using LG’s local remote interface. It currently contains the original TV’s IP: adapt it locally first, install `tooling` dependencies, and accept its pairing request on your TV. Its inventory output stays in ignored `verification/installed-apps.json`; it does not persist the remote client key. Do not run it against an assumed address.

A Google TV port needs its own app discovery, native bridge, audio focus and lifecycle; do not reuse LG app IDs or ship LG service calls in the Android runtime. Follow [the Android porting guide](GOOGLE_TV.md).

## Music and media

The current private-development tree includes `app/assets/naruto-ambient.mp3`, a user-supplied 54-minute mix. Redistribution rights have not been established. Replace it with audio you can distribute, or remove it from your publication copy and configure no track in `app/music-track.js`:

```js
window.DASHBOARD_MUSIC = { src: '', title: '' };
```

For your own licensed file, set `src` to its relative bundled asset path. Playback loops, pauses while hidden/before app handover, and resumes on return. A remote interaction may be needed to unlock playback. Volume uses the remote with a quiet fixed app gain; there is no separate volume control. Review history as well as the current tree before public distribution.

## LG platform limits and the optional helper

The dashboard subscribes to `com.webos.service.tvpower/power/registerScreenSaverRequest` and declines Active requests using their timestamp, releasing the subscription on hide/handover. This is firmware-dependent, not a supported cross-platform wake-lock contract. See the [Kodi implementation](https://github.com/xbmc/xbmc/blob/master/xbmc/windowing/wayland/OSScreenSaverWebOS.cpp) and this repository’s idle-test reports. It does not change the global screensaver timer.

The native Home observer is not required for theme rendering, audio or ordinary dashboard installation. Its separate build needs Zig 0.14.1, Node.js, Python 3 and the webOS CLI. Read [its documentation](../home-helper/README.md) before using the personal-device build or package patcher. Numeric identities, architecture, remote-device names and Home codes in `home-helper/options.json` are not portable defaults.

LG Home can flash before a helper return; Netflix return has been unreliable. Cold-boot launch, default-app replacement and global zoom control were not established on the tested firmware. Renew Developer Mode before its timer expires.

## Verification

Run the local lifecycle checks when changing rendering, audio or visibility:

```sh
node --check app/app.js
node --check app/kurama-scenes.js
node home-helper/test-kurama-scenes.cjs
node home-helper/test-ambient.cjs
node home-helper/test-screensaver.cjs
```

For a paired LG TV, launch the dashboard and start `ares-inspect --device my-tv com.dextor.sharingan`. Use the inspector’s printed base URL in place of `http://127.0.0.1:PORT` below:

```sh
REVIEW_SCREENSHOTS=0 node review-tv.mjs http://127.0.0.1:PORT verification/my-model
node review-brightness.mjs http://127.0.0.1:PORT verification/my-model
node profile-tv.mjs http://127.0.0.1:PORT verification/my-model/timing.json
```

The first command’s environment-variable syntax is for POSIX shells; on Windows PowerShell, set `$env:REVIEW_SCREENSHOTS='0'` before running `node review-tv.mjs ...`. The brightness check reloads the app to verify saved settings. The reviews and profiler temporarily modify dashboard preferences and restore saved options afterward. The review dispatches key events; separately confirm real remote and streaming-app behavior. Timing samples measure animation callbacks, not displayed-frame FPS.

Record exact model/firmware, changed settings, passing checks and remaining limitations. Keep screenshots, device inventories, credentials and runtime helper state out of commits. See [the current LG review](../verification/v0.9.3/REVIEW.md) for evidence and [the performance review](../verification/v0.9.2/REVIEW.md) for timing comparisons.
