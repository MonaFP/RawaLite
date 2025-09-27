# RawaLite v1.8.103 - Launcher Extraction Hotfix

## Fixes

- Restore update installer on production builds by resolving the packaged PowerShell launcher from both `resources/update-launcher.ps1` and `resources/resources/update-launcher.ps1`.
- Prevent update installs from failing with "Launcher extraction failed" when Electron bundles extra resources into a nested folder.

## Notes for QA

- Validate the in-app update flow on a packaged build. Start an update and confirm the detached launcher starts elevated without errors.
- Verify that `AppData/Local/Programs/RawaLite/resources/resources/update-launcher.ps1` is copied into the temporary install folder before the NSIS installer launches.

--

Release date: 26.09.2025
