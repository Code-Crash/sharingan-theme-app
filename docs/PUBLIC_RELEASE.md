# Before a public repository or release

[← README](../README.md)

These notes describe outstanding publication work. The setup guides are ready to use for development, but do not establish distribution rights or Android compatibility.

- **Choose a source license.** There is no repository-wide `LICENSE` yet. The owner must select the intended terms for original code. Preserve the existing Home-helper license/upstream notices and the Simple Icons attribution/license; a new root license must not claim ownership of third-party components.
- **Resolve bundled media.** Redistribution rights for `app/assets/naruto-ambient.mp3` have not been established. Replace it with distributable music or publish without it. Review Naruto character artwork, app logos and reference images separately; generated artwork is not automatically a clearance of character/trademark rights. See [media configuration](DEVELOPMENT.md#music-and-media).
- **Review tracked files and history.** Check device addresses, model-specific reports, helper numeric identities and media in prior commits before changing visibility. Deleting a file from the latest commit does not remove earlier versions. The `.gitignore` excludes keys, local state, device inventories, screenshots and packages, but does not sanitize existing history.
- **Describe support accurately.** LG 55NU870BPLA is the tested hardware. Other LG models need verification. Google TV/Android TV currently requires a port; no APK or Sony compatibility result exists. Keep the experimental LG helper separate from the dashboard installation path.
- **Publish reproducible artifacts only after testing.** Include the version, target platform, actual build commands, required tool versions and known limitations. Do not bundle personal device state or advertise default-Home/cold-boot support without model-specific evidence.

Making the repository public, choosing the source license, replacing/removing media and any history rewrite are separate release decisions. Documentation updates do not perform those actions.
