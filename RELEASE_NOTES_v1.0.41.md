# RawaLite v1.0.41 - Invoice Attachments System

## 🚀 **Neue Features**

### **📎 Vollständiges Invoice Attachments System**
- **Datei-Uploads für Rechnungen**: Bilder können jetzt direkt an Rechnung-Positionen angehängt werden
- **Automatische Attachment-Übertragung**: Beim Konvertieren von Angeboten zu Rechnungen werden alle Anhänge automatisch übernommen
- **PDF-Integration**: Hochgeladene Bilder werden als 60x45px Thumbnails in generierte PDF-Rechnungen eingebettet
- **Database-Only Storage**: Base64-Speicherung für maximale Portabilität ohne File-System Dependencies

### **⚡ Technische Verbesserungen**
- **Field-Mapper Compliance**: Alle Attachment-Queries verwenden jetzt korrekt den RawaLite Field-Mapper
- **CRUD Operations**: Vollständige Create, Read, Update, Delete Funktionalität für Invoice-Anhänge
- **Interface Synchronisation**: Vollständige TypeScript Interface-Abdeckung mit korrekten Methodensignaturen

## 🔧 **Architektur-Verbesserungen**

### **Database Schema**
- Migration 020: Neue `invoice_attachments` Tabelle mit Foreign Key Constraints
- Automatische Cleanup-Triggers bei Rechnung/Position-Löschung
- Index-Optimierung für bessere Query-Performance

### **API Konsistenz**
- `createInvoiceAttachment()` - Neue Anhänge erstellen
- `getInvoiceAttachments()` - Anhänge laden (mit optionalem lineItemId Filter)
- `updateInvoiceAttachment()` - Anhänge bearbeiten
- `deleteInvoiceAttachment()` - Anhänge löschen

### **UI/UX Improvements**
- Drag & Drop Image Upload für Rechnung-Positionen
- Live-Thumbnail Previews mit Dateigröße-Anzeige
- Ein-Click Attachment-Entfernung
- Responsive Attachment-Grid Layout

## 🏗️ **Migration & Kompatibilität**

### **Automatische Migration**
- **Migration 020** wird automatisch beim ersten Start ausgeführt
- Vollständige Backward Compatibility mit bestehenden Rechnungen
- Keine Benutzeraktion erforderlich

### **Field-Mapper Fixes**
- **KRITISCH**: Korrigierte alle Attachment SQL-Queries auf RawaLite Field-Mapper Standard
- Alle Queries verwenden jetzt `convertSQLQuery()` + camelCase → snake_case Transformation
- Einheitliche API-Patterns für Offer- und Invoice-Attachments

## 📊 **User Workflow**

### **Neue Rechnung mit Anhängen**
1. Rechnung erstellen/bearbeiten
2. Bei jeder Position: Bilder via File-Upload hinzufügen
3. Live-Preview der Thumbnails im Form
4. Speichern → Anhänge werden in Database gespeichert

### **Angebot → Rechnung Konvertierung**
1. "Aus Angebot übernehmen" auswählen
2. Alle Positionen + Anhänge werden automatisch übertragen
3. Zusätzliche Anhänge können hinzugefügt/entfernt werden
4. User-Feedback zeigt Anzahl übertragener Anhänge

### **PDF Export**
1. "PDF Export" oder "Vorschau" klicken
2. Anhänge werden automatisch als Thumbnails eingebettet
3. Positioned unter jeder entsprechenden Position
4. Professionelle PDF-Layout Darstellung

## ⚡ **Performance & Stabilität**

### **Database-Only Storage**
- Base64-Encoding für maximale Portabilität
- Keine File-System Dependencies
- Automatische Backup-Integration
- Konsistente Cross-Platform Funktionalität

### **Validierte Architektur**
- ✅ Alle Schemata RawaLite-konform
- ✅ Field-Mapper korrekt implementiert
- ✅ Build erfolgreich ohne Errors
- ✅ Vollständige TypeScript Type-Safety

## 🎯 **Breaking Changes**
**Keine Breaking Changes** - Vollständige Backward Compatibility

## 📝 **Developer Notes**

### **Field-Mapper Compliance**
Alle Attachment-SQL-Queries wurden korrigiert auf korrektes RawaLite Pattern:
```typescript
// ✅ KORREKT (v1.0.41):
const query = convertSQLQuery(`SELECT * FROM invoice_attachments WHERE invoiceId = ?`);
// → automatisch transformiert zu: SELECT * FROM invoice_attachments WHERE invoice_id = ?

// ❌ VORHER (v1.0.40):
const query = `SELECT * FROM invoice_attachments WHERE invoice_id = ?`;
```

### **Interface Completeness**
Alle CRUD-Operationen jetzt vollständig im PersistenceAdapter Interface definiert:
```typescript
createInvoiceAttachment(attachment: Omit<InvoiceAttachment, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceAttachment>;
getInvoiceAttachments(invoiceId: number, lineItemId?: number): Promise<InvoiceAttachment[]>;
updateInvoiceAttachment(id: number, patch: Partial<InvoiceAttachment>): Promise<InvoiceAttachment>;
deleteInvoiceAttachment(id: number): Promise<void>;
```

---

**Version:** v1.0.41  
**Release Datum:** 10. Oktober 2025  
**Kompatibilität:** Windows 10/11 (x64)  
**Electron Version:** 31.7.7  

**Download:** [RawaLite-Setup-1.0.41.exe](https://github.com/MonaFP/RawaLite/releases/tag/v1.0.41)