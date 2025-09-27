# RawaLite v1.8.108 - Detached Launcher Fix

## Fixes
- Ensure the PowerShell launcher survives the app shutdown by calling `unref()` on the detached child process in both update handlers.
- Restores the NSIS wizard and (when necessary) UAC prompts that disappeared after the auto-shutdown change in v1.8.105.

## QA Checklist
1. Start from 1.8.107, trigger the update, and confirm the NSIS UI appears and remains after the app closes.
2. Verify `launcher-YYYYMMDD.log` receives fresh entries for the 1.8.108 installer.
3. Complete the installer and relaunch the app to see `Über RawaLite` reporting 1.8.108.

--

Release date: 26.09.2025
