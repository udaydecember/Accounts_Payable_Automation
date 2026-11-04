/**
 * Indian Rupee (INR) Currency Formatting Utilities for Shout AP Automation.
 * Formats numbers into the standard Indian numbering system (Lakhs and Crores, e.g. ₹1,25,000.00).
 */

export const formatINR = (
  amount: number | string | undefined | null,
  options?: {
    includeSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const {
    includeSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {};

  if (amount === undefined || amount === null || amount === '') {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : Number(amount);

  if (isNaN(num)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits
  });

  return includeSymbol ? `₹${formatted}` : formatted;
};

/**
 * Always returns Indian Rupee symbol '₹' for display.
 */
export const getCurrencySymbol = (_currency?: string): string => {
  return '₹';
};
