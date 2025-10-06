# SQLite Database Installation & Setup Guide

**Version**: 1.0.0  
**Datum**: 29.09.2025  
**Status**: Production Ready  

## Übersicht

Diese Anleitung beschreibt die vollständige Installation und Einrichtung des SQLite-Database-Systems für RawaLite mit better-sqlite3 Native Module.

## Prerequisites

### System Requirements
- **Node.js**: >= 20.0.0
- **Python**: >= 3.8 (für native module compilation)
- **Build Tools**: 
  - Windows: Microsoft Build Tools 2022
  - macOS: Xcode Command Line Tools
  - Linux: build-essential package

### Development Environment
```bash
# Required Tools
npm install -g pnpm          # Package Manager
npm install -g electron      # Electron Framework

# Windows-specific (Visual Studio Build Tools)
npm install -g windows-build-tools

# Verify Installation
node --version               # Should be >= 20.0.0
python --version            # Should be >= 3.8
```

## Installation Steps

### 1. Clean Installation
```bash
# Clone Repository
git clone https://github.com/MonaFP/RawaLite.git
cd RawaLite

# Clean Install mit Native Dependencies
pnpm install --frozen-lockfile

# Native Module Rebuild für Electron
npx electron-rebuild

# Verify Dependencies
pnpm ls better-sqlite3       # Should show version 12.4.1
```

### 2. Development Build
```bash
# Build Application
pnpm build

# Development Mode mit Hot Reload
pnpm dev

# Verify Database Creation
# Check: %APPDATA%/Electron/database/rawalite.db
```

### 3. Production Build
```bash
# Create Production Executable
pnpm dist

# Verify Build
./release/win-unpacked/RawaLite.exe    # Windows
./release/mac/RawaLite.app             # macOS  
./release/linux-unpacked/rawalite      # Linux
```

## Automated Installation

### Using install-local.ps1 (Recommended)
```powershell
# One-Click Installation & Launch
.\install-local.ps1

# What it does:
# 1. Installs dependencies
# 2. Builds application
# 3. Rebuilds native modules
# 4. Creates production build
# 5. Launches application
```

### Using install-local.cmd (Windows Batch)
```cmd
# Alternative Windows Installation
.\install-local.cmd
```

## Database Setup Verification

### Automated Verification
```powershell
# Run Complete System Check
.\verify-installation.ps1

# Manual Verification Steps
powershell -Command "Test-Path '$env:APPDATA\Electron\database\rawalite.db'"    # Should return True
powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*RawaLite*'}"  # Should list processes
```

### Manual Database Inspection
```bash
# Using sqlite3 CLI (optional)
sqlite3 "%APPDATA%\Electron\database\rawalite.db"

# Verify Schema
.schema                      # Show all tables
.tables                      # List table names
PRAGMA user_version;         # Should return 1 (current schema version)
PRAGMA integrity_check;      # Should return "ok"

# Exit sqlite3
.exit
```

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Could not locate the bindings file"
```bash
# Problem: Native module not compiled for Electron
# Solution: Rebuild native dependencies
npx electron-rebuild

# Alternative: Force clean rebuild
rm -rf node_modules/.cache
pnpm install --frozen-lockfile
npx electron-rebuild
```

#### ❌ "Cannot open database because the directory does not exist"
```bash
# Problem: Database directory not created
# Solution: Directory creation is automatic, but check permissions
mkdir -p "$env:APPDATA\Electron\database"     # Windows
mkdir -p "~/Library/Application Support/Electron/database"  # macOS
```

#### ❌ "Prebuild-install not found"
```bash
# Problem: Missing prebuild-install dependency
# Solution: Install explicitly
pnpm add -D prebuild-install
```

#### ❌ "Python not found" (Windows)
```bash
# Problem: Python not in PATH or not installed
# Solution: Install Python and add to PATH
winget install Python.Python.3

# Alternative: Use windows-build-tools
npm install -g windows-build-tools
```

#### ❌ Migration Failure
```typescript
// Problem: Schema migration failed
// Solution: Automatic rollback available
// Check logs for: "Cold backup created: ..."
// Backup file can be manually restored if needed
```

### Build Debugging

#### Enable Verbose Logging
```bash
# Development Mode mit Debug-Output
DEBUG=* pnpm dev:all

# Specific sqlite3 debugging
DEBUG=sqlite3* pnpm dev:all

# Electron main process debugging  
NODE_ENV=development pnpm electron:dev
```

#### Native Module Debugging
```bash
# Check native module architecture
file node_modules/better-sqlite3/build/Release/better_sqlite3.node

# Verify Electron compatibility
npx electron -p "process.versions"
npx electron-rebuild --version
```

### Performance Validation

#### Database Performance Test
```typescript
// Simple performance test
console.time('1000 inserts');
for (let i = 0; i < 1000; i++) {
  await dbClient.exec('INSERT INTO customers (company_name) VALUES (?)', [`Test ${i}`]);
}
console.timeEnd('1000 inserts');
// Should complete in < 100ms
```

#### Memory Usage Check
```bash
# Check memory usage in Task Manager
# RawaLite should use < 100MB RAM (vs 500MB+ with SQL.js)
```

## Directory Structure After Installation

### Application Files
```
RawaLite/
├── release/win-unpacked/
│   ├── RawaLite.exe                 # Main executable
│   ├── resources/
│   │   └── app.asar                 # Bundled application  
│   └── *.dll                       # Electron runtime
├── dist-electron/
│   ├── main.cjs                     # Compiled main process
│   └── preload.js                   # Compiled preload script
└── dist-web/
    └── assets/                      # Compiled renderer assets
```

### User Data Files  
```
%APPDATA%/Electron/database/         # Windows
~/Library/Application Support/Electron/database/  # macOS
~/.config/Electron/database/         # Linux

├── rawalite.db                      # Main database file
├── rawalite.db-wal                  # Write-ahead log
├── rawalite.db-shm                  # Shared memory file
└── backups/
    ├── pre-migration-*.sqlite       # Automatic migration backups
    └── manual-backup-*.sqlite       # User-created backups
```

## Configuration Options

### Environment Variables
```bash
# Database Configuration
RAWALITE_DB_PATH=/custom/path/to/database.db    # Custom database location
RAWALITE_BACKUP_RETENTION=20                    # Keep 20 backups (default: 10)
RAWALITE_LOG_LEVEL=debug                        # Enable debug logging

# Development Mode
NODE_ENV=development                             # Enable dev tools
ELECTRON_IS_DEV=1                               # Force dev mode
```

### Build Configuration
```json
// electron-builder.yml
{
  "buildDependenciesFromSource": true,
  "nodeGypRebuild": true,
  "directories": {
    "output": "release"
  },
  "files": [
    "dist-electron/",
    "dist-web/",
    "!node_modules/better-sqlite3/src/",
    "node_modules/better-sqlite3/build/"
  ]
}
```

## Security Considerations

### File Permissions
```bash
# Database files should be user-writable only
chmod 600 $database_file             # Unix systems
icacls $database_file /grant:r %USERNAME%:F  # Windows
```

### Backup Security
```bash
# Backup files should be secured
mkdir -p ~/secure-backups
chmod 700 ~/secure-backups
# Copy database backups to secure location regularly
```

## Maintenance Tasks

### Database Maintenance
```sql
-- Periodic maintenance (run monthly)
PRAGMA optimize;                     -- Update query optimizer statistics
VACUUM;                             -- Defragment database
PRAGMA integrity_check;             -- Verify data integrity
```

### Backup Rotation
```bash
# Automated backup cleanup (runs automatically)
# Keeps latest 10 backups by default
# Manual cleanup if needed:
find "$backup_dir" -name "*.sqlite" -mtime +30 -delete
```

### Log Cleanup
```bash
# Application logs rotation
find "$log_dir" -name "*.log" -size +10M -delete
```

## Support & Documentation

### Log Locations
- **Application Logs**: `%APPDATA%/Electron/logs/`
- **Database Logs**: Console output during development
- **Migration Logs**: Embedded in database as comments

### Additional Resources
- [SQLite Documentation](https://sqlite.org/docs.html)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md)
- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)

### Getting Help
- Check troubleshooting section above
- Review logs in `%APPDATA%/Electron/logs/`
- Run `verify-installation.ps1` for diagnostic information

---

**Installation Guide Status**: ✅ Complete  
**Last Tested**: 29.09.2025  
**Platform Coverage**: Windows ✅ | macOS 🔄 | Linux 🔄