### 💾 **Neues Dokument anlegen + committen**

````powershell
# 1️⃣ Datei anlegen
New-Item -ItemType File -Force -Path "docs/01-standards/REACT-FALSY-GOTCHAS.md" | Out-Null

# 2️⃣ Inhalt schreiben
@'
# ⚡ React Falsy Gotchas

> **Ziel:** Vermeidung typischer Anzeige- und Logikfehler durch falsche Truthy/Falsy-Werte in React-Komponenten.

---

## 1️⃣ `0` rendert sichtbar
**Problem:**  
JSX rendert `0` als sichtbares Zeichen.  
**Beispiel:**
```tsx
{flag && <span>Text</span>}   // flag === 0 → rendert „0“
````

**Fix:**

```tsx
{!!flag && <span>Text</span>} // 0 → false, kein Render
```

---

## 2️⃣ `undefined` / `null` in Inputs

**Problem:**
React-Warnung: *“A component is changing an uncontrolled input…”*
**Fix:**

```tsx
value={value ?? ''}
checked={!!checked}
```

---

## 3️⃣ `NaN` in numerischen Feldern

**Problem:**
Eingabefehler führen zu `NaN`, Anzeige zeigt leer oder „NaN“.
**Fix:**

```ts
const n = Number.isFinite(+value) ? +value : 0;
```

---

## 4️⃣ `false` oder `true` im UI-Text

**Problem:**
String-Verkettung rendert „false“ oder „true“.
**Fix:**

```tsx
{flag ? 'Text' : ''}
```

---

## 5️⃣ Boolesche Flags aus DB/API

**Problem:**
Backends liefern `0/1`, `"true"/"false"` oder Strings.
**Fix:**

```ts
const isActive = !!Number(dbFlag)
```

Oder im Adapter:

```ts
return { ...record, addVat: !!record.addVat }
```

---

## 6️⃣ Formatter & Fallbacks

**Problem:**
`formatCurrency(amount || 0)` kann Strings verarbeiten → Fehler.
**Fix:**

```ts
formatCurrency(Number(amount))
```

---

## 🧩 Bonus: Linter Guards

Empfohlene ESLint-Regeln:

```json
"rules": {
  "react/jsx-no-literals": ["warn"],
  "no-implicit-coercion": "warn"
}
```

---

## ✅ TL;DR

| Typ         | Fehler             | Fix               |
| ----------- | ------------------ | ----------------- |
| `0`         | Wird gerendert     | `!!flag`          |
| `undefined` | uncontrolled input | `?? ''`           |
| `NaN`       | Anzeige „NaN“      | `Number.isFinite` |
| DB-Flags    | 0/1 oder String    | `!!Number(flag)`  |

---

**Erstellt:** Oktober 2025
**Maintainer:** UI/Frontend-Team RawaLite
**Version:** 1.0
'@ | Set-Content -Encoding UTF8 "docs/01-standards/REACT-FALSY-GOTCHAS.md"



