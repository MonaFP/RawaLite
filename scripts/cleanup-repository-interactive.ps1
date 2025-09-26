# Interaktives Skript zur Bereinigung von Repository-Duplikaten

function Confirm-Action {
    param(
        [string]$Message,
        [string]$DefaultChoice = "n"
    )
    
    $choices = @(
        [System.Management.Automation.Host.ChoiceDescription]::new("&Ja", "Aktion ausführen")
        [System.Management.Automation.Host.ChoiceDescription]::new("&Nein", "Aktion überspringen")
    )
    
    $defaultOption = if ($DefaultChoice -eq "j") { 0 } else { 1 }
    $result = $host.UI.PromptForChoice("Bestätigung", $Message, $choices, $defaultOption)
    
    return $result -eq 0
}

function Show-Header {
    param(
        [string]$Title
    )
    
    Write-Host "`n===== $Title =====" -ForegroundColor Cyan
}

# Logo-Duplikate bereinigen
Show-Header "Logo-Duplikate"

$sourceLogo = ".\assets\rawalite-logo.png"
$rootLogo = ".\rawalite-logo.png"
$publicLogo = ".\public\rawalite-logo.png"

if (Test-Path $sourceLogo) {
    Write-Host "Gefunden: $sourceLogo (Primäre Quelle)" -ForegroundColor Green
    
    if (Test-Path $rootLogo) {
        Write-Host "Gefunden: $rootLogo (Duplikat im Root-Verzeichnis)" -ForegroundColor Yellow
        
        if (Confirm-Action "Möchten Sie das Duplikat im Root-Verzeichnis entfernen?") {
            Remove-Item -Path $rootLogo -Force
            if (-not (Test-Path $rootLogo)) {
                Write-Host "✅ Duplikat im Root-Verzeichnis erfolgreich entfernt" -ForegroundColor Green
            } else {
                Write-Host "❌ Fehler beim Entfernen des Duplikats im Root-Verzeichnis" -ForegroundColor Red
            }
        }
    }
    
    if (Test-Path $publicLogo) {
        Write-Host "Gefunden: $publicLogo (Wird für Vite-Build benötigt)" -ForegroundColor Yellow
        Write-Host "Hinweis: Das Logo im public-Verzeichnis wird für den Vite-Build benötigt und sollte beibehalten werden." -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Logo im assets-Verzeichnis nicht gefunden: $sourceLogo" -ForegroundColor Red
}

# TypeScript-Definition-Duplikate analysieren
Show-Header "TypeScript-Definition-Dateien"

# vite-env.d.ts Duplikate
$rootViteEnvDts = ".\vite-env.d.ts"
$srcViteEnvDts = ".\src\vite-env.d.ts"

$rootViteExists = Test-Path $rootViteEnvDts
$srcViteExists = Test-Path $srcViteEnvDts

if ($rootViteExists -and $srcViteExists) {
    Write-Host "Gefunden: Zwei Versionen von vite-env.d.ts" -ForegroundColor Yellow
    
    try {
        $rootContent = Get-Content -Path $rootViteEnvDts -Raw
        $srcContent = Get-Content -Path $srcViteEnvDts -Raw
        
        if ($rootContent -eq $srcContent) {
            Write-Host "Die Dateien haben identischen Inhalt." -ForegroundColor Yellow
            
            if (Confirm-Action "Möchten Sie das Duplikat im Root-Verzeichnis entfernen? (Empfohlen)") {
                Remove-Item -Path $rootViteEnvDts -Force
                if (-not (Test-Path $rootViteEnvDts)) {
                    Write-Host "✅ Root vite-env.d.ts erfolgreich entfernt" -ForegroundColor Green
                } else {
                    Write-Host "❌ Fehler beim Entfernen der Root vite-env.d.ts" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "⚠️ Die Dateien haben unterschiedliche Inhalte und sollten analysiert werden." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Fehler beim Vergleich der vite-env.d.ts Dateien: $_" -ForegroundColor Red
    }
}

# global.d.ts Duplikate
$rootGlobalDts = ".\src\global.d.ts"
$typesGlobalDts = ".\src\types\global.d.ts"

$rootGlobalExists = Test-Path $rootGlobalDts
$typesGlobalExists = Test-Path $typesGlobalDts

if ($rootGlobalExists -and $typesGlobalExists) {
    Write-Host "`nGefunden: Zwei Versionen von global.d.ts" -ForegroundColor Yellow
    
    try {
        $rootContent = Get-Content -Path $rootGlobalDts -Raw
        $typesContent = Get-Content -Path $typesGlobalDts -Raw
        
        if ($rootContent -eq $typesContent) {
            Write-Host "Die Dateien haben identischen Inhalt." -ForegroundColor Yellow
            
            if (Confirm-Action "Möchten Sie das Duplikat in src/global.d.ts entfernen? (Empfohlen)") {
                Remove-Item -Path $rootGlobalDts -Force
                if (-not (Test-Path $rootGlobalDts)) {
                    Write-Host "✅ src/global.d.ts erfolgreich entfernt" -ForegroundColor Green
                } else {
                    Write-Host "❌ Fehler beim Entfernen von src/global.d.ts" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "⚠️ Die Dateien haben unterschiedliche Inhalte und sollten beide beibehalten werden." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Fehler beim Vergleich der global.d.ts Dateien: $_" -ForegroundColor Red
    }
}

# Bereinigung abgeschlossen
Show-Header "Bereinigung abgeschlossen"
Write-Host "Repository-Struktur wurde optimiert." -ForegroundColor Green

# Erstelle eine 'npm run cleanup' Aufgabe
$keepScript = Confirm-Action "Möchten Sie einen npm-Skript für zukünftige Bereinigungen erstellen?"

if ($keepScript) {
    $packageJsonPath = ".\package.json"
    
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
            
            # Füge cleanup-Skript hinzu, falls nicht vorhanden
            $hasCleanupScript = $false
            foreach ($prop in $packageJson.scripts.PSObject.Properties) {
                if ($prop.Name -eq "cleanup:repo") {
                    $hasCleanupScript = $true
                    break
                }
            }
            
            if (-not $hasCleanupScript) {
                $packageJson.scripts | Add-Member -NotePropertyName "cleanup:repo" -NotePropertyValue "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cleanup-repository-interactive.ps1"
                
                $packageJsonContent = $packageJson | ConvertTo-Json -Depth 10
                $packageJsonContent | Out-File -FilePath $packageJsonPath -Encoding utf8
                
                Write-Host "✅ npm script 'cleanup:repo' wurde hinzugefügt." -ForegroundColor Green
                Write-Host "Sie können in Zukunft 'pnpm cleanup:repo' ausführen, um das Repository zu bereinigen." -ForegroundColor Cyan
            } else {
                Write-Host "ℹ️ Der Skript 'cleanup:repo' existiert bereits in package.json." -ForegroundColor Cyan
            }
        } catch {
            Write-Host "❌ Fehler beim Aktualisieren von package.json: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ package.json nicht gefunden." -ForegroundColor Red
    }
}
