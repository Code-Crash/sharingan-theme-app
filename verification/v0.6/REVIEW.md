# Home-button helper review — 0.6.0

Installed dashboard/service 0.6.0 and native helper 0.2.0 on the paired LG 55NU870BPLA (firmware 43.21.87, SDK 11.2.0).

Passed: native identity/capability probe (non-root uid 6268, gid 5000, compatible true); native filter unit checks; actual-TV closed-pipe release (24) and missed-heartbeat release (20); trial launch and verified active worker; automatic trial expiry and clean worker exit (0). Home/Settings/Themes controls have separate bounds within the actual 1920×1080 viewport. Screenshot saved as home-controls.png.

LG denied both the direct setDefaultApp request and EIM addDevice request. No system-default mapping or startup-input registration was changed. No root or system-file modifications performed.

Physical remote test FAILED: user reports both normal and long Home failed. Neither trial recorded a home-key event from the selected Magic Remote source. Helper explicitly paused; passive input diagnosis is in progress. Persistent interception has not been enabled. The trial expired and was released. Cold boot / standby startup is not established.

Implementation, recovery and build instructions: ../../home-helper/README.md. Native controller logs: helper-log.txt.

## RCU correction / idle diagnosis

Passive recording confirmed Home code 773 on LGE RCU (event0): both short (~0.24 s) and long (~3.7 s) presses. Original Magic Remote relay therefore could not intercept this owner's remote.

Read-only ioctl probe for LGE RCU and CHECK INPUT: identical 160-byte key capability masks; no relative or absolute axes on either; source event-type byte 7, destination 3 (source advertises an empty EV_REL class). Corrected relay accepts only this measured combination, rejects changed key/type/axis masks, and stops on unexpected non-key/non-SYN events. Added capability rejection tests passed.

Idle baseline with helper paused: 183.989 seconds, zero key events, no visibility events, same target and document.hidden=false in every sample. The reported 1–2 minute return to LG Home was not reproduced. No inactivity-exit timer exists in the dashboard. Do not claim a system idle policy was disabled; the helper trial timeout controls only interception.

User subsequently observed the clock screensaver. This corrects the idle-baseline interpretation: document.hidden stayed false under that system overlay, so the baseline does NOT prove absence of screensaver. Dashboard process remains alive. Browser Screen Wake Lock exists but request('screen') was denied with NotAllowedError / Wake Lock permission request denied.

Corrected RCU native helper 0.2.1 installed with dashboard 0.6.1. Actual-TV closed-pipe release passed (READY → 24, 124 ms) and missed-heartbeat release passed (READY → 20, 2130 ms). Native foreground-query probes were denied; no app-scoped fake-input workaround was added. Corrected physical Home trial remains pending and helper is paused.
