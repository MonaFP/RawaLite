import { describe, it, expect } from 'vitest';
import { parseDecimal, isValidDecimalInput } from '../../src/components/common/MoneyInput';

describe('parseDecimal', () => {
  it('should parse valid decimal numbers with dot', () => {
    expect(parseDecimal('12.5')).toBe(12.5);
    expect(parseDecimal('0.99')).toBe(0.99);
    expect(parseDecimal('100.00')).toBe(100);
    expect(parseDecimal('123.456')).toBe(123.456);
  });

  it('should parse valid decimal numbers with comma', () => {
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('0,99')).toBe(0.99);
    expect(parseDecimal('100,00')).toBe(100);
    expect(parseDecimal('123,456')).toBe(123.456);
  });

  it('should parse integers', () => {
    expect(parseDecimal('123')).toBe(123);
    expect(parseDecimal('0')).toBe(0);
    expect(parseDecimal('999')).toBe(999);
  });

  it('should handle empty strings and whitespace', () => {
    expect(parseDecimal('')).toBe(null);
    expect(parseDecimal('   ')).toBe(null);
    expect(parseDecimal('\t')).toBe(null);
  });

  it('should handle invalid inputs', () => {
    expect(parseDecimal('abc')).toBe(null);
    expect(parseDecimal('12.34.56')).toBe(null);
    expect(parseDecimal('12,34,56')).toBe(null);
    expect(parseDecimal('12..34')).toBe(null);
    expect(parseDecimal('12,,34')).toBe(null);
    expect(parseDecimal('.')).toBe(null);
    expect(parseDecimal(',')).toBe(null);
    expect(parseDecimal('..')).toBe(null);
  });
});

describe('isValidDecimalInput', () => {
  it('should accept valid decimal patterns during typing', () => {
    expect(isValidDecimalInput('')).toBe(true);
    expect(isValidDecimalInput('1')).toBe(true);
    expect(isValidDecimalInput('12')).toBe(true);
    expect(isValidDecimalInput('12.')).toBe(true);
    expect(isValidDecimalInput('12.3')).toBe(true);
    expect(isValidDecimalInput('12.34')).toBe(true);
    expect(isValidDecimalInput('12,')).toBe(true);
    expect(isValidDecimalInput('12,3')).toBe(true);
    expect(isValidDecimalInput('12,34')).toBe(true);
    expect(isValidDecimalInput('0')).toBe(true);
    expect(isValidDecimalInput('0.5')).toBe(true);
    expect(isValidDecimalInput('0,5')).toBe(true);
  });

  it('should reject invalid patterns during typing', () => {
    expect(isValidDecimalInput('abc')).toBe(false);
    expect(isValidDecimalInput('12.34.56')).toBe(false);
    expect(isValidDecimalInput('12,34,56')).toBe(false);
    expect(isValidDecimalInput('12..34')).toBe(false);
    expect(isValidDecimalInput('12,,34')).toBe(false);
    expect(isValidDecimalInput('12.3,4')).toBe(false);
    expect(isValidDecimalInput('12,3.4')).toBe(false);
    expect(isValidDecimalInput('a12.34')).toBe(false);
    expect(isValidDecimalInput('12.34b')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidDecimalInput('.')).toBe(false); // Nur Punkt ist ungültig
    expect(isValidDecimalInput(',')).toBe(false); // Nur Komma ist ungültig
    expect(isValidDecimalInput('   ')).toBe(true); // Whitespace ist erlaubt (wird als leer behandelt)
  });
});