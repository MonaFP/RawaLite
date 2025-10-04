/**
 * Discount Calculation Service
 * 
 * Handles discount calculations for offers and invoices with support for:
 * - Percentage and fixed amount discounts
 * - Kleinunternehmer (§19 UStG) mode
 * - 2 decimal precision for all amounts
 * - Proper VAT calculation after discount
 */

export interface CalculationResult {
  subtotalBeforeDiscount: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  totalAmount: number;
  isKleinunternehmer: boolean;
}

export interface LineItem {
  quantity: number;
  unitPrice: number;
}

/**
 * Calculate document totals with discount support
 * 
 * @param lineItems - Array of line items with quantity and unitPrice
 * @param discountType - Type of discount: 'none', 'percentage', or 'fixed'
 * @param discountValue - Discount value (percentage 0-100 or fixed amount)
 * @param vatRate - VAT rate percentage (default: 19)
 * @param isKleinunternehmer - Whether business is exempt from VAT (default: false)
 * @returns Calculation result with all amounts
 */
export function calculateDocumentTotals(
  lineItems: LineItem[],
  discountType: 'none' | 'percentage' | 'fixed' = 'none',
  discountValue: number = 0,
  vatRate: number = 19,
  isKleinunternehmer: boolean = false
): CalculationResult {
  
  // 1. Calculate subtotal from all line items
  const subtotalBeforeDiscount = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  // 2. Calculate discount amount
  let discountAmount = 0;
  
  if (discountType === 'percentage' && discountValue > 0) {
    // Percentage discount: ensure value is between 0-100
    const safePercentage = Math.max(0, Math.min(100, discountValue));
    discountAmount = (subtotalBeforeDiscount * safePercentage) / 100;
  } else if (discountType === 'fixed' && discountValue > 0) {
    // Fixed amount discount: cannot exceed subtotal
    discountAmount = Math.min(discountValue, subtotalBeforeDiscount);
  }

  // 3. Round discount to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  // 4. Calculate subtotal after discount
  const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;

  // 5. Calculate VAT based on Kleinunternehmer status
  // Kleinunternehmer are exempt from VAT according to §19 UStG
  const vatAmount = isKleinunternehmer ? 0 : 
    Math.round((subtotalAfterDiscount * vatRate / 100) * 100) / 100;

  // 6. Calculate final total
  const totalAmount = subtotalAfterDiscount + vatAmount;

  return {
    subtotalBeforeDiscount: Math.round(subtotalBeforeDiscount * 100) / 100,
    discountAmount,
    subtotalAfterDiscount: Math.round(subtotalAfterDiscount * 100) / 100,
    vatAmount,
    totalAmount: Math.round(totalAmount * 100) / 100,
    isKleinunternehmer
  };
}

/**
 * Validate discount input
 * 
 * @param discountType - Type of discount
 * @param discountValue - Discount value to validate
 * @param subtotal - Subtotal to validate against (for fixed discounts)
 * @returns Validation result with error message if invalid
 */
export function validateDiscount(
  discountType: 'none' | 'percentage' | 'fixed',
  discountValue: number,
  subtotal: number
): { isValid: boolean; error?: string } {
  
  if (discountType === 'none') {
    return { isValid: true };
  }

  if (discountValue < 0) {
    return { 
      isValid: false, 
      error: 'Rabatt darf nicht negativ sein' 
    };
  }

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      return { 
        isValid: false, 
        error: 'Prozentrabatt darf nicht über 100% liegen' 
      };
    }
  }

  if (discountType === 'fixed') {
    if (discountValue > subtotal) {
      return { 
        isValid: false, 
        error: 'Fester Rabatt darf nicht höher als die Zwischensumme sein' 
      };
    }
  }

  return { isValid: true };
}

/**
 * Format currency amount for display
 * 
 * @param amount - Amount to format
 * @param showCurrency - Whether to show currency symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, showCurrency: boolean = true): string {
  const formatted = (amount || 0).toFixed(2);
  return showCurrency ? `€${formatted}` : formatted;
}

/**
 * Calculate discount percentage from amounts
 * Useful for displaying discount percentage when amount is known
 * 
 * @param subtotalBefore - Subtotal before discount
 * @param discountAmount - Discount amount
 * @returns Discount percentage (0-100)
 */
export function calculateDiscountPercentage(
  subtotalBefore: number, 
  discountAmount: number
): number {
  if (subtotalBefore === 0) return 0;
  return Math.round((discountAmount / subtotalBefore * 100) * 100) / 100;
}