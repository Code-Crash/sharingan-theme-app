# Dashboard 0.6.5 — simplified Settings and soundtrack source

Installed and launched on LG 55NU870BPLA.

- Settings reduced from 15 rows to 9: Themes, Apps, Background music, Music volume, Background rotation, Use as Home, Animations, 12-hour clock, Back.
- Removed product-facing two-minute trial, resume/pause helper rows, replay-intro and separate blink/screensaver toggles. Replaced helper rows with one real Use as Home switch. Developer diagnostics remain available from the computer.
- Rotation combines Off / 30 seconds / 1 minute. Actual TV button cycle verified all three states and returned to 1 minute, enabled.
- All nine buttons fit the 1920×1080 panel.
- User requested Naruto audio instead of generated music. Generated synthesis was removed. No audio file was available in Downloads/project; no audio was extracted from YouTube.
- Local soundtrack player is prepared in app/ambient.js with app/music-track.js as its source configuration. No source is configured, so the TV correctly shows No track; state=missing, AudioContext=null, no generated fallback.
- Local-player tests passed for missing source, looping, handover pause, hidden/disabled stop, volume, resume and playback denial. Actual soundtrack playback cannot be tested until an audio asset is provided.
- TV screensaver negotiation remains registered. Previous visual confirmation of no clock screensaver is recorded in v0.6.3.
- Native helper 0.2.2 is unchanged, paused, and shown as Use as Home Off pending corrected long-press acceptance. Earlier actual logs proved short Home launches and successful long-Home launch, but user saw a zoom warning; key-up handling was corrected in 0.2.2.

User supplied https://www.youtube.com/watch?v=fffyq5cuUJ0 . Browser inspection identified it as “Naruto Beautiful Music Mix - Peaceful Soundtracks for Relaxing/Sleeping/Studying”, duration 54:16. The user requested an offline download rather than YouTube embedding. No download or YouTube player was added; a local audio asset remains required.

The final TV screenshot settings.png shows Use as Home On (the user activated the normal switch during review). Respect this selection; earlier paused state is historical. All nine controls and the No track status are visibly rendered.
