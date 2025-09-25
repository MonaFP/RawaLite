# install-local-update.ps1
# Skript zur lokalen Installation der aktuellen Version von RawaLite
# Verwendet den vorhandenen Update-Handler

param (
    [switch]$BuildFirst,
    [switch]$CleanBuild,
    [switch]$Debug
)

# Konfiguration
$currentDir = Get-Location
$installLogPath = Join-Path $currentDir "local-install-log.txt"

# Hilfsfunktionen
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-LogMessage($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Output $logMessage
    Add-Content -Path $installLogPath -Value $logMessage
}

function Get-AppVersion {
    $packageJsonPath = Join-Path $currentDir "package.json"
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        return $packageJson.version
    }
    return "Unknown"
}

# Banner anzeigen
$version = Get-AppVersion
Write-ColorOutput "Cyan" @"
=====================================================
🚀 RawaLite Lokale Installation (Version $version)
=====================================================
"@

# Logdatei initialisieren
"# RawaLite Lokale Installations-Log - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Set-Content $installLogPath
Write-LogMessage "Starte lokale Installation für RawaLite v$version"

# Build-Prozess (optional)
if ($BuildFirst) {
    Write-LogMessage "Build-Prozess wird gestartet..."
    Write-ColorOutput "Yellow" "📦 Build wird durchgeführt..."
    
    if ($CleanBuild) {
        Write-LogMessage "Clean Build angefordert - Cache und vorherige Builds werden gelöscht"
        Write-ColorOutput "Magenta" "🧹 Clean Build wird durchgeführt..."
        
        $command = "pnpm clean:build && pnpm install && pnpm build"
        Write-LogMessage "Führe aus: $command"
        Invoke-Expression $command
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogMessage "❌ Clean Build fehlgeschlagen mit Exit-Code $LASTEXITCODE"
            Write-ColorOutput "Red" "❌ Clean Build fehlgeschlagen. Siehe Logdatei für Details."
            return
        }
    } else {
        Write-LogMessage "Standard-Build wird durchgeführt"
        
        $command = "pnpm build"
        Write-LogMessage "Führe aus: $command"
        Invoke-Expression $command
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogMessage "❌ Build fehlgeschlagen mit Exit-Code $LASTEXITCODE"
            Write-ColorOutput "Red" "❌ Build fehlgeschlagen. Siehe Logdatei für Details."
            return
        }
    }
    
    Write-LogMessage "Build erfolgreich abgeschlossen"
    Write-ColorOutput "Green" "✅ Build erfolgreich abgeschlossen"
}

# Prüfen ob electron-builder bereits ausgeführt wurde
$releaseDir = Join-Path $currentDir "release"
$setupFilePath = $null

# Suchen nach der Setup-Datei (neueste Version zuerst)
Write-LogMessage "Suche nach Setup-Datei in $releaseDir und $currentDir"
$setupFiles = @()

if (Test-Path $releaseDir) {
    $setupFiles += Get-ChildItem -Path $releaseDir -Filter "rawalite-Setup-*.exe" | Sort-Object LastWriteTime -Descending
}

$setupFiles += Get-ChildItem -Path $currentDir -Filter "rawalite-Setup-*.exe" | Sort-Object LastWriteTime -Descending

if ($setupFiles.Count -eq 0) {
    Write-LogMessage "Keine Setup-Datei gefunden. electron-builder muss zuerst ausgeführt werden."
    Write-ColorOutput "Yellow" "⚠️ Keine Setup-Datei gefunden. electron-builder wird ausgeführt..."
    
    # electron-builder ausführen
    Write-LogMessage "Führe 'pnpm dist' aus, um Setup-Datei zu erstellen"
    Invoke-Expression "pnpm dist"
    
    if ($LASTEXITCODE -ne 0) {
        Write-LogMessage "❌ electron-builder fehlgeschlagen mit Exit-Code $LASTEXITCODE"
        Write-ColorOutput "Red" "❌ electron-builder fehlgeschlagen. Siehe Logdatei für Details."
        return
    }
    
    # Suche erneut nach Setup-Dateien
    Write-LogMessage "Suche erneut nach Setup-Datei nach dem Build"
    $setupFiles = @()
    
    if (Test-Path $releaseDir) {
        $setupFiles += Get-ChildItem -Path $releaseDir -Filter "rawalite-Setup-*.exe" | Sort-Object LastWriteTime -Descending
    }
    
    $setupFiles += Get-ChildItem -Path $currentDir -Filter "rawalite-Setup-*.exe" | Sort-Object LastWriteTime -Descending
}

if ($setupFiles.Count -eq 0) {
    Write-LogMessage "❌ Auch nach dem Build keine Setup-Datei gefunden"
    Write-ColorOutput "Red" "❌ Keine Setup-Datei gefunden. Installation abgebrochen."
    return
}

$setupFilePath = $setupFiles[0].FullName
$setupVersion = [regex]::Match($setupFiles[0].Name, 'rawalite-Setup-([\d\.]+)\.exe').Groups[1].Value

Write-LogMessage "Setup-Datei gefunden: $setupFilePath (Version $setupVersion)"
Write-ColorOutput "Green" "✅ Setup-Datei gefunden: $($setupFiles[0].Name) (Version $setupVersion)"

# MOTW (Mark of the Web) entfernen
try {
    Write-LogMessage "Entferne Mark of the Web (MOTW) von der Setup-Datei"
    Unblock-File -Path $setupFilePath -ErrorAction Stop
    Write-LogMessage "✅ MOTW erfolgreich entfernt"
} catch {
    Write-LogMessage "⚠️ Warnung beim Entfernen des MOTW: $_"
    Write-ColorOutput "Yellow" "⚠️ Warnung beim Entfernen des MOTW - Installation wird trotzdem fortgesetzt"
}

# Dateiinformationen anzeigen
$fileInfo = Get-Item $setupFilePath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-LogMessage "Setup-Dateigröße: $fileSizeMB MB"
Write-ColorOutput "Cyan" "📊 Setup-Dateigröße: $fileSizeMB MB"

# SHA256-Hash berechnen (optional)
if ($Debug) {
    Write-LogMessage "Berechne SHA256-Hash der Setup-Datei"
    $sha256 = (Get-FileHash -Algorithm SHA256 -Path $setupFilePath).Hash.ToLower()
    Write-LogMessage "SHA256: $sha256"
    Write-ColorOutput "Cyan" "🔑 SHA256: $sha256"
}

# Installation starten
Write-ColorOutput "Yellow" @"
=====================================================
🚀 RawaLite Installation starten

Setup-Datei: $($setupFiles[0].Name)
Version: $setupVersion
Größe: $fileSizeMB MB
Pfad: $setupFilePath

=====================================================
"@

$confirmation = Read-Host "Möchten Sie die Installation jetzt starten? (j/n)"
if ($confirmation -ne 'j') {
    Write-LogMessage "Installation wurde vom Benutzer abgebrochen"
    Write-ColorOutput "Yellow" "⚠️ Installation abgebrochen."
    return
}

# Prüfen ob RawaLite läuft
$rawaliteProcess = Get-Process -Name "rawalite" -ErrorAction SilentlyContinue
if ($rawaliteProcess) {
    Write-LogMessage "RawaLite läuft bereits (PID: $($rawaliteProcess.Id)). Anwendung wird beendet."
    Write-ColorOutput "Yellow" "⚠️ RawaLite läuft bereits und wird beendet..."
    
    try {
        $rawaliteProcess | ForEach-Object { $_.CloseMainWindow() | Out-Null }
        Start-Sleep -Seconds 2
        
        # Prüfen ob Prozess noch läuft
        $stillRunning = Get-Process -Name "rawalite" -ErrorAction SilentlyContinue
        if ($stillRunning) {
            Write-LogMessage "RawaLite reagiert nicht auf CloseMainWindow(). Versuche Kill."
            $stillRunning | ForEach-Object { $_.Kill() }
        }
    } catch {
        Write-LogMessage "Fehler beim Beenden von RawaLite: $_"
    }
}

# Installer starten
Write-LogMessage "Starte Setup: $setupFilePath"
Write-ColorOutput "Green" "🚀 Starte Installation..."

try {
    # ShellExecute über .NET für UAC-Elevation
    Add-Type -TypeDefinition @"
    using System;
    using System.Diagnostics;
    using System.Runtime.InteropServices;
    
    public class ShellExecute {
        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr ShellExecuteW(
            IntPtr hwnd, 
            string lpOperation, 
            string lpFile, 
            string lpParameters, 
            string lpDirectory, 
            int nShowCmd);
        
        public const int SW_SHOW = 5;
    }
"@

    $operation = "runas"  # UAC-Elevation anfordern
    $directory = [System.IO.Path]::GetDirectoryName($setupFilePath)
    $installerArgs = "/NCRC"  # Optional: NSIS-Parameter
    
    Write-LogMessage "Starte Installer mit ShellExecute: Operation=$operation, Args=$installerArgs"
    
    $result = [ShellExecute]::ShellExecuteW(
        [IntPtr]::Zero,     # kein Parent-Fenster
        $operation,         # "runas" für UAC
        $setupFilePath,     # Installer-Pfad
        $installerArgs,     # Kommandozeilenargumente
        $directory,         # Arbeitsverzeichnis
        [ShellExecute]::SW_SHOW  # Fenster anzeigen
    )
    
    if ($result -gt 32) {
        Write-LogMessage "✅ ShellExecute erfolgreich gestartet, Rückgabewert: $result"
        Write-ColorOutput "Green" "✅ Installation erfolgreich gestartet!"
    } else {
        Write-LogMessage "❌ ShellExecute fehlgeschlagen, Fehlercode: $result"
        Write-ColorOutput "Red" "❌ ShellExecute fehlgeschlagen. Versuche Fallback..."
        
        # Fallback zu Start-Process
        Write-LogMessage "Versuche Fallback mit Start-Process"
        Start-Process -FilePath $setupFilePath -ArgumentList $installerArgs -Verb "RunAs"
        Write-LogMessage "✅ Fallback-Start-Process ausgeführt"
        Write-ColorOutput "Green" "✅ Installation mit Fallback-Methode gestartet!"
    }
    
    Write-ColorOutput "Cyan" @"
=====================================================
📋 Installation läuft!

Der NSIS-Installer wurde gestartet. Bitte folgen Sie den
Anweisungen im Installer-Fenster, um die Installation
abzuschließen.

Hinweis: Die aktuelle Version ist $version
=====================================================
"@
    
} catch {
    Write-LogMessage "❌ Fehler beim Starten des Installers: $_"
    Write-ColorOutput "Red" "❌ Fehler beim Starten der Installation: $_"
}

Write-LogMessage "Installations-Skript beendet"