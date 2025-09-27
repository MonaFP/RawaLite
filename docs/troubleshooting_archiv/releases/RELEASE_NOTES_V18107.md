# RawaLite v1.8.107 - Update Pipeline Validation

## Fixes
- No code changes – this build exists to validate the interactive installer (≥1.8.106) across fresh update runs.

## QA Checklist
1. Start from 1.8.106 and trigger the in-app update. Confirm the NSIS wizard appears and the app shuts down after ~5 s.
2. Complete the update and verify `Über RawaLite` reports 1.8.107.
3. Review `launcher-YYYYMMDD.log` to ensure installer arguments and exit code are logged.

--

Release date: 26.09.2025
