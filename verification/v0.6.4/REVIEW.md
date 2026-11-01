# Dashboard 0.6.4 / Home helper 0.2.2

Installed on the paired LG 55NU870BPLA, firmware 43.21.87 / SDK 11.2.0.

## Ambient music

Original local synthesis: slow minor-key sine pads with gentle modulation and sparse pentatonic chimes. No stream, external music service or system-volume change. Enabled at Low by default; On/Off and Low/Medium/High controls save with the other preferences.

- Unit checks passed: no context while hidden, no duplicate pad voices, gain scheduling and suspension before handover, disabled/hidden stop, and resume.
- Actual TV: AudioContext running, clock advanced from 2.304 to 10.88 seconds, music enabled at gain 0.12.
- Actual TV stop/resume: context changed running → suspended → running. App launch awaits suspension before sending the launch request. Hidden/page-exit and LG Home also pause music. Dashboard return resumes it.
- All 15 settings controls fit the 1920×1080 panel. The note ended at y=1048.25; scrolling remains available with its scrollbar hidden.
- Audio listening confirmation requested separately; a running context alone does not prove the TV speaker output was heard.

## Home-button long press

Previous trial logs confirmed four short Home launches of com.dextor.sharingan and long-Home worker exit 22 followed by a successful com.webos.app.home launch. User nevertheless observed a zoom warning.

New filter waits for physical Home key-up after the two-second threshold before releasing the input grab and launching LG Home. This prevents trailing held-key repeats from reaching LG's normal handler. It retains the ten-second stuck-key escape, controller heartbeat, closed-pipe release, device identity/capability comparisons and locks.

- Unit checks passed for short presses, repeats after threshold, long key-up, other keys and overflow.
- On-TV 0.2.2 failure tests passed: closed pipe READY → 24 (109 ms); missed heartbeat READY → 20 (2138 ms).
- Helper remains paused pending physical retest. Start Settings → Test Home button (2 min), then hold Home for two seconds and release. Do not claim the zoom warning is fixed until confirmed on screen.

Prior app-scoped screensaver and 30/60-second rotation verification is in ../v0.6.3/REVIEW.md. The user confirmed the dashboard remained visible without the clock screensaver.
