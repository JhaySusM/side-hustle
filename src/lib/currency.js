export function formatDisplayCurrency(value) {
  const amount = Number(value || 0);
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const hasFraction = Math.abs(normalizedAmount % 1) > Number.EPSILON;

  return `Rs. ${normalizedAmount.toLocaleString("en-PK", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
