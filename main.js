const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

let mainWindow;
let splashWindow;

const APP_DATA_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'RaWaLite');
const LOG_PATH = path.join(APP_DATA_PATH, 'rawalite.log');
const TEMPLATES_PATH = path.join(APP_DATA_PATH, 'templates');

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
        fs.ensureDirSync(APP_DATA_PATH);
        fs.appendFileSync(LOG_PATH, logEntry);
    } catch (error) {
        console.error('Logging failed:', error);
    }
    
    console.log(logEntry.trim());
}

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'src', 'splash.html'));
    
    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

function createMainWindow() {
    if (mainWindow) return;
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
        mainWindow.show();
        log('Hauptfenster angezeigt');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const template = [
        {
            label: 'Datei',
            submenu: [{ role: 'quit', label: 'Beenden' }]
        },
        {
            label: 'Hilfe',
            submenu: [
                {
                    label: 'Über RaWaLite',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Über RaWaLite',
                            message: 'RaWaLite v1.0.0',
                            detail: 'Rechnungs- und Angebotsverwaltung'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-app-paths', () => {
    return {
        appData: APP_DATA_PATH,
        templates: TEMPLATES_PATH
    };
});

ipcMain.handle('log-message', (event, message, level = 'INFO') => {
    log(message, level);
});

async function initializeApp() {
    try {
        await fs.ensureDir(APP_DATA_PATH);
        await fs.ensureDir(TEMPLATES_PATH);
        log('App-Verzeichnisse erstellt');
    } catch (error) {
        log(`Fehler bei App-Initialisierung: ${error.message}`, 'ERROR');
    }
}

app.commandLine.appendSwitch('--disable-http-cache');
app.commandLine.appendSwitch('--disable-gpu-cache');

app.whenReady().then(async () => {
    log('App gestartet');
    
    const session = require('electron').session;
    await session.defaultSession.clearCache();
    log('Cache bereinigt');
    
    await initializeApp();
    
    createSplashWindow();
    
    setTimeout(() => {
        createMainWindow();
    }, 3000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        log('App beendet');
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});