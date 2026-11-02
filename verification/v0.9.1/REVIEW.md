# Sharingan 0.9.1 review

Adds the two approved Naruto/Kurama themes and scenery motion across all eight themes. Hinata additionally has a slowly rotating lunar texture clipped away from foreground occluders, softly masked wind displacement in the foliage, and the existing localized lake ripples. Moon, foliage and water pause when the dashboard is hidden or animations are disabled. No native Home-helper code or device permissions changed.

Local checks passed: JavaScript syntax, whitespace, GPU scheduling/resolution/context-recovery tests, offline ambient audio lifecycle tests, and app-scoped screensaver tests. The new themes previously passed local visual checks; see the 0.9.0 review.

TV: version 0.9.1 was installed and launched before the final Hinata moon/foliage additions. The actual TV inspector verified all eight loaded themes, navigation, app checklist/carousel, eye tracking, all background effects (including both new WebGL renderers), static Itachi pose, crow sizing/cleanup, and water pause/resume. The review then lost its Runtime.evaluate connection during power-effect tests; review.json preserves the partial result rather than claiming a full pass.

The final package with Hinata moon and foliage is built at dist/home-helper/com.dextor.sharingan_0.9.1_all.ipk. A subsequent install stalled, and a fresh Developer Mode SSH connection timed out during its handshake. Final package installation and final physical-TV acceptance remain unconfirmed until the connection is restored. Package files, credentials, runtime state and screenshots are excluded from Git.
