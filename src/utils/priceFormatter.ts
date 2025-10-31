export function formatPrice(price: number): string {
  // Remove trailing zeros after decimal point
  if (price % 1 === 0) {
    return price.toString();
  }
  return price.toFixed(2).replace(/\.?0+$/, '');
}
