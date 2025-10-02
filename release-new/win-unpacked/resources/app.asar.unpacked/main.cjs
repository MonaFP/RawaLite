"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron5 = require("electron");
var import_node_path4 = __toESM(require("node:path"), 1);
var import_node_fs4 = require("node:fs");

// src/main/services/UpdateManagerService.ts
var import_crypto = require("crypto");
var import_fs2 = require("fs");
var import_path2 = require("path");
var import_child_process2 = require("child_process");
var import_electron = require("electron");

// src/main/services/GitHubCliService.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_path = require("path");
var GitHubCliService = class {
  owner = "MonaFP";
  repo = "RawaLite";
  timeout = 3e4;
  // 30 seconds
  /**
   * Prüft ob GitHub CLI verfügbar und authentifiziert ist
   */
  async checkAvailability() {
    try {
      await this.executeCommand(["--version"]);
      await this.executeCommand(["auth", "status"]);
      return { available: true, authenticated: true };
    } catch (error) {
      const githubError = error;
      if (githubError.stderr?.includes("not found") || githubError.code === "ENOENT") {
        return {
          available: false,
          authenticated: false,
          error: "GitHub CLI not installed"
        };
      }
      if (githubError.stderr?.includes("not logged into")) {
        return {
          available: true,
          authenticated: false,
          error: "GitHub CLI not authenticated"
        };
      }
      return {
        available: false,
        authenticated: false,
        error: `GitHub CLI error: ${githubError.message}`
      };
    }
  }
  /**
   * Holt die neueste Release-Information
   */
  async getLatestRelease() {
    try {
      const query = `{
        tag_name: .tag_name,
        name: .name,
        body: .body,
        published_at: .published_at,
        prerelease: .prerelease,
        assets: [.assets[] | {
          name: .name,
          browser_download_url: .browser_download_url,
          size: .size,
          content_type: .content_type,
          download_count: .download_count
        }]
      }`;
      const result = await this.executeCommand([
        "api",
        `repos/${this.owner}/${this.repo}/releases/latest`,
        "--jq",
        query
      ]);
      return JSON.parse(result);
    } catch (error) {
      const githubError = error;
      if (githubError.stderr?.includes("Not Found")) {
        throw new Error("No releases found in repository");
      }
      throw new Error(`Failed to fetch latest release: ${githubError.message}`);
    }
  }
  /**
   * Holt alle Releases (für Fallback oder Versionsliste)
   */
  async getAllReleases(limit = 10) {
    try {
      const query = `[.[] | {
        tag_name: .tag_name,
        name: .name,
        body: .body,
        published_at: .published_at,
        prerelease: .prerelease,
        assets: [.assets[] | {
          name: .name,
          browser_download_url: .browser_download_url,
          size: .size,
          content_type: .content_type,
          download_count: .download_count
        }]
      }] | .[0:${limit}]`;
      const result = await this.executeCommand([
        "api",
        `repos/${this.owner}/${this.repo}/releases`,
        "--jq",
        query
      ]);
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to fetch releases: ${error.message}`);
    }
  }
  /**
   * Downloaded ein Asset mit Progress-Tracking
   */
  async downloadAsset(asset, targetPath, onProgress) {
    try {
      await import_fs.promises.mkdir((0, import_path.join)(targetPath, ".."), { recursive: true });
      const response = await fetch(asset.browser_download_url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const totalBytes = asset.size || parseInt(response.headers.get("content-length") || "0");
      let downloadedBytes = 0;
      const startTime = Date.now();
      const writeStream = (0, import_fs.createWriteStream)(targetPath);
      if (!response.body) {
        throw new Error("No response body for download");
      }
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          downloadedBytes += value.length;
          const elapsed = (Date.now() - startTime) / 1e3;
          const percentage = totalBytes > 0 ? downloadedBytes / totalBytes * 100 : 0;
          const speed = elapsed > 0 ? downloadedBytes / elapsed : 0;
          const eta = speed > 0 && totalBytes > downloadedBytes ? (totalBytes - downloadedBytes) / speed : 0;
          if (onProgress) {
            onProgress({
              downloaded: downloadedBytes,
              total: totalBytes,
              percentage,
              speed,
              eta
            });
          }
        }
      }
      const buffer = Buffer.concat(chunks);
      await import_fs.promises.writeFile(targetPath, buffer);
      if (onProgress) {
        onProgress({
          downloaded: totalBytes,
          total: totalBytes,
          percentage: 100,
          speed: 0,
          eta: 0
        });
      }
    } catch (error) {
      try {
        await import_fs.promises.unlink(targetPath);
      } catch (cleanupError) {
      }
      throw new Error(`Failed to download ${asset.name}: ${error.message}`);
    }
  }
  /**
   * Prüft ob eine neue Version verfügbar ist
   */
  async checkForUpdate(currentVersion) {
    try {
      const latestRelease = await this.getLatestRelease();
      if (latestRelease.prerelease) {
        return { hasUpdate: false };
      }
      const latestVersion = latestRelease.tag_name.replace(/^v/, "");
      const currentClean = currentVersion.replace(/^v/, "");
      const hasUpdate = this.compareVersions(currentClean, latestVersion) < 0;
      return {
        hasUpdate,
        latestRelease: hasUpdate ? latestRelease : void 0
      };
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes("No releases found")) {
        return { hasUpdate: false };
      }
      throw new Error(`Failed to check for updates: ${errorMessage}`);
    }
  }
  /**
   * Führt einen GitHub CLI Befehl aus
   */
  async executeCommand(args) {
    return new Promise((resolve, reject) => {
      const options = {
        timeout: this.timeout,
        stdio: ["pipe", "pipe", "pipe"]
      };
      const process2 = (0, import_child_process.spawn)("gh", args, options);
      let stdout = "";
      let stderr = "";
      process2.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      process2.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      process2.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          const error = new Error(`GitHub CLI command failed: ${stderr || stdout}`);
          error.exitCode = code || -1;
          error.stderr = stderr;
          reject(error);
        }
      });
      process2.on("error", (error) => {
        const githubError = error;
        githubError.code = error.code;
        reject(githubError);
      });
    });
  }
  /**
   * Vergleicht zwei Semantic Versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    try {
      const parts1 = v1.split(".").map((n) => parseInt(n, 10));
      const parts2 = v2.split(".").map((n) => parseInt(n, 10));
      const maxLength = Math.max(parts1.length, parts2.length);
      for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
      }
      return 0;
    } catch (error) {
      return v1.localeCompare(v2, void 0, { numeric: true });
    }
  }
};
var githubCliService = new GitHubCliService();

// src/types/update.types.ts
var DEFAULT_UPDATE_CONFIG = {
  autoCheckOnStartup: true,
  checkIntervalHours: 24,
  autoDownload: false,
  // Requires user consent
  silentInstall: true,
  autoRestart: false,
  // Ask user
  maxRetries: 3,
  retryDelayMs: 5e3,
  includePreReleases: false,
  skipVersions: []
};
var UPDATE_CONSTANTS = {
  MAX_DOWNLOAD_SIZE: 200 * 1024 * 1024,
  // 200 MB
  DOWNLOAD_TIMEOUT: 3e5,
  // 5 minutes
  INSTALLATION_TIMEOUT: 12e4,
  // 2 minutes
  VERIFICATION_TIMEOUT: 3e4,
  // 30 seconds
  RETRY_BACKOFF_MULTIPLIER: 2,
  MIN_RETRY_DELAY: 1e3,
  MAX_RETRY_DELAY: 3e4
};

// src/main/services/UpdateManagerService.ts
var UpdateEventEmitter = class {
  listeners = /* @__PURE__ */ new Map();
  on(listener) {
    const listenerId = Math.random().toString(36);
    if (!this.listeners.has("update")) {
      this.listeners.set("update", []);
    }
    this.listeners.get("update").push(listener);
    return () => {
      const listeners = this.listeners.get("update");
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }
  emit(event) {
    const listeners = this.listeners.get("update") || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in update event listener:", error);
      }
    });
  }
};
var UpdateManagerService = class {
  state;
  config;
  eventEmitter = new UpdateEventEmitter();
  currentDownloadController = null;
  retryTimeouts = /* @__PURE__ */ new Map();
  currentCheckPromise = null;
  constructor(config = {}) {
    this.config = { ...DEFAULT_UPDATE_CONFIG, ...config };
    this.state = {
      currentPhase: "idle",
      checking: false,
      downloading: false,
      installing: false,
      userConsentRequired: false,
      userConsentGiven: false,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };
  }
  /**
   * Event Subscription für UI Updates
   */
  onUpdateEvent(listener) {
    return this.eventEmitter.on(listener);
  }
  /**
   * Get Current State
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get Configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Update Configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  /**
   * Check for Updates
   */
  async checkForUpdates() {
    if (this.currentCheckPromise) {
      return this.currentCheckPromise;
    }
    this.currentCheckPromise = this.performUpdateCheck();
    try {
      const result = await this.currentCheckPromise;
      return result;
    } finally {
      this.currentCheckPromise = null;
    }
  }
  async performUpdateCheck() {
    try {
      this.setState({ checking: true, currentPhase: "checking" });
      this.emit({ type: "check-started" });
      const availability = await githubCliService.checkAvailability();
      if (!availability.available || !availability.authenticated) {
        throw new Error(`GitHub CLI not ready: ${availability.error}`);
      }
      const currentVersion = await this.getCurrentVersion();
      const updateCheck = await githubCliService.checkForUpdate(currentVersion);
      const result = {
        hasUpdate: updateCheck.hasUpdate,
        currentVersion,
        latestVersion: updateCheck.latestRelease?.tag_name.replace(/^v/, ""),
        latestRelease: updateCheck.latestRelease
      };
      this.setState({
        checkResult: result,
        currentPhase: updateCheck.hasUpdate ? "update-available" : "idle"
      });
      this.emit({ type: "check-completed", result });
      if (updateCheck.hasUpdate && updateCheck.latestRelease) {
        const updateInfo = this.createUpdateInfo(updateCheck.latestRelease);
        this.emit({ type: "update-available", updateInfo });
        if (!this.config.autoDownload) {
          this.setState({
            userConsentRequired: true,
            currentPhase: "user-consent"
          });
          this.emit({ type: "user-consent-required", updateInfo });
        }
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.setState({
        currentPhase: "error",
        lastError: errorMessage
      });
      this.emit({ type: "check-failed", error: errorMessage });
      throw error;
    } finally {
      this.setState({ checking: false });
    }
  }
  /**
   * Start Update Download
   */
  async startDownload(updateInfo) {
    try {
      if (this.state.downloading) {
        throw new Error("Download already in progress");
      }
      this.setState({
        downloading: true,
        currentPhase: "downloading",
        userConsentGiven: true
      });
      this.emit({ type: "download-started", updateInfo });
      const downloadDir = await this.prepareDownloadDirectory();
      const targetPath = (0, import_path2.join)(downloadDir, updateInfo.assetName);
      this.currentDownloadController = new AbortController();
      const latestRelease = await githubCliService.getLatestRelease();
      const asset = latestRelease.assets.find((a) => a.name === updateInfo.assetName);
      if (!asset) {
        throw new Error(`Asset ${updateInfo.assetName} not found in release`);
      }
      await githubCliService.downloadAsset(asset, targetPath, (progress) => {
        this.emit({ type: "download-progress", progress });
      });
      this.setState({ currentPhase: "verifying" });
      this.emit({ type: "verification-started" });
      const verification = await this.verifyDownload(targetPath, asset.size);
      if (!verification.valid) {
        throw new Error(`Download verification failed: ${verification.error}`);
      }
      this.emit({ type: "verification-completed" });
      this.emit({ type: "download-completed", filePath: targetPath });
      this.setState({
        currentPhase: "completed",
        downloadStatus: {
          status: "completed",
          filePath: targetPath
        }
      });
      return targetPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.setState({
        currentPhase: "error",
        lastError: errorMessage,
        downloadStatus: {
          status: "failed",
          error: errorMessage
        }
      });
      this.emit({ type: "download-failed", error: errorMessage });
      throw error;
    } finally {
      this.setState({ downloading: false });
      this.currentDownloadController = null;
    }
  }
  /**
   * Cancel Download
   */
  async cancelDownload() {
    if (this.currentDownloadController) {
      this.currentDownloadController.abort();
    }
    this.setState({
      downloading: false,
      currentPhase: "idle",
      downloadStatus: {
        status: "cancelled"
      }
    });
    this.emit({ type: "cancelled" });
  }
  /**
   * Install Update
   */
  async installUpdate(filePath, options = {}) {
    try {
      if (this.state.installing) {
        throw new Error("Installation already in progress");
      }
      this.setState({
        installing: true,
        currentPhase: "installing"
      });
      this.emit({ type: "installation-started" });
      const verification = await this.verifyInstaller(filePath);
      if (!verification.valid) {
        throw new Error(`Installer verification failed: ${verification.error}`);
      }
      const installOptions = {
        silent: this.config.silentInstall,
        restartAfter: this.config.autoRestart,
        ...options
      };
      await this.runInstaller(filePath, installOptions);
      this.emit({ type: "installation-completed" });
      if (installOptions.restartAfter) {
        this.emit({ type: "restart-required" });
        this.setState({ currentPhase: "restart-required" });
      } else {
        this.setState({ currentPhase: "completed" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.setState({
        currentPhase: "error",
        lastError: errorMessage,
        installationStatus: {
          status: "failed",
          error: errorMessage
        }
      });
      this.emit({ type: "installation-failed", error: errorMessage });
      throw error;
    } finally {
      this.setState({ installing: false });
    }
  }
  /**
   * Restart Application
   */
  async restartApplication() {
    import_electron.app.relaunch();
    import_electron.app.exit(0);
  }
  /**
   * Grant User Consent
   */
  grantUserConsent() {
    this.setState({
      userConsentGiven: true,
      userConsentRequired: false,
      currentPhase: "idle"
    });
    this.emit({ type: "user-consent-given" });
  }
  /**
   * Deny User Consent
   */
  denyUserConsent() {
    this.setState({
      userConsentGiven: false,
      userConsentRequired: false,
      currentPhase: "idle"
    });
    this.emit({ type: "user-consent-denied" });
  }
  // Private helper methods
  async getCurrentVersion() {
    try {
      const packageJsonPath = import_electron.app.isPackaged ? (0, import_path2.join)(import_electron.app.getAppPath(), "package.json") : (0, import_path2.join)(process.cwd(), "package.json");
      const packageJson = JSON.parse(await import_fs2.promises.readFile(packageJsonPath, "utf8"));
      return packageJson.version;
    } catch (error) {
      console.error("Failed to get current version:", error);
      return "0.0.0";
    }
  }
  createUpdateInfo(release) {
    const asset = release.assets.find(
      (a) => a.name.includes(".exe") && a.name.includes("Setup")
    );
    return {
      version: release.tag_name.replace(/^v/, ""),
      name: release.name,
      releaseNotes: release.body,
      publishedAt: release.published_at,
      downloadUrl: asset?.browser_download_url || "",
      assetName: asset?.name || "",
      fileSize: asset?.size || 0,
      isPrerelease: release.prerelease
    };
  }
  async prepareDownloadDirectory() {
    const downloadDir = (0, import_path2.join)(import_electron.app.getPath("temp"), "RawaLite-Updates");
    await import_fs2.promises.mkdir(downloadDir, { recursive: true });
    return downloadDir;
  }
  async verifyDownload(filePath, expectedSize) {
    try {
      const stats = await import_fs2.promises.stat(filePath);
      if (stats.size !== expectedSize) {
        return {
          valid: false,
          expectedSize,
          actualSize: stats.size,
          error: `File size mismatch: expected ${expectedSize}, got ${stats.size}`
        };
      }
      const hash = await this.calculateFileHash(filePath);
      return {
        valid: true,
        expectedSize,
        actualSize: stats.size,
        actualHash: hash
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown verification error"
      };
    }
  }
  async verifyInstaller(filePath) {
    try {
      const stats = await import_fs2.promises.stat(filePath);
      if (!stats.isFile()) {
        return { valid: false, error: "Not a file" };
      }
      if (stats.size === 0) {
        return { valid: false, error: "File is empty" };
      }
      if (!filePath.endsWith(".exe")) {
        return { valid: false, error: "Not an executable file" };
      }
      return { valid: true, actualSize: stats.size };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "File verification failed"
      };
    }
  }
  async runInstaller(filePath, options) {
    return new Promise((resolve, reject) => {
      const args = [];
      if (options.silent) {
        args.push("/S", "/SILENT", "/VERYSILENT", "/SP-", "/SUPPRESSMSGBOXES");
      }
      if (options.additionalArgs) {
        args.push(...options.additionalArgs);
      }
      const process2 = (0, import_child_process2.spawn)(filePath, args, {
        detached: false,
        stdio: "pipe"
      });
      let stderr = "";
      process2.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      process2.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation failed with exit code ${code}: ${stderr}`));
        }
      });
      process2.on("error", reject);
      const timeout = setTimeout(() => {
        process2.kill();
        reject(new Error("Installation timeout"));
      }, UPDATE_CONSTANTS.INSTALLATION_TIMEOUT);
      process2.on("close", () => clearTimeout(timeout));
    });
  }
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = (0, import_crypto.createHash)("sha256");
      const stream = require("fs").createReadStream(filePath);
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }
  emit(event) {
    this.eventEmitter.emit(event);
  }
};
var updateManagerService = new UpdateManagerService();

// electron/main.ts
var import_electron6 = require("electron");
var fs6 = __toESM(require("node:fs/promises"), 1);

// src/main/db/Database.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_electron2 = require("electron");
var import_node_path = __toESM(require("node:path"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var instance = null;
function getDbPath() {
  const userData = import_electron2.app.getPath("userData");
  return import_node_path.default.join(userData, "database", "rawalite.db");
}
function getDb() {
  if (instance) return instance;
  const dbFile = getDbPath();
  const dbDir = import_node_path.default.dirname(dbFile);
  if (!import_node_fs.default.existsSync(dbDir)) {
    import_node_fs.default.mkdirSync(dbDir, { recursive: true });
    console.log("\u{1F5C4}\uFE0F [DB] Created database directory:", dbDir);
  }
  console.log("\u{1F5C4}\uFE0F [DB] Opening database:", dbFile);
  const db = new import_better_sqlite3.default(dbFile, {
    fileMustExist: false,
    verbose: console.log
  });
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("temp_store = MEMORY");
  console.log("\u{1F5C4}\uFE0F [DB] PRAGMAs configured:");
  console.log("  - foreign_keys:", db.pragma("foreign_keys", { simple: true }));
  console.log("  - journal_mode:", db.pragma("journal_mode", { simple: true }));
  console.log("  - synchronous:", db.pragma("synchronous", { simple: true }));
  console.log("  - temp_store:", db.pragma("temp_store", { simple: true }));
  instance = db;
  return db;
}
function getUserVersion() {
  return getDb().pragma("user_version", { simple: true });
}
function setUserVersion(version) {
  getDb().pragma(`user_version = ${version}`);
  console.log(`\u{1F5C4}\uFE0F [DB] Schema version set to: ${version}`);
}
function tx(fn) {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction(db);
}
function exec(sql, params) {
  const db = getDb();
  if (params) {
    return db.prepare(sql).run(params);
  }
  const statements = sql.split(";").filter((s) => s.trim());
  let result = { changes: 0, lastInsertRowid: 0 };
  for (const stmt of statements) {
    if (stmt.trim()) {
      const runResult = db.prepare(stmt).run();
      result.changes += runResult.changes;
      if (runResult.lastInsertRowid > 0) {
        result.lastInsertRowid = runResult.lastInsertRowid;
      }
    }
  }
  return result;
}
function prepare(sql) {
  return getDb().prepare(sql);
}
function closeDb() {
  if (instance) {
    instance.close();
    instance = null;
    console.log("\u{1F5C4}\uFE0F [DB] Database connection closed");
  }
}

// src/main/db/migrations/000_init.ts
var up = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address_street TEXT,
      address_city TEXT,
      address_zip TEXT,
      address_country TEXT DEFAULT 'Deutschland',
      tax_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS numbering_circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'offer', 'invoice'
      year INTEGER NOT NULL,
      last_number INTEGER DEFAULT 0,
      prefix TEXT DEFAULT '',
      suffix TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, year)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
      valid_until DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      offer_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue'
      due_date DATE,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      unit TEXT DEFAULT 'St\xFCck',
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
    CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
  `);
  console.log("\u{1F5C4}\uFE0F [Migration 000] Initial schema created");
};
var down = (db) => {
  db.exec("DROP INDEX IF EXISTS idx_invoices_due_date;");
  db.exec("DROP INDEX IF EXISTS idx_invoices_status;");
  db.exec("DROP INDEX IF EXISTS idx_invoices_customer;");
  db.exec("DROP INDEX IF EXISTS idx_offers_status;");
  db.exec("DROP INDEX IF EXISTS idx_offers_customer;");
  db.exec("DROP INDEX IF EXISTS idx_customers_company;");
  db.exec("DROP TABLE IF EXISTS packages;");
  db.exec("DROP TABLE IF EXISTS invoices;");
  db.exec("DROP TABLE IF EXISTS offers;");
  db.exec("DROP TABLE IF EXISTS numbering_circles;");
  db.exec("DROP TABLE IF EXISTS customers;");
  db.exec("DROP TABLE IF EXISTS settings;");
  console.log("\u{1F5C4}\uFE0F [Migration 000] Schema dropped");
};

// src/main/db/migrations/001_settings_restructure.ts
var up2 = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings_new (
      id INTEGER PRIMARY KEY DEFAULT 1,
      company_name TEXT DEFAULT '',
      street TEXT DEFAULT '',
      zip TEXT DEFAULT '',
      city TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      vat_id TEXT DEFAULT '',
      kleinunternehmer INTEGER DEFAULT 0,
      bank_name TEXT DEFAULT '',
      bank_account TEXT DEFAULT '',
      bank_bic TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const keyValueRows = db.prepare("SELECT key, value FROM settings").all();
  const settingsMap = {};
  for (const row of keyValueRows) {
    try {
      settingsMap[row.key] = JSON.parse(row.value);
    } catch {
      settingsMap[row.key] = row.value;
    }
  }
  const companyData = settingsMap["companyData"] || {};
  db.prepare(`
    INSERT OR REPLACE INTO settings_new (
      id, company_name, street, zip, city, phone, email, website,
      tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic, logo
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run([
    companyData.name || "",
    companyData.street || "",
    companyData.postalCode || "",
    companyData.city || "",
    companyData.phone || "",
    companyData.email || "",
    companyData.website || "",
    companyData.taxNumber || "",
    companyData.vatId || "",
    companyData.kleinunternehmer ? 1 : 0,
    companyData.bankName || "",
    companyData.bankAccount || "",
    companyData.bankBic || "",
    companyData.logo || ""
  ]);
  db.exec("DROP TABLE settings;");
  db.exec("ALTER TABLE settings_new RENAME TO settings;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS numbering_circles_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefix TEXT DEFAULT '',
      digits INTEGER DEFAULT 3,
      current INTEGER DEFAULT 0,
      resetMode TEXT DEFAULT 'never' CHECK(resetMode IN ('never', 'yearly')),
      lastResetYear INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const existingCircles = db.prepare("SELECT * FROM numbering_circles").all();
  for (const circle of existingCircles) {
    const circleId = `${circle.type}_${circle.year}`;
    db.prepare(`
      INSERT OR REPLACE INTO numbering_circles_new (
        id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([
      circleId,
      `${circle.type} ${circle.year}`,
      circle.prefix || "",
      3,
      // default digits
      circle.last_number || 0,
      "yearly",
      circle.year,
      circle.created_at,
      circle.updated_at
    ]);
  }
  db.exec("DROP TABLE numbering_circles;");
  db.exec("ALTER TABLE numbering_circles_new RENAME TO numbering_circles;");
  console.log("\u{1F5C4}\uFE0F [Migration 001] Settings restructured to company data schema and numbering circles updated");
};
var down2 = (db) => {
  const companyData = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  db.exec(`
    CREATE TABLE settings_old (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  if (companyData) {
    const companyJson = JSON.stringify({
      name: companyData.company_name || "",
      street: companyData.street || "",
      postalCode: companyData.zip || "",
      city: companyData.city || "",
      phone: companyData.phone || "",
      email: companyData.email || "",
      website: companyData.website || "",
      taxNumber: companyData.tax_id || "",
      vatId: companyData.vat_id || "",
      kleinunternehmer: Boolean(companyData.kleinunternehmer),
      bankName: companyData.bank_name || "",
      bankAccount: companyData.bank_account || "",
      bankBic: companyData.bank_bic || "",
      logo: companyData.logo || ""
    });
    db.prepare("INSERT INTO settings_old (key, value) VALUES (?, ?)").run(["companyData", companyJson]);
  }
  db.exec("DROP TABLE settings;");
  db.exec("ALTER TABLE settings_old RENAME TO settings;");
  db.exec(`
    CREATE TABLE numbering_circles_old (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      year INTEGER NOT NULL,
      last_number INTEGER DEFAULT 0,
      prefix TEXT DEFAULT '',
      suffix TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, year)
    );
  `);
  const newCircles = db.prepare("SELECT * FROM numbering_circles").all();
  for (const circle of newCircles) {
    const [type, yearStr] = circle.id.split("_");
    const year = parseInt(yearStr) || (/* @__PURE__ */ new Date()).getFullYear();
    db.prepare(`
      INSERT INTO numbering_circles_old (type, year, last_number, prefix, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([
      type,
      year,
      circle.current || 0,
      circle.prefix || "",
      circle.createdAt,
      circle.updatedAt
    ]);
  }
  db.exec("DROP TABLE numbering_circles;");
  db.exec("ALTER TABLE numbering_circles_old RENAME TO numbering_circles;");
  console.log("\u{1F5C4}\uFE0F [Migration 001] Reverted settings to key-value schema");
};

// src/main/db/migrations/index.ts
var migrations = [
  {
    version: 1,
    name: "000_init",
    up,
    down
  },
  {
    version: 2,
    name: "001_settings_restructure",
    up: up2,
    down: down2
  }
  // Add future migrations here:
  // {
  //   version: 3,
  //   name: '002_add_packages_table',
  //   up: migration002.up,
  //   down: migration002.down
  // }
];

// src/main/db/MigrationService.ts
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_electron3 = require("electron");
function createPreMigrationBackup() {
  try {
    const userData = import_electron3.app.getPath("userData");
    const backupDir = import_node_path2.default.join(userData, "database", "backups");
    if (!import_node_fs2.default.existsSync(backupDir)) {
      import_node_fs2.default.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupPath = import_node_path2.default.join(backupDir, `pre-migration-${timestamp}.sqlite`);
    const db = getDb();
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
    console.log(`\u{1F5C4}\uFE0F [Migration] Cold backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("\u{1F5C4}\uFE0F [Migration] Failed to create pre-migration backup:", error);
    return null;
  }
}
async function runAllMigrations() {
  const currentVersion = getUserVersion();
  const targetVersion = Math.max(...migrations.map((m) => m.version));
  console.log(`\u{1F5C4}\uFE0F [Migration] Current schema version: ${currentVersion}`);
  console.log(`\u{1F5C4}\uFE0F [Migration] Target schema version: ${targetVersion}`);
  if (currentVersion >= targetVersion) {
    console.log("\u{1F5C4}\uFE0F [Migration] Database is up to date");
    return;
  }
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);
  if (pendingMigrations.length === 0) {
    console.log("\u{1F5C4}\uFE0F [Migration] No pending migrations");
    return;
  }
  console.log(`\u{1F5C4}\uFE0F [Migration] Running ${pendingMigrations.length} pending migrations`);
  const backupPath = createPreMigrationBackup();
  if (!backupPath) {
    console.warn("\u{1F5C4}\uFE0F [Migration] Proceeding without backup (risky!)");
  }
  try {
    tx((db) => {
      for (const migration of pendingMigrations) {
        console.log(`\u{1F5C4}\uFE0F [Migration] Running migration ${migration.version}: ${migration.name}`);
        try {
          migration.up(db);
          console.log(`\u{1F5C4}\uFE0F [Migration] \u2705 Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`\u{1F5C4}\uFE0F [Migration] \u274C Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
      setUserVersion(targetVersion);
    });
    console.log(`\u{1F5C4}\uFE0F [Migration] \u2705 All migrations completed successfully`);
    console.log(`\u{1F5C4}\uFE0F [Migration] Schema updated to version ${targetVersion}`);
  } catch (error) {
    console.error("\u{1F5C4}\uFE0F [Migration] \u274C Migration failed, database rolled back:", error);
    if (backupPath && import_node_fs2.default.existsSync(backupPath)) {
      console.log(`\u{1F5C4}\uFE0F [Migration] \u{1F4BE} Backup available at: ${backupPath}`);
      console.log(`\u{1F5C4}\uFE0F [Migration] To restore: Stop app, replace database file, restart`);
    }
    throw error;
  }
}

// src/main/db/BackupService.ts
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);
var import_electron4 = require("electron");
function getBackupDir() {
  const userData = import_electron4.app.getPath("userData");
  return import_node_path3.default.join(userData, "database", "backups");
}
function getDbPath2() {
  const userData = import_electron4.app.getPath("userData");
  return import_node_path3.default.join(userData, "database", "rawalite.db");
}
function ensureBackupDir() {
  const backupDir = getBackupDir();
  if (!import_node_fs3.default.existsSync(backupDir)) {
    import_node_fs3.default.mkdirSync(backupDir, { recursive: true });
  }
}
async function createHotBackup(targetPath) {
  const start = Date.now();
  ensureBackupDir();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const fileName = `hot-backup-${timestamp}.sqlite`;
  const backupPath = targetPath ?? import_node_path3.default.join(getBackupDir(), fileName);
  const targetDir = import_node_path3.default.dirname(backupPath);
  if (!import_node_fs3.default.existsSync(targetDir)) {
    import_node_fs3.default.mkdirSync(targetDir, { recursive: true });
  }
  console.log(`\u{1F4BE} [Backup] Creating hot backup to: ${backupPath}`);
  try {
    const db = getDb();
    await new Promise((resolve, reject) => {
      const backup = db.backup(backupPath);
      backup.then(() => {
        console.log("\u{1F4BE} [Backup] Hot backup completed successfully");
        resolve();
      }).catch((error) => {
        console.error("\u{1F4BE} [Backup] Hot backup failed:", error);
        reject(error);
      });
    });
    const bytes = import_node_fs3.default.statSync(backupPath).size;
    const durationMs = Date.now() - start;
    console.log(`\u{1F4BE} [Backup] Hot backup created: ${bytes} bytes in ${durationMs}ms`);
    return {
      path: backupPath,
      bytes,
      durationMs
    };
  } catch (error) {
    console.error("\u{1F4BE} [Backup] Hot backup failed:", error);
    if (import_node_fs3.default.existsSync(backupPath)) {
      try {
        import_node_fs3.default.unlinkSync(backupPath);
      } catch (unlinkError) {
        console.warn("\u{1F4BE} [Backup] Failed to clean up failed backup file:", unlinkError);
      }
    }
    throw error;
  }
}
function createVacuumBackup(targetPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\u{1F4BE} [Backup] Creating VACUUM backup to: ${targetPath}`);
      const targetDir = import_node_path3.default.dirname(targetPath);
      if (!import_node_fs3.default.existsSync(targetDir)) {
        import_node_fs3.default.mkdirSync(targetDir, { recursive: true });
      }
      const db = getDb();
      db.exec(`VACUUM INTO '${targetPath.replace(/'/g, "''")}'`);
      const bytes = import_node_fs3.default.statSync(targetPath).size;
      console.log(`\u{1F4BE} [Backup] VACUUM backup created: ${bytes} bytes`);
      resolve({
        path: targetPath,
        bytes
      });
    } catch (error) {
      console.error("\u{1F4BE} [Backup] VACUUM backup failed:", error);
      if (import_node_fs3.default.existsSync(targetPath)) {
        try {
          import_node_fs3.default.unlinkSync(targetPath);
        } catch (unlinkError) {
          console.warn("\u{1F4BE} [Backup] Failed to clean up failed VACUUM backup:", unlinkError);
        }
      }
      reject(error);
    }
  });
}
function checkIntegrity() {
  try {
    console.log("\u{1F50D} [Backup] Running integrity check...");
    const db = getDb();
    const integrityResults = db.prepare("PRAGMA integrity_check").all();
    const fkResults = db.prepare("PRAGMA foreign_key_check").all();
    const errors = [];
    const integrityOk = integrityResults.length === 1 && integrityResults[0].integrity_check === "ok";
    if (!integrityOk) {
      errors.push(...integrityResults.map((r) => r.integrity_check));
    }
    if (fkResults.length > 0) {
      errors.push(...fkResults.map((r) => `FK violation: ${JSON.stringify(r)}`));
    }
    const ok = errors.length === 0;
    console.log(`\u{1F50D} [Backup] Integrity check completed: ${ok ? "PASS" : "FAIL"}`);
    if (!ok) {
      console.error("\u{1F50D} [Backup] Integrity errors:", errors);
    }
    return {
      ok,
      details: JSON.stringify({
        integrity: integrityResults,
        foreignKeys: fkResults,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, null, 2),
      errors
    };
  } catch (error) {
    console.error("\u{1F50D} [Backup] Integrity check failed:", error);
    return {
      ok: false,
      details: `Integrity check failed: ${error}`,
      errors: [`Integrity check error: ${error}`]
    };
  }
}
function restoreFromBackup(sourcePath) {
  try {
    console.log(`\u{1F504} [Backup] Restoring database from: ${sourcePath}`);
    if (!import_node_fs3.default.existsSync(sourcePath)) {
      throw new Error(`Backup file not found: ${sourcePath}`);
    }
    const backupDir = getBackupDir();
    const resolvedSource = import_node_path3.default.resolve(sourcePath);
    const resolvedBackupDir = import_node_path3.default.resolve(backupDir);
    if (!resolvedSource.startsWith(resolvedBackupDir)) {
      throw new Error(`Restore source must be within backup directory: ${backupDir}`);
    }
    const dbPath = getDbPath2();
    const currentBackupPath = import_node_path3.default.join(
      getBackupDir(),
      `pre-restore-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.sqlite`
    );
    try {
      if (import_node_fs3.default.existsSync(dbPath)) {
        import_node_fs3.default.copyFileSync(dbPath, currentBackupPath);
        console.log(`\u{1F504} [Backup] Current database backed up to: ${currentBackupPath}`);
      }
    } catch (backupError) {
      console.warn("\u{1F504} [Backup] Failed to backup current database:", backupError);
    }
    closeDb();
    import_node_fs3.default.copyFileSync(sourcePath, dbPath);
    console.log(`\u{1F504} [Backup] Database restored successfully from: ${sourcePath}`);
    console.log(`\u{1F504} [Backup] Application restart required to reload database`);
    return {
      needsRestart: true,
      message: `Database restored from ${import_node_path3.default.basename(sourcePath)}. Application will restart.`
    };
  } catch (error) {
    console.error("\u{1F504} [Backup] Database restore failed:", error);
    throw error;
  }
}
function listBackups() {
  try {
    ensureBackupDir();
    const backupDir = getBackupDir();
    const files = import_node_fs3.default.readdirSync(backupDir);
    const backups = [];
    for (const file of files) {
      if (!file.endsWith(".sqlite")) continue;
      const filePath = import_node_path3.default.join(backupDir, file);
      const stats = import_node_fs3.default.statSync(filePath);
      let type = "hot";
      if (file.includes("vacuum")) type = "vacuum";
      if (file.includes("migration")) type = "migration";
      backups.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        type
      });
    }
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    return backups;
  } catch (error) {
    console.error("\u{1F4BE} [Backup] Failed to list backups:", error);
    return [];
  }
}
function cleanOldBackups(keepCount = 10) {
  try {
    const backups = listBackups();
    const errors = [];
    let deleted = 0;
    if (backups.length <= keepCount) {
      return {
        deleted: 0,
        kept: backups.length,
        errors: []
      };
    }
    const toDelete = backups.slice(keepCount);
    for (const backup of toDelete) {
      try {
        import_node_fs3.default.unlinkSync(backup.path);
        deleted++;
        console.log(`\u{1F5D1}\uFE0F [Backup] Deleted old backup: ${backup.name}`);
      } catch (error) {
        const errorMsg = `Failed to delete ${backup.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`\u{1F5D1}\uFE0F [Backup] ${errorMsg}`);
      }
    }
    return {
      deleted,
      kept: backups.length - deleted,
      errors
    };
  } catch (error) {
    console.error("\u{1F5D1}\uFE0F [Backup] Failed to clean old backups:", error);
    return {
      deleted: 0,
      kept: 0,
      errors: [`Cleanup failed: ${error}`]
    };
  }
}

// electron/main.ts
var isDev = !import_electron5.app.isPackaged;
function createWindow() {
  const rootPath = isDev ? process.cwd() : import_electron5.app.getAppPath();
  const preloadPath = isDev ? import_node_path4.default.join(rootPath, "dist-electron", "preload.js") : import_node_path4.default.join(__dirname, "preload.js");
  const win = new import_electron5.BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true
    }
  });
  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    const htmlPath = import_node_path4.default.join(process.resourcesPath, "index.html");
    console.log("\u{1F50D} [DEBUG] HTML Path:", htmlPath);
    console.log("\u{1F50D} [DEBUG] Resources Path:", process.resourcesPath);
    console.log("\u{1F50D} [DEBUG] File exists:", (0, import_node_fs4.existsSync)(htmlPath));
    if (!(0, import_node_fs4.existsSync)(htmlPath)) {
      const fallbackPath = import_node_path4.default.join(process.resourcesPath, "..", "resources", "index.html");
      console.log("\u{1F50D} [DEBUG] Fallback Path:", fallbackPath);
      console.log("\u{1F50D} [DEBUG] Fallback exists:", (0, import_node_fs4.existsSync)(fallbackPath));
      if ((0, import_node_fs4.existsSync)(fallbackPath)) {
        win.loadFile(fallbackPath);
        return;
      }
    }
    win.loadFile(htmlPath);
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    import_electron5.shell.openExternal(url);
    return { action: "deny" };
  });
}
import_electron6.ipcMain.handle("paths:get", async (event, pathType) => {
  try {
    switch (pathType) {
      case "userData":
        return import_electron5.app.getPath("userData");
      case "documents":
        return import_electron5.app.getPath("documents");
      case "downloads":
        return import_electron5.app.getPath("downloads");
      default:
        throw new Error(`Unknown path type: ${pathType}`);
    }
  } catch (error) {
    console.error(`Failed to get path ${pathType}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:ensureDir", async (event, dirPath) => {
  try {
    await fs6.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return true;
    console.error(`Failed to ensure directory ${dirPath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:getCwd", async () => {
  try {
    return process.cwd();
  } catch (error) {
    console.error("Failed to get current working directory:", error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:readDir", async (event, dirPath) => {
  try {
    return await fs6.readdir(dirPath);
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:stat", async (event, filePath) => {
  try {
    const stats = await fs6.stat(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime.getTime(),
      atime: stats.atime.getTime(),
      ctime: stats.ctime.getTime()
    };
  } catch (error) {
    console.error(`Failed to stat ${filePath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:unlink", async (event, filePath) => {
  try {
    await fs6.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to unlink ${filePath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:exists", async (event, filePath) => {
  try {
    await fs6.access(filePath);
    return true;
  } catch {
    return false;
  }
});
import_electron6.ipcMain.handle("fs:copy", async (event, src, dest) => {
  try {
    await fs6.copyFile(src, dest);
    return true;
  } catch (error) {
    console.error(`Failed to copy ${src} to ${dest}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:readFile", async (event, filePath, encoding) => {
  try {
    return await fs6.readFile(filePath, encoding);
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("fs:writeFile", async (event, filePath, data, encoding) => {
  try {
    await fs6.writeFile(filePath, data, encoding);
    return true;
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("db:query", async (event, sql, params) => {
  try {
    const stmt = prepare(sql);
    return params ? stmt.all(...params) : stmt.all();
  } catch (error) {
    console.error(`Database query failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("db:exec", async (event, sql, params) => {
  try {
    return exec(sql, params);
  } catch (error) {
    console.error(`Database exec failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("db:transaction", async (event, queries) => {
  try {
    return tx(() => {
      const results = [];
      for (const query of queries) {
        const result = exec(query.sql, query.params);
        results.push(result);
      }
      return results;
    });
  } catch (error) {
    console.error(`Database transaction failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("backup:hot", async (event, backupPath) => {
  try {
    return await createHotBackup(backupPath);
  } catch (error) {
    console.error(`Hot backup failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("backup:vacuumInto", async (event, backupPath) => {
  try {
    return await createVacuumBackup(backupPath);
  } catch (error) {
    console.error(`Vacuum backup failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("backup:integrityCheck", async (event, dbPath) => {
  try {
    return checkIntegrity();
  } catch (error) {
    console.error(`Integrity check failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("backup:restore", async (event, backupPath, targetPath) => {
  try {
    return restoreFromBackup(backupPath);
  } catch (error) {
    console.error(`Backup restore failed:`, error);
    throw error;
  }
});
import_electron6.ipcMain.handle("backup:cleanup", async (event, backupDir, keepCount) => {
  try {
    return cleanOldBackups(keepCount);
  } catch (error) {
    console.error(`Backup cleanup failed:`, error);
    throw error;
  }
});
import_electron5.app.whenReady().then(async () => {
  try {
    console.log("\u{1F5C4}\uFE0F Initializing database...");
    getDb();
    console.log("\u{1F504} Running database migrations...");
    await runAllMigrations();
    createWindow();
    console.log("\u2705 Application ready with database initialized");
  } catch (error) {
    console.error("\u274C Failed to initialize application:", error);
    import_electron5.app.quit();
  }
});
import_electron5.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron5.app.quit();
});
import_electron5.app.on("activate", () => {
  if (import_electron5.BrowserWindow.getAllWindows().length === 0) createWindow();
});
var updateManager = new UpdateManagerService();
import_electron6.ipcMain.handle("updates:check", async () => {
  return await updateManager.checkForUpdates();
});
import_electron6.ipcMain.handle("updates:getCurrentVersion", async () => {
  return import_electron5.app.getVersion();
});
import_electron6.ipcMain.handle("updates:startDownload", async (event, updateInfo) => {
  return await updateManager.startDownload(updateInfo);
});
import_electron6.ipcMain.handle("updates:cancelDownload", async () => {
  return await updateManager.cancelDownload();
});
import_electron6.ipcMain.handle("updates:installUpdate", async (event, filePath) => {
  return await updateManager.installUpdate(filePath);
});
import_electron6.ipcMain.handle("updates:restartApp", async () => {
  return await updateManager.restartApplication();
});
import_electron6.ipcMain.handle("updates:getConfig", async () => {
  return updateManager.getConfig();
});
import_electron6.ipcMain.handle("updates:setConfig", async (event, config) => {
  return updateManager.setConfig(config);
});
import_electron6.ipcMain.handle("updates:openDownloadFolder", async () => {
  import_electron5.shell.showItemInFolder(import_electron5.app.getPath("downloads"));
});
import_electron6.ipcMain.handle("updates:verifyFile", async (event, filePath) => {
  try {
    await require("fs").promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});
