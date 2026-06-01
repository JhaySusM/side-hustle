"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input, Button, Badge } from "reactstrap";

function Avatar({ name, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, color: "#fff", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const bubbleRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeThreadIdRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id ?? null;
  }, [activeThread]);

  // Hide on /messages page
  const hidden = pathname === "/messages";

  const loadData = useCallback((u) => {
    const allMsgs = JSON.parse(localStorage.getItem("batjee_messages") || "[]");
    const mine = allMsgs.filter(
      (m) => m.sellerEmail === u.email || m.buyerEmail === u.email
    );
    setMessages(mine);

    // Calc unread
    const readIds = JSON.parse(localStorage.getItem("batjee_read_messages") || "[]");
    let count = allMsgs.filter(
      (m) => m.sellerEmail === u.email && !readIds.includes(m.id)
    ).length;
    allMsgs.forEach((m) => {
      if (m.sellerEmail !== u.email && m.buyerEmail !== u.email) return;
      (m.replies || []).forEach((r) => {
        if (r.senderEmail !== u.email && !r.readBy.includes(u.email)) count++;
      });
    });
    setUnreadCount(count);

    // Refresh active thread using ref (avoids circular dependency)
    const activeId = activeThreadIdRef.current;
    if (activeId) {
      const refreshed = mine.find((m) => m.id === activeId);
      if (refreshed) setActiveThread(refreshed);
    }
  }, []); // no dependency on activeThread state

  useEffect(() => {
    const stored = localStorage.getItem("batjee_user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    loadData(u);
    const interval = setInterval(() => loadData(u), 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Scroll to bottom when thread opens or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  // Mark thread as read when opened
  function openThread(msg) {
    setActiveThread(msg);
    if (!user) return;

    const allMsgs = JSON.parse(localStorage.getItem("batjee_messages") || "[]");

    // Mark initial message as read
    const readIds = JSON.parse(localStorage.getItem("batjee_read_messages") || "[]");
    if (!readIds.includes(msg.id)) {
      localStorage.setItem("batjee_read_messages", JSON.stringify([...readIds, msg.id]));
    }

    // Mark replies as read
    let changed = false;
    const updated = allMsgs.map((m) => {
      if (m.id !== msg.id || !m.replies) return m;
      const updatedReplies = m.replies.map((r) => {
        if (!r.readBy.includes(user.email)) {
          changed = true;
          return { ...r, readBy: [...r.readBy, user.email] };
        }
        return r;
      });
      return { ...m, replies: updatedReplies };
    });
    if (changed) localStorage.setItem("batjee_messages", JSON.stringify(updated));
    loadData(user);
  }

  function handleSend() {
    if (!replyText.trim() || !activeThread || !user) return;
    const allMsgs = JSON.parse(localStorage.getItem("batjee_messages") || "[]");
    const reply = {
      id: Date.now(),
      senderEmail: user.email,
      senderName: user.name,
      message: replyText.trim(),
      date: new Date().toLocaleString(),
      readBy: [user.email],
    };
    const updated = allMsgs.map((m) =>
      m.id === activeThread.id ? { ...m, replies: [...(m.replies || []), reply] } : m
    );
    localStorage.setItem("batjee_messages", JSON.stringify(updated));
    setReplyText("");
    loadData(user);
    // Scroll after send
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  if (!user || hidden) return null;

  const allBubbles = activeThread
    ? [
        { id: activeThread.id + "_orig", senderEmail: activeThread.buyerEmail, senderName: activeThread.buyerName, message: activeThread.message, date: activeThread.date },
        ...(activeThread.replies || []),
      ]
    : [];

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: 80, right: 24, zIndex: 9999,
            width: 340, maxHeight: 520,
            background: "#fff", borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div style={{
            background: "#0a9e8f", color: "#fff",
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {activeThread ? (
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={() => setActiveThread(null)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}
                >
                  ←
                </button>
                {/* Clickable seller profile */}
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const profileEmail = activeThread.sellerEmail === user.email
                      ? activeThread.buyerEmail
                      : activeThread.sellerEmail;
                    router.push(`/seller/${encodeURIComponent(profileEmail)}`);
                    setOpen(false);
                  }}
                >
                  <Avatar
                    name={activeThread.sellerEmail === user.email ? activeThread.buyerName : activeThread.sellerName}
                    color="rgba(255,255,255,0.3)"
                    size={30}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 2 }}>
                      {activeThread.sellerEmail === user.email ? activeThread.buyerName : activeThread.sellerName}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>{activeThread.listingTitle}</div>
                  </div>
                </div>
              </div>
            ) : (
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                💬 Messages {unreadCount > 0 && <span style={{ fontSize: 12, background: "#e53935", borderRadius: 10, padding: "1px 7px", marginLeft: 6 }}>{unreadCount}</span>}
              </span>
            )}
            <button
              onClick={() => { setOpen(false); setActiveThread(null); }}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Conversation list */}
          {!activeThread && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted py-5" style={{ fontSize: 14 }}>
                  <div style={{ fontSize: 36 }}>💬</div>
                  No conversations yet
                </div>
              ) : (
                messages.map((msg) => {
                  const isSeller = msg.sellerEmail === user.email;
                  const otherName = isSeller ? msg.buyerName : msg.sellerName;
                  const lastReply = (msg.replies || []).slice(-1)[0];
                  const preview = lastReply ? lastReply.message : msg.message;

                  // Check if unread
                  const readIds = JSON.parse(localStorage.getItem("batjee_read_messages") || "[]");
                  const hasUnread =
                    (isSeller && !readIds.includes(msg.id)) ||
                    (msg.replies || []).some((r) => r.senderEmail !== user.email && !r.readBy.includes(user.email));

                  return (
                    <div
                      key={msg.id}
                      onClick={() => openThread(msg)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        background: hasUnread ? "#f0fdf9" : "#fff",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = hasUnread ? "#f0fdf9" : "#fff"}
                    >
                      <Avatar name={otherName} color={isSeller ? "#0d6efd" : "#0a9e8f"} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 14 }}>{otherName}</div>
                        <div style={{
                          fontSize: 12, color: hasUnread ? "#333" : "#888",
                          fontWeight: hasUnread ? 600 : 400,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {preview}
                        </div>
                      </div>
                      {hasUnread && (
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: "#0a9e8f", flexShrink: 0,
                        }} />
                      )}
                    </div>
                  );
                })
              )}
              <div
                className="text-center py-2"
                style={{ fontSize: 12, color: "#0a9e8f", cursor: "pointer", borderTop: "1px solid #f0f0f0" }}
                onClick={() => { router.push("/messages"); setOpen(false); }}
              >
                See all messages →
              </div>
            </div>
          )}

          {/* Active thread */}
          {activeThread && (
            <>
              {/* Bubbles */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", background: "#f8fafc" }}>
                {allBubbles.map((b) => {
                  const isMe = b.senderEmail === user.email;
                  return (
                    <div
                      key={b.id}
                      style={{
                        display: "flex", flexDirection: isMe ? "row-reverse" : "row",
                        alignItems: "flex-end", gap: 6, marginBottom: 8,
                      }}
                    >
                      <Avatar name={b.senderName} color={isMe ? "#0d6efd" : "#6c757d"} size={28} />
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{
                          background: isMe ? "#0a9e8f" : "#e9ecef",
                          color: isMe ? "#fff" : "#212529",
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          padding: "8px 12px", fontSize: 13, lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}>
                          {b.message}
                        </div>
                        <div style={{ fontSize: 10, color: "#aaa", marginTop: 2, textAlign: isMe ? "right" : "left" }}>
                          {b.date}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                display: "flex", gap: 8, padding: "10px 12px",
                background: "#fff", borderTop: "1px solid #f0f0f0",
                alignItems: "center",
              }}>
                <Input
                  type="text"
                  placeholder="Write a message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  style={{ fontSize: 13, borderRadius: 20, background: "#f1f5f9", border: "none" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim()}
                  style={{
                    background: replyText.trim() ? "#0a9e8f" : "#ccc",
                    border: "none", borderRadius: "50%",
                    width: 36, height: 36, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: replyText.trim() ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.109z"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating bubble button */}
      <button
        ref={bubbleRef}
        onClick={() => { setOpen((v) => !v); if (!open) setActiveThread(null); }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: "#0a9e8f", border: "none",
          boxShadow: "0 4px 20px rgba(10,158,143,0.45)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
            <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7z"/>
          </svg>
        )}
        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            background: "#e53935", color: "#fff",
            borderRadius: "50%", width: 20, height: 20,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
