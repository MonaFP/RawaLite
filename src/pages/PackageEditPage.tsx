import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackages } from '../hooks/usePackages';
import { useNotifications } from '../contexts/NotificationContext';
import PackageForm, { type PackageFormValues } from '../components/PackageForm';

interface PackageEditPageProps {
  // Props interface kept for future extensibility
}

export default function PackageEditPage({}: PackageEditPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { packages, loading, updatePackage } = usePackages();
  const { showError, showSuccess } = useNotifications();
  
  const [currentPackage, setCurrentPackage] = useState<any>(null);

  // Find package by ID
  useEffect(() => {
    if (!id || loading) return;
    
    const packageId = parseInt(id, 10);
    if (isNaN(packageId)) {
      showError('Ungültige Paket-ID');
      navigate('/pakete');
      return;
    }

    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) {
      showError('Paket nicht gefunden');
      navigate('/pakete');
      return;
    }

    setCurrentPackage(pkg);
  }, [id, packages, loading, showError, navigate]);

  // **Environment Detection** - import.meta.env.DEV für Renderer Process
  const isDev = import.meta.env.DEV;

  // Keyboard shortcuts - only active in this Edit view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input elements are focused
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Esc → back to list
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }

      // Ctrl+S → save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Will be triggered via form submit
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCancel = useCallback(() => {
    // Navigate back to list - state will be restored automatically by PaketePage
    navigate('/pakete');
  }, [navigate]);

  const handleSubmit = useCallback(async (values: PackageFormValues) => {
    if (!currentPackage) return;
    
    try {
      // Convert Array-Indices back to DB-IDs for persistence
      // **Field-Mapping Pattern** - following existing PaketePage pattern
      const processedLineItems = values.lineItems.map((item: any, index: number) => {
        const dbId = index + 1;
        return {
          ...item,
          id: dbId,
          // Convert parentItemId from Array-Index to DB-ID
          parentItemId: item.parentItemId !== undefined 
            ? (item.parentItemId as number) + 1  // Array-Index → DB-ID
            : undefined
        };
      });

      await updatePackage(currentPackage.id, { 
        internalTitle: values.internalTitle,
        lineItems: processedLineItems,
        parentPackageId: values.parentPackageId,
        addVat: values.addVat
      });

      showSuccess(`Paket "${values.internalTitle}" wurde aktualisiert`);
      
      // Navigate back to list - state will be restored automatically by PaketePage
      navigate('/pakete');
      
    } catch (error) {
      showError('Fehler beim Speichern des Pakets');
      console.error('Package update error:', error);
    }
  }, [currentPackage, updatePackage, showSuccess, showError, navigate]);

  // Loading state
  if (loading || !currentPackage) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div>Paket wird geladen...</div>
        </div>
      </div>
    );
  }

  // **Convert DB-IDs to Array-Indices** for PackageForm compatibility
  // Following existing pattern from PaketePage.tsx
  const formInitialValues: PackageFormValues = {
    internalTitle: currentPackage.internalTitle,
    lineItems: (() => {
      const dbToIndexMap: Record<number, number> = {};
      
      // Create mapping: DB-ID → Array-Index
      currentPackage.lineItems.forEach((item: any, index: number) => {
        dbToIndexMap[item.id] = index;
      });
      
      return currentPackage.lineItems.map((li: any) => ({ 
        title: li.title, 
        quantity: li.quantity, 
        unitPrice: li.unitPrice,
        parentItemId: li.parentItemId ? dbToIndexMap[li.parentItemId] : undefined,
        description: li.description,
        priceDisplayMode: li.priceDisplayMode || 'default'
      }));
    })(),
    addVat: !!currentPackage.addVat,
    parentPackageId: currentPackage.parentPackageId
  };

  return (
    <div className="card">
      {/* **Focus-Mode Breadcrumb** - No overlays, in-flow design */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ 
          fontSize: '14px', 
          color: 'var(--text-muted)', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button 
            onClick={() => navigate('/pakete')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            Pakete
          </button>
          <span>›</span>
          <span>{currentPackage.internalTitle}</span>
          <span>›</span>
          <span>Bearbeiten</span>
        </nav>
        
        <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          📦 {currentPackage.internalTitle} bearbeiten
          {isDev && (
            <span style={{ 
              fontSize: '12px', 
              background: 'var(--accent)', 
              color: 'white', 
              padding: '2px 6px', 
              borderRadius: '4px' 
            }}>
              DEV
            </span>
          )}
        </h2>
        <div style={{ opacity: 0.7, fontSize: '14px' }}>
          Bearbeite die Details und Positionen des Pakets.
        </div>
      </div>

      {/* **PackageForm - No Overlay, In-Flow** */}
      <PackageForm
        initial={formInitialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Paket aktualisieren"
        packages={packages}
      />

      {/* **Keyboard Shortcuts Info** (nur in Dev) */}
      {isDev && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          💡 <strong>Shortcuts:</strong> ESC = Zurück zur Liste | Ctrl+S = Speichern
        </div>
      )}
    </div>
  );
}