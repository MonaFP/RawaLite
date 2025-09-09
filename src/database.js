const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class DatabaseManager {
    constructor() {
        const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RaWaLite');
        this.dataPath = path.join(appDataPath, 'data.json');
        this.initialized = false;
        this.data = this.getEmptyData();
    }

    getEmptyData() {
        return {
            customers: [],
            packages: [],
            offers: [],
            invoices: [],
            settings: {},
            sequences: {
                customer: { prefix: 'K', digits: 3, current: 0 },
                invoice: { prefix: 'RE', digits: 3, current: 0 },
                offer: { prefix: 'AN', digits: 3, current: 0 },
                package: { prefix: 'PAK', digits: 3, current: 0 }
            }
        };
    }

    async initialize() {
        try {
            await fs.ensureDir(path.dirname(this.dataPath));
            
            if (await fs.pathExists(this.dataPath)) {
                try {
                    const content = await fs.readFile(this.dataPath, 'utf8');
                    const loaded = JSON.parse(content);
                    if (loaded && typeof loaded === 'object') {
                        this.data = loaded;
                        // Sicherstellen dass Arrays existieren
                        if (!Array.isArray(this.data.customers)) this.data.customers = [];
                        if (!Array.isArray(this.data.packages)) this.data.packages = [];
                        if (!Array.isArray(this.data.offers)) this.data.offers = [];
                        if (!Array.isArray(this.data.invoices)) this.data.invoices = [];
                    }
                } catch (e) {
                    console.log('Datei korrupt, verwende leere Daten');
                    this.data = this.getEmptyData();
                }
            }
            
            this.initialized = true;
            console.log('Database initialized');
        } catch (error) {
            console.error('Init error:', error);
            this.initialized = true;
        }
    }

    async saveData() {
        try {
            if (!this.data || !this.data.sequences) {
                this.data = this.getEmptyData();
            }
            
            await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    async getNextNumber(type) {
        if (!this.data.sequences || !this.data.sequences[type]) {
            this.data.sequences = this.getEmptyData().sequences;
        }
        
        const seq = this.data.sequences[type];
        seq.current++;
        const number = `${seq.prefix}-${String(seq.current).padStart(seq.digits, '0')}`;
        
        await this.saveData();
        return number;
    }

    // Kunden
    async createCustomer(data) {
        if (!Array.isArray(this.data.customers)) {
            this.data.customers = [];
        }
        
        const customer = {
            id: Date.now() + Math.random(),
            number: await this.getNextNumber('customer'),
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            created_at: new Date().toISOString()
        };
        
        this.data.customers.push(customer);
        await this.saveData();
        return customer;
    }

    async getAllCustomers() {
        return Array.isArray(this.data.customers) ? this.data.customers : [];
    }

    async updateCustomer(id, data) {
        if (!Array.isArray(this.data.customers)) return null;
        
        const index = this.data.customers.findIndex(c => c.id === id);
        if (index >= 0) {
            this.data.customers[index] = { ...this.data.customers[index], ...data };
            await this.saveData();
            return this.data.customers[index];
        }
        return null;
    }

    async deleteCustomer(id) {
        if (!Array.isArray(this.data.customers)) {
            this.data.customers = [];
        }
        
        this.data.customers = this.data.customers.filter(c => c.id !== id);
        
        if (this.data.customers.length === 0) {
            this.data.sequences.customer.current = 0;
        }
        
        await this.saveData();
    }

    // Pakete
    async createPackage(data) {
        if (!Array.isArray(this.data.packages)) {
            this.data.packages = [];
        }
        
        const pkg = {
            id: Date.now() + Math.random(),
            sku: data.sku || await this.getNextNumber('package'),
            title: data.title || '',
            description: data.description || '',
            price: data.price || 0,
            created_at: new Date().toISOString()
        };
        
        this.data.packages.push(pkg);
        await this.saveData();
        return pkg;
    }

    async getAllPackages() {
        return Array.isArray(this.data.packages) ? this.data.packages : [];
    }

    async updatePackage(id, data) {
        if (!Array.isArray(this.data.packages)) return null;
        
        const index = this.data.packages.findIndex(p => p.id === id);
        if (index >= 0) {
            this.data.packages[index] = { ...this.data.packages[index], ...data };
            await this.saveData();
            return this.data.packages[index];
        }
        return null;
    }

    async deletePackage(id) {
        if (!Array.isArray(this.data.packages)) {
            this.data.packages = [];
        }
        
        this.data.packages = this.data.packages.filter(p => p.id !== id);
        
        if (this.data.packages.length === 0) {
            this.data.sequences.package.current = 0;
        }
        
        await this.saveData();
    }

    // Weitere Funktionen
    async getAllOffers() { return this.data.offers || []; }
    async getAllInvoices() { return this.data.invoices || []; }
    async getAllSettings() { return this.data.settings || {}; }
    async setSetting(key, value) {
        if (!this.data.settings) this.data.settings = {};
        this.data.settings[key] = value;
        await this.saveData();
    }
    async getNumberSequences() {
        if (!this.data.sequences) return [];
        return Object.keys(this.data.sequences).map(type => ({
            type,
            ...this.data.sequences[type]
        }));
    }
}

window.dbManager = new DatabaseManager();