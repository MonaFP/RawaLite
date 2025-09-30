import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DbClient from '../src/services/DbClient';

// Mock window.rawalite API for testing
const mockRawalite = {
  db: {
    query: vi.fn(),
    exec: vi.fn(),
    transaction: vi.fn()
  }
};

// Setup global mock
Object.defineProperty(global, 'window', {
  value: { rawalite: mockRawalite },
  writable: true
});

describe('DbClient', () => {
  let client: DbClient;

  beforeEach(() => {
    client = DbClient.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const client1 = DbClient.getInstance();
      const client2 = DbClient.getInstance();
      expect(client1).toBe(client2);
    });
  });

  describe('Query Operations', () => {
    it('should execute query with parameters', async () => {
      const mockResult = [{ id: 1, name: 'Test Customer' }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const result = await client.query('SELECT * FROM customers WHERE id = ?', [1]);

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle query without parameters', async () => {
      const mockResult = [{ count: 5 }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const result = await client.query('SELECT COUNT(*) as count FROM customers');

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM customers',
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      mockRawalite.db.query.mockRejectedValue(error);

      await expect(client.query('INVALID SQL')).rejects.toThrow('Database error');
    });
  });

  describe('Exec Operations', () => {
    it('should execute SQL with parameters', async () => {
      const mockResult = { changes: 1, lastInsertRowid: 123 };
      mockRawalite.db.exec.mockResolvedValue(mockResult);

      const result = await client.exec(
        'INSERT INTO customers (name, email) VALUES (?, ?)',
        ['John Doe', 'john@example.com']
      );

      expect(mockRawalite.db.exec).toHaveBeenCalledWith(
        'INSERT INTO customers (name, email) VALUES (?, ?)',
        ['John Doe', 'john@example.com']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle exec errors', async () => {
      const error = new Error('Constraint violation');
      mockRawalite.db.exec.mockRejectedValue(error);

      await expect(client.exec('INSERT INTO invalid_table')).rejects.toThrow('Constraint violation');
    });
  });

  describe('Transaction Operations', () => {
    it('should execute multiple queries in transaction', async () => {
      const mockResults = [
        { changes: 1, lastInsertRowid: 1 },
        { changes: 1, lastInsertRowid: 2 }
      ];
      mockRawalite.db.transaction.mockResolvedValue(mockResults);

      const queries = [
        { sql: 'INSERT INTO customers (name) VALUES (?)', params: ['Customer 1'] },
        { sql: 'INSERT INTO customers (name) VALUES (?)', params: ['Customer 2'] }
      ];

      const results = await client.transaction(queries);

      expect(mockRawalite.db.transaction).toHaveBeenCalledWith(queries);
      expect(results).toEqual(mockResults);
    });

    it('should handle transaction errors', async () => {
      const error = new Error('Transaction failed');
      mockRawalite.db.transaction.mockRejectedValue(error);

      const queries = [{ sql: 'INVALID SQL', params: [] }];

      await expect(client.transaction(queries)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Convenience Methods', () => {
    it('should insert record and return ID', async () => {
      const mockResult = { changes: 1, lastInsertRowid: 456 };
      mockRawalite.db.exec.mockResolvedValue(mockResult);

      const id = await client.insert('customers', { name: 'Test', email: 'test@example.com' });

      expect(mockRawalite.db.exec).toHaveBeenCalledWith(
        'INSERT INTO customers (name, email) VALUES (?, ?)',
        ['Test', 'test@example.com']
      );
      expect(id).toBe(456);
    });

    it('should update record by ID', async () => {
      const mockResult = { changes: 1, lastInsertRowid: 0 };
      mockRawalite.db.exec.mockResolvedValue(mockResult);

      const changes = await client.updateById('customers', 123, { name: 'Updated Name' });

      expect(mockRawalite.db.exec).toHaveBeenCalledWith(
        'UPDATE customers SET name = ? WHERE id = ?',
        ['Updated Name', 123]
      );
      expect(changes).toBe(1);
    });

    it('should delete record by ID', async () => {
      const mockResult = { changes: 1, lastInsertRowid: 0 };
      mockRawalite.db.exec.mockResolvedValue(mockResult);

      const changes = await client.deleteById('customers', 123);

      expect(mockRawalite.db.exec).toHaveBeenCalledWith(
        'DELETE FROM customers WHERE id = ?',
        [123]
      );
      expect(changes).toBe(1);
    });

    it('should get record by ID', async () => {
      const mockResult = [{ id: 123, name: 'Test Customer' }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const record = await client.getById('customers', 123);

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = ? LIMIT 1',
        [123]
      );
      expect(record).toEqual(mockResult[0]);
    });

    it('should return null when record not found', async () => {
      mockRawalite.db.query.mockResolvedValue([]);

      const record = await client.getById('customers', 999);

      expect(record).toBeNull();
    });

    it('should get all records from table', async () => {
      const mockResult = [
        { id: 1, name: 'Customer 1' },
        { id: 2, name: 'Customer 2' }
      ];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const records = await client.getAll('customers', 'name ASC');

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT * FROM customers ORDER BY name ASC'
      );
      expect(records).toEqual(mockResult);
    });

    it('should count records in table', async () => {
      const mockResult = [{ count: 42 }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const count = await client.count('customers');

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM customers',
        undefined
      );
      expect(count).toBe(42);
    });

    it('should count records with WHERE clause', async () => {
      const mockResult = [{ count: 5 }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const count = await client.count('customers', 'name LIKE ?', ['%Test%']);

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM customers WHERE name LIKE ?',
        ['%Test%']
      );
      expect(count).toBe(5);
    });

    it('should check if record exists', async () => {
      const mockResult = [{ count: 1 }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const exists = await client.exists('customers', 'email = ?', ['test@example.com']);

      expect(mockRawalite.db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM customers WHERE email = ?',
        ['test@example.com']
      );
      expect(exists).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      const mockResult = [{ count: 0 }];
      mockRawalite.db.query.mockResolvedValue(mockResult);

      const exists = await client.exists('customers', 'email = ?', ['nonexistent@example.com']);

      expect(exists).toBe(false);
    });
  });
});