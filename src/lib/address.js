export function formatUserAddress(user) {
  if (!user) return "";

  const structuredParts = [
    user.addressHouseNo,
    user.addressStreetNo ? `Street ${user.addressStreetNo}` : null,
    user.addressArea,
    user.addressCity,
    user.addressPostalCode,
    user.addressCountry,
  ].filter((part) => part && String(part).trim());

  if (structuredParts.length) {
    return structuredParts.join(", ");
  }

  return String(user.address || "").trim();
}

export function getUserCity(user) {
  if (user?.addressCity && String(user.addressCity).trim()) {
    return String(user.addressCity).trim();
  }

  const text = String(user?.address || "").trim();
  if (!text) return "";

  const segments = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (!segments.length) return "";

  if (segments.length >= 2) {
    const cityPostal = segments[segments.length - 2];
    const cityPart = cityPostal.split("-")[0]?.trim();
    if (cityPart) return cityPart;
  }

  return segments[segments.length - 1];
}
