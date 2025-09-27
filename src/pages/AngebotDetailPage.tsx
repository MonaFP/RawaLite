import { useEffect, useState } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import type { Customer } from "../persistence/adapter";

interface AngebotDetailPageProps {
  // z.B. offerId?: string;
}

export default function AngebotDetailPage({}: AngebotDetailPageProps) {
  const { adapter, ready, error } = usePersistence();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

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
    const number = `K-${String(Date.now()).slice(-6)}`; // später NummernkreisService
    await adapter.createCustomer({ number, name });
    const rows = await adapter.listCustomers();
    setCustomers(rows);
    setNewCustomerName("");
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Angebot – Details</h1>
      </header>

      {!ready && <div className="text-sm text-gray-500">Initialisiere Persistenz…</div>}
      {error && <div className="text-sm text-red-600">Persistenzfehler: {String(error)}</div>}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Schnell-Kunde anlegen</h2>
        <div className="flex gap-2">
          <input
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="Kundenname"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleAddQuickCustomer}
            disabled={!newCustomerName.trim() || !adapter}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Hinzufügen
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Kunden ({customers.length})</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Lade Kunden…</div>
        ) : (
          <div className="grid gap-2">
            {customers.map((c) => (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.number}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

