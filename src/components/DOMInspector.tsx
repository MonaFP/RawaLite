import React, { useEffect, useState } from 'react';

/**
 * DOM-Inspektor für die Summe-Anzeige
 */
export function DOMInspector() {
  const [domContent, setDomContent] = useState<string>('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Suche nach allen Elementen die "Summe:" enthalten
      const allElements = Array.from(document.querySelectorAll('*'));
      const summeElements = allElements.filter(el => 
        el.textContent?.includes('Summe:') || el.innerHTML?.includes('Summe:')
      );
      
      const analysis = summeElements.map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          index: i,
          tagName: el.tagName,
          textContent: el.textContent,
          innerHTML: el.innerHTML,
          visible: rect.width > 0 && rect.height > 0,
          styles: {
            fontSize: getComputedStyle(el).fontSize,
            fontWeight: getComputedStyle(el).fontWeight,
            content: getComputedStyle(el, '::after').content
          }
        };
      });
      
      setDomContent(JSON.stringify(analysis, null, 2));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '400px', 
      right: '10px', 
      background: 'lightgreen', 
      padding: '10px',
      border: '2px solid green',
      zIndex: 9997,
      fontSize: '8px',
      fontFamily: 'monospace',
      maxWidth: '500px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <div><strong>DOM Inspector - Summe Elements:</strong></div>
      <pre>{domContent}</pre>
    </div>
  );
}