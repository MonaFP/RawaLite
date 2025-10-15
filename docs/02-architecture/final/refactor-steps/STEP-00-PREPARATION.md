# 📋 Schritt 0: Vorbereitung

> **Strukturelle Vorbereitung** ohne Code-Änderungen
> 
> **Risiko:** Low | **Dauer:** 30 min | **Status:** ✅ COMPLETED

---

## 🎯 **Ziel**

Strukturelle Vorbereitung für den Refactor ohne jegliche Logik-Änderungen. Ordner erstellen und Marker setzen.

---

## 📝 **Aufgaben**

### **1. Ordner-Struktur erstellen**
```bash
mkdir electron/windows
mkdir electron/ipc
```

**Erwartete Struktur:**
```
electron/
├── main.ts
├── preload.ts
├── windows/          # NEU - leer
├── ipc/              # NEU - leer
└── ...
```

### **2. Refactor-Marker in main.ts setzen**
```typescript
// === REFACTOR START ===
// Dieser Bereich wird schrittweise in Module aufgeteilt

// ... bestehender Code ...

// === REFACTOR END ===
```

**Position:** Nach den Imports, vor der ersten Funktion

---

## ✅ **Acceptance Criteria**

- [ ] `electron/windows/` Ordner existiert
- [ ] `electron/ipc/` Ordner existiert  
- [ ] Refactor-Marker in `main.ts` gesetzt
- [ ] Keine Code-Änderungen
- [ ] Alle Guards grün
- [ ] Commit erstellt

---

## 🧪 **Testing & Validation**

### **Guards Protocol**
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm guard:cjs && pnpm guard:pkgtype && pnpm guard:assets && pnpm validate:critical-fixes
```

**Erwartung:** Alle grün (keine Code-Änderungen)

### **Dev-Smoke Test**
```bash
pnpm dev:all
```

**Erwartung:** App startet normal, alle Funktionen unverändert

---

## 📊 **Status Report Template**

```
[STEP 0 DONE]
Was getan: Ordner electron/windows + electron/ipc erstellt, Refactor-Marker in main.ts gesetzt
Risiko: low
Tests: typecheck ✅, lint ✅, test ✅, guards ✅, dev-smoke ✅
Diff-Vorschau: 
  - electron/windows/ (neu, leer)
  - electron/ipc/ (neu, leer)
  - main.ts (2 Marker-Kommentare hinzugefügt)
Commit: chore(refactor): scaffold directories and markers for main.ts modularization
Bereit für Step 1? (Ja/Nein)
```

---

## 🔄 **Rollback Procedure**

Falls Probleme auftreten:
```bash
# Ordner löschen
Remove-Item -Path "electron/windows", "electron/ipc" -Recurse -Force

# Marker aus main.ts entfernen
# Manually remove the "=== REFACTOR START/END ===" comments

# Git reset
git checkout -- electron/main.ts
```

---

## ➡️ **Next Step**

Nach Freigabe: [STEP-01-02-WINDOWS.md](./STEP-01-02-WINDOWS.md) - Window Management Extraktion

---

*Erstellt: 13. Oktober 2025 | Teil des [Main.ts Refactor Plans](../MAIN-TS-REFACTOR-PLAN.md)*