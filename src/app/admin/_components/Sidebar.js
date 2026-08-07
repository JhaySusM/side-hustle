"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    section: "Overview",
    items: [{ href: "/admin", icon: "📊", label: "Dashboard" }],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/listings", icon: "📋", label: "Listing Approval" },
      { href: "/admin/messages", icon: "💬", label: "Messages" },
      { href: "/admin/reports", icon: "🚨", label: "Reports & Complaints" },
      { href: "/admin/notifications", icon: "🔔", label: "Push Notifications" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/admin/users", icon: "👥", label: "User Management" },
      { href: "/admin/sellers", icon: "🏪", label: "Seller Management" },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/admin/analytics", icon: "📈", label: "Analytics" },
      { href: "/admin/referrals", icon: "🎁", label: "Referral Tracking" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="brand-row">
          <div className="name">TradiGO</div>
        </div>
        <div className="sub">Admin Backoffice</div>
      </div>
      <nav className="sb-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href ? " active" : ""}`}
              >
                <span className="ic">{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-footer">v1.0.0 · Admin Portal</div>
    </aside>
  );
}

export const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/users": "User Management",
  "/admin/sellers": "Seller Management",
  "/admin/listings": "Listing Approval",
  "/admin/messages": "Messages",
  "/admin/reports": "Reports & Complaints",
  "/admin/notifications": "Push Notifications",
  "/admin/referrals": "Referral Tracking",
};
