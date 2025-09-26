# test-update-handler.ps1
# PowerShell-Skript zum Testen des Updater-Handlers

param (
    [string]$InstallerPath,
    [switch]$Elevate,
    [switch]$UnblockFile,
    [int]$QuitDelayMs = 7000
)

# Standardwerte für die Switches
if (-not $PSBoundParameters.ContainsKey('Elevate')) { $Elevate = $true }
if (-not $PSBoundParameters.ContainsKey('UnblockFile')) { $UnblockFile = $true }

# Prüfen ob InstallerPath angegeben wurde
if (-not $InstallerPath) {
    Write-Host "❌ Fehler: Bitte geben Sie den Pfad zum Installer mit -InstallerPath an" -ForegroundColor Red
    Write-Host ""
    Write-Host "Beispiel: .\test-update-handler.ps1 -InstallerPath 'C:\path\to\rawalite-Setup-1.8.76.exe'" -ForegroundColor Yellow
    exit 1
}

# Prüfen ob Installer existiert
if (-not (Test-Path $InstallerPath)) {
    Write-Host "❌ Fehler: Installer nicht gefunden: $InstallerPath" -ForegroundColor Red
    exit 1
}

# Prüfen ob es eine .exe Datei ist
if (-not $InstallerPath.ToLower().EndsWith('.exe')) {
    Write-Host "❌ Fehler: Installer ist keine .exe-Datei: $InstallerPath" -ForegroundColor Red
    exit 1
}

# Dateigröße prüfen
$fileInfo = Get-Item $InstallerPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "🔍 Test-Konfiguration:"
Write-Host "📂 Installer-Pfad: $InstallerPath"
Write-Host "📊 Dateigröße: $fileSizeMB MB"
Write-Host "🔐 Elevation: $Elevate"
Write-Host "🔓 Unblock-File: $UnblockFile"
Write-Host "⏱️ Quit-Delay: $QuitDelayMs ms"
Write-Host ""

# SHA256-Hash berechnen
Write-Host "🔄 Berechne SHA256-Hash..." -NoNewline
$sha256 = (Get-FileHash -Algorithm SHA256 -Path $InstallerPath).Hash.ToLower()
Write-Host " Fertig!"
Write-Host "🔑 SHA256: $sha256"
Write-Host ""

# Überprüfen ob die App läuft (optional)
$appProcess = Get-Process -Name "rawalite" -ErrorAction SilentlyContinue
if ($appProcess) {
    Write-Host "⚠️ Achtung: RawaLite ist bereits gestartet (PID: $($appProcess.Id))" -ForegroundColor Yellow
    Write-Host ""
}

# Testcode für ShellExecute
Write-Host "🧪 ShellExecute-Test starten..."

# Code zur Simulation des Handler-Verhaltens
Write-Host "🔍 Simuliere Handler-Verhalten..."

if ($UnblockFile) {
    Write-Host "🔓 Entferne MOTW (Mark of the Web)..." -NoNewline
    try {
        Unblock-File -Path $InstallerPath -ErrorAction Stop
        Write-Host " ✅ Erfolgreich!" -ForegroundColor Green
    } catch {
        Write-Host " ⚠️ Fehler: $_" -ForegroundColor Yellow
    }
}

# ShellExecute-Methode testen
Write-Host "🚀 Starte ShellExecute-Test..."

try {
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

    $operation = if ($Elevate) { "runas" } else { "open" }
    $directory = [System.IO.Path]::GetDirectoryName($InstallerPath)
    $installerArgs = "/NCRC"
    
    Write-Host "📂 Installer: $InstallerPath"
    Write-Host "⚙️ Operation: $operation"
    Write-Host "🔧 Arguments: $installerArgs"
    Write-Host "📁 Directory: $directory"
    
    # SIMULIEREN OHNE AUSFÜHRUNG
    Write-Host "✅ ShellExecute-Befehl wurde simuliert (keine tatsächliche Ausführung)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Um den Installer tatsächlich auszuführen, entfernen Sie den Kommentar bei der nächsten Codezeile" -ForegroundColor Yellow
    
    # Tatsächliche Ausführung (auskommentiert zu Testzwecken)
    # $result = [ShellExecute]::ShellExecuteW([IntPtr]::Zero, $operation, $InstallerPath, $installerArgs, $directory, [ShellExecute]::SW_SHOW)
    
    # SIMULIERTER Erfolg
    $result = 42  # Erfolgscode > 32
    
    if ($result -gt 32) {
        Write-Host "✅ ShellExecute erfolgreich, Rückgabewert: $result" -ForegroundColor Green
        
        Write-Host "⏱️ Simuliere Quit-Delay von $QuitDelayMs ms..."
        # Keine tatsächliche Verzögerung in der Simulation
        
        Write-Host "🔄 Würde App nach $QuitDelayMs ms beenden"
    } else {
        Write-Host "❌ ShellExecute fehlgeschlagen, Fehlercode: $result" -ForegroundColor Red
        
        Write-Host "🔄 Fallback zu Start-Process..."
        # Start-Process -FilePath $InstallerPath -ArgumentList $installerArgs -Verb "RunAs"
        Write-Host "✅ Start-Process simuliert" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ ShellExecute-Ausnahme: $_" -ForegroundColor Red
    Write-Host "Stacktrace: $($_.Exception.StackTrace)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test abgeschlossen. In der tatsächlichen Implementierung würde die App in $QuitDelayMs ms beendet werden." -ForegroundColor Green