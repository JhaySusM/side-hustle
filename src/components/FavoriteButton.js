"use client";

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 20.25c-.21 0-.42-.07-.58-.2-4.32-3.49-7.12-5.96-8.56-7.56C1.62 11.11 1 9.7 1 8.25 1 5.35 3.35 3 6.25 3c1.69 0 3.31.79 4.35 2.13A5.57 5.57 0 0 1 14.95 3c2.9 0 5.25 2.35 5.25 5.25 0 1.45-.62 2.86-1.86 4.24-1.44 1.6-4.24 4.07-8.56 7.56-.16.13-.37.2-.58.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FavoriteButton({
  isFavorited,
  disabled,
  onClick,
  activeLabel = "Saved",
  inactiveLabel = "Save",
  iconOnly = false,
  className = "",
  style,
  title,
}) {
  const resolvedTitle = title || (isFavorited ? "Remove from favorites" : "Save to favorites");

  return (
    <button
      type="button"
      aria-pressed={isFavorited}
      aria-label={resolvedTitle}
      title={resolvedTitle}
      disabled={disabled}
      className={className}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconOnly ? 0 : 8,
        borderRadius: 999,
        border: `1px solid ${isFavorited ? "#dc3545" : "#cbd5e1"}`,
        background: isFavorited ? "#fff5f5" : "#ffffff",
        color: isFavorited ? "#dc3545" : "#334155",
        fontWeight: 600,
        width: iconOnly ? 34 : undefined,
        height: iconOnly ? 34 : undefined,
        minWidth: iconOnly ? 34 : undefined,
        padding: iconOnly ? 0 : "0.65rem 0.95rem",
        lineHeight: 1,
        transition: "all 0.15s ease",
        boxShadow: iconOnly ? "0 4px 14px rgba(15, 23, 42, 0.08)" : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      <HeartIcon filled={isFavorited} />
      {iconOnly ? null : <span>{isFavorited ? activeLabel : inactiveLabel}</span>}
    </button>
  );
}