# Home shortcut — read-only observer

Dashboard 0.9.1 and native helper 0.4.0, on LG 55NU870BPLA / firmware 43.21.87 / SDK 11.2.0.

## Behavior

The dashboard automatically enables a physical Home-button observer; its status note appears at the bottom left. There is no Home switch in Settings. A short Home release waits 700 ms, then opens Sharingan. LG may briefly show its own Home UI first. This is not a system-default-app replacement.

The helper opens the exact **LGE RCU** device **read-only**. It never grabs an input device, writes an input event, forwards arrows, or uses CHECK INPUT. All ordinary keys, pointer actions and volume controls continue directly to webOS. Home press-and-release is the only normal event that triggers a launch.

The **LG Home** button beside Settings opens LG Home while leaving the observer enabled. Holding Home for two seconds also requests LG Home. Since input is read-only, LG may additionally show its own long-press behavior, such as a zoom message.

## Why 0.3.0 changed the design

Earlier helpers exclusively grabbed LGE RCU and injected ordinary keys into CHECK INPUT. Matching capability masks did not establish that LG would deliver those injected keys to the app. The user reported lost Left/Right navigation. That entire forwarding path was removed, rather than enabling another exclusive relay.

The native filename remains `relay` for package compatibility, but its implementation is now an independent read-only observer. Status reports identify `mode:observe-only`, `inputGrabbed:false`, `eventsWritten:0`.

## Lifecycle and recovery

Own-state locks, process identity checks, closed-pipe shutdown and heartbeat timeouts remain. A crash cannot consume or disable normal remote keys because no input grab exists. The dashboard enables the helper when it opens. Developer maintenance can pause it explicitly. Automatic worker recovery is bounded to three retries per minute.

From this paired computer:

```sh
node home-helper/control.mjs pause
node home-helper/control.mjs status
node home-helper/control.mjs logs
```

A bounded developer trial is available through the app inspector:

```js
homeControl('resume', {trialSeconds:120})
```

Normal enablement uses `{trialSeconds:0}`. The product Settings contains no trial/debug rows.

To remove the optional observer:

```sh
npm exec --yes --package=@webos-tools/cli -- ares-install -d lg-tv --remove com.mbs.communityhomehelper
```

## Build and update

Requires Zig 0.14.1, Node, Python 3 and the official webOS CLI. Numeric identities in options.json are verified for this TV only. No root, system-user changes, firmware patch or Home Assistant account is used.

```sh
ZIG=/path/to/zig node home-helper/build.mjs
npm exec --yes --package=@webos-tools/cli -- ares-install -d lg-tv dist/home-helper/com.dextor.sharingan_0.8.1_all.ipk
npm exec --yes --package=@webos-tools/cli -- ares-install -d lg-tv dist/home-helper/com.mbs.communityhomehelper_0.4.0_arm.ipk
```

Upgrade **both** packages from an earlier exclusive-relay version. Updating only the web app does not replace the old native worker.

## Separate dashboard features and limits

App-scoped screensaver negotiation, theme rotation and the soundtrack player do not require this observer to be enabled. The user-provided Naruto mix is bundled locally and loops independently of this observer.

There is no firmware boot service or proven cold-boot startup. Developer Mode must remain enabled and renewed. Only the physical LGE RCU Home path is currently monitored; other remotes and network-injected Home events need individual testing.

Tests and actual-TV results: ../verification/v0.7/. Earlier verification folders describe historical implementations, not the current input behavior. Attribution and source adaptation: UPSTREAM.md, LICENSE, UPSTREAM-LICENSE.

## Outstanding physical-TV issue

The user confirmed normal navigation works, but Home return from Netflix can briefly show Sharingan and then hide it. A successful launch reply does not prove a stable foreground return. Native helper processes belong to their app’s freezer cgroup; process existence alone cannot prove the watcher is scheduled. The JS service runs outside that app cgroup but lacks the input-device group, so moving the watcher into it is not a permitted drop-in solution. No cgroup, group membership, input permissions, or firmware settings were modified.

## Zoom, direct Home routing and startup checks (2026-11-02)

On firmware 43.21.87, Developer Mode calls to `controlZoom` and `setDefaultApp` were explicitly denied. Settings reads for general/option/accessibility were also denied. A documented persistent Activity with a boot-status trigger and Sharingan launch callback was rejected because the caller lacked rights to its callback/trigger; no activity was created.

The TV’s native key-handler library exposes `cb_getScreenZoomBlockAppList` and requests a `screen_zoom` configuration from LG’s secure settings service. This suggests an LG-managed exclusion list, rather than a proven app-declared opt-out. Neither the official public appinfo reference nor the inspected app metadata APIs established a Zoom opt-out available to Sharingan. No guessed manifest flags or global Zoom changes were installed. Normal image size would be 100% magnification.

Evidence: `../verification/v0.8.1/platform-capabilities.json`. These checks do not establish root compatibility or disprove every possible undocumented mechanism.
