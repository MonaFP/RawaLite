# RawaLite Dokumentation - Übersicht

*Stand: 15. September 2025*

## 📚 **Dokumentations-Struktur**

### 🎯 **Kern-Dokumentation (Aktuell & Empfohlen)**

| Datei | Zweck | Status | Letzte Aktualisierung |
|-------|-------|--------|----------------------|
| **SYSTEM_STATUS_V1_7_2.md** | **Vollständiger aktueller Status** | ✅ Aktuell | 15.09.2025 |
| **PROJECT_OVERVIEW.md** | Projekt-Überblick & Architektur | ✅ Aktuell | Migrated |
| **TEMPLATE_MIGRATION_ANALYSIS.md** | Template-Probleme & Lösungen | ✅ Aktuell | 15.09.2025 |
| **THEMES_NAVIGATION.md** | UI/UX Theme & Navigation System | ✅ Aktuell | Existing |
| **PDF_SYSTEM.md** | PDF-Generation & Templates | ✅ Aktuell | Existing |

### 🔧 **Entwickler-Dokumentation**

| Datei | Zweck | Status | Empfehlung |
|-------|-------|--------|------------|
| **DEV_GUIDE_NEW.md** | Moderne Development Guidelines | ✅ Bevorzugen | Use This |
| ~~DEV_GUIDE.md~~ | Legacy Development Guide | ✅ Entfernt | Migrated to DEV_GUIDE_NEW.md |
| **DEBUGGING_STANDARDS.md** | Debug-Strategien & Standards | ✅ Aktuell | Migrated |
| INSTALL.md | Installation & Setup | ❓ Prüfen | Review needed |

### 🏗️ **Architektur-Dokumentation**

| Datei | Zweck | Status | Empfehlung |
|-------|-------|--------|------------|
| **ARCHITECTURE.md** | Moderne Architektur-Beschreibung | ✅ Bevorzugen | Use This |
| ~~ARCHITEKTUR.md~~ | Legacy Architektur | ✅ Entfernt | Merged into ARCHITECTURE.md |
| MIGRATION_SYSTEM.md | Datenbank-Migrationen | ✅ Aktuell | Keep |
| VERSION_MANAGEMENT.md | Versions-Management | ✅ Aktuell | Keep |

### 🚀 **Release & CI/CD**

| Datei | Zweck | Status | Empfehlung |
|-------|-------|--------|------------|
| **RELEASE_OPTIMIZED.md** | Optimierte Release-Pipeline | ✅ Aktuell | Migrated |
| RELEASE_PROCESS.md | Legacy Release Process | ⚠️ Veraltet | → Konsolidieren |
| RELEASE_GUIDELINES.md | Release Guidelines | ❓ Prüfen | Review vs Optimized |
| **AUTO_UPDATER_IMPLEMENTATION.md** | Update-System Details | ✅ Aktuell | Migrated |
| CI_CD_SETUP.md | CI/CD Configuration | ❓ Prüfen | Review needed |

## 📋 **Aufräum-Empfehlungen**

### 🗑️ **Zu konsolidieren/entfernen**
```
DEV_GUIDE.md              → In DEV_GUIDE_NEW.md integrieren
ARCHITEKTUR.md            → In ARCHITEKTUR_NEW.md integrieren  
RELEASE_PROCESS.md        → In RELEASE_OPTIMIZED.md integrieren
```

### ❓ **Zu überprüfen**
```
INSTALL.md                → Noch aktuell? Setup korrekt?
RELEASE_GUIDELINES.md     → Überschneidung mit RELEASE_OPTIMIZED.md?
CI_CD_SETUP.md            → Aktuell mit Guards-System?
```

## 🎯 **Neue Struktur (Empfehlung)**

### 📁 **Reorganisation**
```
docs/
├── README.md                    # Doku-Übersicht (diese Datei)
├── SYSTEM_STATUS_V1_7_2.md      # ⭐ Haupt-Status-Dokument
├── 
├── core/                        # Kern-Dokumentation
│   ├── PROJECT_OVERVIEW.md      # Projekt-Überblick
│   ├── ARCHITECTURE.md          # → Konsolidiert aus _NEW
│   └── THEMES_NAVIGATION.md     # UI/UX System
│
├── development/                 # Entwickler-Guides  
│   ├── DEV_GUIDE.md             # → Konsolidiert aus _NEW
│   ├── DEBUGGING_STANDARDS.md
│   ├── INSTALL.md
│   └── PDF_SYSTEM.md
│
├── operations/                  # Release & Operations
│   ├── RELEASE_PROCESS.md       # → Konsolidiert aus _OPTIMIZED
│   ├── AUTO_UPDATER_IMPLEMENTATION.md
│   ├── VERSION_MANAGEMENT.md
│   └── CI_CD_SETUP.md
│
└── troubleshooting/            # Problem-Analysen
    ├── TEMPLATE_MIGRATION_ANALYSIS.md
    └── MIGRATION_SYSTEM.md
```

## ✅ **Nächste Schritte**

1. **Legacy-Dateien konsolidieren** (DEV_GUIDE.md, ARCHITEKTUR.md, etc.)
2. **Veraltete Inhalte aktualisieren** (INSTALL.md, CI_CD_SETUP.md)
3. **Ordner-Struktur implementieren** (optional, für bessere Organisation)
4. **README.md aktualisieren** (Root-Level Einstiegspunkt)

## 🎯 **Wartungs-Guidelines**

- **Bei Code-Änderungen**: Relevante Dokumentation parallel aktualisieren
- **Bei neuen Features**: SYSTEM_STATUS_V1_7_2.md erweitern
- **Bei Architektur-Änderungen**: ARCHITECTURE.md aktualisieren
- **Bei Bug-Fixes**: Troubleshooting-Docs ergänzen