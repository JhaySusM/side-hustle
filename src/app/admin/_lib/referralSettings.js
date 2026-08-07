// TODO: Referral program settings are stored only in the browser's localStorage —
// there is no backend table/endpoint for them. This is a known gap carried over
// as-is from the old admin-backoffice.html (not shared across admins/devices).
// A real settings endpoint is out of scope for this HTML->React port.

const REFERRAL_SETTINGS_KEY = "tradigo_admin_referral_settings";

export const DEFAULT_REFERRAL_SETTINGS = {
  rewardAmount: 500,
  minListings: 1,
  fraudDetection: true,
  programActive: true,
};

export function getReferralSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_REFERRAL_SETTINGS };
  try {
    const raw = window.localStorage.getItem(REFERRAL_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_REFERRAL_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      rewardAmount: Math.max(0, Number(parsed.rewardAmount ?? DEFAULT_REFERRAL_SETTINGS.rewardAmount) || 0),
      minListings: Math.max(0, Number(parsed.minListings ?? DEFAULT_REFERRAL_SETTINGS.minListings) || 0),
      fraudDetection: parsed.fraudDetection !== false,
      programActive: parsed.programActive !== false,
    };
  } catch {
    return { ...DEFAULT_REFERRAL_SETTINGS };
  }
}

export function persistReferralSettings(settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFERRAL_SETTINGS_KEY, JSON.stringify(settings));
}
