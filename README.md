# Sharingan Theme App

An animated, remote-controlled TV dashboard with Naruto-inspired themes, tracking eyes, character powers, selectable apps, and optional offline music. Built with HTML, CSS, JavaScript, and WebGL.

## Choose your TV

| Platform | Status | Setup and AI prompt |
| --- | --- | --- |
| **LG webOS** | Working implementation; tested on **LG 55NU870BPLA**, firmware 43.21.87, webOS SDK 11.2.0 | [LG setup guide](docs/LG_WEBOS.md) |
| **Google TV / Android TV** — Sony BRAVIA and other brands | **Port required.** No Android project or APK is included yet. | [Google TV setup and porting guide](docs/GOOGLE_TV.md) |

Both guides include a prompt you can paste into **Codex or Claude Code** after opening this repository. Other TV models need their own compatibility checks.

## LG webOS: what you need to do

1. Install LG’s Developer Mode app, sign in, and enable Developer Mode.
2. Install the webOS CLI on your computer, pair your TV, and verify the connection.
3. Preview, package, install, and launch the dashboard.
4. Choose your themes and enable the apps you want to see.

Follow the [LG guide](docs/LG_WEBOS.md) for exact commands, troubleshooting, and the model-specific prompt. The experimental Home-button helper is a separate, optional step; replacing LG Home and starting after a cold boot are not guaranteed.

## Google TV: what you need to do

1. Confirm your TV runs Google TV or Android TV and enable its developer/debugging options.
2. Install Android Studio and SDK Platform Tools; pair the TV with ADB.
3. Use the [Google TV prompt](docs/GOOGLE_TV.md#prompt-for-codex-or-claude-code) to build an Android port with native app launching and remote navigation.
4. Build and sideload that APK, then test it on your exact model.

The webOS `.ipk` cannot be installed on Android. Default-Home support must be checked separately on each model.

## Preview on your computer

```sh
git clone https://github.com/Code-Crash/sharingan-theme-app.git
cd sharingan-theme-app
python3 -m http.server 8765 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:8765/preview.html). Click inside the dashboard, then use **Left/Right** and **Enter**. App launches are simulated in the browser.

## Features

- Eight themes: Itachi Rain, Itachi Crimson Moon, Naruto Golden Hour, Hinata, Sasuke, Sakura, Kurama, and Naruto Chakra Sync.
- Eye tracking, blinking, animated backgrounds, and character effects toward the selected app.
- App checkboxes, saved preferences, and background rotation every 30 or 60 seconds.
- Saved dashboard brightness (20–100%); Left/Right adjusts it in Settings.
- Optional looping local music; volume follows the TV remote.

On LG: **Left/Right** selects an app, **OK** opens it, **Down** reaches Themes/Settings, and **Back** closes panels. Default apps are YouTube, Netflix, Prime Video, JioHotstar, and Crunchyroll; availability depends on your TV and region.

## Develop and share

- [Development, customization, and verification](docs/DEVELOPMENT.md)
- [Experimental LG Home helper](home-helper/README.md)
- [Before publishing a public fork or release](docs/PUBLIC_RELEASE.md)

Current dashboard version: **0.9.3**. [Current on-TV verification](verification/v0.9.3/REVIEW.md) · [Performance results](verification/v0.9.2/REVIEW.md).

Source licensing and bundled-media redistribution rights still need to be resolved before a public release; see the publication notes above. This project is not affiliated with LG, Google, Sony, or the Naruto rights holders.
