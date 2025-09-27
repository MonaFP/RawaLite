# Glossar

## A

**Adapter-Parität**  
Beide Persistenz-Adapter (SQLite, IndexedDB) implementieren identische Schnittstellen und garantieren gleiches Verhalten bei allen Operationen.

**Atomarität**  
Eigenschaft von Datenbank-Transaktionen, bei der alle Operationen entweder vollständig ausgeführt oder vollständig zurückgerollt werden. Besonders kritisch für Nummernkreis-Generierung.

**Auto-Numbering**  
Automatisches Vergabesystem für eindeutige Dokumentnummern mit konfigurierbaren Präfixen, Stellenzahlen und Reset-Modi.

## C

**Context Bridge**  
Electron-Sicherheitsmechanismus, der typisierte IPC-Kommunikation zwischen Main- und Renderer-Prozess ermöglicht ohne Node-Integration.

**Custom Updater**  
RawaLite-spezifisches Update-System basierend auf GitHub Releases API, das vollständig in-App ohne externe Browser-Navigation funktioniert.

## D

**DexieAdapter**  
IndexedDB-basierte Persistenz-Implementierung für Development-Mode und Browser-Fallback-Szenarien.

**Deprecated Patterns**  
Verbotene Implementierungs-Muster, die aus Sicherheits-, Performance- oder Architektur-Gründen nicht verwendet werden dürfen.

## F

**FOUC (Flash of Unstyled Content)**  
Kurzes Aufblitzen von unstyliertem Inhalt beim Laden. RawaLite verhindert dies durch Pre-Loading der Theme-Konfiguration.

## I

**In-App Update**  
Update-Workflow, der vollständig innerhalb der Anwendung abläuft ohne externe Browser-Navigation oder manuelle Downloads.

**IPC (Inter-Process Communication)**  
Kommunikationsmechanismus zwischen Electron Main- und Renderer-Prozess über typisierte Kanäle.

## L

**Lessons Learned**  
Strukturierte Dokumentation aller Debugging- und Analyse-Versuche zur Vermeidung von Doppelarbeit bei Problem-Lösung.

## N

**Numbering Config**  
Konfiguration für Auto-Numbering-System eines Dokumenttyps mit Präfix, Stellenzahl, aktuellem Zähler und Reset-Modus.

## P

**PATHS-Objekt**  
Single Source of Truth für alle Dateipfade in RawaLite, definiert in `src/lib/paths.ts`.

**PDF-Pipeline**  
3-stufiger Workflow: PDFService → PDFPostProcessor → Templates für professionelle Dokument-Generierung.

**Persistence Entry-Point**  
Einziger Zugangspunkt `src/persistence/index.ts` für alle Datenbank-Operationen zur Kapselung der Adapter-Implementierungen.

## S

**SQLiteAdapter**  
SQL.js-basierte Persistenz-Implementierung als primärer Datenbank-Adapter für Production-Mode.

**Standalone-Script**  
Node.js/TypeScript-Skripte außerhalb des Electron-Kontexts (CLI, CI, Build-Tools, Installer), die `path-utils.ts` statt `paths.ts` verwenden.

## T

**Theme-Persistenz**  
Dauerhafte Speicherung der Theme-Auswahl über SQLite/IndexedDB für konsistentes Erscheinungsbild nach App-Neustarts.

**Typisierte IPC-Kanäle**  
Statisch definierte, TypeScript-typisierte Kommunikations-Kanäle zwischen Electron-Prozessen zur Compile-Time-Validierung.
