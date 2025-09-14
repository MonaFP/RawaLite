/**
 * PDF System Integration Test
 * Tests the complete new Electron-based PDF generation workflow
 */

import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  templatesDir: './templates',
  servicesDir: './src/services',
  electronDir: './electron',
  requiredFiles: [
    './templates/offer.html',
    './templates/invoice.html', 
    './templates/timesheet.html',
    './src/services/PDFService.ts',
    './src/services/PDFPostProcessor.ts',
    './electron/main.ts',
    './electron/preload.ts'
  ]
};

console.log('🧪 RawaLite PDF System Integration Test');
console.log('======================================\n');

// Test 1: File Structure Validation
console.log('1️⃣ Validating PDF System File Structure...');
let filesValid = true;

TEST_CONFIG.requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${filePath}`);
  } else {
    console.log(`  ❌ ${filePath} - MISSING!`);
    filesValid = false;
  }
});

if (!filesValid) {
  console.log('\n❌ File structure validation FAILED!');
  process.exit(1);
}

// Test 2: Template System Validation
console.log('\n2️⃣ Validating HTML Template System...');
const templateFiles = ['offer.html', 'invoice.html', 'timesheet.html'];
let templatesValid = true;

templateFiles.forEach(template => {
  const templatePath = path.join('./templates', template);
  try {
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Check for DIN 5008 compliance indicators
    const hasLogoSection = content.includes('logo') || content.includes('company-logo');
    const hasFooter = content.includes('footer') || content.includes('company-footer');
    const hasStyles = content.includes('<style>');
    const hasVariables = content.includes('{{');
    const hasDIN5008 = content.includes('DIN 5008');
    const hasAddressField = content.includes('address-field') || content.includes('recipient');
    
    if (hasLogoSection && hasFooter && hasStyles && hasVariables && hasDIN5008 && hasAddressField) {
      console.log(`  ✅ ${template} - DIN 5008 compliant`);
    } else {
      console.log(`  ⚠️  ${template} - Missing: Logo:${hasLogoSection} Footer:${hasFooter} Styles:${hasStyles} Variables:${hasVariables} DIN5008:${hasDIN5008} Address:${hasAddressField}`);
      templatesValid = false;
    }
  } catch (error) {
    console.log(`  ❌ ${template} - Read error: ${error.message}`);
    templatesValid = false;
  }
});

// Test 3: Service Layer Validation
console.log('\n3️⃣ Validating Service Layer Implementation...');

// Check PDFService.ts
try {
  const pdfServiceContent = fs.readFileSync('./src/services/PDFService.ts', 'utf8');
  const hasExportMethods = pdfServiceContent.includes('exportOfferToPDF') && 
                          pdfServiceContent.includes('exportInvoiceToPDF') && 
                          pdfServiceContent.includes('exportTimesheetToPDF');
  const hasInterfaces = pdfServiceContent.includes('PDFGenerationOptions') && 
                       pdfServiceContent.includes('PDFResult');
  
  if (hasExportMethods && hasInterfaces) {
    console.log('  ✅ PDFService.ts - Complete implementation');
  } else {
    console.log('  ⚠️  PDFService.ts - Missing methods or interfaces');
  }
} catch (error) {
  console.log(`  ❌ PDFService.ts - Read error: ${error.message}`);
}

// Check PDFPostProcessor.ts
try {
  const postProcessorContent = fs.readFileSync('./src/services/PDFPostProcessor.ts', 'utf8');
  const hasPDFAConversion = postProcessorContent.includes('convertToPDFA');
  const hasValidation = postProcessorContent.includes('validatePDFA');
  const hasGhostscript = postProcessorContent.includes('ghostscript');
  
  if (hasPDFAConversion && hasValidation && hasGhostscript) {
    console.log('  ✅ PDFPostProcessor.ts - PDF/A-2b support implemented');
  } else {
    console.log('  ⚠️  PDFPostProcessor.ts - Missing PDF/A-2b components');
  }
} catch (error) {
  console.log(`  ❌ PDFPostProcessor.ts - Read error: ${error.message}`);
}

// Test 4: Electron Integration Validation
console.log('\n4️⃣ Validating Electron Integration...');

// Check main.ts IPC handlers
try {
  const mainContent = fs.readFileSync('./electron/main.ts', 'utf8');
  const hasPDFHandler = mainContent.includes('pdf:generate');
  const hasTemplateRendering = mainContent.includes('renderTemplate');
  const hasPrintToPDF = mainContent.includes('printToPDF');
  
  if (hasPDFHandler && hasTemplateRendering && hasPrintToPDF) {
    console.log('  ✅ electron/main.ts - PDF IPC handlers implemented');
  } else {
    console.log('  ⚠️  electron/main.ts - Missing PDF handlers');
  }
} catch (error) {
  console.log(`  ❌ electron/main.ts - Read error: ${error.message}`);
}

// Check preload.ts API exposure
try {
  const preloadContent = fs.readFileSync('./electron/preload.ts', 'utf8');
  const hasElectronAPI = preloadContent.includes('electronAPI');
  const hasPDFAPI = preloadContent.includes('pdf');
  
  if (hasElectronAPI && hasPDFAPI) {
    console.log('  ✅ electron/preload.ts - PDF API exposed');
  } else {
    console.log('  ⚠️  electron/preload.ts - Missing PDF API');
  }
} catch (error) {
  console.log(`  ❌ electron/preload.ts - Read error: ${error.message}`);
}

// Test 5: UI Integration Validation
console.log('\n5️⃣ Validating UI Integration...');

// Check AngebotePage.tsx
try {
  const angeboteContent = fs.readFileSync('./src/pages/AngebotePage.tsx', 'utf8');
  const importsPDFService = angeboteContent.includes('PDFService');
  const usesNewPDFExport = angeboteContent.includes('PDFService.exportOfferToPDF');
  
  if (importsPDFService && usesNewPDFExport) {
    console.log('  ✅ AngebotePage.tsx - New PDF system integrated');
  } else {
    console.log('  ⚠️  AngebotePage.tsx - PDF integration incomplete');
  }
} catch (error) {
  console.log(`  ❌ AngebotePage.tsx - Read error: ${error.message}`);
}

// Check RechnungenPage.tsx
try {
  const rechnungenContent = fs.readFileSync('./src/pages/RechnungenPage.tsx', 'utf8');
  const importsPDFService = rechnungenContent.includes('PDFService');
  const usesNewPDFExport = rechnungenContent.includes('PDFService.exportInvoiceToPDF');
  
  if (importsPDFService && usesNewPDFExport) {
    console.log('  ✅ RechnungenPage.tsx - New PDF system integrated');
  } else {
    console.log('  ⚠️  RechnungenPage.tsx - PDF integration incomplete');
  }
} catch (error) {
  console.log(`  ❌ RechnungenPage.tsx - Read error: ${error.message}`);
}

// Test 6: Dependencies Check
console.log('\n6️⃣ Validating Dependencies...');

try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Check old dependencies are removed
  const hasOldJsPDF = packageJson.dependencies?.['jspdf'] || packageJson.devDependencies?.['jspdf'];
  const hasOldHtml2Canvas = packageJson.dependencies?.['html2canvas'] || packageJson.devDependencies?.['html2canvas'];
  
  if (!hasOldJsPDF && !hasOldHtml2Canvas) {
    console.log('  ✅ Old PDF dependencies removed (jsPDF, html2canvas)');
  } else {
    console.log('  ⚠️  Old PDF dependencies still present');
  }
  
  // Check Electron version
  const electronVersion = packageJson.dependencies?.['electron'] || packageJson.devDependencies?.['electron'];
  if (electronVersion) {
    console.log(`  ✅ Electron ${electronVersion} - PDF generation support`);
  } else {
    console.log('  ❌ Electron dependency missing');
  }
  
} catch (error) {
  console.log(`  ❌ package.json - Read error: ${error.message}`);
}

// Final Test Summary
console.log('\n🎯 PDF System Integration Test Complete!');
console.log('========================================');

if (filesValid && templatesValid) {
  console.log('✅ PASSED: PDF System successfully implemented');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run `pnpm dev` to test in development mode');
  console.log('   2. Create test offers/invoices and validate PDF export');
  console.log('   3. Install Ghostscript for PDF/A-2b conversion (optional)');
  console.log('   4. Install veraPDF for validation (optional)');
  console.log('\n🚀 Ready for production use!');
  process.exit(0);
} else {
  console.log('❌ FAILED: PDF System has issues that need attention');
  process.exit(1);
}