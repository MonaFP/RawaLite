console.log('app.js lädt');

class RaWaLiteApp {
    constructor() {
        this.currentView = 'customers';
        this.customers = [];
        this.packages = [];
        this.offers = [];
        this.invoices = [];
    }
    
    async init() {
        console.log('App init');
        
        if (window.dbManager) {
            await window.dbManager.initialize();
            await this.loadAllData();
        }
        
        this.setupEventListeners();
        this.showView('customers');
    }
    
    async loadAllData() {
        this.customers = await window.dbManager.getAllCustomers();
        this.packages = await window.dbManager.getAllPackages();
        this.offers = await window.dbManager.getAllOffers();
        this.invoices = await window.dbManager.getAllInvoices();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.onclick = () => this.showView(btn.dataset.view);
        });
        
        // Forms
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.onsubmit = (e) => {
                e.preventDefault();
                this.saveCustomer();
            };
        }
        
        const packageForm = document.getElementById('package-form');
        if (packageForm) {
            packageForm.onsubmit = (e) => {
                e.preventDefault();
                this.savePackage();
            };
        }
        
        // Buttons
        document.getElementById('customer-reset')?.addEventListener('click', () => this.resetCustomerForm());
        document.getElementById('customer-delete')?.addEventListener('click', () => this.deleteCustomer());
        
        document.getElementById('package-reset')?.addEventListener('click', () => this.resetPackageForm());
        document.getElementById('package-delete')?.addEventListener('click', () => this.deletePackage());
        
        document.getElementById('new-offer')?.addEventListener('click', () => this.showOfferForm());
        document.getElementById('new-invoice')?.addEventListener('click', () => this.showInvoiceForm());
    }
    
    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        const view = document.getElementById(viewName + '-view');
        if (view) view.classList.add('active');
        
        const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
        if (navBtn) navBtn.classList.add('active');
        
        if (viewName === 'customers') this.refreshCustomerList();
        if (viewName === 'packages') this.refreshPackageList();
        if (viewName === 'offers') this.refreshOfferList();
        if (viewName === 'invoices') this.refreshInvoiceList();
    }
    
    // KUNDEN
    refreshCustomerList() {
        const list = document.getElementById('customer-list');
        if (!list) return;
        
        if (this.customers.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #6c757d;">Keine Kunden vorhanden</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid #dee2e6;">';
        html += '<th style="text-align: left; padding: 8px;">Nr.</th>';
        html += '<th style="text-align: left; padding: 8px;">Name</th>';
        html += '<th style="text-align: center; padding: 8px;">Aktionen</th></tr></thead><tbody>';
        
        this.customers.forEach(customer => {
            html += `<tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px;">${customer.number}</td>
                <td style="padding: 8px;">${customer.name}</td>
                <td style="text-align: center; padding: 8px;">
                    <button onclick="window.app.editCustomer(${customer.id})" style="margin-right: 5px;">✏️</button>
                    <button onclick="window.app.quickDeleteCustomer(${customer.id})">🗑️</button>
                </td></tr>`;
        });
        
        html += '</tbody></table>';
        list.innerHTML = html;
    }

    async saveCustomer() {
        try {
            const formData = {
                name: document.getElementById('customer-name').value,
                email: document.getElementById('customer-email').value,
                phone: document.getElementById('customer-phone').value,
                address: document.getElementById('customer-address').value
            };
            
            if (!formData.name) {
                alert('Bitte Namen eingeben');
                return;
            }
            
            const customerId = document.getElementById('customer-id').value;
            
            if (customerId) {
                await window.dbManager.updateCustomer(parseFloat(customerId), formData);
            } else {
                await window.dbManager.createCustomer(formData);
            }
            
            this.customers = await window.dbManager.getAllCustomers();
            this.refreshCustomerList();
            this.resetCustomerForm();
            
        } catch (error) {
            console.error('Fehler:', error);
            alert('Fehler beim Speichern: ' + error.message);
        }
    }
    
    editCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (!customer) return;
        
        document.getElementById('customer-id').value = customer.id;
        document.getElementById('customer-number').value = customer.number;
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-delete').style.display = 'inline-block';
    }
    
    async quickDeleteCustomer(id) {
        if (confirm('Kunde löschen?')) {
            await window.dbManager.deleteCustomer(id);
            this.customers = await window.dbManager.getAllCustomers();
            this.refreshCustomerList();
        }
    }
    
    async deleteCustomer() {
        const id = document.getElementById('customer-id').value;
        if (id && confirm('Kunde löschen?')) {
            await window.dbManager.deleteCustomer(parseFloat(id));
            this.customers = await window.dbManager.getAllCustomers();
            this.refreshCustomerList();
            this.resetCustomerForm();
        }
    }
    
    resetCustomerForm() {
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-delete').style.display = 'none';
    }
    
    // PAKETE
    refreshPackageList() {
        const list = document.getElementById('package-list');
        if (!list) return;
        
        if (this.packages.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #6c757d;">Keine Pakete vorhanden</p>';
            return;
        }
        
        let html = '';
        this.packages.forEach(pkg => {
            html += `<div style="padding: 10px; border: 1px solid #dee2e6; margin-bottom: 10px; cursor: pointer;" 
                     onclick="window.app.editPackage(${pkg.id})">
                <strong>${pkg.title}</strong><br>
                <small>${pkg.sku} - ${pkg.price}€</small>
            </div>`;
        });
        list.innerHTML = html;
    }
    
    async savePackage() {
        try {
            const formData = {
                sku: document.getElementById('package-sku').value,
                title: document.getElementById('package-title').value,
                description: document.getElementById('package-description').value,
                price: parseFloat(document.getElementById('package-price').value) || 0
            };
            
            if (!formData.title) {
                alert('Bitte Titel eingeben');
                return;
            }
            
            const packageId = document.getElementById('package-id').value;
            
            if (packageId) {
                await window.dbManager.updatePackage(parseFloat(packageId), formData);
            } else {
                await window.dbManager.createPackage(formData);
            }
            
            this.packages = await window.dbManager.getAllPackages();
            this.refreshPackageList();
            this.resetPackageForm();
            
        } catch (error) {
            alert('Fehler: ' + error.message);
        }
    }
    
    editPackage(id) {
        const pkg = this.packages.find(p => p.id === id);
        if (!pkg) return;
        
        document.getElementById('package-id').value = pkg.id;
        document.getElementById('package-sku').value = pkg.sku || '';
        document.getElementById('package-title').value = pkg.title;
        document.getElementById('package-description').value = pkg.description || '';
        document.getElementById('package-price').value = pkg.price;
        document.getElementById('package-delete').style.display = 'inline-block';
    }
    
    async deletePackage() {
        const id = document.getElementById('package-id').value;
        if (id && confirm('Paket löschen?')) {
            await window.dbManager.deletePackage(parseFloat(id));
            this.packages = await window.dbManager.getAllPackages();
            this.refreshPackageList();
            this.resetPackageForm();
        }
    }
    
    resetPackageForm() {
        document.getElementById('package-form').reset();
        document.getElementById('package-id').value = '';
        document.getElementById('package-delete').style.display = 'none';
    }
    
    // ANGEBOTE & RECHNUNGEN
    refreshOfferList() {
        const list = document.getElementById('offer-list');
        if (list) list.innerHTML = '<p>Angebotsverwaltung wird noch implementiert</p>';
    }
    
    refreshInvoiceList() {
        const list = document.getElementById('invoice-list');
        if (list) list.innerHTML = '<p>Rechnungsverwaltung wird noch implementiert</p>';
    }
    
    showOfferForm() {
        alert('Angebotserstellung wird noch implementiert');
    }
    
    showInvoiceForm() {
        alert('Rechnungserstellung wird noch implementiert');
    }
}

window.app = new RaWaLiteApp();

setTimeout(() => {
    window.app.init();
}, 500);