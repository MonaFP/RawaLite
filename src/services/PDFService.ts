export async function generatePDF(template: string, data: object, kleinunternehmer: boolean): Promise<Buffer> {
  let content = template.replace(/{{name}}/g, data.name); // HTML-Template mit Platzhaltern
  if (kleinunternehmer) {
    content += '<p>Gemäß §19 UStG wird keine Umsatzsteuer ausgewiesen.</p>';
  } else {
    // USt Berechnung
  }
  content += '<footer>Seite {{page}} von {{pages}} | Pflichtangaben §14 UStG: Firma, Adresse, etc.</footer>';
  return window.api.pdf.generate(content, { footer: '...' });
}