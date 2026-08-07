"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "../_context/AdminDataContext";
import { toRelativeTime } from "../_lib/format";
import { markConversationRead } from "../_lib/conversations";

const READ_KEYS_STORAGE_KEY = "tradigo_admin_notifications_read_keys";

function readReadKeys() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEYS_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistReadKeys(keys) {
  window.localStorage.setItem(READ_KEYS_STORAGE_KEY, JSON.stringify([...keys]));
}

function timeOf(value) {
  const ts = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

export default function NotificationBell() {
  const router = useRouter();
  const { users, products, conversations, patchConversations } = useAdminData();
  const [open, setOpen] = useState(false);
  const [readKeys, setReadKeys] = useState(new Set());
  const wrapRef = useRef(null);

  useEffect(() => {
    setReadKeys(readReadKeys());
  }, []);

  useEffect(() => {
    function handleDocClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // New users/listings have no server-side "read" concept, so their read
  // state is tracked client-only via `readKeys` (persisted in localStorage).
  // Unread messages instead reflect each conversation's real `unreadCount`
  // (the same figure the Messages page shows) — clicking one actually marks
  // it read through the API, it isn't just hidden from this dropdown.
  const items = useMemo(() => {
    const newUsers = users.map((user) => ({
      key: `user-${user.id}`,
      type: "user",
      icon: "🆕",
      title: `New user: ${user.name || user.email || "User"}`,
      time: timeOf(user.createdAt),
      href: "/admin/users",
      read: readKeys.has(`user-${user.id}`),
    }));

    const newProducts = products.map((product) => ({
      key: `product-${product.id}`,
      type: "product",
      icon: "📦",
      title: `New listing: ${product.product_name || "Untitled listing"}`,
      time: timeOf(product.upload_date_time),
      href: "/admin/listings",
      read: readKeys.has(`product-${product.id}`),
    }));

    const conversationItems = conversations
      .filter((conversation) => Number(conversation.unreadCount || 0) > 0)
      .map((conversation) => ({
        key: `conversation-${conversation.id}`,
        type: "message",
        conversationId: conversation.id,
        icon: "💬",
        title: `${conversation.otherParty?.name || "Buyer"}: ${
          conversation.lastMessage?.body || (conversation.lastMessage?.imageUrl ? "Sent an image" : "New message")
        }`,
        time: timeOf(conversation.updatedAt),
        href: "/admin/messages",
        // Always unread by construction — filtered to unreadCount > 0 above.
        read: false,
      }));

    return [...newUsers, ...newProducts, ...conversationItems]
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  }, [users, products, conversations, readKeys]);

  const unseenCount = items.filter((item) => !item.read).length;

  function toggleOpen(event) {
    event.stopPropagation();
    setOpen((prev) => !prev);
  }

  function markKeyRead(key) {
    setReadKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev).add(key);
      persistReadKeys(next);
      return next;
    });
  }

  function markAllSeen() {
    items.forEach((item) => {
      if (item.read) return;
      if (item.type === "message") {
        markConversationRead(item.conversationId, patchConversations);
      } else {
        markKeyRead(item.key);
      }
    });
  }

  function handleItemClick(item) {
    if (!item.read) {
      if (item.type === "message") {
        markConversationRead(item.conversationId, patchConversations);
      } else {
        markKeyRead(item.key);
      }
    }
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div className="badge-dot notif-wrap" ref={wrapRef}>
      <button type="button" className="btn-icon" onClick={toggleOpen}>
        🔔
        {unseenCount > 0 ? <div className="notif-count">{unseenCount > 9 ? "9+" : unseenCount}</div> : null}
      </button>
      {open ? (
        <div className="search-dropdown notif-dropdown show">
          <div className="notif-header">
            <h4>Notifications</h4>
            <button type="button" onClick={markAllSeen}>
              Mark all as read
            </button>
          </div>
          <div className="notif-list">
            {!items.length ? (
              <div className="sd-empty">No recent activity.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.key}
                  className={`sd-item${!item.read ? " is-new" : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="sd-emoji">{item.icon}</div>
                  <div className="sd-text">
                    <div className="sd-name">{item.title}</div>
                    <div className="sd-sub">{toRelativeTime(item.time)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
