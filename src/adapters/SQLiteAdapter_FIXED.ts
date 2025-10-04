import type { PersistenceAdapter, Settings, Customer, Offer, Invoice, Package, Activity, Timesheet, TimesheetActivity } from "../persistence/adapter";
import { DbClient } from "../services/DbClient";
import { FieldMapper, mapFromSQL, mapFromSQLArray, mapToSQL, convertSQLQuery } from "../lib/field-mapper";

function nowIso() {
  return new Date().toISOString();
}

export class SQLiteAdapter implements PersistenceAdapter {
  private client: DbClient;

  constructor() {
    this.client = DbClient.getInstance();
  }

  async ready(): Promise<void> {
    // DbClient validates availability automatically
  }

  // SETTINGS
  async getSettings(): Promise<Settings> {
    const query = convertSQLQuery("SELECT * FROM settings WHERE id = 1");
    const rows = await this.client.query<Settings>(query);
    return rows[0] as Settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    // Get current settings
    const current = await this.getSettings();
    const next = { ...current, ...patch, updatedAt: nowIso() };

    const mappedData = mapToSQL(next);
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE settings SET ${fields} WHERE id = 1`);
    await this.client.query(query, values);
    
    return this.getSettings();
  }

  // CUSTOMERS
  async listCustomers(): Promise<Customer[]> {
    const query = convertSQLQuery("SELECT * FROM customers ORDER BY name");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Customer>(rows);
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = nowIso();
    const customerData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(customerData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO customers (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getCustomer(result.lastInsertRowid as number);
  }

  async getCustomer(id: number): Promise<Customer> {
    const query = convertSQLQuery("SELECT * FROM customers WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const customer = mapFromSQL<Customer>(rows[0]);
    if (!customer) throw new Error(`Customer ${id} not found`);
    return customer;
  }

  async updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE customers SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getCustomer(id);
  }

  async deleteCustomer(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM customers WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // OFFERS
  async listOffers(): Promise<Offer[]> {
    const query = convertSQLQuery("SELECT * FROM offers ORDER BY date DESC");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Offer>(rows);
  }

  async createOffer(data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const now = nowIso();
    const offerData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(offerData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO offers (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getOffer(result.lastInsertRowid as number);
  }

  async getOffer(id: number): Promise<Offer> {
    const query = convertSQLQuery("SELECT * FROM offers WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const offer = mapFromSQL<Offer>(rows[0]);
    if (!offer) throw new Error(`Offer ${id} not found`);
    return offer;
  }

  async updateOffer(id: number, patch: Partial<Offer>): Promise<Offer> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE offers SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getOffer(id);
  }

  async deleteOffer(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM offers WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // INVOICES
  async listInvoices(): Promise<Invoice[]> {
    const query = convertSQLQuery("SELECT * FROM invoices ORDER BY date DESC");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Invoice>(rows);
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const now = nowIso();
    const invoiceData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(invoiceData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO invoices (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getInvoice(result.lastInsertRowid as number);
  }

  async getInvoice(id: number): Promise<Invoice> {
    const query = convertSQLQuery("SELECT * FROM invoices WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const invoice = mapFromSQL<Invoice>(rows[0]);
    if (!invoice) throw new Error(`Invoice ${id} not found`);
    return invoice;
  }

  async updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE invoices SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getInvoice(id);
  }

  async deleteInvoice(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM invoices WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // PACKAGES
  async listPackages(): Promise<Package[]> {
    const query = convertSQLQuery("SELECT * FROM packages ORDER BY date DESC");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Package>(rows);
  }

  async createPackage(data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Promise<Package> {
    const now = nowIso();
    const packageData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(packageData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO packages (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getPackage(result.lastInsertRowid as number);
  }

  async getPackage(id: number): Promise<Package> {
    const query = convertSQLQuery("SELECT * FROM packages WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const pkg = mapFromSQL<Package>(rows[0]);
    if (!pkg) throw new Error(`Package ${id} not found`);
    return pkg;
  }

  async updatePackage(id: number, patch: Partial<Package>): Promise<Package> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE packages SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getPackage(id);
  }

  async deletePackage(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM packages WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // ACTIVITIES
  async listActivities(): Promise<Activity[]> {
    const query = convertSQLQuery("SELECT * FROM activities ORDER BY created_at DESC");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Activity>(rows);
  }

  async createActivity(data: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const now = nowIso();
    const activityData = { ...data, createdAt: now };
    const mappedData = mapToSQL(activityData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO activities (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getActivity(result.lastInsertRowid as number);
  }

  async getActivity(id: number): Promise<Activity> {
    const query = convertSQLQuery("SELECT * FROM activities WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const activity = mapFromSQL<Activity>(rows[0]);
    if (!activity) throw new Error(`Activity ${id} not found`);
    return activity;
  }

  async deleteActivity(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM activities WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // TIMESHEETS
  async listTimesheets(): Promise<Timesheet[]> {
    const query = convertSQLQuery("SELECT * FROM timesheets ORDER BY date DESC");
    const rows = await this.client.query(query);
    return mapFromSQLArray<Timesheet>(rows);
  }

  async createTimesheet(data: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Timesheet> {
    const now = nowIso();
    const timesheetData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(timesheetData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO timesheets (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getTimesheet(result.lastInsertRowid as number);
  }

  async getTimesheet(id: number): Promise<Timesheet> {
    const query = convertSQLQuery("SELECT * FROM timesheets WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const timesheet = mapFromSQL<Timesheet>(rows[0]);
    if (!timesheet) throw new Error(`Timesheet ${id} not found`);
    return timesheet;
  }

  async updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE timesheets SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getTimesheet(id);
  }

  async deleteTimesheet(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM timesheets WHERE id = ?");
    await this.client.query(query, [id]);
  }

  // TIMESHEET ACTIVITIES
  async listTimesheetActivities(timesheetId: number): Promise<TimesheetActivity[]> {
    const query = convertSQLQuery("SELECT * FROM timesheet_activities WHERE timesheet_id = ? ORDER BY start_time");
    const rows = await this.client.query(query, [timesheetId]);
    return mapFromSQLArray<TimesheetActivity>(rows);
  }

  async createTimesheetActivity(data: Omit<TimesheetActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimesheetActivity> {
    const now = nowIso();
    const activityData = { ...data, createdAt: now, updatedAt: now };
    const mappedData = mapToSQL(activityData);

    const fields = Object.keys(mappedData).join(', ');
    const placeholders = Object.keys(mappedData).map(() => '?').join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`INSERT INTO timesheet_activities (${fields}) VALUES (${placeholders})`);
    const result = await this.client.query(query, values);
    
    return this.getTimesheetActivity(result.lastInsertRowid as number);
  }

  async getTimesheetActivity(id: number): Promise<TimesheetActivity> {
    const query = convertSQLQuery("SELECT * FROM timesheet_activities WHERE id = ?");
    const rows = await this.client.query(query, [id]);
    const activity = mapFromSQL<TimesheetActivity>(rows[0]);
    if (!activity) throw new Error(`TimesheetActivity ${id} not found`);
    return activity;
  }

  async updateTimesheetActivity(id: number, patch: Partial<TimesheetActivity>): Promise<TimesheetActivity> {
    const next = { ...patch, updatedAt: nowIso() };
    const mappedData = mapToSQL(next);
    
    const fields = Object.keys(mappedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(mappedData);

    const query = convertSQLQuery(`UPDATE timesheet_activities SET ${fields} WHERE id = ?`);
    await this.client.query(query, [...values, id]);
    
    return this.getTimesheetActivity(id);
  }

  async deleteTimesheetActivity(id: number): Promise<void> {
    const query = convertSQLQuery("DELETE FROM timesheet_activities WHERE id = ?");
    await this.client.query(query, [id]);
  }
}