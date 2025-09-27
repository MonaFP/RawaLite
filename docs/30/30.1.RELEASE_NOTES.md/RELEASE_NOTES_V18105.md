# RawaLite v1.8.105 - Autoshutdown Update Flow

## Fixes
- After the launcher starts successfully, the desktop app now quits automatically so NSIS can replace files without running into locked binaries.
- Renderer clients receive a `updater:will-quit` notice before shutdown, keeping the UI in sync with the update lifecycle.

## Tooling
- `scripts/repair-update-launcher.ps1` copies the latest repository launcher into the installed app (both legacy and nested paths) so testers on ≤1.8.102 can patch their environment quickly.

## QA Checklist
1. From 1.8.104, trigger an in-app update to 1.8.105 and verify the app closes automatically within ~2s.
2. After relaunch, confirm `install-results.json` is consumed and the UI reports 1.8.105.
3. Run the repair script against a 1.8.102 machine and retry the update flow to ensure the hotfix sticks.

--

Release date: 26.09.2025
