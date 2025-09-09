// src/App.tsx
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    // kleine Probe: Bridge vorhanden?
    // @ts-expect-error - preload stellt rawalite bereit
    window.rawalite?.log?.('Renderer gestartet')
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>RaWaLite</h1>
      <p>React + Vite + Electron läuft 🎉</p>
      <ul>
        <li>Links: Sidebar / Navigation</li>
        <li>Rechts: Inhalt</li>
      </ul>
    </div>
  )
}
