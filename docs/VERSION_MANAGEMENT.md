# Version Management System

## 🔄 Automatische Version-Synchronisation

RawaLite verwendet ein **duales Versionierungssystem**:
- `package.json` → `"version": "1.6.0"`
- `src/services/VersionService.ts` → `BASE_VERSION = '1.6.0'`

### 📋 Verfügbare Commands

```bash
# Version-Synchronisation prüfen
pnpm version:check

# Versionen automatisch synchronisieren
pnpm version:sync                    # Zeigt Status
pnpm version:sync --version 1.7.0   # Setzt spezifische Version
pnpm version:sync --from-package    # VersionService → package.json
pnpm version:sync --from-service    # package.json → VersionService
```

### 🎯 Release Workflow

```bash
# 1. Version bump und synchronisieren
pnpm version:sync --version 1.7.0

# 2. Build und Test
pnpm build
pnpm lint
pnpm typecheck

# 3. Git commit und tag
git add -A && git commit -m "v1.7.0: Feature description"
git tag v1.7.0
git push origin main --tags

# 4. GitHub Release erstellen
gh release create v1.7.0 --title "RawaLite v1.7.0" --notes "Release notes..."

# 5. Distributables erstellen (optional)
pnpm dist
```

### ⚙️ Automatische Features

- **Semantic Versioning Validation** (X.Y.Z Format)
- **BUILD_DATE Auto-Update** (YYYY-MM-DD)
- **Konsistenz-Checks** zwischen allen Versionsdefinitionen
- **Git Workflow Integration**

### 🔍 Troubleshooting

```bash
# Bei Versions-Konflikten
pnpm version:check                   # Problem identifizieren
pnpm version:sync --from-package    # package.json als Quelle verwenden
```

Das System gewährleistet, dass alle Komponenten der App immer die **gleiche Versionsnummer** verwenden.