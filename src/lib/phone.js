// Normalizes a phone number to a simple E.164-ish shape (+ followed by 8-15
// digits). Returns null if the input doesn't look like a valid phone number.
export function normalizePhone(input) {
  const trimmed = String(input || "").trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  const hasPlus = digits.startsWith("+");
  const numeric = digits.replace(/\+/g, "");

  if (!hasPlus || numeric.length < 8 || numeric.length > 15) {
    return null;
  }

  return `+${numeric}`;
}
