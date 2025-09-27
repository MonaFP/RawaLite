# RawaLite v1.8.104 - Legacy Launcher Repair

## Fixes
- Packaged builds now ship `resources/update-launcher.ps1` alongside the nested copy, restoring compatibility with installers that expect the legacy path.
- On startup we auto-repair existing installations by copying the launcher from `resources/resources/` when the legacy location is missing.

## Tooling
- Added `scripts/repair-update-launcher.ps1` so testers can fix existing v1.8.102 installations without reinstalling.

## QA Checklist
1. Start a packaged v1.8.104 build and confirm the log shows `LEGACY-LAUNCHER` repair only once.
2. Trigger an in-app update from 1.8.104 to the next build and verify the detached launcher starts elevated.
3. Run the repair script on a clean 1.8.102 setup and confirm the update to 1.8.104 succeeds without manual copying.

--

Release date: 26.09.2025
