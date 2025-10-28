CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
# GitHub API Migration Plan
**Datum:** 02. Oktober 2025  
**Zweck:** Migration von GitHub CLI zu direkter GitHub API für Update-System  
**Status:** 🔄 Planung  
**Priorität:** 🔥 Hoch  

## 📋 Executive Summary

### Problem
Das aktuelle Update-System verwendet GitHub CLI (`gh`), was zu folgenden Problemen führt:
- **Benutzerverteilung:** Freunde/Nutzer müssen GitHub-Account + CLI-Setup durchführen
- **Dependency Hell:** Externe Binärdatei-Abhängigkeit (`gh.exe`)
- **Download-Fehler:** ENOENT-Fehler bei Update-Downloads
- **Komplexität:** Authentifizierung über externe Tools

### Lösung
Migration zu direkter GitHub HTTP API:
- **Public API:** Rate Limits für öffentliche Repositories ausreichend
- **Zero Dependencies:** Nur native Node.js HTTP-Module
- **Bessere UX:** Keine Benutzer-Authentifizierung erforderlich
- **Robustheit:** Weniger bewegliche Teile, bessere Fehlerbehandlung

### Impact
- **Entwicklungszeit:** ~11 Stunden (4 Phasen)
- **Breaking Changes:** Interne API-Änderungen, keine UI-Änderungen
- **Risiko:** Niedrig (bestehende Funktionalität bleibt erhalten)

---

## 🎯 Migrationsziele

| Ziel | Status | Beschreibung |
|------|--------|--------------|
| ✅ **Zero External Dependencies** | Geplant | Entfernung aller `gh` CLI Abhängigkeiten |
| ✅ **Simplified User Experience** | Geplant | Keine GitHub-Authentifizierung für Endnutzer |
| ✅ **Improved Error Handling** | Geplant | HTTP-basierte Fehlerbehandlung mit Retry-Logic |
| ✅ **Rate Limit Management** | Geplant | Intelligente Anfrage-Begrenzung für GitHub API |
| ✅ **Backward Compatibility** | Geplant | Bestehende UI und IPC-Schnittstellen beibehalten |

---

## 🔄 Migrationsphasen

### Phase 1: GitHubApiService Implementation (4h)
**Ziel:** Erstelle HTTP-basierte GitHub API-Wrapper

#### 1.1 Service-Grundstruktur (1h)
```typescript
// src/main/services/GitHubApiService.ts
class GitHubApiService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly repo = 'MonaFP/RawaLite';
  
  async getLatestRelease(): Promise<Release>
  async downloadAsset(url: string, destination: string): Promise<void>
  private async makeRequest<T>(endpoint: string): Promise<T>
  private handleRateLimit(headers: Headers): void
}
```

#### 1.2 Release Detection (1.5h)
- **Endpoint:** `GET /repos/MonaFP/RawaLite/releases/latest`
- **Response Mapping:** GitHub API → Internal Release Interface
- **Error Handling:** 404, Rate Limits, Network Errors
- **Caching:** Lokaler Cache für wiederholte Anfragen

#### 1.3 Asset Download (1.5h)
- **Direct Download:** Über Asset `browser_download_url`
- **Progress Tracking:** Stream-basierte Download-Progress
- **Retry Logic:** Exponential Backoff bei Fehlern
- **Checksums:** Optional für Integrität (zukünftig)

### Phase 2: UpdateManagerService Migration (3h)
**Ziel:** Integration des neuen GitHubApiService

#### 2.1 Service Substitution (1h)
```typescript
// Vorher:
private githubCli = new GitHubCliService();

// Nachher:
private githubApi = new GitHubApiService();
```

#### 2.2 Method Adaptation (1h)
- **getLatestRelease():** Direkte API-Calls statt CLI-Parsing
- **downloadAsset():** HTTP-Streams statt CLI-Exec
- **Error Mapping:** CLI-Errors → HTTP-Errors

#### 2.3 Event Emission (1h)
- **Existing Events:** Beibehalten für UI-Kompatibilität
- **Progress Events:** Verbesserte Granularität durch HTTP-Streams
- **Error Events:** Strukturierte HTTP-Fehlerinformationen

### Phase 3: Testing & Validation (2h)
**Ziel:** Sicherstellung der Funktionalität

#### 3.1 Unit Tests Update (1h)
```typescript
// tests/services/GitHubApiService.test.ts
describe('GitHubApiService', () => {
  test('should fetch latest release');
  test('should handle rate limits');
  test('should download assets with progress');
  test('should retry on network errors');
});
```

#### 3.2 Integration Tests (1h)
- **Mock GitHub API:** Für zuverlässige Tests
- **E2E Update Flow:** Vollständiger Update-Zyklus
- **Error Scenarios:** Network, Rate Limits, Invalid Responses

### Phase 4: Cleanup & Documentation (2h)
**Ziel:** Aufräumen und Dokumentation

#### 4.1 Code Cleanup (1h)
- **Remove GitHubCliService:** Datei + alle Imports
- **Update Dependencies:** Entfernung von CLI-bezogenen Packages
- **Type Cleanup:** Ungenutzte CLI-Types entfernen

#### 4.2 Documentation Update (1h)
- **Architecture Docs:** Update-System Architektur
- **API Documentation:** Neue HTTP-basierte Schnittstellen
- **User Guide:** Vereinfachte Installation (kein GitHub CLI)

---

## 🏗️ Technische Implementierung

### Aktuelle Architektur
```
UpdateDialog (React)
       ↓ IPC
UpdateManagerService
       ↓ CLI
GitHubCliService
       ↓ Exec
   gh.exe Binary
       ↓ HTTP
  GitHub API
```

### Neue Architektur
```
UpdateDialog (React)
       ↓ IPC
UpdateManagerService
       ↓ Direct
 GitHubApiService
       ↓ HTTP
  GitHub API
```

### API-Mapping

| GitHub CLI Command | GitHub HTTP API | Implementation |
|-------------------|-----------------|----------------|
| `gh release view latest --json` | `GET /repos/owner/repo/releases/latest` | `GitHubApiService.getLatestRelease()` |
| `gh release download --dir` | Direct asset URL download | `GitHubApiService.downloadAsset()` |
| CLI Auth | Public API (no auth needed) | No authentication required |

### Rate Limiting Strategy
```typescript
class RateLimitManager {
  private requests: Date[] = [];
  private readonly maxRequests = 60; // GitHub public API limit
  private readonly timeWindow = 3600000; // 1 hour in ms
  
  canMakeRequest(): boolean;
  trackRequest(): void;
  getResetTime(): Date;
}
```

---

## 🔧 Betroffene Dateien

### Neue Dateien
| Datei | Zweck | Aufwand |
|-------|-------|---------|
| `src/main/services/GitHubApiService.ts` | HTTP-basierte GitHub API | 4h |
| `src/main/services/RateLimitManager.ts` | Rate Limiting Logic | 1h |
| `tests/services/GitHubApiService.test.ts` | Unit Tests für neue API | 1h |

### Zu Ändernde Dateien
| Datei | Änderung | Aufwand |
|-------|----------|---------|
| `src/main/services/UpdateManagerService.ts` | Service-Substitution | 2h |
| `tests/services/UpdateManagerService.test.ts` | Mock-Updates | 1h |
| `src/types/github.ts` | Type-Cleanup | 0.5h |

### Zu Löschende Dateien
| Datei | Grund | Impact |
|-------|-------|--------|
| `src/main/services/GitHubCliService.ts` | CLI-Dependency entfernt | Niedrig |
| `tests/services/GitHubCliService.test.ts` | Obsolet | Niedrig |

---

## 🧪 Test-Strategie

### Unit Tests
```typescript
// Beispiel: Rate Limit Testing
test('should respect GitHub API rate limits', async () => {
  const service = new GitHubApiService();
  
  // Simulate 60 requests (GitHub limit)
  for (let i = 0; i < 60; i++) {
    await service.getLatestRelease();
  }
  
  // 61st request should trigger rate limiting
  await expect(service.getLatestRelease())
    .rejects.toThrow('Rate limit exceeded');
});
```

### Integration Tests
```typescript
// Beispiel: E2E Update Flow
test('complete update flow without CLI', async () => {
  const updateManager = new UpdateManagerService();
  
  // Check for updates
  const hasUpdate = await updateManager.checkForUpdates();
  expect(hasUpdate).toBe(true);
  
  // Download update
  const downloadPath = await updateManager.startDownload();
  expect(fs.existsSync(downloadPath)).toBe(true);
  
  // Verify no CLI processes
  expect(getRunningProcesses()).not.toContain('gh.exe');
});
```

### Manual Testing Checklist
- [ ] Update-Erkennung funktioniert ohne CLI
- [ ] Download läuft komplett durch
- [ ] Progress-Events werden korrekt emittiert
- [ ] Fehlerbehandlung bei Network-Issues
- [ ] Rate Limits werden respektiert
- [ ] UI bleibt unverändert

---

## ⚠️ Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| **GitHub API Rate Limits** | Mittel | Niedrig | Rate Limiting + Caching implementieren |
| **Breaking UI Changes** | Niedrig | Hoch | IPC-Interface beibehalten |
| **Download Performance** | Niedrig | Niedrig | Streaming + Progress Tracking |
| **Network Errors** | Hoch | Niedrig | Retry Logic + Exponential Backoff |
| **Authentication Issues** | Niedrig | Niedrig | Public API benötigt keine Auth |

### Rollback-Plan
1. **Git Revert:** Gesamte Migration in einem Feature Branch
2. **CLI Service Restore:** GitHubCliService.ts aus Git-History wiederherstellen
3. **Dependency Rollback:** `gh` CLI Package wieder installieren
4. **Test Suite:** Vollständige Tests vor Release

---

## 📊 Success Metrics

### Funktionalität
- [ ] **Update Detection:** Funktioniert ohne CLI-Abhängigkeiten
- [ ] **Download Completion:** 100% Success Rate bei stabiler Netzverbindung
- [ ] **Error Recovery:** Graceful Handling von Network-Timeouts
- [ ] **UI Consistency:** Keine UI-Änderungen für Endnutzer

### Performance
- [ ] **Response Time:** < 2s für Update-Check
- [ ] **Download Speed:** Mindestens aktuelle CLI-Performance
- [ ] **Memory Usage:** Keine signifikante Erhöhung
- [ ] **Bundle Size:** Reduktion durch CLI-Dependency-Entfernung

### User Experience
- [ ] **Installation:** Keine GitHub CLI Setup erforderlich
- [ ] **First-Time Use:** Funktioniert ohne Benutzer-Authentifizierung
- [ ] **Error Messages:** Verständliche HTTP-basierte Fehlermeldungen
- [ ] **Offline Behavior:** Graceful Degradation ohne Netzwerk

---

## 📝 Changelog Preview

### Version 1.0.8 - GitHub API Migration
#### 🚀 Improvements
- **Update System:** Migrated from GitHub CLI to direct HTTP API
- **User Experience:** Removed GitHub authentication requirements
- **Performance:** Improved download reliability and error handling
- **Dependencies:** Eliminated external `gh` CLI dependency

#### 🔧 Technical Changes
- Added `GitHubApiService` for direct GitHub API communication
- Implemented intelligent rate limiting for GitHub API calls
- Enhanced error handling with HTTP-specific retry logic
- Streamlined update detection and download processes

#### 🧹 Cleanup
- Removed `GitHubCliService` and CLI-related dependencies
- Updated test suites for HTTP-based update system
- Simplified installation process (no external CLI tools required)

---

## 🔗 Verwandte Dokumentation

### Internal References
- [UPDATE_SYSTEM_ARCHITECTURE.md](../01-architecture/UPDATE_SYSTEM_ARCHITECTURE.md)
- [Update Development Guide](../02-development/UPDATE_DEVELOPMENT.md)
- [Update Testing Strategy](../03-testing/UPDATE_TESTING.md)
- [Deployment Updates](../10-deployment/DEPLOYMENT_UPDATES.md)

### External References
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub Release API](https://docs.github.com/en/rest/releases/releases)
- [Rate Limiting Guidelines](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

---

## 🏃‍♂️ Next Steps

1. **Phase 1 Start:** Implementierung von `GitHubApiService`
2. **Prototyping:** Schneller API-Test mit latest release
3. **Integration:** UpdateManagerService Migration
4. **Testing:** Vollständige Test-Suite
5. **Documentation:** Update aller betroffenen Docs
6. **Release:** Version 1.0.8 mit Migration

**Geschätzte Gesamtzeit:** 11 Stunden  
**Target Release:** Version 1.0.8  
**Deadline:** Eine Woche nach Start