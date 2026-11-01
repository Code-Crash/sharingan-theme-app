# Dashboard 0.6.3 — rotation and app-scoped screensaver

Installed on LG 55NU870BPLA (43.21.87 / SDK 11.2.0).

- Settings offers 30 seconds or 1 minute. This update enables rotation once at 1 minute; user changes subsequently persist.
- Actual 1-minute rotation: ready at 19:35:17.280 UTC, next theme at 19:36:18.517 UTC (61.237 seconds).
- Actual 30-second rotation: interval applied at 19:36:42.221 UTC, next theme at 19:37:13.316 UTC (31.095 seconds).
- Final preference restored to 1 minute, rotation enabled.
- Screen Wake Lock request was denied, but the separate tvpower/registerScreenSaverRequest subscription returned subscribed:true on this firmware.
- app/screensaver.js responds ack:false to Active requests using the exact TV timestamp while enabled and visible. It cancels before an app launch, LG Home, hiding, exit, or opt-out. It does not alter system timer settings, play fake video, or inject input.
- Unit checks passed for exact timestamps, hidden/disabled state, handover cancellation including pending responses, stale callbacks and permission denial.
- Native Home helper remains paused; the corrected physical Home-button acceptance test remains separate and pending.

The complete idle/rotation samples are in idle-rotation.json. Actual screensaver event and visual acceptance results are appended after the idle test.

Reference: https://github.com/xbmc/xbmc/blob/master/xbmc/windowing/wayland/OSScreenSaverWebOS.cpp. This API is undocumented by LG; firmware compatibility must be checked individually.

## Actual TV screensaver negotiation

At 19:38:09.902 UTC, the TV sent an Active screensaver request with timestamp 726458681. The dashboard replied ack:false using that timestamp. At 19:38:10.267 UTC the TV returned returnValue:true. Zero remote key events occurred during the test. Background rotation subsequently continued to Sasuke at 19:38:28.507 UTC. Physical confirmation of the absence of the clock overlay is requested from the user separately.

## User visual confirmation

User confirmed after the idle test: “Dashboard stays visible; no clock screensaver”. App-scoped screensaver prevention passed on this TV, along with automatic background rotation.

Corrected Home trial restarted after screensaver confirmation: native logs show exact names CHECK INPUT (event1), LGE RCU (event0), then READY. User physical acceptance requested.
