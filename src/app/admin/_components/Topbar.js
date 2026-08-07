"use client";

import { usePathname } from "next/navigation";
import { PAGE_TITLES } from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "./NotificationBell";

export default function Topbar({ onSignOut }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Admin";

  return (
    <div className="topbar">
      <div className="page-title">{title}</div>
      <div className="topbar-right">
        <GlobalSearch />
        <NotificationBell />
        <ProfileMenu onSignOut={onSignOut} />
      </div>
    </div>
  );
}
