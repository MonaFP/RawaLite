# DEPRECATED: GitHubCliService (Historical Reference)

**Status:** ❌ Deprecated - Replaced by GitHubApiService  
**Last Used:** v1.0.7  
**Replacement:** GitHubApiService (v1.0.8+)  
**Migration Date:** Oktober 2025

## Purpose (Historical)
GitHubCliService was the original GitHub integration using external CLI tools.

### Original Architecture:
```
UpdateManagerService
       ↓ CLI
GitHubCliService  
       ↓ Exec
   gh.exe Binary
       ↓ HTTP  
  GitHub API
```

## Why Deprecated
- **External Dependency:** Required `gh` CLI binary installation
- **User Authentication:** Complex GitHub account setup required
- **Download Issues:** ENOENT errors and reliability problems
- **Maintenance Overhead:** External tool version management

## Migration to GitHubApiService
All functionality successfully migrated to GitHubApiService:

### New Architecture:
```
UpdateManagerService
       ↓ Direct
GitHubApiService
       ↓ HTTP
  GitHub API
```

### Benefits:
- ✅ **Zero Dependencies:** No external CLI tools required
- ✅ **No Authentication:** Public API, no user setup needed  
- ✅ **Better Performance:** Direct HTTP calls, faster response
- ✅ **Improved Reliability:** Native error handling, retry logic

## Developer Notes
If you find references to GitHubCliService in old documentation:
1. Replace with GitHubApiService
2. Update import statements
3. Remove CLI-related configurations
4. See UPDATE-SYSTEM-ARCHITECTURE.md for current implementation

**Migration completed:** ✅ Oktober 2025  
**Current status:** GitHubApiService fully operational in production

---

**Historical Context:**
- Original CLI-based implementation served as proof-of-concept
- Successful migration demonstrates API-first approach benefits
- Lessons learned: Direct API integration > External tool dependencies