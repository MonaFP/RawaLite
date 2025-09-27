# Persistenz-Schicht

## Überblick
Die Persistenz-Schicht von RawaLite abstrahiert die Datenhaltung über ein einheitliches Adapter-Pattern. Sie stellt eine konsistente API für alle Datenoperationen bereit, unabhängig vom verwendeten Backend.

## Architektur

### Single Entry Point
- **Einziger Zugang**: `src/persistence/index.ts`
- **Regel**: Alle Services und Components importieren ausschließlich von diesem Entry Point
- **Verboten**: Direkte Importe von Adapter-Implementierungen

```typescript
// Korrekt
import { customerService, offerService } from '@/persistence';

// Verboten
import { SQLiteAdapter } from '@/adapters/SQLiteAdapter';
import { DexieAdapter } from '@/adapters/DexieAdapter';
```

### Adapter Pattern Implementation
- **Primary Adapter**: SQLiteAdapter (Production)
- **Fallback Adapter**: DexieAdapter (Development)
- **Runtime-Auswahl**: Automatisch basierend auf Verfügbarkeit und Environment

## Adapter-Parität

### Einheitliche Schnittstelle
Beide Adapter implementieren identische Interfaces für alle Entitäts-Services:

- `CustomerService`: Kundendatenverwaltung (CRUD + Auto-Numbering)
- `PackageService`: Paket-Templates mit Hierarchie
- `OfferService`: Angebote mit Status-Workflow
- `InvoiceService`: Rechnungen mit Zahlungsstatus
- `TimesheetService`: Leistungsnachweise/Zeiterfassung
- `SettingsService`: App-Konfiguration und Theme-Settings

### Garantierte Funktionsparität
- **Identische API**: Gleiche Methoden, Parameter und Rückgabewerte
- **Gleiche Semantik**: Identisches Verhalten bei allen Operationen
- **Konsistente Fehlerbehandlung**: Einheitliche Error-Types und Messages
- **Performance-Äquivalenz**: Ähnliche Response-Zeiten für vergleichbare Operationen

## Migration System

### Einheitlicher Migrations-Ordner
- **Pfad**: `src/persistence/migrations/`
- **Regel**: Ein gemeinsamer Ordner für beide Adapter
- **Format**: Dateinamen nach Schema `YYYY-MM-DD-HH-mm-description.ts`

### Migrations-Eigenschaften
- **Additiv**: Nur ALTER TABLE, CREATE INDEX, INSERT - niemals DROP oder DELETE
- **Idempotent**: Mehrfache Ausführung führt zum gleichen Ergebnis
- **Rückwärtskompatibel**: Neue Migrations dürfen bestehende Daten nicht brechen
- **Atomär**: Jede Migration ist eine in sich geschlossene Transaktion

### Migrations-Ausführung
- **Automatisch**: Bei App-Start werden ausstehende Migrations erkannt und ausgeführt
- **Logging**: Jede Migration wird mit Timestamp und Erfolg/Fehler protokolliert
- **Rollback**: Bei Fehlern wird Transaction zurückgerollt, App startet mit vorheriger Version
- **Version-Tracking**: Migrations-Status wird in `schema_version` Tabelle verwaltet

## Datenbank-Schemas

### SQLite Schema (Primary)
- **Tabellen**: customers, packages, offers, invoices, timesheets, settings, schema_version
- **Indizierung**: Automatische Indizes für Fremdschlüssel und häufige Queries
- **Constraints**: Foreign Keys, Check Constraints für Datenintegrität
- **Storage**: Einzelne .sqlite Datei über `PATHS.db()`

### IndexedDB Schema (Fallback)
- **Object Stores**: Entsprechen SQLite-Tabellen
- **Indizierung**: Automatische Indizes für Query-Performance
- **Transactions**: Read/Write Transactions für Konsistenz
- **Storage**: Browser-native IndexedDB API

## Service-Implementierung

### Auto-Numbering System
- **Konfigurierbar**: Präfix, Stellen, aktueller Zähler pro Entitätstyp
- **Atomarität**: Threadsafe Nummer-Generation
- **Reset-Optionen**: Nie / Jährlich / Monatlich konfigurierbar
- **Konsistenz**: Identisches Verhalten in beiden Adaptern

### Hierarchische Daten
- **Line Items**: Parent-Child-Beziehungen für Angebots-/Rechnungspositionen
- **Packages**: Mehrfach verschachtelte Paket-Strukturen
- **Rekursive Queries**: Effiziente Tree-Traversierung in beiden Backends

### Transaktions-Management
- **ACID-Eigenschaften**: Atomarität, Konsistenz, Isolation, Dauerhaftigkeit
- **Error Handling**: Automatische Rollbacks bei Fehlern
- **Batch Operations**: Effiziente Bulk-Inserts und Updates

## Performance-Optimierung

### Caching-Strategien
- **In-Memory Cache**: Häufig verwendete Settings und Stammdaten
- **Query-Optimierung**: Prepared Statements und Index-Nutzung
- **Lazy Loading**: On-Demand Laden von Relationship-Daten

### Connection Management
- **SQLite**: Einzelne persistente Connection pro Adapter-Instanz
- **IndexedDB**: Connection-Pool für parallele Transactions
- **Cleanup**: Automatisches Schließen bei App-Shutdown

## Development vs. Production

### Development Mode
- **Primary**: DexieAdapter erlaubt (für einfacheres Debugging)
- **Browser DevTools**: IndexedDB kann über DevTools inspiziert werden
- **Hot Reload**: Schema-Änderungen ohne App-Neustart möglich

### Production Mode  
- **Primary**: SQLiteAdapter verpflichtend
- **Backup Integration**: Automatische Backups vor Migrations
- **File-based**: Bessere Performance und Portabilität

## Backup Integration
- **Vor Migrations**: Automatisches Backup der aktuellen Datenbank
- **Vor Updates**: Integration mit BackupService für App-Updates
- **Recovery**: Restore-Mechanismus bei kritischen Fehlern

## Testing-Strategie
- **Unit Tests**: Isolierte Tests für jeden Adapter einzeln
- **Integration Tests**: Cross-Adapter-Tests für Parität-Validierung
- **Migration Tests**: Automatisierte Tests für alle Migrations-Pfade
- **Performance Tests**: Benchmark-Tests für beide Adapter
