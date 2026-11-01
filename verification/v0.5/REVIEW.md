# Final TV review — build 0.5.1

Passed on the actual LG 55NU870BPLA at 1920 × 1080.

- Six themes: Itachi Midnight Rain, Itachi Crimson Moon, Naruto, Hinata, Sasuke, Sakura. Original Artwork is absent.
- Exactly five default shortcuts in order: YouTube, Netflix, Prime Video, JioHotstar, Crunchyroll. Others remain available through the settings checklist.
- Both eyes track selection in every theme. Eye aperture coordinates were inspected against enlarged source images, and icon coordinates map into each SVG’s rendered bounds.
- Crimson Moon uses one complete static drawing of Itachi forming a two-handed jutsu seal. The source, bounding box, transform, and animation count remain unchanged across selection. No hand rotation or distance-based hand scaling remains.
- The final flock contains seven crows with a nominal 119 px wingspan at 1920 px width, spread along the path. Flying crows, rather than the hands, react to selection.
- Hinata’s water animation advances and pauses correctly. Displacement is clipped to the lake texture; the face and landscape are not distorted. Motion-off clears flying effects and pauses the water.
- Naruto’s portrait is enlarged 30%. Eye tracking uses inverse coordinates from the transformed SVG; Rasengan position and size are taken from the rendered hand-orb bounds.
- Naruto, Hinata, Sasuke, and Sakura’s power effects were exercised and captured mid-flight. All complete and clean up their temporary elements.
- Rasengan flight, impact, and cleanup passed. An actual Naruto → YouTube launch was triggered afterward. User explicitly confirmed: “Yes, effect and YouTube worked”.
- All six theme cards fit the picker. App defaults, availability, checkbox visibility, preferences, and earlier reopening checks passed.

Artifacts:

- `review.json`: measured results and assertions.
- `theme-*.png`: actual TV rendering of all six themes.
- `itachi-jutsu-crows.png`: final static hands and enlarged flock.
- `power-*.png`, `rasengan-flight.png`: animation captures.
- `gallery-six-themes.png`, `apps-five-defaults.png`: menus.

Remaining limits: no Home-button replacement or automatic startup; Developer Mode renewal is needed; newly installed apps need a refreshed catalog. Five-minute automatic theme rotation is configured but the full interval was not waited out during this review. Individual optional system shortcuts may be firmware-restricted.
