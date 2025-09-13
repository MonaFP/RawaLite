/**
 * 🔬 PDF Data Flow Test Script
 * Tests the complete data mapping from UI to PDF templates
 */

console.log('🔬 PDF DATA FLOW DEBUGGING SCRIPT');
console.log('=================================');

// Simulate the exact data structure being sent to main process
const testData = {
  templateType: 'offer',
  data: {
    offer: {
      id: 1,
      offerNumber: 'AN-2025-0001',
      customerId: 1,
      title: 'Test Angebot für PDF Debug',
      status: 'draft',
      validUntil: '2025-01-31',
      lineItems: [
        {
          id: 1,
          title: 'Hauptposition 1',
          description: 'Ausführliche Beschreibung der ersten Position',
          quantity: 2,
          unitPrice: 150.00,
          total: 300.00
        },
        {
          id: 2,
          title: 'Hauptposition 2', 
          description: 'Zweite Position mit Detail',
          quantity: 1,
          unitPrice: 250.00,
          total: 250.00
        }
      ],
      subtotal: 550.00,
      vatRate: 19,
      vatAmount: 104.50,
      total: 654.50,
      notes: 'Weitere Hinweise zum Angebot',
      createdAt: '2025-01-13',
      updatedAt: '2025-01-13'
    },
    customer: {
      id: 1,
      number: 'K-0001',
      name: 'Mustermann GmbH',
      email: 'info@mustermann.de',
      phone: '+49 123 456789',
      street: 'Musterstraße 123',
      zip: '12345',
      city: 'Musterstadt',
      notes: 'Wichtiger Kunde',
      createdAt: '2025-01-13',
      updatedAt: '2025-01-13'
    },
    settings: {
      companyData: {
        name: 'Test Firma GmbH',
        street: 'Firmenstraße 456',
        zip: '67890',
        city: 'Firmenstadt',
        phone: '+49 987 654321',
        email: 'kontakt@testfirma.de',
        website: 'www.testfirma.de',
        taxId: 'DE123456789',
        vatId: 'DE987654321',
        kleinunternehmer: false,
        bankName: 'Test Bank',
        bankAccount: 'DE12 3456 7890 1234 5678 90',
        bankBic: 'TESTDEFFXXX',
        logo: null
      }
    },
    currentDate: '13.01.2025'
  },
  theme: {
    themeId: 'rosé',
    theme: {
      id: 'rosé',
      name: 'Rosé (Soft)',
      primary: '#6b4d5a',
      secondary: '#5e4050',
      accent: '#e6a8b8',
      gradient: 'linear-gradient(160deg, #6b4d5a 0%, #5e4050 40%, #513343 100%)',
      description: 'Sanfte Rosétöne für dezente Eleganz'
    },
    primary: '#6b4d5a',
    secondary: '#5e4050',
    accent: '#e6a8b8'
  },
  options: {
    filename: 'Test_Angebot_AN-2025-0001_Mustermann_GmbH.pdf',
    previewOnly: true,
    enablePDFA: false,
    validateCompliance: false
  }
};

console.log('📊 COMPLETE DATA STRUCTURE ANALYSIS:');
console.log('=====================================');

// Analyze data structure depth
function analyzeObject(obj, path = '', level = 0) {
  const indent = '  '.repeat(level);
  
  if (typeof obj !== 'object' || obj === null) {
    console.log(`${indent}${path}: ${typeof obj} = "${obj}"`);
    return;
  }
  
  if (Array.isArray(obj)) {
    console.log(`${indent}${path}: Array[${obj.length}]`);
    if (obj.length > 0) {
      console.log(`${indent}  [0]: ${typeof obj[0]} ${obj[0] && typeof obj[0] === 'object' ? Object.keys(obj[0]).join(', ') : ''}`);
    }
    return;
  }
  
  console.log(`${indent}${path}: Object {${Object.keys(obj).join(', ')}}`);
  
  if (level < 3) { // Prevent deep recursion
    for (const [key, value] of Object.entries(obj)) {
      analyzeObject(value, path ? `${path}.${key}` : key, level + 1);
    }
  }
}

analyzeObject(testData);

console.log('\n🔍 CRITICAL TEMPLATE VARIABLES CHECK:');
console.log('=====================================');

// Test the exact variables used in templates
const templateVars = [
  'offer.offerNumber',
  'offer.createdAt', 
  'offer.validUntil',
  'offer.title',
  'offer.total',
  'offer.subtotal',
  'offer.vatAmount',
  'offer.vatRate',
  'customer.name',
  'customer.email',
  'customer.phone',
  'customer.street',
  'customer.zip',
  'customer.city',
  'company.name',
  'company.street', 
  'company.zip',
  'company.city',
  'company.phone',
  'company.email',
  'company.website',
  'theme.themeId',
  'theme.primary',
  'theme.secondary',
  'theme.accent'
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current && typeof current === 'object' ? current[prop] : undefined;
  }, obj);
}

templateVars.forEach(varPath => {
  const value = getNestedValue(testData, varPath);
  const status = value !== undefined ? '✅' : '❌';
  const displayValue = value !== undefined ? `"${value}"` : 'UNDEFINED';
  console.log(`${status} {{${varPath}}} = ${displayValue}`);
});

console.log('\n🎨 THEME INTEGRATION CHECK:');
console.log('============================');

if (testData.theme && testData.theme.theme) {
  console.log('✅ Theme structure is correct');
  console.log(`   Primary: ${testData.theme.theme.primary}`);
  console.log(`   Secondary: ${testData.theme.theme.secondary}`);
  console.log(`   Accent: ${testData.theme.theme.accent}`);
} else {
  console.log('❌ Theme structure issue detected');
  console.log('   Theme object:', !!testData.theme);
  if (testData.theme) {
    console.log('   Theme.theme:', !!testData.theme.theme);
    console.log('   Available keys:', Object.keys(testData.theme));
  }
}

console.log('\n📄 TEMPLATE MAPPING VERIFICATION:');
console.log('==================================');

// Check mapping between data structure and template expectations
const mappingIssues = [];

// Check company mapping (critical fix)
if (!getNestedValue(testData, 'company.name')) {
  mappingIssues.push('company.* variables missing - should map from settings.companyData');
}

// Check offer data
if (!getNestedValue(testData, 'offer.offerNumber')) {
  mappingIssues.push('offer.offerNumber missing');
}

// Check customer data
if (!getNestedValue(testData, 'customer.name')) {
  mappingIssues.push('customer.name missing');
}

if (mappingIssues.length === 0) {
  console.log('✅ All expected template variables are properly mapped');
} else {
  console.log('❌ MAPPING ISSUES DETECTED:');
  mappingIssues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n💡 RECOMMENDATIONS:');
console.log('===================');
console.log('1. Check main.ts templateData mapping: company should map from settings.companyData');
console.log('2. Verify all offer.* and customer.* data is passed correctly');
console.log('3. Ensure theme.theme structure is preserved through IPC');
console.log('4. Test formatDate and formatCurrency helpers with actual date strings');

console.log('\n🔬 Test data structure ready for PDF generation!');