import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOffer,
  listCustomers,
  updateOfferBasics,
  replaceOfferItems,
  getSettings,
} from "../db";

type Customer = {
  id: string;
  name: string;
  address: string;
};

type OfferItem = {
  pos: number;
  text: string;
  qty: number;
  price: number;
};

type Offer = {
  id: number;
  title: string;
  customer_id: string | null;
  created_at: string;
  items?: OfferItem[];
};

// Fallback: wenn kein Steuersatz in Settings liegt, 19 %
const DEFAULT_TAX_RATE = 0.19;

export default function AngebotDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const offerId = useMemo<number | null>(() => {
    const p = params?.id ?? params?.offerId ?? "";
    const n = Number(p);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<OfferItem[]>([]);

  // Settings
  const [smallBusiness, setSmallBusiness] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(DEFAULT_TAX_RATE);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        // Kunden laden
        const cs = await listCustomers();
        if (!cancelled) setCustomers(cs ?? []);

        if (offerId == null) {
          if (!cancelled) setOffer(null);
          return;
        }
        // Angebot + Positionen
        const of = await getOffer(offerId);
        if (!cancelled) {
          setOffer(of as Offer);
          const loadedItems: OfferItem[] =
            (of && (of as any).items ? (of as any).items : []) as OfferItem[];
          setItems(
            (loadedItems ?? []).map((it, idx) => ({
              pos: Number(it.pos ?? idx + 1),
              text: String(it.text ?? ""),
              qty: Number(it.qty ?? 0),
              price: Number(it.price ?? 0),
            }))
          );
        }

        // Settings (Kleinunternehmer + optional vat_rate)
        const settings = await getSettings();
        if (!cancelled) {
          const sb = String(settings?.small_business ?? "false") === "true";
          setSmallBusiness(sb);
          const parsedVat =
            settings && typeof settings.vat_rate === "string"
              ? Number(settings.vat_rate)
              : settings && typeof settings.vat_rate === "number"
              ? Number(settings.vat_rate)
              : NaN;
          setTaxRate(Number.isFinite(parsedVat) ? parsedVat : DEFAULT_TAX_RATE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [offerId]);

  const customersById = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of customers) map.set(c.id, c);
    return map;
  }, [customers]);

  // Summen berechnen
  const { net, vat, gross } = useMemo(() => {
    const n = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const v = smallBusiness ? 0 : n * taxRate;
    const g = n + v;
    return { net: n, vat: v, gross: g };
  }, [items, smallBusiness, taxRate]);

  function fmt(amount: number) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
      Math.round(amount * 100) / 100
    );
  }

  async function handleTitleChange(newTitle: string) {
    if (!offer) return;
    setOffer({ ...offer, title: newTitle });
  }

  async function handleTitleBlur() {
    if (!offer) return;
    setSaving(true);
    try {
      await updateOfferBasics(offer.id, { title: offer.title });
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomerChange(newId: string) {
    if (!offer) return;
    setSaving(true);
    try {
      await updateOfferBasics(offer.id, { customer_id: newId || null });
      setOffer({ ...offer, customer_id: newId || null });
    } finally {
      setSaving(false);
    }
  }

  function upsertItem(index: number, patch: Partial<OfferItem>) {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index] ?? {
        pos: index + 1,
        text: "",
        qty: 0,
        price: 0,
      };
      next[index] = { ...current, ...patch, pos: index + 1 };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        pos: prev.length + 1,
        text: "",
        qty: 1,
        price: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, pos: i + 1 }))
    );
  }

  async function saveItems() {
    if (!offer) return;
    setSaving(true);
    try {
      const clean = items
        .map((it, i) => ({
          pos: i + 1,
          text: (it.text ?? "").trim(),
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0,
        }))
        // optional: leere Zeilen raus
        .filter((it) => it.text.length > 0 || it.qty !== 0 || it.price !== 0);
      await replaceOfferItems(offer.id, clean);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 16 }}>Lade Angebot …</div>;
  }

  if (!offer || offerId == null) {
    return (
      <div style={{ padding: 16 }}>
        <p>Kein Angebot gefunden.</p>
        <button onClick={() => (navigate ? navigate(-1) : window.history.back())}>
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => (navigate ? navigate(-1) : window.history.back())}>← Zurück</button>
        <h1 style={{ margin: 0, fontSize: 20 }}>Angebot #{offer.id}</h1>
        {saving && <span style={{ marginLeft: 8, fontSize: 12 }}>Speichere …</span>}
      </div>

      <section style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Titel</span>
          <input
            value={offer.title ?? ""}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Titel des Angebots"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Kunde</span>
          <select
            value={offer.customer_id ?? ""}
            onChange={(e) => handleCustomerChange(e.target.value)}
          >
            <option value="">— Kein Kunde —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        </label>

        {offer.customer_id && customersById.get(offer.customer_id) && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            <div>
              <strong>Adresse:</strong>{" "}
              {customersById.get(offer.customer_id)?.address ?? "—"}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Positionen</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Pos</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Text</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Menge</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Einzelpreis (€)</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Summe (€)</th>
                <th style={{ borderBottom: "1px solid #ddd" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const rowSum = (Number(it.qty) || 0) * (Number(it.price) || 0);
                return (
                  <tr key={idx}>
                    <td style={{ padding: 6 }}>{idx + 1}</td>
                    <td style={{ padding: 6, minWidth: 240 }}>
                      <input
                        value={it.text ?? ""}
                        onChange={(e) => upsertItem(idx, { text: e.target.value })}
                        placeholder="Leistungsbeschreibung"
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: 6, textAlign: "right", minWidth: 100 }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={Number.isFinite(Number(it.qty)) ? String(it.qty) : ""}
                        onChange={(e) =>
                          upsertItem(idx, { qty: Number(e.target.value.replace(",", ".")) })
                        }
                        style={{ width: 100, textAlign: "right" }}
                      />
                    </td>
                    <td style={{ padding: 6, textAlign: "right", minWidth: 120 }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={Number.isFinite(Number(it.price)) ? String(it.price) : ""}
                        onChange={(e) =>
                          upsertItem(idx, { price: Number(e.target.value.replace(",", ".")) })
                        }
                        style={{ width: 120, textAlign: "right" }}
                      />
                    </td>
                    <td style={{ padding: 6, textAlign: "right", minWidth: 120 }}>
                      {fmt(rowSum)}
                    </td>
                    <td style={{ padding: 6, textAlign: "right" }}>
                      <button onClick={() => removeItem(idx)} title="Position löschen">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={addItem}>+ Position</button>
          <button onClick={saveItems} disabled={saving}>
            {saving ? "Speichern …" : "Positionen speichern"}
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gap: 4, justifyContent: "end" }}>
        {smallBusiness && (
          <div style={{ fontSize: 12, color: "#444", maxWidth: 560 }}>
            Hinweis: Kleinunternehmerregelung nach § 19 UStG – Es wird keine Umsatzsteuer
            ausgewiesen.
          </div>
        )}
        <div style={{ display: "grid", gap: 4, minWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Nettosumme:</span>
            <strong>{fmt(net)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Umsatzsteuer {smallBusiness ? "(0 %)" : `(${Math.round(taxRate * 100)} %)`}:</span>
            <strong>{fmt(vat)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", paddingTop: 6 }}>
            <span>Gesamt:</span>
            <strong>{fmt(gross)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
