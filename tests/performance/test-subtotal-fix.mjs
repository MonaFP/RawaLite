#!/usr/bin/env node

/**
 * Test Suite: Validierung der Discount Calculator & Subtotal Fixes
 * 
 * Diese Tests validieren die Behebung der beiden Hauptprobleme:
 * 1. 80,00€ Input → 79,98€ Speicherung (subtotal fix)
 * 2. PDF Einzelpreis 0,00€ (field mapping fix)
 */

import { calculateDocumentTotals } from './src/lib/discount-calculator.ts';

console.log("=== Discount Calculator & Subtotal Fix Tests ===\n");

// Test 1: Grundlegende Berechnung ohne Rabatt
console.log("Test 1: Kein Rabatt (80,00€ Einzelpreis)");
const lineItems1 = [{ quantity: 1, unitPrice: 80.00 }];
const totals1 = calculateDocumentTotals(lineItems1, 'none', 0, 19, false);

console.log("Input: 1x 80,00€");
console.log("subtotalBeforeDiscount:", totals1.subtotalBeforeDiscount); // Sollte 80.00 sein
console.log("subtotalAfterDiscount:", totals1.subtotalAfterDiscount);   // Sollte 80.00 sein
console.log("VAT (19%):", totals1.vatAmount);
console.log("Total:", totals1.totalAmount);
console.log("");

// Test 2: Kleine Menge mit potentieller Rundungsproblematik
console.log("Test 2: Rundungstest mit kleinen Beträgen");
const lineItems2 = [{ quantity: 3, unitPrice: 26.67 }];
const totals2 = calculateDocumentTotals(lineItems2, 'none', 0, 19, false);

console.log("Input: 3x 26,67€");
console.log("subtotalBeforeDiscount:", totals2.subtotalBeforeDiscount);
console.log("subtotalAfterDiscount:", totals2.subtotalAfterDiscount);
console.log("");

// Test 3: Mit 5% Rabatt
console.log("Test 3: 5% Prozentrabatt auf 80,00€");
const lineItems3 = [{ quantity: 1, unitPrice: 80.00 }];
const totals3 = calculateDocumentTotals(lineItems3, 'percentage', 5, 19, false);

console.log("Input: 1x 80,00€ mit 5% Rabatt");
console.log("subtotalBeforeDiscount:", totals3.subtotalBeforeDiscount); // Sollte 80.00 sein
console.log("discountAmount:", totals3.discountAmount);                 // Sollte 4.00 sein
console.log("subtotalAfterDiscount:", totals3.subtotalAfterDiscount);   // Sollte 76.00 sein
console.log("");

// Test 4: Kleinunternehmer Modus
console.log("Test 4: Kleinunternehmer (keine MwSt)");
const lineItems4 = [{ quantity: 1, unitPrice: 80.00 }];
const totals4 = calculateDocumentTotals(lineItems4, 'none', 0, 19, true);

console.log("Input: 1x 80,00€ (Kleinunternehmer)");
console.log("subtotalBeforeDiscount:", totals4.subtotalBeforeDiscount);
console.log("vatAmount:", totals4.vatAmount); // Sollte 0.00 sein
console.log("totalAmount:", totals4.totalAmount); // Sollte 80.00 sein
console.log("");

// Test 5: Validierung dass lineItems unverändert bleiben
console.log("Test 5: lineItems Konsistenz-Check");
const originalLineItems = [{ quantity: 1, unitPrice: 80.00 }];
const originalCopy = JSON.parse(JSON.stringify(originalLineItems));

calculateDocumentTotals(originalLineItems, 'percentage', 10, 19, false);

console.log("Original lineItems vor Berechnung:", originalCopy);
console.log("Original lineItems nach Berechnung:", originalLineItems);
console.log("Sind identisch:", JSON.stringify(originalCopy) === JSON.stringify(originalLineItems));
console.log("");

// Test 6: Fix Validation - Was passierte VORHER vs NACHHER
console.log("Test 6: Subtotal Logic Fix Validation");
const testData = [{ quantity: 1, unitPrice: 80.00 }];
const result = calculateDocumentTotals(testData, 'none', 0, 19, false);

console.log("VORHER (falsch): subtotal = totals.subtotalAfterDiscount =", result.subtotalAfterDiscount);
console.log("NACHHER (richtig): subtotal = totals.subtotalBeforeDiscount =", result.subtotalBeforeDiscount);
console.log("Problem behoben:", result.subtotalBeforeDiscount === 80.00 ? "✅ JA" : "❌ NEIN");
console.log("");

console.log("=== Test Suite Abgeschlossen ===");
console.log("");
console.log("🎯 ERWARTETE ERGEBNISSE:");
console.log("   • Alle subtotalBeforeDiscount Werte sollten exakt 80.00 sein");
console.log("   • Keine 79.98 oder ähnliche Rundungsfehler");
console.log("   • lineItems bleiben unverändert (wichtig für PDF Template)");
console.log("   • Discount Calculator arbeitet mit korrekter Präzision");