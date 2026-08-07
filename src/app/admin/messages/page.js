"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import { toRelativeTime } from "../_lib/format";
import { markConversationRead } from "../_lib/conversations";

// Ported from messageStatusTag() in the old public/admin-backoffice.html.
function messageStatusTag(status) {
  if (status === "Sold") return "tag-ok";
  if (status === "Pending") return "tag-warn";
  if (status === "Inactive") return "tag-danger";
  return "tag-info";
}

export default function AdminMessagesPage() {
  const { conversations, patchConversations, loading } = useAdminData();
  const showToast = useToast();

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || conversations[0] || null,
    [conversations, selectedConversationId]
  );

  const conversationsCount = conversations.length;
  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [conversations]
  );
  const withTransactions = useMemo(
    () => conversations.filter((item) => item.transaction).length,
    [conversations]
  );

  function handleSelectConversation(conversationId) {
    setSelectedConversationId(conversationId);
    const conversation = conversations.find((item) => item.id === conversationId);
    if (conversation?.unreadCount > 0) {
      markConversationRead(conversationId, patchConversations);
    }
  }

  function handleMarkSelectedRead() {
    if (!selected) return;
    markConversationRead(selected.id, patchConversations);
  }

  async function handleMarkSolved() {
    if (!selected) return;
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, action: "solve_support" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to mark conversation as solved");
      }
      const updated = payload.conversation;
      patchConversations((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      setSelectedConversationId(updated.id);
    } catch (error) {
      showToast(error.message || "Failed to mark conversation as solved", "danger");
    }
  }

  async function handleSendReply() {
    if (!selected) return;
    const body = replyText.trim();
    if (!body) {
      showToast("Please write a reply before sending.", "warn");
      return;
    }

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, body }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send reply");
      }
      const updated = payload.conversation;
      patchConversations((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      setReplyText("");
      setSelectedConversationId(updated.id);
    } catch (error) {
      showToast(error.message || "Failed to send reply", "danger");
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading messages...</div>;
  }

  return (
    <div className="messages-shell">
      <div className="messages-summary-grid">
        <div className="stat">
          <div className="label">Conversations</div>
          <div className="val">{conversationsCount.toLocaleString()}</div>
          <div className="delta">Active inbox threads</div>
          <div className="ic-bg">💬</div>
        </div>
        <div className="stat">
          <div className="label">Unread</div>
          <div className="val">{unreadTotal.toLocaleString()}</div>
          <div className="delta">Waiting for admin reply</div>
          <div className="ic-bg">🔵</div>
        </div>
        <div className="stat">
          <div className="label">With Transactions</div>
          <div className="val">{withTransactions.toLocaleString()}</div>
          <div className="delta">Conversations tied to deals</div>
          <div className="ic-bg">💸</div>
        </div>
      </div>

      <div className="messages-layout">
        <div className="card messages-sidebar-card">
          <div className="messages-panel-head">
            <div>
              <h3>Inbox</h3>
              <p>Buyer conversations routed to the admin support desk.</p>
            </div>
          </div>
          <div className="messages-inbox">
            {!conversations.length ? (
              <div className="messages-empty">
                <strong>No conversations yet.</strong>
                No buyer messages have reached the admin support desk.
              </div>
            ) : (
              conversations.map((conversation) => {
                const preview = conversation.lastMessage?.body
                  || (conversation.lastMessage?.imageUrl ? "Sent an image" : "No messages yet");
                const itemClass = ["message-thread-list-item"];
                if (selected && conversation.id === selected.id) itemClass.push("active");
                if (conversation.unreadCount > 0) itemClass.push("unread");

                return (
                  <div
                    key={conversation.id}
                    className={itemClass.join(" ")}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="message-thread-list-top">
                      <div>
                        <div className="message-thread-name">{conversation.otherParty?.name || "Buyer"}</div>
                        <div className="message-thread-meta">{conversation.otherParty?.email || "No email"}</div>
                      </div>
                      <div className="message-thread-date">{toRelativeTime(conversation.updatedAt)}</div>
                    </div>
                    <div className="message-thread-meta">{conversation.listingTitle || "Unknown listing"}</div>
                    <div className="message-thread-preview">{preview}</div>
                    <div className="message-thread-badges">
                      <span className={`tag ${messageStatusTag(conversation.listingStatus)}`}>
                        {conversation.listingStatus || "Unknown"}
                      </span>
                      {conversation.unreadCount > 0 ? (
                        <span className="message-unread-pill">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card messages-thread-card">
          <div className="messages-thread-wrap">
            <div className="messages-thread-header">
              <div>
                <h3 className="messages-thread-title">
                  {selected ? selected.otherParty?.name || "Buyer" : "No active conversations"}
                </h3>
                <div className="messages-thread-sub">
                  {selected
                    ? `${selected.otherParty?.email || "No email"} • Listing #${selected.listingId} • Updated ${toRelativeTime(selected.updatedAt)}`
                    : "The admin inbox is currently empty."}
                </div>
                <div className="messages-thread-tags">
                  {selected ? (
                    <>
                      <span className={`tag ${messageStatusTag(selected.listingStatus)}`}>
                        {selected.listingStatus || "Unknown"}
                      </span>
                      <span className="tag tag-info">{selected.listingTitle || "Unknown listing"}</span>
                      {selected.isSupportResolved ? <span className="tag tag-ok">Solved</span> : null}
                      {selected.transaction ? (
                        <span className="tag tag-ok">Transaction {selected.transaction.status || "active"}</span>
                      ) : (
                        <span className="tag tag-muted">No transaction</span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-ok btn-sm"
                  onClick={handleMarkSolved}
                  disabled={!selected || Boolean(selected.isSupportResolved)}
                >
                  Mark as solved
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleMarkSelectedRead}
                  disabled={!selected || selected.unreadCount === 0}
                >
                  Mark as read
                </button>
              </div>
            </div>
            <div className="messages-thread-body">
              <div className="messages-thread-scroll">
                {!selected ? (
                  <div className="messages-empty">
                    <strong>No thread selected.</strong>
                    When a conversation is available, the full message history will appear here.
                  </div>
                ) : selected.messages?.length ? (
                  <div className="messages-bubble-col">
                    {selected.messages.map((message) => {
                      const self = message.senderEmail === "admin@gmail.com" || message.senderName === "Batjee Admin";
                      return (
                        <div className={`messages-bubble-row${self ? " self" : ""}`} key={message.id}>
                          <div className="messages-bubble">
                            <div className="messages-bubble-meta">
                              <span>{message.senderName || "User"}</span>
                              <span>{toRelativeTime(message.createdAt || message.date)}</span>
                            </div>
                            {message.body ? <div className="messages-bubble-body">{message.body}</div> : null}
                            {message.imageUrl ? (
                              <img className="messages-bubble-image" src={message.imageUrl} alt="Shared image" />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="messages-empty">
                    <strong>No messages in this thread.</strong>
                    The conversation exists but has no message history yet.
                  </div>
                )}
              </div>
              <div className="messages-composer">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Reply as Admin</label>
                  <textarea
                    rows={4}
                    placeholder="Type your reply to the buyer..."
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                  />
                </div>
                <div className="messages-composer-actions">
                  <div className="messages-composer-hint">
                    Replies are sent from the admin support account and appear in the live conversation.
                  </div>
                  <button type="button" className="btn btn-teal" onClick={handleSendReply}>
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
