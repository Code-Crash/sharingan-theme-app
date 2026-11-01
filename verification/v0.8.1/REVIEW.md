# Sharingan 0.8.1 verification

Installed on paired LG 55NU870BPLA. The complete user-provided Naruto mix is bundled locally; the user confirmed audible TV-speaker playback. Seeking to 1.2 seconds before the end confirmed automatic wraparound, followed by successful pause and resume. Original audio remains unchanged.

`functional/review.json` passed navigation, nested panels, app checklist, 17-app carousel, all six themes and eyes, static Itachi pose, crow sizing and cleanup, Hinata water lifecycle, four character powers, Rasengan, eight settings, local looping music, screensaver registration, and no loader replay. No runtime exceptions were observed. Preferences were restored.

The first screenshot-enabled run timed out in Page.captureScreenshot and is preserved as a failed diagnostic in review.json. Reconnecting the inspector confirmed the dashboard and music remained active and preferences were restored. The complete functional rerun disabled screenshots and passed.

Physical Home return from Netflix is still unresolved: the user previously saw the dashboard briefly appear then disappear. Passing dashboard tests does not establish that the Home hook is reliable. Native processes belong to the helper app freezer cgroup; the background JS service lacks input-device group permissions. No security settings, cgroups, or input permissions were changed.
