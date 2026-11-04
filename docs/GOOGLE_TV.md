# Google TV / Android TV: setup and porting

[← README](../README.md) · [Development](DEVELOPMENT.md)

**Status: not implemented or tested on Android yet.** This repository contains a webOS app, not an Android project. There is no APK to install today. This guide is a development path for Sony BRAVIA and other TVs/devices running Google TV or Android TV; brand alone does not establish compatibility.

## 1. Identify and prepare your TV

Record the exact model, Android TV OS version, firmware and computer OS. Check the model’s own support guide for its developer menus.

A common path is **Settings → System / Device Preferences → About → Android TV OS build**. Select the build entry repeatedly until developer options are enabled; the count and menu location vary. Then enable the debugging option offered by your firmware. Android documents [developer options](https://developer.android.com/studio/debug/dev-options); Sony also provides [model-specific developer-option instructions](https://helpguide.sony.net/tv/naep3/v1/en/contents/TP1002274403.html).

Install **Android Studio**, its required SDK/build tools, and **Android SDK Platform Tools** on your computer. Keep the TV and computer on the same local network.

## 2. Connect with ADB

If the TV offers **Wireless debugging → Pair using pairing code**, use the addresses/ports it displays:

```sh
adb pair TV_IP:PAIRING_PORT
adb connect TV_IP:DEBUG_PORT
adb devices
```

Replace the uppercase placeholders. Pairing and debugging ports can differ; enter the pairing code at the prompt. Wireless pairing support varies by Android version and TV firmware. See the official [ADB wireless debugging guide](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi).

On models offering legacy **Network / ADB debugging**, follow the manufacturer’s connection instructions. Use `adb connect TV_IP:5555` only if that model exposes that port; it is not a universal setting. Accept any debugging authorization on the TV. If neither network method is available, use a manufacturer-supported development connection or an Android TV emulator; do not assume a TV’s USB-A ports support ADB.

Keep pairing material and device-specific configuration local.

## 3. Build the Android port

Use the prompt below to create an `android/` project in your fork. A practical starting point is a native Android TV activity hosting the existing interface in a WebView, with a small native platform adapter.

| Existing webOS component | Android work required |
| --- | --- |
| HTML/CSS/WebGL themes | Bundle local assets; load with `WebViewAssetLoader`; enable required JavaScript/DOM storage for trusted content. |
| `PalmServiceBridge` requests in `app/app.js` | Replace with Android app discovery/launching and lifecycle integration. The browser preview fallback alone only simulates launches. |
| webOS catalog and app IDs | Discover TV-launchable activities using `PackageManager`; handle package visibility and store user-selected package IDs. |
| webOS remote keys and Back behavior | Map D-pad/OK/Back events and maintain a visible focus target without swallowing volume/Home. |
| Screensaver service in `app/screensaver.js` | Use Android’s activity-scoped keep-screen-on flag only while the dashboard is visible. |
| Music and Home helper | Respect Android audio focus/lifecycle; replace LG-specific Home behavior rather than packaging its native helper. |

Use `LEANBACK_LAUNCHER` to make the activity appear in the TV app list, a TV banner, and a manifest that does not require a touchscreen. That category does **not** make the app the system Home screen. Official references: [Android TV project setup](https://developer.android.com/training/tv/get-started/create), [local WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [package visibility](https://developer.android.com/training/package-visibility/declaring), [TV launch intents](https://developer.android.com/reference/android/content/pm/PackageManager#getLeanbackLaunchIntentForPackage(java.lang.String)), and [keeping an activity’s screen on](https://developer.android.com/develop/background-work/background-tasks/awake/screen-on).

Expose only the native operations needed by the trusted bundled UI. Keep arbitrary web navigation and untrusted content away from the native bridge. App IDs, regional services, WebView behavior and rendering speed must be checked on the target model.

## 4. Install and verify — after the port exists

Have the agent document its actual Gradle module, build command, APK output path, application ID and activity. Then install the generated APK, replacing this example path:

```sh
adb install -r path/to/your-debug.apk
```

Open it from the TV’s app list or Android Studio. Check remote focus and Back, installed-app discovery, launching each selected app, music handover/return, all themes, frame pacing, idle behavior, standby/resume and process recreation. Record the exact Sony/other model and firmware in a new verification report; the existing LG reports do not validate Android behavior.

Default-Home integration is a later, model-specific feature. An Android HOME activity and a supported user selection flow may be needed; manufacturer restrictions can prevent it. First ship a working app-list dashboard. Do not disable the stock launcher or promise automatic startup after power-on.

## Prompt for Codex or Claude Code

Open this repository in the coding agent, then replace the bracketed details and paste:

```text
Read README.md, docs/GOOGLE_TV.md and docs/DEVELOPMENT.md. This is currently
an LG webOS dashboard; an Android APK/project does not exist yet.
Port it for my Google TV / Android TV:
Brand and model: [e.g. Sony BRAVIA exact model]. Android version: [version].
Firmware: [version or unknown]. Computer OS: [Windows/macOS/Linux].
ADB device/connection status: [device serial or not paired].

Inspect the webOS dependencies and create an android/ project in this fork.
Preserve the existing LG implementation. Start with an Android TV activity and
trusted local WebViewAssetLoader content, TV banner, LEANBACK_LAUNCHER entry,
D-pad/OK/Back navigation and a narrow native bridge. Replace PalmServiceBridge,
LG app IDs, screensaver calls and Home-helper assumptions with Android APIs.
Discover installed TV-launchable apps using appropriate package visibility,
launch their actual activities, and preserve the selectable-app preferences.
Handle audio focus, pause/resume, activity-scoped keep-screen-on, and process
recreation. Use only media I can redistribute, or disable the soundtrack.

Keep the existing modest animation budget and profile on my exact TV. Build an
APK, document the real build/install commands, install on my paired development
TV and verify navigation, app launches, every theme, effect cleanup, idle and
standby behavior. If ADB is not paired, guide me using the model's supported
method; do not assume port 5555 or store pairing codes in source.

Deliver a normal TV app first. Treat default-Home support as a separate optional
feature, verify the manufacturer's supported selection flow, and preserve the
stock launcher. Report tested behavior and limitations without claiming the
existing LG reports prove Android compatibility. Keep unrelated changes intact.
```
