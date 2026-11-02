# Sharingan 0.9.0 — local review candidate

Implemented the two approved Naruto/Kurama designs. The built-in image generator removed baked UI from the approved concept images; the dashboard renders its own clock, app row and controls. Final art is `app/assets/kurama-moon.png` and `app/assets/chakra-sync.png`; provenance and prompt set are in `artwork-v0.9-prompts.txt`.

Nine-Tails Moon keeps Naruto facing the viewer and animates tail regions, smoke, moon glow and embers. Chakra Sync adds gold chakra contour flow, 19 flame wisps, sparks, tail movement and lake ripples. Both have four measured tracking eyes and blinks; power travels to the selected icon before the local launch notice. Hands and faces are not articulated.

Local browser acceptance: both WebGL programs compiled and rendered. Moon frame counter advanced from 244 to 1281; a capture comparison measured a mean RGB tail-region difference of 11.63 / 5.19 / 4.38 between frames. Animations Off kept frame 236 unchanged across two observations about 37 seconds apart. Changing themes left the old scene stopped and the selected scene running. All eight theme cards fit within the gallery. Left/Right selection changed gaze transforms; Enter produced the strong power projectile and then the expected preview-only app notice.

The first GPU pass exposed a uniform-precision link mismatch. Both shader stages now use matching high precision, and both scenes subsequently ran through the WebGL path. SVG fallback timeline pause/resume and GPU scheduling limits are covered by `test-kurama-scenes.cjs`.

Checks: JavaScript syntax, linked runtime assets, JSON, diff whitespace, scene lifecycle tests, ambient audio tests and screensaver tests. Local preview: `http://127.0.0.1:8765/preview.html`. The page contains a 16:9 dashboard frame and dedicated theme switch buttons. The browser viewport override used for review was reset.

No package was built or installed on the TV for this change. TV performance and physical-remote acceptance for 0.9.0 remain unverified until a separately requested deployment. The existing installed build remains unchanged.
