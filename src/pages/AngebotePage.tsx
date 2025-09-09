import { useEffect, useState } from "react";
import { db, saveDbDebounced, ensureSchema } from "../db";

type OfferRow = {
  id: number;
  title: string;
  created_at: string;
};

export default function AngebotePage() {
  const [rows, setRows] = useState<OfferRow[]>([]);

  useEffect(() => {
    ensureSchema();
    loadOffers();
  }, []);

  function loadOffers() {
    const res = db.exec(
      `SELECT id, title, created_at FROM offers ORDER BY id DESC`
    );

    const list: OfferRow[] =
      res.length > 0
        ? (res[0].values as unknown as Array<[number, string, string]>).map(
            ([id, title, created_at]: [number, string, string]) => ({
              id,
              title,
              created_at,
            })
          )
        : [];

    setRows(list);
  }

  function handleNew() {
    const now = new Date().toISOString();
    db.run(`INSERT INTO offers (title, created_at) VALUES (?, ?)`, [
      "Neues Angebot",
      now,
    ]);

    // neue ID (sql.js): last_insert_rowid()
    const idRes = db.exec(`SELECT last_insert_rowid() AS id;`);
    const newId = idRes.length ? Number(idRes[0].values[0][0]) : 0;

    // Optimistisch anzeigen
    setRows((prev) => [
      { id: newId, title: "Neues Angebot", created_at: now },
      ...prev,
    ]);

    saveDbDebounced();
  }

  function handleRename(id: number) {
    const current = rows.find((r) => r.id === id)?.title ?? "";
    const title = prompt("Neuer Titel:", current);
    if (title == null) return;

    db.run(`UPDATE offers SET title = ? WHERE id = ?`, [title.trim(), id]);
    saveDbDebounced();
    loadOffers();
  }

  function handleDelete(id: number) {
    if (!confirm("Angebot wirklich löschen?")) return;
    db.run(`DELETE FROM offers WHERE id = ?`, [id]);
    saveDbDebounced();
    loadOffers();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Angebote</h1>
        <button
          onClick={handleNew}
          className="rounded-2xl bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
        >
          Neu
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-6 text-gray-600">
          Hier entstehen Angebotsentwürfe und PDF-Exporte.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {row.title || `Angebot #${row.id}`}
                </div>
                <div className="text-xs text-gray-500">
                  ID {row.id} • {row.created_at}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRename(row.id)}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Umbenennen
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="rounded-lg border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
