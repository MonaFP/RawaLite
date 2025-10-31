# 📅 Timesheet Day Grouping Feature - RawaLite
> **Tagesgruppenansicht für Leistungsnachweise implementiert**  
> **Erstellt:** 2025-10-09 | **Status:** Production Ready

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Validated Documentation (automatisch durch Erkannt durch "UI System", "Theme Management", "Frontend Development" erkannt)
> - **TEMPLATE-QUELLE:** 04-ui User Interface Documentation Template
> - **AUTO-UPDATE:** Bei UI-Component-Änderung automatisch Documentation aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "UI System", "Theme Management", "Frontend Development"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):** 
 **📚 STATUS = Validated:**
 - ✅ **UI Documentation** - Verlässliche Quelle für Component und Theme Management
 - ✅ **Frontend Standards** - Authoritative Standards für UI-Entwicklung
 - 🎯 **AUTO-REFERENCE:** Bei UI-Entwicklung IMMER diese Documentation konsultieren
 - 🔄 **AUTO-TRIGGER:** Bei Keywords "UI BROKEN" → Frontend-Documentation-Update erforderlich

---

## 🎯 **Übersicht**

Die neue Tagesgruppenansicht für Leistungsnachweise bietet eine kompakte, übersichtliche Darstellung von Zeiterfassungsaktivitäten sowohl in der UI als auch in der PDF-Ausgabe.

**Kernfunktionen:**
- ✅ UI-only Gruppierung nach Datum ohne Schema-Änderungen
- ✅ Toggle zwischen traditioneller Listen- und Tagesgruppenansicht
- ✅ Automatische PDF-Ausgabe immer in Tagesgruppenansicht
- ✅ Kompakte Darstellung: **[📅] Datum │ Tätigkeiten │ Stunden │ €Betrag**

---

## 🏗️ **Implementierung**

### **UI Components**
```
src/utils/timesheetGrouping.ts       # Gruppierungs-Logik
src/components/TimesheetDayGroupComponent.tsx  # React Komponente
src/pages/TimesheetsPage.tsx         # Integration mit Toggle
```

### **PDF System**
```
electron/main.ts                     # PDF Template mit Tagesgruppenansicht
src/services/PDFService.ts           # Datenübertragung
```

---

## 📊 **UI Funktionalität**

### **Tagesgruppenansicht (UI)**
- **Toggle-Button**: 📅 Tagesgruppenansicht ↔ 📋 Listansicht
- **Expandierbare Gruppen**: Einzelne Aktivitäten pro Tag
- **Auto-Berechnung**: Gesamtstunden und -betrag pro Tag
- **CRUD Operations**: Hinzufügen, Bearbeiten, Löschen von Aktivitäten

### **Darstellung**
```
[▶] 9.10.2025 │ Beratung, Entwicklung, Meeting │ 24h gesamt │ €1200.00
  ↳ 09:00-17:00 │ Beratung │ 8h │ €400.00
  ↳ 09:00-17:00 │ Entwicklung │ 8h │ €400.00  
  ↳ 09:00-17:00 │ Meeting │ 8h │ €400.00
```

---

## 📄 **PDF Integration**

### **Automatische Tagesgruppenansicht**
- **Immer aktiv**: PDF verwendet ausschließlich Tagesgruppenansicht
- **Kompakte Darstellung**: Nur eine Zeile pro Datum
- **Keine Uhrzeiten**: Fokus auf Tätigkeiten und Gesamtstunden

### **PDF Template Struktur**
```html
<table>
  <thead>
    <tr>
      <th>Datum</th>
      <th>Tätigkeiten</th>
      <th>Stunden</th>
      <th>Stundensatz</th>
      <th>Gesamt</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8f9fa; border-top: 2px solid ${primaryColor};">
      <td>📅 5.10.2025</td>
      <td>Dokumentation</td>
      <td>8.0h</td>
      <td>€50.00</td>
      <td>€400.00</td>
    </tr>
    <tr>
      <td>📅 9.10.2025</td>
      <td>Beratung, Meeting</td>
      <td>16.0h</td>
      <td>€50.00</td>
      <td>€800.00</td>
    </tr>
  </tbody>
</table>
```

---

## 🔧 **Technische Details**

### **Schema Compliance**
- ✅ **Keine DB-Änderungen**: Bestehende `timesheet_activities` Tabelle unverändert
- ✅ **Field Mapping**: Vollständige Kompatibilität mit `field-mapper.ts`
- ✅ **convertSQLQuery()**: Korrekte snake_case/camelCase Konvertierung

### **Gruppierungs-Algorithmus**
```typescript
// src/utils/timesheetGrouping.ts
export function groupActivitiesByDate(activities: TimesheetActivity[]): TimesheetDayGroup[] {
  const groups = new Map<string, TimesheetDayGroup>();
  
  activities.forEach(activity => {
    const date = activity.date;
    if (!groups.has(date)) {
      groups.set(date, {
        date,
        activities: [],
        totalHours: 0,
        totalAmount: 0,
        isExpanded: false
      });
    }
    
    const group = groups.get(date)!;
    group.activities.push(activity);
    group.totalHours += activity.hours || 0;
    group.totalAmount += activity.total || 0;
  });
  
  return Array.from(groups.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
```

### **PDF Template Integration**
```typescript
// electron/main.ts - PDF Template
${templateType === 'timesheet' && entity.activities?.length > 0 ? (() => {
  const groupActivitiesByDate = (activities: any[]) => {
    // Inline grouping logic for PDF
  };
  
  const dayGroups = groupActivitiesByDate(entity.activities);
  
  return dayGroups.map((group: any) => {
    const formattedDate = new Date(group.date).toLocaleDateString('de-DE');
    const activitiesList = group.activities.map((a: any) => a.title).join(', ');
    const avgHourlyRate = group.activities.length > 0 ? group.activities[0].hourlyRate : 0;
    
    return `
      <tr style="background-color: #f8f9fa; border-top: 2px solid ${primaryColor};">
        <td style="font-weight: bold; color: ${primaryColor};">📅 ${formattedDate}</td>
        <td style="font-weight: bold;">${activitiesList}</td>
        <td style="font-weight: bold; color: ${primaryColor};">${group.totalHours.toFixed(1)}h</td>
        <td style="font-weight: bold;">€${avgHourlyRate.toFixed(2)}</td>
        <td style="font-weight: bold; color: ${primaryColor};">€${group.totalAmount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
})() : /* fallback for offers/invoices */}
```

---

## 🎨 **Design Prinzipien**

### **UI/UX**
- **Minimal Interface**: Toggle-Button für einfache Umschaltung
- **Konsistente Icons**: 📅 für Datum, 📋 für Liste
- **Expandierbare Gruppen**: Übersicht bei Bedarf mit Details
- **Theme Integration**: Verwendet bestehende Farbpalette

### **PDF Layout**
- **Kompakt**: Maximal eine Zeile pro Datum
- **Lesbar**: Klare Trennung durch Farben und Icons
- **Professionell**: Konsistent mit bestehenden PDF-Standards
- **Platzsparend**: Entfernung redundanter Uhrzeiten und Zwischenzeilen

---

## 📋 **Testing & Validation**

### **Getestete Szenarien**
- ✅ Einzelne Aktivität pro Tag
- ✅ Mehrere Aktivitäten pro Tag  
- ✅ Verschiedene Datum-Bereiche
- ✅ UI Toggle-Funktionalität
- ✅ PDF-Generierung und -Vorschau
- ✅ Theme-Kompatibilität

### **Edge Cases**
- ✅ Leere Aktivitätsliste → "Keine Aktivitäten" 
- ✅ Aktivitäten ohne Titel → Fallback-Behandlung
- ✅ Null/undefined Werte → Sichere Defaults

---

## 🚀 **Deployment**

### **Produktive Nutzung**
- **UI**: Sofort verfügbar nach Component-Integration
- **PDF**: Automatisch für alle neuen Leistungsnachweise
- **Kompatibilität**: Vollständig rückwärtskompatibel mit bestehenden Daten

### **Performance**
- **Grouping**: O(n) Komplexität für n Aktivitäten
- **Memory**: Minimaler Overhead durch Map-basierte Gruppierung
- **PDF**: Inline-Template-Generierung ohne zusätzliche Dependencies

---

## 📚 **Zugehörige Dokumentation**

- **[Schema Standards](../01-standards/standards.md)** - Field Mapping Compliance
- **[PDF System](./INDEX.md)** - PDF-Generierung Architektur
- **[Paths System](../06-paths/PATHS-SYSTEM-DOCUMENTATION.md)** - IPC und Renderer/Main Isolation

---

## 🔮 **Zukünftige Erweiterungen**

### **Mögliche Features**
- Gruppierung nach Woche/Monat
- Exportierbare Gruppierungs-Einstellungen
- Custom Sortierung innerhalb von Gruppen
- Filter für bestimmte Aktivitäts-Typen

### **API Erweiterungen**
- REST API für Gruppierungs-Daten
- Externe Integration mit Zeiterfassungs-Tools
- Bulk-Import von gruppierten Aktivitäten

---

*Implementiert: 2025-10-09 | Status: ✅ Production Ready*