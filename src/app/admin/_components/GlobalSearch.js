"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "../_context/AdminDataContext";
import { buildLiveUsers, mapProductsToListingRows } from "../_lib/deriveStats";

const STATUS_COLORS = {
  Active: "tag-ok",
  Verified: "tag-ok",
  Approved: "tag-ok",
  Reported: "tag-warn",
  Pending: "tag-warn",
  Suspended: "tag-danger",
  Illegal: "tag-danger",
  pending: "tag-warn",
  approved: "tag-ok",
  rejected: "tag-danger",
};

function highlight(text, q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(re);
  return parts.map((part, index) =>
    re.test(part) ? (
      <mark key={index} style={{ background: "#ffd166", borderRadius: 2, padding: "0 1px" }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function GlobalSearch() {
  const router = useRouter();
  const { users, products, reports } = useAdminData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

  const searchUsers = useMemo(
    () => buildLiveUsers(users, reports).slice(0, 20),
    [users, reports]
  );
  const searchListings = useMemo(() => mapProductsToListingRows(products).slice(0, 20), [products]);

  const q = query.trim().toLowerCase();
  const matchedUsers = q
    ? searchUsers
        .filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];
  const matchedListings = q
    ? searchListings
        .filter(
          (l) => l.title.toLowerCase().includes(q) || l.seller.toLowerCase().includes(q) || l.id.includes(q)
        )
        .slice(0, 4)
    : [];

  function goTo(href) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 180);
  }

  return (
    <div className="search-top" id="searchWrap">
      <span className="s-icon">🔍</span>
      <input
        id="globalSearch"
        placeholder="Search users, listings…"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(Boolean(e.target.value.trim()));
        }}
        onFocus={() => setOpen(Boolean(query.trim()))}
        onBlur={handleBlur}
      />
      {open && q ? (
        <div className="search-dropdown show" id="searchDropdown">
          {!matchedUsers.length && !matchedListings.length ? (
            <div className="sd-empty">
              No results for &quot;<b>{q}</b>&quot;
            </div>
          ) : (
            <>
              {matchedUsers.length ? (
                <div className="sd-section">
                  <div className="sd-label">Users &amp; Sellers</div>
                  {matchedUsers.map((u) => (
                    <div key={u.id} className="sd-item" onMouseDown={() => goTo("/admin/users")}>
                      <div className="sd-av" style={{ background: u.color }}>
                        {u.name[0]}
                      </div>
                      <div className="sd-text">
                        <div className="sd-name">{highlight(u.name, q)}</div>
                        <div className="sd-sub">
                          {u.email} · {u.city}
                        </div>
                      </div>
                      <span className={`sd-tag ${STATUS_COLORS[u.status] || "tag-muted"}`}>{u.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {matchedUsers.length && matchedListings.length ? <div className="sd-divider" /> : null}
              {matchedListings.length ? (
                <div className="sd-section">
                  <div className="sd-label">Listings</div>
                  {matchedListings.map((l) => (
                    <div key={l.id} className="sd-item" onMouseDown={() => goTo("/admin/listings")}>
                      <div className="sd-emoji">{l.emoji}</div>
                      <div className="sd-text">
                        <div className="sd-name">{highlight(l.title, q)}</div>
                        <div className="sd-sub">
                          #{l.id} · {l.seller} · {l.price}
                        </div>
                      </div>
                      <span className={`sd-tag ${STATUS_COLORS[l.status] || "tag-muted"}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
