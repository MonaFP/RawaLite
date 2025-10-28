# Feature Documentation: Image Upload für Angebote
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## Übersicht
Das Image Upload System ermöglicht es Benutzern, Bilder zu Angebotspositionen hinzuzufügen, die automatisch in generierten PDFs angezeigt werden.

## Funktionen

### Bild-Upload
- **Wo**: In der Angebotsbearbeitung bei jeder Position
- **Unterstützte Formate**: PNG, JPG, JPEG, GIF, WebP
- **Speicherung**: Base64 in der Datenbank
- **Größe**: Keine Beschränkungen

### PDF-Integration
- **Anzeige**: 60x45px Thumbnails unter jeder Position
- **Fallback**: Platzhalter-Icon für zu große Bilder (>2MB)
- **Position**: Direkt unter der Positionsbeschreibung

## Benutzeranleitung

### Bild hinzufügen
1. Angebot bearbeiten
2. Bei gewünschter Position auf "📷 Bild hinzufügen" klicken
3. Datei auswählen
4. Bild wird automatisch gespeichert

### Bild entfernen
1. Auf das "🗑️" Symbol neben dem Bild klicken
2. Bestätigung mit "Ja"

### PDF-Generierung
- Bilder erscheinen automatisch in allen generierten PDFs
- Vorschau und Download zeigen identischen Inhalt

## Technische Implementation

### Database Schema
```sql
CREATE TABLE offer_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  line_item_id INTEGER NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  base64_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (line_item_id) REFERENCES offer_line_items(id) ON DELETE CASCADE
);
```

### API Endpoints
Über IPC (Electron):
- `offer-attachment:create` - Neuen Anhang erstellen
- `offer-attachment:delete` - Anhang löschen
- `offer:get` - Angebot mit Anhängen laden

### File Storage
- **Methode**: Base64-Encoding in SQLite-Datenbank
- **Vorteile**: 
  - Keine externen Dateien
  - Portable Backups
  - Automatisches Cleanup
  - Konsistente Daten

### PDF-Rendering
- **Methode**: Data-URLs in HTML-Template
- **Performance**: Größenbegrenzung für große Bilder
- **Styling**: Responsive Thumbnails mit Rahmen

## Limitierungen

### Dateigröße
- **Technisch**: Keine harte Grenze
- **Performance**: Bilder >2MB werden als Platzhalter angezeigt
- **Empfehlung**: Bilder vor Upload optimieren

### Bildqualität
- **PDF-Auflösung**: 60x45px Thumbnails
- **Zweck**: Übersicht, nicht Detailansicht
- **Original**: In Datenbank in voller Qualität gespeichert

## Troubleshooting

### Bild wird nicht angezeigt
1. **Prüfen**: Browser-Cache leeren
2. **Prüfen**: Angebot neu laden
3. **Prüfen**: PDF neu generieren

### Upload schlägt fehl
1. **Dateiformat**: Nur Bildformate unterstützt
2. **Browser**: Moderne Browser erforderlich
3. **Speicher**: Ausreichend RAM für große Bilder

### PDF ohne Bilder
1. **Neustart**: Anwendung neu starten
2. **Version**: Aktuelle Version verwenden
3. **Debug**: Terminal-Logs prüfen

## Security

### File Validation
- **MIME-Type**: Überprüfung des Dateityps
- **Content**: Base64-Validierung
- **Size**: Praktische Größenbegrenzung

### Data Storage
- **Encryption**: Datenbank-Level Verschlüsselung möglich
- **Access**: Nur über authentifizierte API
- **Backup**: In regulären DB-Backups enthalten

---

**Erstellt**: 6. Oktober 2025
**Version**: 1.0.13+
**Status**: Produktiv