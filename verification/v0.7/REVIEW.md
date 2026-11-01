# Deep TV review — dashboard 0.7.0, Home observer 0.3.0

Installed on LG 55NU870BPLA, firmware 43.21.87 / SDK 11.2.0.

## Navigation repair

The previous helper exclusively grabbed LGE RCU and forwarded all normal keys through CHECK INPUT. Capability-mask equality had not established that LG actually delivered those forwarded keys to the app. The user reported loss of navigation with Use as Home enabled.

That forwarding path was removed completely. The native worker now opens the named LGE RCU device read-only, observes Home key-up and never grabs a device or writes an input event. Normal remote keys remain on LG's original path. A short Home release waits 700 ms, then opens Sharingan; a brief LG Home flash is expected. LG's own long-press behavior is not suppressed. The LG Home button beside Settings remains the predictable stock-Home route.

A syscall-level regression test supplies Right and Home events and asserts read-only input opens, rejects any write-direction input ioctl, rejects input-fd writes and confirms shutdown on a closed controller pipe. It passed. Filter tests cover unmatched releases, short/long Home releases, repeats, arrows, pointer/wheel events and overflow. The TV's closed-pipe and missing-heartbeat tests passed (exit 24 and 20). Status reports active observe-only mode, inputGrabbed=false, eventsWritten=0.

## Other fixes

- Settings Left now returns to apps; Right opens/changes the current row. Up/Down and OK remain supported.
- Footer instructions now reflect the active panel instead of always suggesting app navigation.
- Home status refreshes while Settings is visible and duplicate toggle requests are prevented.
- The LG Home button no longer depends on a successful helper pause response.
- Animations and Hinata water pause while the dashboard is hidden, and resume on return.
- An app launch in progress is cancelled if the dashboard becomes hidden before handover.
- Synchronous bridge failures clean up their timeout/reference.
- Build permission rewriting now touches only the two newly generated packages, not historical IPKs.

## Actual TV software review — passed

See review.json and theme/power screenshots in this folder.

- Left/Right app navigation; footer traversal both directions; Up/Down, nested menus, Back, Settings Left/Right.
- Five default streaming apps, 17-app catalog, checkbox changes, last-app guard, 17-app carousel and restored preferences.
- All six theme assets loaded; two tracking eyes per character.
- Static Itachi jutsu artwork: same bounds, transform none, zero animations.
- Seven crows, nominal 119 px width; transient flock cleanup.
- Hinata water moving; hidden pause / visible resume; motion switch.
- Four character powers and Rasengan flight/impact cleanup.
- Nine Settings controls fit the TV screen. No developer test rows.
- Soundtrack remains unconfigured and silent: no AudioContext and no generated fallback.
- App-scoped screensaver subscription registered. The earlier actual idle request was declined successfully, and the user confirmed no clock screensaver.
- Zero runtime exceptions. Approximately 10 MB reported JavaScript heap, 660 DOM elements, no leftover power elements at the check.

Preferences were restored after the review. Use as Home was restored On using the passive observer. Physical remote navigation and YouTube → Home acceptance have been requested separately; do not confuse synthetic software-key tests with physical-remote confirmation.

## Remaining limits

- Native Home can briefly appear before the dashboard returns; no system-default mapping was changed.
- Cold-boot automatic startup remains unproven/not implemented. Developer Mode renewal is still required.
- Naruto music requires a local audio asset; no track was downloaded or substituted.

## Installation integrity and observed physical Home events

The TV's native worker SHA-256 matches the reviewed local binary: b96a162ea685eef67ed49e92e526aafa3cc8ec37b775a0ac94e792d634f4ae18. Native status reports mode=observe-only, inputGrabbed=false, eventsWritten=0.

After enablement, physical short Home events were recorded and followed by successful dashboard launch responses. A long release paused the observer and successfully launched LG Home, and the owner subsequently re-enabled it. These are backend launch results, not a substitute for the user's visual/remote-navigation acceptance. The user has been asked to confirm normal arrows/OK and YouTube → Home return.
