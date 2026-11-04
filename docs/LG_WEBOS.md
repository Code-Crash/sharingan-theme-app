# LG webOS setup

[← README](../README.md) · [Development](DEVELOPMENT.md)

**Status:** dashboard 0.9.2 tested on LG **55NU870BPLA**, firmware **43.21.87**, SDK **11.2.0**. Other LG webOS models need individual testing. This guide installs a normal dashboard app first.

## 1. Prepare your TV and computer

You need an LG webOS TV, an LG developer account, a computer with Git, Node.js/npm and Python 3, and both devices on the same local network.

On the TV, install **Developer Mode** from LG Apps, sign in, switch **Dev Mode Status** on, and complete any requested restart. Reopen Developer Mode and note the TV’s IP address. Enable **Key Server** when retrieving the pairing key. LG’s [Developer Mode guide](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) explains these steps and session renewal.

On your computer:

```sh
git clone https://github.com/Code-Crash/sharingan-theme-app.git
cd sharingan-theme-app
npm install -g @webos-tools/cli
ares -V
```

Use a Node.js version supported by the installed CLI; see [LG’s CLI installation guide](https://webostv.developer.lge.com/develop/tools/cli-installation). Developer Mode has an expiry timer: extend its session before it expires. Expiry can remove development apps.

## 2. Pair the TV

```sh
ares-setup-device
```

Choose **add**, name the device `my-tv`, enter **your TV’s IP**, port **9922**, and SSH user **prisoner**. Use the Developer Mode connection rather than an LG account password.

```sh
ares-setup-device --list
ares-novacom --device my-tv --getkey
ares-device --system-info --device my-tv
```

Enter the current passphrase shown by the TV when prompted for the key. Pairing keys stay in the CLI’s local configuration, outside the repository. Keep account passwords, pairing codes, and keys out of commits. Connection steps are documented in [LG’s pairing guide](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app).

## 3. Preview, package, and install the dashboard

From the repository root, preview first:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open [the preview](http://127.0.0.1:8765/preview.html), then stop the server with Ctrl+C when finished. Browser preview does not test TV app launching or firmware permissions.

Build the **dashboard only**; this path does not require Zig or the native Home helper:

```sh
node --check app/app.js
node home-helper/test-kurama-scenes.cjs
node home-helper/test-ambient.cjs
node home-helper/test-screensaver.cjs
mkdir -p dist
ares-package --no-minify app --outdir dist
ares-install --device my-tv dist/com.dextor.sharingan_0.9.2_all.ipk
ares-launch --device my-tv com.dextor.sharingan
```

The filename above matches the current `app/appinfo.json`; use the generated filename if you change its ID/version. Packaging and deployment commands follow [LG’s CLI guide](https://webostv.developer.lge.com/develop/tools/cli-dev-guide).

The stock Home button continues to belong to LG. Without the optional helper/service, the dashboard’s Home-shortcut status may say **unavailable**; that is expected. App launching and keeping the dashboard visible must be tested on your firmware because permissions can differ from the tested TV.

## 4. Configure and check your TV

- In **Settings → Apps on home screen**, tick the apps you want. The catalog is a snapshot from the tested TV, not universal app discovery. Update `app/catalog.js` and the defaults in `app/app.js` for your region/model.
- Test arrows, OK, Back, theme changes, and opening each enabled streaming app. Return using LG Home and reopen Sharingan.
- Leave it idle longer than the TV’s screensaver interval. The app-scoped screensaver negotiation is firmware-dependent.
- Test music pausing when another app opens, and resuming on return. For a fork, use audio you can distribute; see [media configuration](DEVELOPMENT.md#music-and-media).
- If animation is slow, use Animations Off while profiling. Start new effects with the existing modest rendering budget.

To inspect the app:

```sh
ares-inspect --device my-tv com.dextor.sharingan
```

## Optional: experimental Home-button behavior

Read [the helper documentation](../home-helper/README.md) before building it. `home-helper/options.json` contains UID/GID, architecture, remote-device and key-code values verified only on the original TV. Do not reuse them as universal LG settings. The personal-device build uses Zig 0.14.1 and patches package metadata; it is not the general installation path above.

On the tested firmware, the observer can briefly show LG Home before returning to Sharingan; Netflix return has been unreliable. Cold-boot auto-launch, direct replacement of LG Home, and disabling LG’s long-press zoom behavior are not established. Developer Mode does not grant those system permissions automatically.

## Troubleshooting and removal

| Problem | Check |
| --- | --- |
| Pairing or SSH times out | Confirm the current IP, TV power, Developer Mode session and local network. Enable Key Server again when retrieving a key; reopen Developer Mode and retry. |
| App entry is dim or fails to open | Check installation, regional availability, app ID and launch permissions. |
| Home shortcut unavailable | Expected for the dashboard-only install; helper setup is separate. |
| Clock screensaver appears | Check firmware behavior with the app visible. Do not assume the tested TV’s negotiation works on every model. |

Remove the dashboard with `ares-install --device my-tv --remove com.dextor.sharingan`. If installed separately, remove the native observer with `ares-install --device my-tv --remove com.mbs.communityhomehelper`.

## Prompt for Codex or Claude Code

Open this repository in the coding agent, then replace the bracketed details and paste:

```text
Read README.md, docs/LG_WEBOS.md and docs/DEVELOPMENT.md in this repository.
Help me adapt and install Sharingan on my LG webOS TV.
Model: [exact model]. Firmware/webOS version: [version or unknown].
Computer OS: [Windows/macOS/Linux]. TV IP: [local IP].
Developer Mode: [on/off]. Key Server: [on/off].

Inspect the current code and confirm compatibility for this exact TV. Start with
local preview and a dashboard-only IPK, using the official webOS CLI. Pair through
the local CLI prompt; do not store credentials in the repository. Check app IDs
against my installed apps and region instead of assuming the existing catalog.
Build, install, and launch on the paired TV, then verify remote navigation,
all themes, power cleanup, audio lifecycle, app launching and idle behavior.
Keep scenery rendering within the existing TV performance budget and report
what you actually tested versus what still needs physical confirmation.

Treat the native Home observer as a separate experiment. Do not copy numeric
permissions, remote key codes or package patches from the original model without
verifying them. Do not promise default Home or cold-boot startup. Preserve a way
to open LG Home, and keep my unrelated repository changes intact.
```
