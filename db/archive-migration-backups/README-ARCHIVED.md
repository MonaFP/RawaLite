# Archivierte Migration-Backup-Datenbanken

> **Archiviert:** 22.10.2025 | **Grund:** Datenbank-Chaos-Bereinigung  
> **Status:** DEPRECATED - Diese DBs werden nicht von der App verwendet

## 📋 **Archivierte Dateien**

| Datei | Größe | Zweck | Status |
|:--|:--|:--|:--|
| `after-migration-040-fresh.db` | 5100KB | Migration-Test-Backup | ✅ Archiviert |
| `after-migration-040.db` | 5100KB | Migration-Test-Backup | ✅ Archiviert |
| `real-rawalite.db` | 5100KB | Migration-Test-Backup | ✅ Archiviert |

## 🚨 **WICHTIGE KLARSTELLUNG**

**DIESE DATEIEN WAREN NIE AKTIV!**

- ❌ **NICHT verwendet** von der RawaLite-App
- ❌ **NICHT die echte** Produktions-Datenbank
- ✅ **NUR Migration-Test-Backups** aus Development

### **Echte Produktions-DB:**
```
C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
```

### **Konfiguriert in:**
```typescript
// src/main/db/Database.ts
function getDbPath(): string {
  const userData = app.getPath('userData'); // = AppData/Roaming/Electron
  return path.join(userData, 'database', 'rawalite.db');
}
```

## 🎯 **Warum archiviert?**

1. **Verwirrung vermeiden:** `/db` Ordner sollte keine verwaisten DBs enthalten
2. **Klarheit schaffen:** Nur echte App-DB ist relevant für Debugging
3. **KI-Session-Fehler verhindern:** Zukünftige Analysen verwenden korrekte DB

## 📚 **Referenz**

- **Problem dokumentiert in:** `LESSON_FIX-DATABASE-MULTIPLE-INSTANCES-CHAOS_2025-10-22.md`
- **Session:** GitHub Copilot 22.10.2025 - Database-Chaos-Bereinigung
- **Resultat:** `/db/rawalite.db` (0KB) bleibt als Platzhalter, aktive DB unverändert

---

*Diese Dateien können gelöscht werden, wenn Migration-History nicht mehr benötigt wird.*