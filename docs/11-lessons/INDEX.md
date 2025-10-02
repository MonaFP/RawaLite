# Lessons Learned - Gesammelte Erkenntnisse

Dieser Ordner sammelt wichtige Erkenntnisse und Lösungen aus der RawaLite-Entwicklung für zukünftige Referenz und Problemvermeidung.

## 📋 Übersicht der dokumentierten Lessons

### Database & Schema
- **[SCHEMA-CONSISTENCY-LESSONS.md](./solved/SCHEMA-CONSISTENCY-LESSONS.md)** - Umfassende Schema-Konsistenz-Reparatur zwischen camelCase und snake_case
- **[NUMMERNKREISE-PRODUCTION-BUG.md](./solved/NUMMERNKREISE-PRODUCTION-BUG.md)** - ✅ **SOLVED:** Production Bug: Fehlende Nummernkreise durch unvollständige Migration

### Architecture & IPC  
- **[IPC-ARCHITECTURE-LESSONS.md](./solved/IPC-ARCHITECTURE-LESSONS.md)** - Unified IPC Architecture für Window.rawalite Integration

### Frontend & State Management
- **[UPDATE-BUTTON-FIX-LESSONS.md](../00-standards/debugging/solved/LESSONS-LEARNED-update-button-fix.md)** - ✅ **SOLVED:** Update Button Funktionalitätsfehler durch Async State Race Condition

### Documentation & Project Management
- **[DOCUMENTATION-REORGANIZATION-LESSONS.md](./solved/DOCUMENTATION-REORGANIZATION-LESSONS.md)** - KI-optimierte Dokumentationsstruktur mit lückenloser 00-12 Nummerierung

## 🎯 Haupterkenntnisse

### 1. **Systematisches Debugging**
- **Backend → Frontend:** Probleme systematisch von der Datenbank zur UI untersuchen
- **Verschiedene Umgebungen:** Dev vs Production können unterschiedliche Zustände haben
- **Debug-Logs:** Strategisch in kritischen Bereichen platzieren

### 2. **Schema & Migration Management**
- **Single Source of Truth:** Field-Mapper als zentrale Mapping-Quelle
- **Robuste Migrations:** Separate Migrations für jede logische Änderung
- **Backup-First:** Immer Backup vor kritischen Schema-Änderungen

### 3. **IPC Architecture**
- **Unified Bridge:** `window.rawalite` als einziger Kommunikationskanal
- **Main Process Direct DB:** Datenbankzugriff nur im Main Process
- **Type Safety:** Typescript-Interfaces für IPC-Kommunikation

### 4. **Documentation Strategy**
- **KI-optimiert:** Lückenlose Nummerierung für bessere Navigation
- **Workflow-orientiert:** Struktur folgt Entwicklungsphasen
- **Cross-References:** Verweise zwischen verwandten Dokumenten

## 🔄 Wiederkehrende Patterns

### Problem-Solving Workflow
1. **Symptome dokumentieren** - Was genau funktioniert nicht?
2. **Systematisch debuggen** - Backend → Frontend, Dev → Prod
3. **Root Cause identifizieren** - Echte Ursache vs. Symptom
4. **Lösung implementieren** - Robust und future-proof
5. **Validieren** - Alle Umgebungen testen
6. **Dokumentieren** - Lessons Learned festhalten

### Code Quality Practices
- **Defensive Programming** - Null checks, Error handling
- **Separation of Concerns** - Klare Verantwortlichkeiten
- **Consistent Naming** - Einheitliche Konventionen
- **Comprehensive Testing** - Dev und Production validieren

## 📚 Referenz-Index

| Problem | Bereich | Lösung | Datei |
|---------|---------|--------|--------|
| Schema Mismatch | Database | Field-Mapper System | SCHEMA-CONSISTENCY-LESSONS.md |
| Fehlende Nummernkreise | Production | ✅ Migration 006 | NUMMERNKREISE-PRODUCTION-BUG.md |
| IPC Chaos | Architecture | Unified window.rawalite | IPC-ARCHITECTURE-LESSONS.md |
| Update Button funktionslos | Frontend | ✅ Async State Fix | UPDATE-BUTTON-FIX-LESSONS.md |
| Unstrukturierte Docs | Documentation | 00-12 KI-Struktur | DOCUMENTATION-REORGANIZATION-LESSONS.md |

## 🔮 Zukünftige Verbesserungen

### Monitoring & Validation
- [ ] Automatische Schema-Validierung nach Migrations
- [ ] Production Health Checks für kritische Daten  
- [ ] Automated Integration Tests für alle Modi

### Development Experience
- [ ] Migration Testing Framework
- [ ] Improved Debug Tools
- [ ] Production Debugging Dashboard

---
**Hinweis:** Diese Sammlung wird kontinuierlich erweitert. Jede signifikante Problemlösung sollte hier dokumentiert werden.