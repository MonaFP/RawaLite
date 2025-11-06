import React, { useState, useCallback, useEffect } from "react";
import { useUnifiedSettings } from "../hooks/useUnifiedSettings";
import { usePersistence } from "../contexts/PersistenceContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useNumbering } from "../contexts/NumberingContext";
import type { CompanyData, NumberingCircle } from "../lib/settings";
import { defaultSettings } from "../lib/settings";
import { UpdateDialog } from "../components/UpdateDialog";
import { UpdateStatus } from "../components/UpdateStatus";
import { AutoUpdatePreferences } from "../components/AutoUpdatePreferences";
import { ThemeSelector } from "../components/ThemeSelector";
import { NavigationModeSelector } from "../components/NavigationModeSelector";
import { useActivities } from "../hooks/useActivities";
import type { Activity } from "../persistence/adapter";
import VersionService from "../services/VersionService";
import { SQLiteAdapter } from "../adapters/SQLiteAdapter";
import { formatNumberInputValue, parseNumberInput, getNumberInputStyles } from "../lib/input-helpers";

interface EinstellungenPageProps {
  title?: string;
}

export default function EinstellungenPage({ title = "Einstellungen" }: EinstellungenPageProps) {
  const { settings, loading, error, updateCompanyData } = useUnifiedSettings();
  const { circles: numberingCircles, loading: numberingLoading, error: numberingError, updateCircle, getNextNumber } = useNumbering();
  const { activities, loading: activitiesLoading, createActivity, updateActivity, deleteActivity } = useActivities();
  const { adapter } = usePersistence();
  const { showError, showSuccess } = useNotifications();
  const [sqliteAdapter] = useState(() => new SQLiteAdapter());

  // State für Activity Dialog
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [currentVersion, setCurrentVersion] = useState('1.0.20');
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    description: '',
    hourlyRate: 0
  });
  const [activeTab, setActiveTab] = useState<'company' | 'logo' | 'tax' | 'bank' | 'numbering' | 'activities' | 'themes' | 'updates' | 'maintenance'>('company');
  const [companyFormData, setCompanyFormData] = useState<CompanyData>(() => ({
    ...defaultSettings.companyData,
    ...settings.companyData
  }));
  const [numberingFormData, setNumberingFormData] = useState<NumberingCircle[]>(numberingCircles);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [importType, setImportType] = useState<'customers' | 'invoices' | 'offers'>('customers');
  const [selectedCSVFile, setSelectedCSVFile] = useState<File | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  // Version laden beim Component Mount
  useEffect(() => {
    const loadVersion = async () => {
      try {
        console.log('EinstellungenPage: Loading current version...');
        const version = await window.rawalite.updates.getCurrentVersion();
        console.log('EinstellungenPage: Version loaded successfully:', version);
        setCurrentVersion(version || '1.0.20');
      } catch (error) {
        console.error('EinstellungenPage: Failed to load current version:', error);
        console.log('EinstellungenPage: Using fallback version 1.0.20');
        // Fallback bleibt '1.0.20'
      }
    };
    loadVersion();
  }, []);

  // Activity Dialog Funktionen
  const openCreateActivityDialog = () => {
    setEditingActivity(null);
    setActivityFormData({ title: '', description: '', hourlyRate: 0 });
    setShowActivityDialog(true);
  };

  const openEditActivityDialog = (activity: any) => {
    setEditingActivity(activity);
    setActivityFormData({ 
      title: activity.title, 
      description: activity.description || '',
      hourlyRate: activity.hourlyRate || 0
    });
    setShowActivityDialog(true);
  };

  const handleActivitySubmit = async () => {
    try {
      if (!activityFormData.title.trim()) {
        showError('Bitte geben Sie einen Namen ein');
        return;
      }

      if (editingActivity) {
        // Edit existing activity
        await updateActivity(editingActivity.id, {
          title: activityFormData.title,
          description: activityFormData.description,
          hourlyRate: activityFormData.hourlyRate,
          isActive: true
        });
        showSuccess('Tätigkeit erfolgreich bearbeitet');
      } else {
        // Create new activity
        await createActivity({
          title: activityFormData.title,
          description: activityFormData.description,
          hourlyRate: activityFormData.hourlyRate,
          isActive: true
        });
        showSuccess('Tätigkeit erfolgreich erstellt');
      }
      
      setShowActivityDialog(false);
      setEditingActivity(null);
      setActivityFormData({ title: '', description: '', hourlyRate: 0 });
    } catch (error) {
      showError('Fehler beim Speichern: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const openDeleteActivityDialog = (activity: Activity) => {
    setActivityToDelete(activity);
    setShowDeleteConfirm(true);
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    try {
      await deleteActivity(activityToDelete.id);
      showSuccess('Tätigkeit erfolgreich gelöscht');
      setShowDeleteConfirm(false);
      setActivityToDelete(null);
    } catch (error) {
      showError('Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  // A2: Stable Close Callback - verhindert Dialog Re-Renders durch Function Reference Changes
  const handleCloseUpdateDialog = useCallback(() => setUpdateDialogOpen(false), []);

  // Update form data when settings change
  React.useEffect(() => {
    console.log('🔍 Settings loaded - Logo length:', settings.companyData.logo?.length || 0);
    console.log('🔍 Bank data from settings:', {
      bankName: settings.companyData.bankName,
      bankAccount: settings.companyData.bankAccount,
      bankBic: settings.companyData.bankBic,
      taxOffice: settings.companyData.taxOffice
    });
    setCompanyFormData(settings.companyData);
  }, [settings]);

  React.useEffect(() => {
    console.log('🔍 [DEBUG] UI - Received numberingCircles:', numberingCircles.length, 'circles');
    console.log('🔍 [DEBUG] UI - Circle data:', numberingCircles);
    setNumberingFormData(numberingCircles);
  }, [numberingCircles]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Fehler: Bitte wählen Sie eine Bilddatei aus (PNG, JPG, GIF, etc.)');
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 2MB)
    const maxSizeMB = 2;
    const fileSizeMB = file.size / (1024 * 1024);
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`❌ Datei zu groß: ${fileSizeMB.toFixed(2)} MB\n\nMaximum erlaubt: ${maxSizeMB} MB\nBitte verkleinern Sie das Bild oder wählen Sie eine andere Datei.`);
      event.target.value = ''; // Reset input
      return;
    }

    try {
      setUploadingLogo(true);
      showSuccess(`✅ Logo wird hochgeladen... (${fileSizeMB.toFixed(2)} MB)`);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCompanyFormData(prev => ({ ...prev, logo: base64 }));
        showSuccess('Logo erfolgreich geladen! Vergessen Sie nicht zu speichern.');
      };
      reader.onerror = () => {
        showError('Fehler beim Lesen der Datei');
        event.target.value = ''; // Reset input
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showError('Fehler beim Verarbeiten des Logos');
      event.target.value = ''; // Reset input
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setCompanyFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🏢 Company form submitted with data:', companyFormData);
    
    try {
      setSaving(true);
      await updateCompanyData(companyFormData);
      showSuccess('Unternehmensdaten gespeichert!');
      // KEIN window.location.reload() - Daten bleiben erhalten
    } catch (error) {
      console.error('Company save error:', error);
      showError('Fehler beim Speichern der Unternehmensdaten');
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
      showSuccess('Steuerliche Einstellungen gespeichert!');
    } catch (error) {
      console.error('Tax settings save error:', error);
      showError('Fehler beim Speichern der steuerlichen Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🖼️ Logo form submitted, saving logo only');
    try {
      setSaving(true);
      await updateCompanyData(companyFormData);
      showSuccess('Logo erfolgreich gespeichert!');
      // KEIN window.location.reload() hier - Logo bleibt im aktuellen Tab
    } catch (error) {
      console.error('Logo save error:', error);
      showError('Fehler beim Speichern des Logos');
    } finally {
      setSaving(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🏦 Bank form submitted, saving bank data only');
    console.log('🔍 Current companyFormData:', companyFormData);
    console.log('🔍 Bank fields specifically:', {
      bankName: companyFormData.bankName,
      bankAccount: companyFormData.bankAccount,
      bankBic: companyFormData.bankBic
    });
    try {
      setSaving(true);
      await updateCompanyData(companyFormData);
      showSuccess('Bankverbindung erfolgreich gespeichert!');
      // KEIN window.location.reload() hier - Bank-Tab bleibt aktiv
    } catch (error) {
      console.error('Bank save error:', error);
      showError('Fehler beim Speichern der Bankverbindung');
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
      // Update each circle individually
      for (const circle of numberingFormData) {
        await updateCircle(circle.id, circle);
      }
      showSuccess('Nummernkreise gespeichert!');
    } catch (error) {
      showError('Fehler beim Speichern der Nummernkreise');
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

      // ✅ Verwende VersionService für konsistente Versionsinformation (Phase 2)
      const versionInfo = VersionService.getBackupVersionInfo();
      
      const backupData = {
        companyData: settings.companyData,
        numberingCircles: settings.numberingCircles,
        customers,
        invoices,
        offers,
        packages,
        exportDate: versionInfo.timestamp,
        version: versionInfo.version,
        buildInfo: versionInfo.buildInfo
      };

      // Erstelle ZIP-Datei
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      zip.file('backup.json', JSON.stringify(backupData, null, 2));
      zip.file('README.txt', `RawaLite Backup
Erstellt am: ${new Date().toLocaleDateString('de-DE')}
Version: ${backupData.version}
Build: ${backupData.buildInfo}

Diese Datei enthält alle Ihre RawaLite-Daten und kann über die Datensicherungs-Funktion importiert werden.

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
      const now = new Date();
      const dateTime = now.toISOString().split('T')[0] + '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');
      link.download = `rawalite-backup-${dateTime}.zip`;
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
      const now = new Date();
      const dateTime = now.toISOString().split('T')[0] + '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');
      link.download = `${filename}-${dateTime}.csv`;
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
      let importedCounts = { customers: 0, invoices: 0, offers: 0, packages: 0, settings: 0 };
      let importErrors: { type: string; item: any; error: string }[] = [];

      // NORMALISIERUNG: Konvertiere alte Oct 17 Backup Struktur (Migration 034) zu Migration 033
      // Oct 17 Backup könnte komplexere Felder haben, die wir hier vereinfachen
      const normalizeOffer = (offer: any) => {
        // Stelle sicher, dass notwendige Felder existieren
        if (!offer.customerId) throw new Error('Angebot hat keine customerId');
        if (!offer.offerNumber) throw new Error('Angebot hat keine offerNumber');
        
        // Normalisiere lineItems wenn vorhanden
        if (offer.lineItems && Array.isArray(offer.lineItems)) {
          offer.lineItems = offer.lineItems.map((item: any) => ({
            ...item,
            // Stelle sicher, dass parent_item_id nur wenn subItem
            parentItemId: item.parentItemId || item.parent_item_id || undefined
          }));
        }
        return offer;
      };

      const normalizeInvoice = (invoice: any) => {
        if (!invoice.customerId) throw new Error('Rechnung hat keine customerId');
        if (!invoice.invoiceNumber) throw new Error('Rechnung hat keine invoiceNumber');
        
        if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
          invoice.lineItems = invoice.lineItems.map((item: any) => ({
            ...item,
            parentItemId: item.parentItemId || item.parent_item_id || undefined
          }));
        }
        return invoice;
      };

      const normalizeCompanyData = (companyData: any) => {
        // Konvertiere Oct 17 Backup CompanyData (Migration 034) zu Migration 033 Format
        const normalized = {
          name: companyData.name || companyData.companyName || 'RawaLite',
          street: companyData.street || companyData.streetAddress || '',
          postalCode: companyData.postalCode || companyData.zip || '',
          city: companyData.city || companyData.location || '',
          phone: companyData.phone || companyData.phoneNumber || '',
          email: companyData.email || companyData.emailAddress || '',
          website: companyData.website || companyData.websiteUrl || '',
          taxNumber: companyData.taxNumber || companyData.taxId || companyData.tax_number || '',
          vatId: companyData.vatId || companyData.vat_id || companyData.umsatzsteuer_id || '',
          kleinunternehmer: companyData.kleinunternehmer ?? companyData.smallBusiness ?? false,
          bankName: companyData.bankName || companyData.bank_name || '',
          bankAccount: companyData.bankAccount || companyData.account_number || companyData.iban || '',
          bankBic: companyData.bankBic || companyData.bic || '',
          taxOffice: companyData.taxOffice || companyData.finanzamt || '',
          logo: companyData.logo || '',
          
          // Auto-Update Preferences (Migration 018)
          autoUpdateEnabled: companyData.autoUpdateEnabled ?? false,
          autoUpdateCheckFrequency: companyData.autoUpdateCheckFrequency || 'startup',
          autoUpdateNotificationStyle: companyData.autoUpdateNotificationStyle || 'subtle',
          autoUpdateReminderInterval: companyData.autoUpdateReminderInterval || 4,
          autoUpdateAutoDownload: companyData.autoUpdateAutoDownload ?? false,
          autoUpdateInstallPrompt: companyData.autoUpdateInstallPrompt || 'manual'
        };
        
        console.log('📋 Normalized Company Data:', { original: companyData, normalized });
        return normalized;
      };

      // Build ID-Mapping für Kunden UND Angebote (Oct 17 Backup → neue DB IDs)
      const customerIdMap = new Map<number, number>(); // backupCustomerID → newCustomerID
      const offerIdMap = new Map<number, number>();   // backupOfferID → newOfferID
      
      // Importiere Kunden
      if (backupData.customers && Array.isArray(backupData.customers)) {
        for (const customer of backupData.customers) {
          try {
            // Speichere alte ID BEVOR wir sie entfernen
            const backupCustomerId = (customer as any).id;
            
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...customerData } = customer;
            const result = await adapter.createCustomer(customerData);
            
            // Speichere Mapping für später (Invoices und Offers brauchen die neuen IDs!)
            if (backupCustomerId && result?.id) {
              customerIdMap.set(backupCustomerId, result.id);
            }
            
            importedCounts.customers++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.warn('Fehler beim Importieren von Kunde:', customer, error);
            importErrors.push({
              type: 'customer',
              item: customer,
              error: errorMsg
            });
          }
        }
      }

      // Importiere Angebote (mit ID-Mapping für Customers!)
      if (backupData.offers && Array.isArray(backupData.offers)) {
        for (const offer of backupData.offers) {
          try {
            // Speichere alte Offer-ID für Package-Mapping
            const backupOfferId = (offer as any).id;
            
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...offerData } = offer;
            
            // Remap customerId wenn nötig (Oct 17 Backup alte ID → neue DB ID)
            const remappedOfferData = { ...offerData } as any;
            if (remappedOfferData.customerId) {
              const newCustomerId = customerIdMap.get(remappedOfferData.customerId);
              if (newCustomerId) {
                remappedOfferData.customerId = newCustomerId;
              } else {
                throw new Error(`Customer ID ${remappedOfferData.customerId} nicht im Backup vorhanden`);
              }
            }
            
            // Normalisiere für Migration 033 Kompatibilität
            const normalizedOffer = normalizeOffer(remappedOfferData);
            
            const result = await adapter.createOffer(normalizedOffer);
            
            // Speichere Mapping für später (Packages brauchen die neuen Offer-IDs!)
            if (backupOfferId && result?.id) {
              offerIdMap.set(backupOfferId, result.id);
            }
            
            importedCounts.offers++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.warn('Fehler beim Importieren von Angebot:', offer, error);
            importErrors.push({
              type: 'offer',
              item: offer,
              error: errorMsg
            });
          }
        }
      }

      // Importiere Rechnungen (mit ID-Mapping für Customers UND Offers!)
      if (backupData.invoices && Array.isArray(backupData.invoices)) {
        for (const invoice of backupData.invoices) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...invoiceData } = invoice;
            
            // Remap customerID UND offerId wenn nötig (Oct 17 Backup alte IDs → neue DB IDs)
            const remappedInvoiceData = { ...invoiceData } as any;
            
            // Remap Customer ID
            if (remappedInvoiceData.customerId) {
              const newCustomerId = customerIdMap.get(remappedInvoiceData.customerId);
              if (newCustomerId) {
                remappedInvoiceData.customerId = newCustomerId;
              } else {
                throw new Error(`Customer ID ${remappedInvoiceData.customerId} nicht im Backup vorhanden`);
              }
            }
            
            // Remap Offer ID (falls vorhanden - Oct 17 Backup könnte Invoices mit Offer referenzen haben)
            if (remappedInvoiceData.offerId) {
              const newOfferId = offerIdMap.get(remappedInvoiceData.offerId);
              if (newOfferId) {
                remappedInvoiceData.offerId = newOfferId;
              } else {
                throw new Error(`Offer ID ${remappedInvoiceData.offerId} nicht im Backup vorhanden`);
              }
            }
            
            // Normalisiere für Migration 033 Kompatibilität
            const normalizedInvoice = normalizeInvoice(remappedInvoiceData);
            
            await adapter.createInvoice(normalizedInvoice);
            importedCounts.invoices++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.warn('Fehler beim Importieren von Rechnung:', invoice, error);
            importErrors.push({
              type: 'invoice',
              item: invoice,
              error: errorMsg
            });
          }
        }
      }

      // Importiere Pakete (mit ID-Mapping für Angebote!)
      if (backupData.packages && Array.isArray(backupData.packages)) {
        for (const pkg of backupData.packages) {
          try {
            // Entferne ID und Timestamps für Import
            const { id, createdAt, updatedAt, ...packageData } = pkg;
            
            // Remap offerId wenn nötig (Oct 17 Backup alte ID → neue DB ID)
            const remappedPackageData = { ...packageData } as any;
            if (remappedPackageData.offerId) {
              const newOfferId = offerIdMap.get(remappedPackageData.offerId);
              if (newOfferId) {
                remappedPackageData.offerId = newOfferId;
              } else {
                throw new Error(`Offer ID ${remappedPackageData.offerId} nicht im Backup vorhanden`);
              }
            }
            
            await adapter.createPackage(remappedPackageData);
            importedCounts.packages++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.warn('Fehler beim Importieren von Paket:', pkg, error);
            importErrors.push({
              type: 'package',
              item: pkg,
              error: errorMsg
            });
          }
        }
      }

      // Schritt 3: Unternehmensdaten importieren
      if (backupData.companyData) {
        try {
          console.log('🏢 Importing company data...');
          console.log('📋 Original backup companyData:', JSON.stringify(backupData.companyData, null, 2));
          
          // Normalisiere CompanyData für Migration 033 Kompatibilität
          const normalizedCompanyData = normalizeCompanyData(backupData.companyData);
          console.log('📋 Normalized company data:', JSON.stringify(normalizedCompanyData, null, 2));
          
          // Call updateCompanyData and wait for it to complete
          await updateCompanyData(normalizedCompanyData);
          console.log('✅ Company data imported successfully');
          console.log('✅ Settings updated in database and context');
          importedCounts.settings++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('❌ FATAL Error importing company data:', error);
          console.error('📋 Full error stack:', error instanceof Error ? error.stack : 'No stack');
          console.error('📋 Error details:', {
            message: errorMsg,
            originalData: backupData.companyData,
            timestamp: new Date().toISOString(),
            errorType: error instanceof Error ? error.constructor.name : typeof error
          });
          importErrors.push({
            type: 'settings',
            item: backupData.companyData,
            error: `Settings import failed: ${errorMsg}`
          });
        }
      } else {
        console.warn('⚠️ No company data in backup');
      }
      
      // Schritt 4: Nummernkreise intelligent anpassen - schaue nach höchster verwendeter ID
      if (backupData.numberingCircles) {
        try {
          console.log('🔢 Analyzing imported data for intelligent numbering...');
          
          // Lade die importierten Daten um die höchsten IDs zu finden
          const [importedCustomers, importedInvoices, importedOffers, importedPackages] = await Promise.all([
            adapter.listCustomers(),
            adapter.listInvoices(),
            adapter.listOffers(),
            adapter.listPackages()
          ]);
          
          // Finde alle verwendeten Nummern und bestimme die niedrigste freie
          const findNextFreeNumber = (items: any[], prefix: string): number => {
            const usedNumbers = new Set<number>();
            
            // Sammle alle verwendeten Nummern
            items.forEach(item => {
              if (item.number && item.number.startsWith(prefix)) {
                const numberPart = item.number.replace(prefix, '');
                const parsed = parseInt(numberPart, 10);
                if (!isNaN(parsed)) {
                  usedNumbers.add(parsed);
                }
              }
            });
            
            // Finde die niedrigste freie Nummer (beginne bei 1)
            let freeNumber = 1;
            while (usedNumbers.has(freeNumber)) {
              freeNumber++;
            }
            
            // Gib die Nummer zurück, die verwendet werden soll (eine weniger, da getNextNumber +1 macht)
            return Math.max(0, freeNumber - 1);
          };
          
          // Aktualisiere Nummernkreise mit intelligenten Werten
          const intelligentNumberingCircles = backupData.numberingCircles.map((circle: any) => {
            let newCurrent = 0;
            
            switch (circle.id) {
              case 'customers':
                newCurrent = findNextFreeNumber(importedCustomers, circle.prefix);
                break;
              case 'invoices':
                newCurrent = findNextFreeNumber(importedInvoices, circle.prefix);
                break;
              case 'offers':
                newCurrent = findNextFreeNumber(importedOffers, circle.prefix);
                break;
              case 'packages':
                newCurrent = findNextFreeNumber(importedPackages, circle.prefix);
                break;
            }
            
            console.log(`📊 ${circle.id}: Next free number will be ${circle.prefix}${(newCurrent + 1).toString().padStart(3, '0')}, setting current to ${newCurrent}`);
            return { ...circle, current: newCurrent };
          });
          
          console.log('🔢 Importing intelligent numbering circles...');
          // Update each circle individually  
          for (const circle of intelligentNumberingCircles) {
            await updateCircle(circle.id, circle);
          }
          console.log('✅ Intelligent numbering circles imported successfully');
        } catch (error) {
          console.warn('Error importing intelligent numbering circles:', error);
          // Fallback zu normalen Nummernkreisen
          for (const circle of backupData.numberingCircles) {
            await updateCircle(circle.id, circle);
          }
        }
      }

      // Stelle Erfolgs- und Fehler-Message zusammen
      let resultMessage = `✅ Backup Import abgeschlossen!\n\nImportierte Daten:\n`;
      resultMessage += `- ${importedCounts.customers} Kunden\n`;
      resultMessage += `- ${importedCounts.invoices} Rechnungen\n`;
      resultMessage += `- ${importedCounts.offers} Angebote\n`;
      resultMessage += `- ${importedCounts.packages} Pakete\n`;
      resultMessage += `- Unternehmenseinstellungen\n`;
      resultMessage += `- Intelligente Nummernkreise (angepasst an vorhandene Daten)\n\n`;
      resultMessage += `🔄 Die Anwendung wurde aktualisiert. Sie können jetzt mit den importierten Daten arbeiten.`;

      // Zeige Fehler, falls vorhanden
      if (importErrors.length > 0) {
        resultMessage += `\n\n⚠️ ${importErrors.length} Import-Fehler aufgetreten:\n`;
        importErrors.forEach((err, idx) => {
          resultMessage += `\n${idx + 1}. ${err.type.toUpperCase()}: ${err.error}`;
          if (err.item.offerNumber) resultMessage += ` (Angebot: ${err.item.offerNumber})`;
          if (err.item.invoiceNumber) resultMessage += ` (Rechnung: ${err.item.invoiceNumber})`;
          if (err.item.customerNumber) resultMessage += ` (Kunde: ${err.item.customerNumber})`;
        });
        resultMessage += `\n\nBitte überprüfen Sie die fehlgeschlagenen Datensätze manuell oder kontaktieren Sie den Support.`;
        console.warn('Import errors tracked:', importErrors);
      }

      if (importErrors.length > 0 && importErrors.length > importedCounts.offers + importedCounts.invoices + importedCounts.customers + importedCounts.packages) {
        showError(resultMessage);
      } else {
        showSuccess(resultMessage);
      }
      
      console.log('✅ Backup import completed successfully');
      
      // Statt zu navigieren, informiere den User und lasse ihn selbst navigieren
      // Das verhindert das UI-Blocking-Problem
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Importieren des Backups: ' + error);
    } finally {
      setSaving(false);
      // Input zurücksetzen für wiederholte Imports
      event.target.value = '';
      setSelectedCSVFile(null);
    }
  };

  const handleCSVFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedCSVFile(null);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      showError('Bitte wählen Sie eine CSV-Datei aus.');
      setSelectedCSVFile(null);
      return;
    }

    setSelectedCSVFile(file);
  };

  const handleImportCSV = async () => {
    if (!selectedCSVFile) {
      showError('Bitte wählen Sie zuerst eine CSV-Datei aus.');
      return;
    }

    if (!adapter) {
      showError('Fehler: Datenbankadapter nicht verfügbar');
      return;
    }

    try {
      setSaving(true);
      
      const text = await selectedCSVFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showError('CSV-Datei ist leer oder hat keine Daten.');
        return;
      }

      const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
      const dataLines = lines.slice(1);
      
      console.log('CSV Headers:', headers);
      console.log('CSV Data lines:', dataLines.length);
      
      let importedCount = 0;
      let errors = 0;
      
      if (importType === 'customers') {
        // CSV-Import für Kunden
        for (const line of dataLines) {
          try {
            const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
            
            const customerData: any = {};
            if (values[0]) customerData.name = values[0];
            if (values[1]) customerData.email = values[1];
            if (values[2]) customerData.phone = values[2];
            if (values[3]) customerData.street = values[3];
            if (values[4]) customerData.zip = values[4];
            if (values[5]) customerData.city = values[5];
            if (values[6]) customerData.notes = values[6];
            
            if (!customerData.name) {
              console.warn('Überspringe Zeile ohne Namen:', values);
              errors++;
              continue;
            }
            
            try {
              customerData.number = await getNextNumber('customers');
            } catch (error) {
              customerData.number = `K-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
            
            await adapter.createCustomer(customerData);
            importedCount++;
            
          } catch (error) {
            console.warn('Fehler beim Importieren einer CSV-Zeile:', line, error);
            errors++;
          }
        }
        
        showSuccess(`✅ CSV-Import abgeschlossen!
        
Erfolgreich importiert: ${importedCount} Kunden
${errors > 0 ? `Fehler: ${errors}` : ''}

CSV-Format: Name;Email;Telefon;Straße;PLZ;Ort;Notizen`);

      } else if (importType === 'offers') {
        // CSV-Import für Angebote
        for (const line of dataLines) {
          try {
            const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
            
            const offerData: any = {};
            if (values[0]) offerData.title = values[0];
            if (values[1]) offerData.customerName = values[1]; // Kundenname für Zuordnung
            if (values[2]) offerData.total = parseFloat(values[2]) || 0;
            if (values[3]) offerData.validUntil = values[3]; // Format: YYYY-MM-DD
            if (values[4]) offerData.notes = values[4];
            
            if (!offerData.title) {
              console.warn('Überspringe Zeile ohne Titel:', values);
              errors++;
              continue;
            }
            
            // Finde Kunden-ID basierend auf Namen
            let customerId = null;
            if (offerData.customerName) {
              const customers = await adapter.listCustomers();
              const customer = customers.find(c => c.name.toLowerCase() === offerData.customerName.toLowerCase());
              if (customer) {
                customerId = customer.id;
              }
            }
            
            if (!customerId) {
              console.warn('Kunde nicht gefunden für Angebot:', offerData.customerName);
              errors++;
              continue;
            }
            
            try {
              offerData.offerNumber = await getNextNumber('offers');
            } catch (error) {
              offerData.offerNumber = `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
            
            // Erstelle Angebot mit Minimal-Daten
            const fullOfferData = {
              ...offerData,
              customerId,
              lineItems: [], // Leere LineItems - können später manuell hinzugefügt werden
              subtotal: offerData.total,
              vatAmount: 0,
              vatRate: 19,
              status: 'draft'
            };
            
            delete fullOfferData.customerName; // Entferne temporäres Feld
            
            await adapter.createOffer(fullOfferData);
            importedCount++;
            
          } catch (error) {
            console.warn('Fehler beim Importieren einer CSV-Zeile:', line, error);
            errors++;
          }
        }
        
        showSuccess(`✅ CSV-Import abgeschlossen!
        
Erfolgreich importiert: ${importedCount} Angebote
${errors > 0 ? `Fehler: ${errors}` : ''}

CSV-Format: Titel;Kundenname;Gesamtbetrag;Gültig bis (YYYY-MM-DD);Notizen`);

      } else if (importType === 'invoices') {
        // CSV-Import für Rechnungen  
        for (const line of dataLines) {
          try {
            const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
            
            const invoiceData: any = {};
            if (values[0]) invoiceData.title = values[0];
            if (values[1]) invoiceData.customerName = values[1];
            if (values[2]) invoiceData.total = parseFloat(values[2]) || 0;
            if (values[3]) invoiceData.dueDate = values[3]; // Format: YYYY-MM-DD
            if (values[4]) invoiceData.notes = values[4];
            
            if (!invoiceData.title) {
              console.warn('Überspringe Zeile ohne Titel:', values);
              errors++;
              continue;
            }
            
            // Finde Kunden-ID
            let customerId = null;
            if (invoiceData.customerName) {
              const customers = await adapter.listCustomers();
              const customer = customers.find(c => c.name.toLowerCase() === invoiceData.customerName.toLowerCase());
              if (customer) {
                customerId = customer.id;
              }
            }
            
            if (!customerId) {
              console.warn('Kunde nicht gefunden für Rechnung:', invoiceData.customerName);
              errors++;
              continue;
            }
            
            try {
              invoiceData.invoiceNumber = await getNextNumber('invoices');
            } catch (error) {
              invoiceData.invoiceNumber = `R-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
            
            const fullInvoiceData = {
              ...invoiceData,
              customerId,
              lineItems: [],
              subtotal: invoiceData.total,
              vatAmount: 0,
              vatRate: 19,
              status: 'draft'
            };
            
            delete fullInvoiceData.customerName;
            
            await adapter.createInvoice(fullInvoiceData);
            importedCount++;
            
          } catch (error) {
            console.warn('Fehler beim Importieren einer CSV-Zeile:', line, error);
            errors++;
          }
        }
        
        showSuccess(`✅ CSV-Import abgeschlossen!
        
Erfolgreich importiert: ${importedCount} Rechnungen
${errors > 0 ? `Fehler: ${errors}` : ''}

CSV-Format: Titel;Kundenname;Gesamtbetrag;Fällig am (YYYY-MM-DD);Notizen`);
        
      } else {
        showError(`CSV-Import für "${importType}" ist noch nicht implementiert.`);
      }
      
    } catch (error) {
      console.error('CSV Import error:', error);
      showError('Fehler beim CSV-Import: ' + error);
    } finally {
      setSaving(false);
      setSelectedCSVFile(null);
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
      
      // 🔥 KRITISCH: App sofort in "Maintenance Mode" versetzen
      // Global state setzen, der alle Formulare deaktiviert
      document.body.style.pointerEvents = 'none';
      document.body.style.opacity = '0.7';
      
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

      // 🔥 WICHTIG: Nummernkreise zurücksetzen!
      try {
        console.log('🔄 Resetting numbering circles to default values');
        
        // Zuerst localStorage komplett leeren
        localStorage.removeItem('rawalite-numbering');
        console.log('🗑️ Cleared localStorage numbering data');
        
        // Dann Standard-Nummernkreise mit current: 0 setzen
        const resetCircles = defaultSettings.numberingCircles.map(circle => ({
          ...circle,
          current: 0,
          lastResetYear: undefined
        }));
        
        console.log('📝 Setting numbering circles to:', resetCircles);
        for (const circle of resetCircles) {
          await updateCircle(circle.id, circle);
        }
        console.log('✅ Numbering circles reset successfully');
      } catch (e) {
        console.warn('Error resetting numbering circles:', e);
        // Fallback: Clear localStorage directly and set defaults
        localStorage.removeItem('rawalite-numbering');
        localStorage.setItem('rawalite-numbering', JSON.stringify(defaultSettings.numberingCircles));
      }

      // 🔥 ZUSÄTZLICH: Firmendaten zurücksetzen (optional)
      try {
        console.log('🔄 Resetting company data to defaults');
        await updateCompanyData(defaultSettings.companyData);
        console.log('✅ Company data reset successfully');
      } catch (e) {
        console.warn('Error resetting company data:', e);
      }
      
      showSuccess(`${deletedCount} Datensätze wurden gelöscht und alle Nummernkreise zurückgesetzt. Die Anwendung wird neu geladen...`);
      
      // Sofortiges Reload ohne Verzögerung, um inkonsistente States zu vermeiden
      // Die 2-Sekunden-Verzögerung verursachte Probleme mit unbeschreibbaren Eingabefeldern
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      
      // UI wieder aktivieren bei Fehlern
      document.body.style.pointerEvents = '';
      document.body.style.opacity = '';
      
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
            backgroundColor: activeTab === 'company' ? "var(--accent)" : "rgba(255,255,255,0.8)",
            color: activeTab === 'company' ? "white" : "var(--text-secondary)",
            border: activeTab === 'company' ? "1px solid var(--accent)" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'company' ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'company' ? "600" : "500"
          }}
        >
          Stammdaten
        </button>
        <button
          onClick={() => setActiveTab('logo')}
          style={{
            backgroundColor: activeTab === 'logo' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
            color: activeTab === 'logo' ? "white" : "#374151",
            border: activeTab === 'logo' ? "1px solid var(--accent)" : "1px solid rgba(0,0,0,.2)", /* 🎨 Theme-basiert */
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'logo' ? "2px solid var(--accent)" : "2px solid transparent", /* 🎨 Theme-basiert */
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'logo' ? "600" : "500"
          }}
        >
          Logo & Design
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          style={{
            backgroundColor: activeTab === 'tax' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
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
            backgroundColor: activeTab === 'bank' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
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
            backgroundColor: activeTab === 'numbering' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
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
          onClick={() => setActiveTab('activities')}
          style={{
            backgroundColor: activeTab === 'activities' ? "var(--accent)" : "rgba(255,255,255,0.8)",
            color: activeTab === 'activities' ? "white" : "var(--text-secondary)",
            border: activeTab === 'activities' ? "1px solid var(--accent)" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'activities' ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'activities' ? "600" : "500"
          }}
        >
          ⚡ Tätigkeiten
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          style={{
            backgroundColor: activeTab === 'themes' ? "var(--accent)" : "rgba(255,255,255,0.8)",
            color: activeTab === 'themes' ? "white" : "var(--text-secondary)",
            border: activeTab === 'themes' ? "1px solid var(--accent)" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'themes' ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'themes' ? "600" : "500"
          }}
        >
          🎨 Themes
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          style={{
            backgroundColor: activeTab === 'updates' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
            color: activeTab === 'updates' ? "white" : "#374151",
            border: activeTab === 'updates' ? "1px solid #1e3a2e" : "1px solid rgba(0,0,0,.2)",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            borderBottom: activeTab === 'updates' ? "2px solid #1e3a2e" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontWeight: activeTab === 'updates' ? "600" : "500"
          }}
        >
          Updates
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            backgroundColor: activeTab === 'maintenance' ? "var(--accent)" : "rgba(255,255,255,0.8)", /* 🎨 Theme-basiert */
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
          Datensicherung
        </button>
      </div>

      {/* Company Data Tab - Stammdaten */}
      {activeTab === 'company' && (
        <form onSubmit={handleCompanySubmit}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Stammdaten</h3>
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
                value={companyFormData.email || ''}
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
                value={companyFormData.phone || ''}
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
                Ort
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
                value={companyFormData.website || ''}
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
                {saving ? "Speichere..." : "Stammdaten speichern"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Logo & Design Tab */}
      {activeTab === 'logo' && (
        <form onSubmit={handleLogoSubmit}>
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
                value={companyFormData.taxNumber || ''}
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
                value={companyFormData.vatId || ''}
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

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Finanzamt
              </label>
              <input
                type="text"
                value={companyFormData.taxOffice || ''}
                onChange={(e) => setCompanyFormData({ ...companyFormData, taxOffice: e.target.value })}
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
        <form onSubmit={handleBankSubmit}>
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
                value={companyFormData.bankName || ''}
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
                value={companyFormData.bankBic || ''}
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
                value={companyFormData.bankAccount || ''}
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

            {numberingFormData.map((circle, index) => {
              console.log('🔍 [DEBUG] UI - Rendering circle:', circle.id, circle.name);
              return (
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
                      value={formatNumberInputValue(circle.digits)}
                      onChange={(e) => updateNumberingCircle(index, 'digits', parseInt(e.target.value) || 1)}
                      style={{
                        ...getNumberInputStyles(),
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
                      value={formatNumberInputValue(circle.current)}
                      onChange={(e) => updateNumberingCircle(index, 'current', parseInt(e.target.value) || 0)}
                      style={{
                        ...getNumberInputStyles(),
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
              );
            })}
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

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Software Updates</h3>
          <p style={{ opacity: 0.7, marginBottom: "24px" }}>
            Halten Sie RawaLite auf dem neuesten Stand und profitieren Sie von neuen Features, Bugfixes und Sicherheitsupdates.
          </p>

          {/* Update Check Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Update-Prüfung</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Suchen Sie nach verfügbaren Updates für RawaLite und installieren Sie diese direkt aus der Anwendung.
            </p>
            <UpdateStatus 
              onUpdateAvailable={() => setUpdateDialogOpen(true)}
            />
          </div>

          {/* Update Info Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Aktuelle Version</h4>
            <div style={{ 
              padding: "16px", 
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>RawaLite Version {currentVersion}</p>
              <p style={{ margin: "0", fontSize: "14px", opacity: 0.7 }}>
                Letzte Überprüfung: Beim nächsten Update-Check
              </p>
            </div>
          </div>

          {/* Update Settings Section */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Update-Einstellungen</h4>
            <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
              Konfigurieren Sie, wie RawaLite mit Updates umgehen soll.
            </p>
            <AutoUpdatePreferences />
          </div>
        </div>
      )}

      {/* Activities Tab - Tätigkeiten */}
        {activeTab === 'activities' && (
          <div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px"}}>
              <div>
                <h2 style={{margin:"0 0 4px 0"}}>Tätigkeiten verwalten</h2>
                <div style={{opacity:.7}}>Verwalte deine Standard-Tätigkeiten für Leistungsnachweise.</div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={openCreateActivityDialog}
              >
                Neue Tätigkeit
              </button>
            </div>
            
            {activitiesLoading ? (
              <div className="card">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p>Tätigkeiten werden geladen...</p>
                </div>
              </div>
            ) : (
              <div style={{border:"1px solid var(--color-border)", borderRadius:"8px", overflow:"hidden"}}>
                <div style={{
                  display:"grid", 
                  gridTemplateColumns:"1fr 150px 120px", 
                  backgroundColor:"var(--color-table-header)", 
                  padding:"12px 16px", 
                  fontWeight:"600",
                  borderBottom:"1px solid var(--color-border)"
                }}>
                  <div>Tätigkeit</div>
                  <div>Stundensatz</div>
                  <div>Aktionen</div>
                </div>
                
                {activities?.length === 0 ? (
                  <div style={{
                    padding:"32px 16px", 
                    textAlign:"center", 
                    color:"var(--color-text-secondary)"
                  }}>
                    Noch keine Tätigkeiten erstellt.
                  </div>
                ) : (
                  activities?.map((activity, index) => (
                    <div key={activity.id} style={{
                      display:"grid", 
                      gridTemplateColumns:"1fr 150px 120px", 
                      padding:"12px 16px",
                      alignItems:"center",
                      gap:"8px",
                      borderBottom: index < activities.length - 1 ? "1px solid var(--color-border)" : "none"
                    }}>
                      <div>
                        <div style={{fontWeight:"500", fontSize:"14px"}}>{activity.title}</div>
                        {activity.description && (
                          <div style={{fontSize:"12px", color:"var(--color-text-secondary)", marginTop:"2px"}}>
                            {activity.description}
                          </div>
                        )}
                      </div>
                      
                      <div style={{fontSize:"14px"}}>
                        {activity.hourlyRate ? `€${activity.hourlyRate}` : <em style={{opacity:0.6}}>Nicht festgelegt</em>}
                      </div>
                      
                      <div style={{display:"flex", gap:"4px"}}>
                        <button
                          onClick={() => openEditActivityDialog(activity)}
                          className="btn btn-secondary"
                          style={{padding:"4px 8px", fontSize:"11px"}}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteActivityDialog(activity)}
                          className="btn btn-danger"
                          style={{padding:"4px 8px", fontSize:"11px"}}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}      {/* Themes Tab - Farbthemes */}
      {activeTab === 'themes' && (
        <div>
          <ThemeSelector />
          
          <div style={{ margin: '32px 0', borderTop: '1px solid rgba(0,0,0,0.1)' }} />
          
          <NavigationModeSelector />
        </div>
      )}

      {/* Maintenance Tab - Datensicherung */}
      {activeTab === 'maintenance' && (
        <div>
          <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>Datensicherung & Datenmanagement</h3>
          
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
                  padding: "10px 20px",
                  cursor: saving ? "not-allowed" : "pointer",
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
                  padding: "10px 20px",
                  cursor: saving ? "not-allowed" : "pointer",
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
                  padding: "10px 20px",
                  cursor: saving ? "not-allowed" : "pointer",
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
                  padding: "10px 20px",
                  cursor: saving ? "not-allowed" : "pointer",
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
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "auto 1fr auto", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#6b7280" }}>
                    Datentyp
                  </label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as 'customers' | 'invoices' | 'offers')}
                    style={{
                      padding: "8px",
                      border: "1px solid rgba(0,0,0,.2)",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.9)",
                      minWidth: "120px"
                    }}
                  >
                    <option value="customers">Kunden</option>
                    <option value="invoices">Rechnungen</option>
                    <option value="offers">Angebote</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#6b7280" }}>
                    CSV-Datei auswählen
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileSelect}
                    style={{
                      padding: "8px",
                      border: "1px solid rgba(0,0,0,.2)",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.9)",
                      width: "100%"
                    }}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleImportCSV}
                    disabled={!selectedCSVFile || saving}
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: selectedCSVFile ? "#059669" : "#6b7280",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: selectedCSVFile && !saving ? "pointer" : "not-allowed",
                      fontWeight: "500",
                      opacity: selectedCSVFile && !saving ? 1 : 0.6,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {saving ? "Importiere..." : "Import starten"}
                  </button>
                </div>
              </div>
              {selectedCSVFile && (
                <div style={{ marginTop: "8px", fontSize: "14px", color: "#059669" }}>
                  📄 Ausgewählte Datei: {selectedCSVFile.name} ({Math.round(selectedCSVFile.size / 1024)}KB)
                </div>
              )}
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

      {/* Update Dialog - außerhalb der Tab-Bereiche */}
      <UpdateDialog 
        isOpen={updateDialogOpen}
        onClose={handleCloseUpdateDialog}
        autoCheckOnOpen={true}
      />

      {/* Activity Dialog */}
      {showActivityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {editingActivity ? 'Tätigkeit bearbeiten' : 'Neue Tätigkeit'}
            </h3>
            
            <div className="mb-4">
              <label htmlFor="activity-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="activity-name"
                type="text"
                value={activityFormData.title}
                onChange={(e) => setActivityFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name der Tätigkeit"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                id="activity-description"
                value={activityFormData.description}
                onChange={(e) => setActivityFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Beschreibung der Tätigkeit"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="activity-hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Stundensatz (€)
              </label>
              <input
                id="activity-hourlyRate"
                type="number"
                min="0"
                value={formatNumberInputValue(activityFormData.hourlyRate, true)}
                onChange={(e) => setActivityFormData(prev => ({ ...prev, hourlyRate: parseNumberInput(e.target.value, 0) }))}
                style={{
                  ...getNumberInputStyles(),
                  width: "100%",
                  padding: "8px",
                  border: "1px solid rgb(209, 213, 219)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none"
                }}
                className="focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowActivityDialog(false);
                  setEditingActivity(null);
                  setActivityFormData({ title: '', description: '', hourlyRate: 0 });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleActivitySubmit}
                disabled={!activityFormData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingActivity ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && activityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Tätigkeit löschen
            </h3>
            
            <p className="text-gray-600 mb-6">
              Möchten Sie die Tätigkeit <strong>"{activityToDelete.title}"</strong> wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setActivityToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteActivity}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
