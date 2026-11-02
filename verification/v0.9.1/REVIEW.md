# Sharingan 0.9.1 review

Adds the two approved Naruto/Kurama themes and scenery motion across all eight themes. Hinata additionally has a slowly rotating lunar texture clipped away from foreground occluders, softly masked wind displacement in the foliage, and the existing localized lake ripples. Moon, foliage and water pause when the dashboard is hidden or animations are disabled. No native Home-helper code or device permissions changed.

Local checks passed: JavaScript syntax, whitespace, GPU scheduling/resolution/context-recovery tests, offline ambient audio lifecycle tests, and app-scoped screensaver tests. The new themes previously passed local visual checks; see the 0.9.0 review.

TV: version 0.9.1 was installed and launched before the final Hinata moon/foliage additions. The actual TV inspector verified all eight loaded themes, navigation, app checklist/carousel, eye tracking, all background effects (including both new WebGL renderers), static Itachi pose, crow sizing/cleanup, and water pause/resume. The review then lost its Runtime.evaluate connection during power-effect tests; review.json preserves the partial result rather than claiming a full pass.

The final package with Hinata moon and foliage was successfully installed and launched after the user enabled Key Server. The installed backgrounds.js SHA-256 matches the committed source: e59f47039e8b74ac90099c5731bb51d081b26ae8bec0aa847b5d9a33ef9782ab.

Targeted checks on the visible TV dashboard confirmed the lunar rotation timeline advanced to 11.77 seconds, and the foliage and water timelines advanced from 17.02 to 34.65 seconds. All three paused with Animations Off and with the dashboard hidden, then resumed. The dashboard was left displaying Hinata; the user's automatic theme rotation preference is retained.

The full automated review was retried but did not complete: one run exceeded the fixed crow-cleanup timing check and a subsequent inspector connection timed out before collecting results. The checker now polls for effect completion with an eight-second limit instead of relying on a fixed sleep/remote promise. The earlier partial all-theme review is retained in review.json; final deployment and targeted checks are recorded in deployment.json. This does not claim a full automated or physical-remote acceptance pass. Native helper behavior is unchanged.
