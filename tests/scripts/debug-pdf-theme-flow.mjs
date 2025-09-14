// PDF Theme Data Flow Debugging - ESM Version
// Note: Using manual theme simulation since we can't import TS files directly in Node

console.log('=== PDF THEME DATA FLOW DEBUGGING ===');
console.log('');

// Simulate getCurrentPDFTheme function behavior
function simulateGetCurrentPDFTheme(themeId, customColors) {
  const themeDefinitions = {
    'rosé': {
      id: 'rosé',
      name: 'Rosé (Soft)',
      primary: '#6b4d5a',
      secondary: '#5e4050', 
      accent: '#e6a8b8',
      gradient: 'linear-gradient(160deg, #6b4d5a 0%, #5e4050 40%, #513343 100%)',
      description: 'Sanfte Rosétöne für dezente Eleganz'
    },
    'salbeigrün': {
      id: 'salbeigrün',
      name: 'Salbeigrün (Standard)',
      primary: '#4a5d5a',
      secondary: '#3a4d4a',
      accent: '#7dd3a0',
      gradient: 'linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%)',
      description: 'Beruhigendes Salbeigrün mit sanften Pastellakzenten'
    }
  };
  
  const theme = themeDefinitions[themeId] || themeDefinitions['salbeigrün'];
  
  return {
    themeId: themeId,
    theme: theme,
    cssVariables: `CSS variables for ${themeId}`,
    themeCSS: `Theme CSS for ${themeId}`
  };
}

// Test theme data pipeline like in PDFService
async function testThemeDataFlow() {
  try {
    // 1. Simulate current theme selection
    const currentTheme = 'rosé';
    const customColors = undefined; // Standard theme, no custom colors
    
    console.log('🎨 Input Parameters:');
    console.log('  currentTheme:', currentTheme);
    console.log('  customColors:', customColors);
    console.log('');
    
    // 2. Generate PDF theme data (like PDFService does)
    const pdfTheme = simulateGetCurrentPDFTheme(currentTheme, customColors);
    console.log('🔄 Generated PDF Theme Data:');
    console.log('  themeId:', pdfTheme?.themeId);
    console.log('  theme object:', !!pdfTheme?.theme);
    if (pdfTheme?.theme) {
      console.log('    primary:', pdfTheme.theme.primary);
      console.log('    secondary:', pdfTheme.theme.secondary);
      console.log('    accent:', pdfTheme.theme.accent);
    }
    console.log('');
    
    // 3. Simulate template data structure (like PDFService creates)
    const templateData = {
      templateType: 'offer',
      data: {
        offer: { offerNumber: 'AN-2025-0001' },
        customer: { name: 'Test Customer' },
        settings: { companyData: { name: 'Test Company' } },
        currentDate: new Date().toLocaleDateString('de-DE')
      },
      theme: pdfTheme ? {
        themeId: pdfTheme.themeId,
        theme: pdfTheme.theme,
        primary: pdfTheme.theme.primary,
        secondary: pdfTheme.theme.secondary,
        accent: pdfTheme.theme.accent
      } : null,
      options: {
        filename: 'test.pdf',
        previewOnly: false,
        enablePDFA: false,
        validateCompliance: false
      }
    };
    
    console.log('📦 Template Data Structure:');
    console.log('  theme exists:', !!templateData.theme);
    if (templateData.theme) {
      console.log('    themeId:', templateData.theme.themeId);
      console.log('    theme nested object:', !!templateData.theme.theme);
      console.log('    primary (direct):', templateData.theme.primary);
      console.log('    primary (nested):', templateData.theme.theme?.primary);
    }
    console.log('');
    
    // 4. Simulate JSON serialization (IPC transmission)
    console.log('📡 IPC Serialization Test:');
    const serialized = JSON.stringify(templateData);
    const deserialized = JSON.parse(serialized);
    
    console.log('  Serialization successful:', !!serialized);
    console.log('  Deserialized theme:', !!deserialized.theme);
    if (deserialized.theme) {
      console.log('    themeId after IPC:', deserialized.theme.themeId);
      console.log('    primary after IPC:', deserialized.theme.primary);
      console.log('    nested theme after IPC:', !!deserialized.theme.theme);
      if (deserialized.theme.theme) {
        console.log('    nested primary after IPC:', deserialized.theme.theme.primary);
      }
    }
    console.log('');
    
    // 5. Check data integrity
    const originalThemePrimary = pdfTheme?.theme?.primary;
    const deserializedThemePrimary = deserialized.theme?.primary;
    const deserializedNestedPrimary = deserialized.theme?.theme?.primary;
    
    console.log('✅ Data Integrity Check:');
    console.log('  Original primary:', originalThemePrimary);
    console.log('  Direct primary preserved:', originalThemePrimary === deserializedThemePrimary);
    console.log('  Nested primary preserved:', originalThemePrimary === deserializedNestedPrimary);
    
    const dataIntegrityOK = (
      originalThemePrimary === deserializedThemePrimary &&
      originalThemePrimary === deserializedNestedPrimary
    );
    
    console.log('  Overall integrity:', dataIntegrityOK ? '✅ PASS' : '❌ FAIL');
    
    if (!dataIntegrityOK) {
      console.log('');
      console.log('❌ PROBLEM DETECTED:');
      console.log('  Theme data structure may have redundancy or inconsistency');
      console.log('  Recommendation: Simplify theme data structure in PDFService');
    } else {
      console.log('');
      console.log('✅ THEME DATA FLOW: OK');
      console.log('  No issues detected in theme data transmission');
    }
    
  } catch (error) {
    console.error('❌ Error in theme data flow test:', error.message);
    console.error('  Stack:', error.stack);
  }
}

// Run the test
await testThemeDataFlow();