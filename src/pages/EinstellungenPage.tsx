import React, { useState } from "react";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";
import { usePersistence } from "../contexts/PersistenceContext";
import type { CompanyData, NumberingCircle } from "../lib/settings";

interface EinstellungenPageProps {
  title?: string;
}

export default function EinstellungenPage({ title = "Einstellungen" }: EinstellungenPageProps) {
  const { settings, loading, error, updateCompanyData, updateNumberingCircles } = useUnifiedSettings();
  const { adapter } = usePersistence();
  const [activeTab, setActiveTab] = useState<'company' | 'logo' | 'tax' | 'bank' | 'numbering' | 'maintenance'>('company');
  const [companyFormData, setCompanyFormData] = useState<CompanyData>(settings.companyData);
  const [numberingFormData, setNumberingFormData] = useState<NumberingCircle[]>(settings.numberingCircles);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [importType, setImportType] = useState<'customers' | 'invoices' | 'offers'>('customers');

  // Update form data when settings change
  React.useEffect(() => {
    setCompanyFormData(settings.companyData);
    setNumberingFormData(settings.numberingCircles);
  }, [settings]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximum 2MB erlaubt.');
      return;
    }

    try {
      setUploadingLogo(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCompanyFormData(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Fehler beim Laden des Logos');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setCompanyFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateCompanyData(companyFormData);
      alert('Unternehmensdaten gespeichert!');
      // Automatischer Reload nach dem Speichern, damit Logo in Sidebar erscheint
      window.location.reload();
    } catch (error) {
      alert('Fehler beim Speichern der Unternehmensdaten');
    } finally {
      setSaving(false);
    }
  };

  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tax form submitted, NOT calling clear data');
    try {
      setSaving(true);
      await updateCompanyData(companyFormData);
      alert('Steuerliche Einstellungen gespeichert!');
    } catch (error) {
      console.error('Tax settings save error:', error);
      alert('Fehler beim Speichern der steuerlichen Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  // Separate Funktion für Kleinunternehmer-Checkbox um Probleme zu vermeiden
  const handleKleinunternehmerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔧 Kleinunternehmer checkbox changed to:', e.target.checked, 'NOT deleting any data');
    
    // Prevent any bubbling or other events
    e.stopPropagation();
    
    setCompanyFormData({ ...companyFormData, kleinunternehmer: e.target.checked });
  };

  const handleNumberingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateNumberingCircles(numberingFormData);
      alert('Nummernkreise gespeichert!');
    } catch (error) {
      alert('Fehler beim Speichern der Nummernkreise');
    } finally {
      setSaving(false);
    }
  };

  const updateNumberingCircle = (index: number, field: keyof NumberingCircle, value: any) => {
    const updated = [...numberingFormData];
    updated[index] = { ...updated[index], [field]: value };
    setNumberingFormData(updated);
  };

  // Maintenance functions
  const handleCreateBackup = async () => {
    try {
      setSaving(true);
      
      if (!adapter) {
        alert('Fehler: Datenbankadapter nicht verfügbar');
        return;
      }
      
      // Sammle alle Daten über den Adapter
      const [customers, invoices, offers, packages] = await Promise.all([
        adapter.listCustomers(),
        adapter.listInvoices(), 
        adapter.listOffers(),
        adapter.listPackages()
      ]);

      const backupData = {
        companyData: settings.companyData,
        numberingCircles: settings.numberingCircles,
        customers,
        invoices,
        offers,
        packages,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // Erstelle ZIP-Datei
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      zip.file('backup.json', JSON.stringify(backupData, null, 2));
      zip.file('README.txt', `RawaLite Backup
Erstellt am: ${new Date().toLocaleDateString('de-DE')}
Version: ${backupData.version}

Diese Datei enthält alle Ihre RawaLite-Daten und kann über die Wartungs-Funktion importiert werden.

Enthaltene Daten:
- Kunden: ${customers.length}
- Rechnungen: ${invoices.length}
- Angebote: ${offers.length}
- Pakete: ${packages.length}
- Unternehmenseinstellungen
- Nummernkreise`);

      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download starten
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rawalite-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`Backup erfolgreich erstellt!
      
Enthalten:
- ${customers.length} Kunden
- ${invoices.length} Rechnungen  
- ${offers.length} Angebote
- ${packages.length} Pakete`);
    } catch (error) {
      console.error('Backup error:', error);
      alert('Fehler beim Erstellen des Backups: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async (type: 'customers' | 'invoices' | 'offers' | 'packages') => {
    try {
      setSaving(true);
      
      if (!adapter) {
        alert('Fehler: Datenbankadapter nicht verfügbar');
        return;
      }
      
      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      switch (type) {
        case 'customers':
          data = await adapter.listCustomers();
          filename = 'kunden';
          headers = ['ID', 'Nummer', 'Name', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Ort', 'Notizen', 'Erstellt'];
          break;
        case 'invoices':
          data = await adapter.listInvoices();
          filename = 'rechnungen';
          headers = ['ID', 'Nummer', 'Kunde ID', 'Titel', 'Status', 'Fällig am', 'Zwischensumme', 'MwSt-Satz', 'MwSt-Betrag', 'Gesamt', 'Notizen', 'Erstellt'];
          break;
        case 'offers':
          data = await adapter.listOffers();
          filename = 'angebote';
          headers = ['ID', 'Nummer', 'Kunde ID', 'Titel', 'Status', 'Gültig bis', 'Zwischensumme', 'MwSt-Satz', 'MwSt-Betrag', 'Gesamt', 'Notizen', 'Erstellt'];
          break;
        case 'packages':
          data = await adapter.listPackages();
          filename = 'pakete';
          headers = ['ID', 'Name', 'Beschreibung', 'Preis', 'Erstellt'];
          break;
      }

      if (data.length === 0) {
        alert(`Keine ${filename} zum Exportieren gefunden.`);
        return;
      }

      // CSV erstellen
      const csvContent = [
        headers.join(';'),
        ...data.map(item => headers.map(header => {
          const value = getValueByHeader(item, header);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(';'))
      ].join('\n');

      // Download starten
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`${data.length} ${filename} erfolgreich als CSV exportiert!`);
    } catch (error) {
      console.error('CSV Export error:', error);
      alert('Fehler beim CSV-Export: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const getValueByHeader = (item: any, header: string): string => {
    switch (header) {
      case 'ID': return item.id || '';
      case 'Nummer': return item.number || item.invoiceNumber || item.offerNumber || '';
      case 'Name': return item.name || '';
      case 'E-Mail': return item.email || '';
      case 'Telefon': return item.phone || '';
      case 'Straße': return item.street || '';
      case 'PLZ': return item.zip || '';
      case 'Ort': return item.city || '';
      case 'Notizen': return item.notes || '';
      case 'Kunde ID': return item.customerId || '';
      case 'Titel': return item.title || '';
      case 'Status': return item.status || '';
      case 'Fällig am': return item.dueDate || '';
      case 'Gültig bis': return item.validUntil || '';
      case 'Zwischensumme': return item.subtotal || '';
      case 'MwSt-Satz': return item.vatRate || '';
      case 'MwSt-Betrag': return item.vatAmount || '';
      case 'Gesamt': return item.total || '';
      case 'Beschreibung': return item.description || '';
      case 'Preis': return item.price || '';
      case 'Erstellt': return item.createdAt || '';
      default: return '';
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      alert('Bitte wählen Sie eine ZIP-Datei aus.');
      return;
    }

    if (!adapter) {
      alert('Fehler: Datenbankadapter nicht verfügbar');
      return;
    }

    try {
      setSaving(true);

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const backupFile = contents.file('backup.json');
      if (!backupFile) {
        alert('Ungültige Backup-Datei: backup.json nicht gefunden.');
        return;
      }

      const backupData = JSON.parse(await backupFile.async('text'));
      
      // Bestätigung anfordern mit Warnungshinweis
      const itemCounts = `⚠️ ACHTUNG: DATEN WERDEN ÜBERSCHRIEBEN ⚠️

Das Backup enthält:
- ${backupData.customers?.length || 0} Kunden
- ${backupData.invoices?.length || 0} Rechnungen
- ${backupData.offers?.length || 0} Angebote
- ${backupData.packages?.length || 0} Pakete

WARNUNG: Der Import wird ALLE aktuellen Daten löschen und durch die Backup-Daten ersetzen!

Möchten Sie wirklich fortfahren?`;

      if (!confirm(itemCounts)) {
        return;
      }

      if (!confirm('LETZTE WARNUNG: Alle aktuellen Daten werden unwiderruflich gelöscht! Fortfahren?')) {
        return;
      }

      // Schritt 1: Alle existierenden Daten löschen
      try {
        const [existingCustomers, existingInvoices, existingOffers, existingPackages] = await Promise.all([
          adapter.listCustomers(),
          adapter.listInvoices(),
          adapter.listOffers(),
          adapter.listPackages()
        ]);

        // Lösche alle existierenden Daten
        await Promise.all([
          ...existingCustomers.map(c => adapter.deleteCustomer(c.id)),
          ...existingInvoices.map(i => adapter.deleteInvoice(i.id)),
          ...existingOffers.map(o => adapter.deleteOffer(o.id)),
          ...existingPackages.map(p => adapter.deletePackage(p.id))
        ]);
      } catch (error) {
        console.warn('Fehler beim Löschen existierender Daten:', error);
      }

      // Schritt 2: Backup-Daten importieren
      let importedCounts = { customers: 0, invoices: 0, offers: 0, packages: 0 };

      // Importiere Kunden
      if (backupData.customers && Array.isArray(backupData.customers)) {
        for (const customer of backupData.customers) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...customerData } = customer;
            await adapter.createCustomer(customerData);
            importedCounts.customers++;
          } catch (error) {
            console.warn('Fehler beim Importieren von Kunde:', customer, error);
          }
        }
      }

      // Importiere Angebote
      if (backupData.offers && Array.isArray(backupData.offers)) {
        for (const offer of backupData.offers) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...offerData } = offer;
            await adapter.createOffer(offerData);
            importedCounts.offers++;
          } catch (error) {
            console.warn('Fehler beim Importieren von Angebot:', offer, error);
          }
        }
      }

      // Importiere Rechnungen
      if (backupData.invoices && Array.isArray(backupData.invoices)) {
        for (const invoice of backupData.invoices) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...invoiceData } = invoice;
            await adapter.createInvoice(invoiceData);
            importedCounts.invoices++;
          } catch (error) {
            console.warn('Fehler beim Importieren von Rechnung:', invoice, error);
          }
        }
      }

      // Importiere Pakete
      if (backupData.packages && Array.isArray(backupData.packages)) {
        for (const pkg of backupData.packages) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...packageData } = pkg;
            await adapter.createPackage(packageData);
            importedCounts.packages++;
          } catch (error) {
            console.warn('Fehler beim Importieren von Paket:', pkg, error);
          }
        }
      }

      // Importiere Einstellungen
      if (backupData.companyData) {
        await updateCompanyData(backupData.companyData);
      }
      if (backupData.numberingCircles) {
        await updateNumberingCircles(backupData.numberingCircles);
      }

      alert(`✅ Backup erfolgreich importiert!

Importierte Daten:
- ${importedCounts.customers} Kunden
- ${importedCounts.invoices} Rechnungen
- ${importedCounts.offers} Angebote
- ${importedCounts.packages} Pakete
- Unternehmenseinstellungen
- Nummernkreise

Die Seite wird neu geladen.`);
      
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Importieren des Backups: ' + error);
    } finally {
      setSaving(false);
      // Input zurücksetzen für wiederholte Imports
      event.target.value = '';
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Bitte wählen Sie eine CSV-Datei aus.');
      return;
    }

    if (!adapter) {
      alert('Fehler: Datenbankadapter nicht verfügbar');
      return;
    }

    try {
      setSaving(true);
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV-Datei ist leer oder hat keine Daten.');
        return;
      }

      const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
      const dataLines = lines.slice(1);
      
      alert(`CSV-Import ist noch nicht vollständig implementiert.
      
Gefunden:
- ${headers.length} Spalten
- ${dataLines.length} Datensätze
- Typ: ${importType}

Diese Funktion würde die Daten über den Datenbankadapter importieren,
was eine komplexere Implementierung erfordert.`);
      
    } catch (error) {
      console.error('CSV Import error:', error);
      alert('Fehler beim CSV-Import: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllData = async () => {
    console.log('🚨 CRITICAL: handleClearAllData was called! This should only happen from the Clear All Data button!');
    console.trace('Call stack:');
    
    if (!confirm('WARNUNG: Alle Daten werden unwiderruflich gelöscht! Sind Sie sicher?')) {
      return;
    }
    
    if (!confirm('Letzte Warnung: Haben Sie ein Backup erstellt? Alle Daten gehen verloren!')) {
      return;
    }

    if (!adapter) {
      alert('Fehler: Datenbankadapter nicht verfügbar');
      return;
    }

    try {
      setSaving(true);
      let deletedCount = 0;
      
      // Lösche alle Daten sequenziell, um Race Conditions zu vermeiden
      try {
        const customers = await adapter.listCustomers();
        for (const customer of customers) {
          await adapter.deleteCustomer(customer.id);
          deletedCount++;
        }
      } catch (e) {
        console.warn('Error deleting customers:', e);
      }

      try {
        const invoices = await adapter.listInvoices();
        for (const invoice of invoices) {
          await adapter.deleteInvoice(invoice.id);
          deletedCount++;
        }
      } catch (e) {
        console.warn('Error deleting invoices:', e);
      }

      try {
        const offers = await adapter.listOffers();
        for (const offer of offers) {
          await adapter.deleteOffer(offer.id);
          deletedCount++;
        }
      } catch (e) {
        console.warn('Error deleting offers:', e);
      }

      try {
        const packages = await adapter.listPackages();
        for (const pkg of packages) {
          await adapter.deletePackage(pkg.id);
          deletedCount++;
        }
      } catch (e) {
        console.warn('Error deleting packages:', e);
      }
      
      alert(`${deletedCount} Datensätze wurden gelöscht. Die Seite wird neu geladen.`);
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      alert('Fehler beim Löschen der Daten: ' + error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card">Lade Einstellungen...</div>;
  }

  if (error) {
    return <div className="card">Fehler beim Laden der Einstellungen: {error}</div>;
  }

  return (
    <div className="card">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 4px 0" }}>{title}</h2>
        <div style={{ opacity: 0.7 }}>Konfiguriere deine Unternehmensdaten und Nummernkreise.</div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid rgba(0,0,0,.15)", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab('company')}
          style={{
            backgroundColor: activeTab === 'company' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'company' ? "white" : "#374151",
            border: activeTab === 'company' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'company' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'company' ? "600" : "500"
          }}
        >
          Grunddaten
        </button>
        <button
          onClick={() => setActiveTab('logo')}
          style={{
            backgroundColor: activeTab === 'logo' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'logo' ? "white" : "#374151",
            border: activeTab === 'logo' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'logo' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'logo' ? "600" : "500"
          }}
        >
          Logo & Design
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          style={{
            backgroundColor: activeTab === 'tax' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'tax' ? "white" : "#374151",
            border: activeTab === 'tax' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'tax' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'tax' ? "600" : "500"
          }}
        >
          Steuerliche Angaben
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          style={{
            backgroundColor: activeTab === 'bank' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'bank' ? "white" : "#374151",
            border: activeTab === 'bank' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'bank' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'bank' ? "600" : "500"
          }}
        >
          Bankverbindung
        </button>
        <button
          onClick={() => setActiveTab('numbering')}
          style={{
            backgroundColor: activeTab === 'numbering' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'numbering' ? "white" : "#374151",
            border: activeTab === 'numbering' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'numbering' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'numbering' ? "600" : "500"
          }}
        >
          Nummernkreise
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            backgroundColor: activeTab === 'maintenance' ? "#1e3a2e" : "rgba(255,255,255,0.8)",
            color: activeTab === 'maintenance' ? "white" : "#374151",
            border: activeTab === 'maintenance' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'maintenance' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'maintenance' ? "600" : "500"
          }}
        >
          Wartung
        </button>
      </div>

      {/* Company Data Tab - Grunddaten */}
      {activeTab === 'company' && (
        <form onSubmit={handleCompanySubmit}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Grunddaten</h3>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Firmenname *
              </label>
              <input
                type="text"
                value={companyFormData.name}
                onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                E-Mail
              </label>
              <input
                type="email"
                value={companyFormData.email}
                onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Straße
              </label>
              <input
                type="text"
                value={companyFormData.street}
                onChange={(e) => setCompanyFormData({ ...companyFormData, street: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Telefon
              </label>
              <input
                type="tel"
                value={companyFormData.phone}
                onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                PLZ
              </label>
              <input
                type="text"
                value={companyFormData.postalCode}
                onChange={(e) => setCompanyFormData({ ...companyFormData, postalCode: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Stadt
              </label>
              <input
                type="text"
                value={companyFormData.city}
                onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Website
              </label>
              <input
                type="url"
                value={companyFormData.website}
                onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {saving ? "Speichere..." : "Grunddaten speichern"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Logo & Design Tab */}
      {activeTab === 'logo' && (
        <form onSubmit={handleCompanySubmit}>
          <div style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
            <div>
              <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Logo & Design</h3>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Firmenlogo
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {companyFormData.logo && (
                  <div style={{ 
                    position: "relative", 
                    display: "inline-block",
                    maxWidth: "300px",
                    padding: "16px",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255,255,255,.05)"
                  }}>
                    <img 
                      src={companyFormData.logo} 
                      alt="Firmenlogo" 
                      style={{ 
                        maxWidth: "100%", 
                        maxHeight: "120px", 
                        objectFit: "contain",
                        display: "block"
                      }} 
                    />
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Logo entfernen"
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  style={{
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,.2)",
                    backgroundColor: "rgba(255,255,255,.05)",
                    color: "var(--foreground)",
                    cursor: "pointer"
                  }}
                />
                <div style={{ fontSize: "14px", opacity: 0.7, lineHeight: "1.4" }}>
                  <strong>Empfehlungen:</strong><br/>
                  • Dateiformate: PNG, JPG, GIF<br/>
                  • Maximale Dateigröße: 2MB<br/>
                  • Empfohlene Größe: 200x80px<br/>
                  • Transparenter Hintergrund für beste Ergebnisse
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                disabled={saving || uploadingLogo}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {saving ? "Speichere..." : "Logo speichern"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tax Tab - Steuerliche Angaben */}
      {activeTab === 'tax' && (
        <form onSubmit={handleTaxSubmit}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Steuerliche Angaben</h3>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Steuernummer
              </label>
              <input
                type="text"
                value={companyFormData.taxNumber}
                onChange={(e) => setCompanyFormData({ ...companyFormData, taxNumber: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Umsatzsteuer-ID
              </label>
              <input
                type="text"
                value={companyFormData.vatId}
                onChange={(e) => setCompanyFormData({ ...companyFormData, vatId: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={companyFormData.kleinunternehmer}
                  onChange={handleKleinunternehmerChange}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontWeight: "500" }}>Kleinunternehmer (§19 UStG)</span>
              </label>
              <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px", marginLeft: "28px" }}>
                Als Kleinunternehmer weisen Sie keine Umsatzsteuer aus und sind nicht zum Vorsteuerabzug berechtigt.
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {saving ? "Speichere..." : "Steuerliche Angaben speichern"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bank Tab - Bankverbindung */}
      {activeTab === 'bank' && (
        <form onSubmit={handleCompanySubmit}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Bankverbindung</h3>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Bank
              </label>
              <input
                type="text"
                value={companyFormData.bankName}
                onChange={(e) => setCompanyFormData({ ...companyFormData, bankName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                BIC
              </label>
              <input
                type="text"
                value={companyFormData.bankBic}
                onChange={(e) => setCompanyFormData({ ...companyFormData, bankBic: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                IBAN
              </label>
              <input
                type="text"
                value={companyFormData.bankAccount}
                onChange={(e) => setCompanyFormData({ ...companyFormData, bankAccount: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,.2)",
                  backgroundColor: "rgba(255,255,255,.05)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {saving ? "Speichere..." : "Bankverbindung speichern"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Numbering Tab */}
      {activeTab === 'numbering' && (
        <form onSubmit={handleNumberingSubmit}>
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Nummernkreise</h3>
            <p style={{ opacity: 0.7, marginBottom: "24px" }}>
              Verwalte die automatische Nummerierung für verschiedene Dokumenttypen.
            </p>

            {numberingFormData.map((circle, index) => (
              <div key={circle.id} style={{ 
                marginBottom: "24px", 
                padding: "16px", 
                border: "1px solid rgba(255,255,255,.1)", 
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,.02)"
              }}>
                <h4 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>
                  {circle.name}
                </h4>
                
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                      Präfix
                    </label>
                    <input
                      type="text"
                      value={circle.prefix}
                      onChange={(e) => updateNumberingCircle(index, 'prefix', e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        backgroundColor: "rgba(255,255,255,.05)",
                        color: "var(--foreground)"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                      Stellen
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={circle.digits}
                      onChange={(e) => updateNumberingCircle(index, 'digits', parseInt(e.target.value) || 1)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        backgroundColor: "rgba(255,255,255,.05)",
                        color: "var(--foreground)"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                      Aktuell
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={circle.current}
                      onChange={(e) => updateNumberingCircle(index, 'current', parseInt(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        backgroundColor: "rgba(255,255,255,.05)",
                        color: "var(--foreground)"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                      Reset
                    </label>
                    <select
                      value={circle.resetMode}
                      onChange={(e) => updateNumberingCircle(index, 'resetMode', e.target.value as 'yearly' | 'never')}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,.2)",
                        backgroundColor: "rgba(255,255,255,.05)",
                        color: "var(--foreground)"
                      }}
                    >
                      <option value="never">Nie</option>
                      <option value="yearly">Jährlich</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "12px", fontSize: "14px", opacity: 0.7 }}>
                  <strong>Vorschau nächste Nummer:</strong> {circle.prefix}{(circle.current + 1).toString().padStart(circle.digits, '0')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: "var(--accent)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "500",
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? "Speichere..." : "Nummernkreise speichern"}
            </button>
          </div>
        </form>
      )}

      {/* Maintenance Tab - Wartung */}
      {activeTab === 'maintenance' && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Wartung & Datenmanagement</h3>
          
          {/* Backup Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Backup erstellen</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Erstellen Sie ein vollständiges Backup aller Ihrer Daten als ZIP-Datei.
            </p>
            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={saving}
              className="btn"
              style={{
                backgroundColor: "var(--accent)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "500",
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? "Erstelle Backup..." : "📦 Backup erstellen (ZIP)"}
            </button>
          </div>

          {/* Export Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Daten exportieren</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Exportieren Sie Ihre Daten als CSV-Dateien für die Verwendung in anderen Programmen.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleExportCSV('customers')}
                disabled={saving}
                className="btn btn-secondary"
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  opacity: saving ? 0.6 : 1
                }}
              >
                📄 Kunden exportieren (CSV)
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV('invoices')}
                disabled={saving}
                className="btn btn-secondary"
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  opacity: saving ? 0.6 : 1
                }}
              >
                🧾 Rechnungen exportieren (CSV)
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV('offers')}
                disabled={saving}
                className="btn btn-secondary"
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  opacity: saving ? 0.6 : 1
                }}
              >
                📋 Angebote exportieren (CSV)
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV('packages')}
                disabled={saving}
                className="btn btn-secondary"
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  opacity: saving ? 0.6 : 1
                }}
              >
                📦 Pakete exportieren (CSV)
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Daten importieren</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Importieren Sie Backup-Dateien oder CSV-Daten zurück in die Anwendung.
            </p>
            
            {/* ZIP Backup Import */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                Backup importieren (ZIP)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleImportBackup}
                style={{
                  padding: "8px",
                  border: "1px solid rgba(0,0,0,.2)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  width: "100%",
                  maxWidth: "400px"
                }}
              />
            </div>

            {/* CSV Import */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                CSV importieren
              </label>
              <div style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                <div>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as 'customers' | 'invoices' | 'offers')}
                    style={{
                      padding: "8px",
                      border: "1px solid rgba(0,0,0,.2)",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.9)",
                      marginRight: "8px"
                    }}
                  >
                    <option value="customers">Kunden</option>
                    <option value="invoices">Rechnungen</option>
                    <option value="offers">Angebote</option>
                  </select>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    style={{
                      padding: "8px",
                      border: "1px solid rgba(0,0,0,.2)",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.9)"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ 
            marginTop: "40px", 
            padding: "20px", 
            border: "2px solid #ef4444", 
            borderRadius: "8px", 
            backgroundColor: "rgba(239, 68, 68, 0.05)" 
          }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#ef4444" }}>⚠️ Gefahrenbereich</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Diese Aktionen können nicht rückgängig gemacht werden. Erstellen Sie vorher ein Backup!
            </p>
            <button
              type="button"
              onClick={handleClearAllData}
              className="btn btn-danger"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              🗑️ Alle Daten löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
