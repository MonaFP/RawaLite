import { useEffect, useState } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import type { Customer } from "../persistence/adapter";

interface AngebotDetailPageProps {
  // zukünftig: offerId?: string; // wenn du Routing/Details einhängst
}

export default function AngebotDetailPage({}: AngebotDetailPageProps) {
  const { adapter, ready, error } = usePersistence();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>("");

  // customern laden
  useEffect(() => {
    if (!ready || !adapter) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const rows = await adapter.listCustomers();
        if (active) setCustomers(rows);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [ready, adapter]);

  async function handleAddQuickCustomer() {
    if (!adapter) return;
    const name = newCustomerName.trim();
    if (!name) return;

    // einfache Nummernvergabe – später durch NummernkreisService ersetzen
    const number = `K-${String(Date.now()).slice(-6)}`;

    await adapter.createCustomer({
      number,
      name,
      email: undefined,
      phone: undefined,
      street: undefined,
      zip: undefined,
      city: undefined,
      notes: undefined,
    });

    // Refresh list (einfach gehalten)
    const rows = await adapter.listCustomers();
    setCustomers(rows);
    setNewCustomerName("");
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Angebot – Details</h1>
        {/* Platz für Aktionen (Speichern, PDF, etc.) */}
      </header>

      {!ready && (
        <div className="text-sm text-gray-500">Initialisiere Persistenz…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          Persistenzfehler: {String(error)}
        </div>
      )}

      {/* customern-Sektion (als Vorbereitung für Angebots-Zuordnung) */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">customer</h2>

        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Neuen customern schnell anlegen…"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
          />
          <button
            className="border rounded px-3 py-1"
            onClick={handleAddQuickCustomer}
            disabled={!ready || !adapter || !newCustomerName.trim()}
          >
            Anlegen
          </button>
        </div>

        <div className="border rounded">
          <div className="grid grid-cols-4 gap-2 px-3 py-2 font-semibold bg-gray-50">
            <div>Nr.</div>
            <div>Name</div>
            <div>Ort</div>
            <div>Geändert</div>
          </div>

          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Lade customern…</div>
          ) : customers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Noch keine customern erfasst.
            </div>
          ) : (
            <ul className="divide-y">
              {customers.map((c) => (
                <li key={c.id} className="grid grid-cols-4 gap-2 px-3 py-2">
                  <div className="truncate">{c.number}</div>
                  <div className="truncate">{c.name}</div>
                  <div className="truncate">
                    {[c.zip, c.city].filter(Boolean).join(" ")}
                  </div>
                  <div className="truncate">
                    {new Date(c.updatedAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Platzhalter für Angebotsdetails (Positionen, Summen, Nummernkreis, PDF) */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Positionen</h2>
        <p className="text-sm text-gray-500">
          TODO: Positionen-Editor, Netto/Brutto, MwSt., Gesamtsumme, PDF-Preview.
        </p>
      </section>
    </div>
  );
}
