# RawaLite v1.8.106 - Interactive Installer Restore

## Fixes
- Re-enable the NSIS UI by default: the launcher drops the silent `/S` switch and only adds it when the app explicitly requests `-Silent`.
- Log the installer arguments and extend the auto-quit delay to 5s so testers see the launcher message before the app closes.

## Tooling
- `repair-update-launcher.ps1` now copies the latest launcher into both resource paths and accepts the new optional parameters.

## QA Checklist
1. From 1.8.105, trigger the in-app update to 1.8.106 and confirm the NSIS wizard becomes visible.
2. Wait for the app to close automatically (~5s) and complete the installer manually; after relaunch the About dialog should show 1.8.106.
3. (Optional) Run the repair script on a 1.8.102 machine and retry the update; verify the NSIS UI appears.

--

Release date: 26.09.2025
