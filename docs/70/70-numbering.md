# Nummernkreise

## Überblick
RawaLite implementiert ein flexibles Auto-Numbering-System für alle Geschäftsdokumente. Jeder Dokumenttyp erhält automatisch eindeutige, fortlaufende Nummern nach konfigurierbaren Regeln.

## Konfigurierbare Parameter

### Pro Dokumenttyp konfigurierbar:

#### Präfix
- **Kunden**: `K-` (K-0001, K-0002, ...)
- **Pakete**: `PAK-` (PAK-001, PAK-002, ...)  
- **Angebote**: `AN-{YYYY}-` (AN-2025-0001, AN-2025-0002, ...)
- **Rechnungen**: `RE-{YYYY}-` (RE-2025-0001, RE-2025-0002, ...)
- **Leistungsnachweise**: `LN-{YYYY}-` (LN-2025-0001, LN-2025-0002, ...)

#### Stellenzahl
- **Konfigurierbar**: 3-6 Stellen mit führenden Nullen
- **Standard**: 4 Stellen (0001, 0002, 0003, ...)
- **Maximum**: 999999 (6-stellig)

#### Aktueller Zähler
- **Persistent**: Gespeichert in Datenbank (settings-Tabelle)
- **Atomarität**: Thread-safe Increment-Operation
- **Nachverfolgung**: Letzter verwendeter Wert je Dokumenttyp

#### Reset-Modus
- **Nie**: Kontinuierliche Nummerierung (Standard für Kunden, Pakete)
- **Jährlich**: Reset zum Jahreswechsel (Standard für Angebote, Rechnungen, Leistungsnachweise)
- **Monatlich**: Reset zum Monatsanfang (optional für alle Typen)

## Atomarität und Konsistenz

### Thread-Safe Implementation
- **Database-Locks**: Verwendung von Transactionen für Nummer-Generation
- **Race-Condition-Schutz**: Gleichzeitige Anfragen erhalten unterschiedliche Nummern
- **Retry-Mechanismus**: Bei Conflicts automatische Wiederholung
- **Rollback-Sicherheit**: Bei fehlgeschlagenen Dokumenterstellungen wird Nummer nicht "verbraucht"

### Konsistenz-Garantien
- **Eindeutigkeit**: Keine doppelten Nummern innerhalb eines Dokumenttyps
- **Lückenlosigkeit**: Optional konfigurierbar (bei Löschungen)
- **Chronologie**: Höhere Nummern entsprechen späterem Erstellungszeitpunkt
- **Mandanten-Trennung**: Nummernkreise sind pro Installation isoliert

## Jahres-Reset Implementation

### Automatischer Reset
- **Trigger**: Bei erster Nummer-Generierung im neuen Jahr
- **Validierung**: Vergleich aktuelle Jahr vs. gespeichertes Jahr
- **Backup**: Alte Nummernstände werden archiviert
- **Migration**: Historische Dokumente behalten ihre Original-Nummern

### Reset-Konfiguration
```typescript
interface NumberingConfig {
  documentType: 'customer' | 'package' | 'offer' | 'invoice' | 'timesheet';
  prefix: string;                    // z.B. "AN-{YYYY}-"
  digits: number;                    // Anzahl Stellen (3-6)
  resetMode: 'never' | 'yearly' | 'monthly';
  currentCounter: number;            // Aktueller Zählerstand
  lastResetDate?: string;            // Letzter Reset (ISO-Date)
}
```

## Vorschau-System

### "Nächste Nummer"-Anzeige
- **UI-Integration**: Anzeige der nächsten Nummer vor Dokumenterstellung
- **Non-Destructive**: Vorschau reserviert keine Nummer
- **Real-Time**: Aktualisierung bei Änderung der Numbering-Config
- **Format-Preview**: Vollständige Darstellung mit Präfix und Formatierung

### Konfiguration-Preview
- **Format-Validation**: Sofortige Anzeige bei Config-Änderungen
- **Jahres-Simulation**: Preview für verschiedene Jahre/Monate
- **Conflict-Detection**: Warnung bei potentiellen Überschneidungen

## Testing-Anforderungen

### Parallelität-Tests
```typescript
// Test: Gleichzeitige Nummer-Generierung
describe('Concurrent Number Generation', () => {
  it('should generate unique numbers under load', async () => {
    // 100 parallele Requests → 100 eindeutige Nummern
    const promises = Array.from({length: 100}, () => 
      numberingService.getNextNumber('offer')
    );
    const numbers = await Promise.all(promises);
    expect(new Set(numbers)).toHaveLength(100);
  });
});
```

### Reset-Tests
```typescript
// Test: Jahres-Reset Funktionalität
describe('Yearly Reset', () => {
  it('should reset counter on year change', async () => {
    // 2024: AN-2024-0001, AN-2024-0002
    // 2025: AN-2025-0001 (Reset auf 1)
    await timeTravel(new Date('2025-01-01'));
    const newYearNumber = await numberingService.getNextNumber('offer');
    expect(newYearNumber).toBe('AN-2025-0001');
  });
});
```

### Edge-Case-Tests
- **Rollover**: Verhalten bei Erreichen der maximalen Stellenzahl
- **Config-Changes**: Auswirkung von Präfix/Format-Änderungen auf bestehende Dokumente
- **Database-Corruption**: Recovery bei beschädigten Numbering-Settings
- **Performance**: Response-Zeit bei hoher Load

## Service Implementation

### NumberingService Interface
```typescript
interface NumberingService {
  getNextNumber(documentType: DocumentType): Promise<string>;
  previewNextNumber(documentType: DocumentType): Promise<string>;
  updateConfig(documentType: DocumentType, config: NumberingConfig): Promise<void>;
  getConfig(documentType: DocumentType): Promise<NumberingConfig>;
  resetCounter(documentType: DocumentType): Promise<void>;
}
```

### Adapter-Integration
- **SQLite**: Verwendung von `BEGIN IMMEDIATE` Transaktionen für Atomarität
- **IndexedDB**: Verwendung von ReadWrite-Transaktionen mit Object-Locks
- **Consistent API**: Identisches Verhalten in beiden Adapters

## Migration und Upgrade

### Schema-Evolution
- **Backward-Compatibility**: Alte Numbering-Configs bleiben gültig
- **Migration-Path**: Automatische Konvertierung alter Formate
- **Default-Values**: Sinnvolle Defaults für neue Installations

### Import/Export
- **Settings-Export**: Numbering-Config kann exportiert werden
- **Bulk-Migration**: Import von externen Numbering-Schemata
- **Validation**: Importierte Configs werden auf Konsistenz geprüft

## Performance-Optimierung

### Caching-Strategie
- **In-Memory Cache**: Aktuelle Numbering-Configs werden gecacht
- **Cache-Invalidation**: Updates invalidieren Cache sofort
- **Lazy-Loading**: Configs werden nur bei Bedarf geladen

### Database-Optimierung
- **Prepared Statements**: Vorkompilierte SQL für Nummer-Generation
- **Index-Strategy**: Optimale Indizes für Numbering-Queries
- **Connection-Pooling**: Effiziente DB-Connection-Nutzung
## Überblick
Automatische Nummerierung für Dokumenttypen.

## Konfigurierbar
- Präfix
- Stellen
- Aktueller Zähler
- Reset (Nie/Jährlich/Monatlich)

## Regeln
- Atomarität garantiert.
- Jahres-Reset optional.

## Tests
- Vorschau „nächste Nummer“.
- Parallelität.
