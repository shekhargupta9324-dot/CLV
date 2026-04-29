export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}
