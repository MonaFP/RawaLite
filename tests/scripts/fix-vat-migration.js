/**
 * 🚨 VAT Migration Script für Kleinunternehmer-Compliance
 * 
 * Dieses Script korrigiert bestehende Angebote/Rechnungen die noch falsche 
 * MwSt-Beträge haben, obwohl Kleinunternehmer-Status aktiv ist.
 * 
 * Rechtliche Grundlage: § 19 UStG - Kleinunternehmer dürfen keine MwSt ausweisen
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

console.log('🔍 VAT Migration Script gestartet...');
console.log('📁 Database Path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found:', dbPath);
  process.exit(1);
}

const db = new sqlite3.default.Database(dbPath);

async function fixVATForKleinunternehmer() {
  return new Promise((resolve, reject) => {
    // 1. Prüfe Kleinunternehmer-Status
    db.get(`SELECT kleinunternehmer FROM settings WHERE id = 1`, (err, settings) => {
      if (err) return reject(err);
      
      const isKleinunternehmer = settings?.kleinunternehmer === 1;
      console.log('🏢 Kleinunternehmer Status:', isKleinunternehmer);
      
      if (!isKleinunternehmer) {
        console.log('✅ Kein Kleinunternehmer - keine VAT-Migration erforderlich');
        return resolve();
      }
      
      // 2. Finde alle Angebote mit VAT > 0
      db.all(`SELECT id, offerNumber, vatAmount, total, subtotal FROM offers WHERE vatAmount > 0`, (err, offers) => {
        if (err) return reject(err);
        
        console.log(`🔍 Gefunden: ${offers.length} Angebote mit inkorrekter MwSt`);
        
        if (offers.length === 0) {
          console.log('✅ Alle Angebote bereits korrekt - keine Migration erforderlich');
          return resolve();
        }
        
        // 3. Korrigiere jedes Angebot
        let fixed = 0;
        offers.forEach(offer => {
          const newTotal = offer.subtotal; // Total = Subtotal (ohne MwSt)
          
          db.run(
            `UPDATE offers SET vatAmount = 0, total = ? WHERE id = ?`,
            [newTotal, offer.id],
            function(err) {
              if (err) {
                console.error(`❌ Fehler bei Angebot ${offer.offerNumber}:`, err);
                return;
              }
              
              console.log(`✅ Korrigiert: ${offer.offerNumber} - VAT: ${offer.vatAmount.toFixed(2)}€ → 0.00€, Total: ${offer.total.toFixed(2)}€ → ${newTotal.toFixed(2)}€`);
              fixed++;
              
              if (fixed === offers.length) {
                console.log(`🎉 VAT-Migration abgeschlossen! ${fixed} Angebote korrigiert.`);
                
                // 4. Korrigiere auch Rechnungen
                fixInvoiceVAT(resolve, reject);
              }
            }
          );
        });
      });
    });
  });
}

function fixInvoiceVAT(resolve, reject) {
  db.all(`SELECT id, invoiceNumber, vatAmount, total, subtotal FROM invoices WHERE vatAmount > 0`, (err, invoices) => {
    if (err) return reject(err);
    
    console.log(`🔍 Gefunden: ${invoices.length} Rechnungen mit inkorrekter MwSt`);
    
    if (invoices.length === 0) {
      console.log('✅ Alle Rechnungen bereits korrekt');
      return resolve();
    }
    
    let fixed = 0;
    invoices.forEach(invoice => {
      const newTotal = invoice.subtotal;
      
      db.run(
        `UPDATE invoices SET vatAmount = 0, total = ? WHERE id = ?`,
        [newTotal, invoice.id],
        function(err) {
          if (err) {
            console.error(`❌ Fehler bei Rechnung ${invoice.invoiceNumber}:`, err);
            return;
          }
          
          console.log(`✅ Korrigiert: ${invoice.invoiceNumber} - VAT: ${invoice.vatAmount.toFixed(2)}€ → 0.00€`);
          fixed++;
          
          if (fixed === invoices.length) {
            console.log(`🎉 VAT-Migration komplett! ${fixed} Rechnungen korrigiert.`);
            resolve();
          }
        }
      );
    });
  });
}

// Starte Migration
fixVATForKleinunternehmer()
  .then(() => {
    console.log('✅ VAT-Migration erfolgreich abgeschlossen!');
    console.log('🔄 Bitte starten Sie RawaLite neu, um die Änderungen zu sehen.');
    db.close();
  })
  .catch(err => {
    console.error('❌ VAT-Migration fehlgeschlagen:', err);
    db.close();
    process.exit(1);
  });

module.exports = { fixVATForKleinunternehmer };