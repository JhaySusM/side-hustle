"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Input } from "reactstrap";
import ChatImageModal from "@/components/ChatImageModal";
import ConversationTransactionCard from "@/components/ConversationTransactionCard";
import {
  createOrUpdateTransaction,
  fetchInbox,
  markConversationRead,
  openSupportConversation,
  sendMessage,
  subscribeToInbox,
  updateTransaction,
  uploadMessageImage,
} from "@/lib/message-client";

function Avatar({ name, color, size = 36 }) {
  const label = name || "U";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, color: "#fff", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4,
    }}>
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [launcherConversation, setLauncherConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [viewerImage, setViewerImage] = useState("");
  const [sending, setSending] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const bubbleRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeThreadIdRef = useRef(null);
  const launcherConversationIdRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 575.98px)");

    function syncViewport() {
      setIsMobile(mediaQuery.matches);
    }

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id ?? null;
  }, [activeThread]);

  useEffect(() => {
    launcherConversationIdRef.current = launcherConversation?.id ?? null;
  }, [launcherConversation]);

  const hidden = pathname === "/messages" || pathname.startsWith("/admin");

  const clearSelectedImage = useCallback(() => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(null);
    setSelectedImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [selectedImagePreview]);

  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  }, [selectedImagePreview]);

  const loadData = useCallback(async () => {
    const inbox = await fetchInbox();
    const mine = inbox.conversations || [];
    setMessages(mine);
    setUnreadCount(inbox.unreadCount || 0);

    const activeId = activeThreadIdRef.current;
    if (activeId) {
      const refreshed = mine.find((conversation) => conversation.id === activeId) || null;
      setActiveThread(refreshed);
    }

    const launcherId = launcherConversationIdRef.current;
    if (launcherId) {
      const refreshedLauncher = mine.find((conversation) => conversation.id === launcherId) || null;
      setLauncherConversation(refreshedLauncher);
    }

    return mine;
  }, []);

  useEffect(() => {
    function handleOpenChat(event) {
      const requestedConversationId = Number(event?.detail?.conversationId || 0);
      const requestedConversation = event?.detail?.conversation || null;

      setOpen(true);
      setTransactionError("");

      if (!requestedConversationId) {
        setActiveThread(null);
        return;
      }

      if (requestedConversation) {
        setActiveThread(requestedConversation);
        setLauncherConversation(requestedConversation);
      }

      loadData()
        .then(async (conversations) => {
          const nextConversation = conversations.find((conversation) => conversation.id === requestedConversationId) || null;

          if (!nextConversation) {
            setActiveThread(null);
            return;
          }

          setActiveThread(nextConversation);
          setLauncherConversation(nextConversation);

          if (!nextConversation.unreadCount) {
            return;
          }

          await markConversationRead(nextConversation.id);
          await loadData();
        })
        .catch(() => {
          setActiveThread(null);
        });
    }

    function handleLogout() {
      setUser(null);
      setMessages([]);
      setUnreadCount(0);
      setOpen(false);
      setActiveThread(null);
      setLauncherConversation(null);
      setReplyText("");
      setViewerImage("");
      setSending(false);
      setTransactionError("");
      clearSelectedImage();
    }

    function handleLogin(event) {
      const nextUser = event?.detail?.user || null;
      setUser(nextUser);
      setTransactionError("");
      loadData().catch(() => {
        setMessages([]);
        setUnreadCount(0);
      });
    }

    window.addEventListener("batjee:open-chat", handleOpenChat);
    window.addEventListener("batjee:logout", handleLogout);
    window.addEventListener("batjee:login", handleLogin);

    return () => {
      window.removeEventListener("batjee:open-chat", handleOpenChat);
      window.removeEventListener("batjee:logout", handleLogout);
      window.removeEventListener("batjee:login", handleLogin);
    };
  }, [clearSelectedImage, loadData]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.user) {
          if (!cancelled) {
            setUser(null);
            setMessages([]);
            setUnreadCount(0);
            setOpen(false);
            setActiveThread(null);
            setLauncherConversation(null);
            setReplyText("");
            setViewerImage("");
            setSending(false);
            setTransactionError("");
            clearSelectedImage();
          }
          return;
        }
        if (cancelled) return;
        setUser(data.user);
        await loadData();
      } catch {
        if (!cancelled) {
          setUser(null);
          setMessages([]);
          setUnreadCount(0);
          setOpen(false);
          setActiveThread(null);
          setLauncherConversation(null);
          setReplyText("");
          setViewerImage("");
          setSending(false);
          setTransactionError("");
          clearSelectedImage();
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [clearSelectedImage, loadData]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeToInbox(() => {
      loadData().catch(() => {
        // Ignore transient stream refresh failures.
      });
    });
  }, [user, loadData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  async function openThread(msg) {
    setTransactionError("");
    setActiveThread(msg);
    setLauncherConversation(msg);
    if (!user) return;

    if (!msg.unreadCount) {
      return;
    }

    try {
      await markConversationRead(msg.id);
      await loadData();
    } catch {
      // ignore
    }
  }

  async function handleSend() {
    if ((!replyText.trim() && !selectedImage) || !activeThread || !user) return;

    try {
      setSending(true);
      const imageUrl = selectedImage ? await uploadMessageImage(selectedImage) : null;
      await sendMessage({ conversationId: activeThread.id, body: replyText.trim(), imageUrl });
      setReplyText("");
      clearSelectedImage();
      await loadData();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  async function handleContactAdmin() {
    if (!user) {
      return;
    }

    try {
      const result = await openSupportConversation();
      setOpen(true);
      setActiveThread(result.conversation);
      setLauncherConversation(result.conversation);
      await loadData();
    } catch {
      // ignore
    }
  }

  async function handleTransactionAction(work) {
    setTransactionError("");

    try {
      await work();
      await loadData();
    } catch (transactionActionError) {
      setTransactionError(transactionActionError.message || "Failed to update transaction.");
      throw transactionActionError;
    }
  }

  async function handleSaveTransactionAmount(amountInput) {
    if (!activeThread) {
      return;
    }

    await handleTransactionAction(() =>
      createOrUpdateTransaction({
        conversationId: activeThread.id,
        agreedAmount: amountInput,
      })
    );
  }

  async function handleConfirmTransactionAmount() {
    if (!activeThread) {
      return;
    }

    await handleTransactionAction(() =>
      updateTransaction({
        conversationId: activeThread.id,
        action: "confirm_amount",
      })
    );
  }

  async function handleMarkTransactionCompleted() {
    if (!activeThread) {
      return;
    }

    await handleTransactionAction(() =>
      updateTransaction({
        conversationId: activeThread.id,
        action: "mark_completed",
      })
    );
  }

  async function handleVoidTransaction() {
    if (!activeThread) {
      return;
    }

    await handleTransactionAction(() =>
      updateTransaction({
        conversationId: activeThread.id,
        action: "void",
      })
    );
  }

  async function handleSubmitFeePayment({ paymentMethod, paymentReference, feeProofImageUrl }) {
    if (!activeThread) {
      return;
    }

    await handleTransactionAction(() =>
      updateTransaction({
        conversationId: activeThread.id,
        action: "submit_fee_payment",
        paymentMethod,
        paymentReference,
        feeProofImageUrl,
      })
    );
  }

  function minimizeChat() {
    setOpen(false);
    clearSelectedImage();
  }

  function closeChat() {
    setOpen(false);
    setActiveThread(null);
    setLauncherConversation(null);
    setReplyText("");
    setTransactionError("");
    clearSelectedImage();
  }

  if (!user || hidden) return null;

  const allBubbles = activeThread?.messages || [];

  function toggleLauncher() {
    if (!launcherConversation) {
      return;
    }

    if (open) {
      minimizeChat();
      return;
    }

    setActiveThread(launcherConversation);
    setOpen(true);
  }

  function closeLauncherConversation(event) {
    event.stopPropagation();
    setLauncherConversation(null);

    if (!open) {
      return;
    }

    setActiveThread(null);
  }

  return (
    <>
      <ChatImageModal isOpen={Boolean(viewerImage)} toggle={() => setViewerImage("")} imageUrl={viewerImage} />
      {open && activeThread && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? 0 : 80,
            right: isMobile ? 0 : 24,
            top: isMobile ? 0 : "auto",
            left: isMobile ? 0 : "auto",
            zIndex: 9999,
            width: isMobile ? "100vw" : 340,
            maxHeight: isMobile ? "100dvh" : 520,
            height: isMobile ? "100dvh" : "auto",
            background: "#fff", borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            borderRadius: isMobile ? 0 : 16,
          }}
        >
          <div style={{
            background: "#0a9e8f", color: "#fff",
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
              <Avatar name={activeThread.otherParty.name} color="rgba(255,255,255,0.3)" size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeThread.otherParty.name}</div>
                <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeThread.listingTitle}</div>
              </div>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleContactAdmin();
                }}
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.18)",
                  padding: "4px 8px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
              >
                Contact Admin
              </a>
            </div>
            <div className="d-flex align-items-center gap-2 ms-2">
              <button
                type="button"
                onClick={minimizeChat}
                title="Minimize chat"
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}
              >
                -
              </button>
              <button
                type="button"
                onClick={closeChat}
                title="Close chat"
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
          </div>
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", background: "#f8fafc" }}>
              {!activeThread.isSupportConversation ? (
                <ConversationTransactionCard
                  key={`${activeThread.id}-${activeThread.transaction?.updatedAt || "none"}`}
                  conversation={activeThread}
                  currentUserId={user.id}
                  compact
                  actionError={transactionError}
                  onSaveAmount={handleSaveTransactionAmount}
                  onConfirmAmount={handleConfirmTransactionAmount}
                  onMarkCompleted={handleMarkTransactionCompleted}
                  onVoid={handleVoidTransaction}
                  onSubmitFeePayment={handleSubmitFeePayment}
                />
              ) : null}
              {allBubbles.map((b) => {
                const isMe = b.senderId === user.id;
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
                        {b.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setViewerImage(b.imageUrl)}
                            style={{ display: "block", padding: 0, border: "none", background: "transparent", cursor: "zoom-in", width: "100%" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.imageUrl}
                              alt="Shared in conversation"
                              style={{ display: "block", width: "100%", maxWidth: 200, borderRadius: 10, marginBottom: b.body ? 8 : 0 }}
                            />
                          </button>
                        )}
                        {b.body && <div>{b.body}</div>}
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

            <div style={{
              display: "flex", gap: 8, padding: "10px 12px",
              background: "#fff", borderTop: "1px solid #f0f0f0",
              alignItems: "center", flexWrap: "wrap",
            }}>
              {selectedImagePreview && (
                <div style={{ width: "100%", position: "relative", marginBottom: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImagePreview}
                    alt="Selected attachment preview"
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: "1px solid #dbe3ea" }}
                  />
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    style={{ position: "absolute", top: -8, left: 80, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#dc3545", color: "#fff", fontWeight: 700, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                style={{ background: "#eef2f7", border: "none", borderRadius: "50%", width: 36, height: 36, flexShrink: 0 }}
                title="Attach image"
              >
                📷
              </button>
              <Input
                type="text"
                placeholder="Write a message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{ fontSize: 13, borderRadius: 20, background: "#f1f5f9", border: "none", flex: 1 }}
              />
              <button
                onClick={handleSend}
                disabled={sending || (!replyText.trim() && !selectedImage)}
                style={{
                  background: replyText.trim() || selectedImage ? "#0a9e8f" : "#ccc",
                  border: "none", borderRadius: "50%",
                  width: 36, height: 36, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: replyText.trim() || selectedImage ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.109z"/>
                </svg>
              </button>
            </div>
          </>
        </div>
      )}

      {!open && launcherConversation && !isMobile ? (
        <button
          type="button"
          onClick={closeLauncherConversation}
          title="Close chat head"
          style={{
            position: "fixed",
            bottom: 62,
            right: 62,
            zIndex: 10000,
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid #fff",
            background: "#111827",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            lineHeight: 1,
            padding: 0,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      ) : null}

      {!isMobile && launcherConversation ? (
        <button
          ref={bubbleRef}
          onClick={toggleLauncher}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%",
            background: "#fff", border: "none",
            boxShadow: "0 4px 20px rgba(10,158,143,0.45)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s",
            overflow: "hidden",
          }}
          title={`Open chat with ${launcherConversation.otherParty?.name || "User"}`}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Avatar
            name={launcherConversation.otherParty?.name || "User"}
            color={activeThread ? "#0a9e8f" : "#0d6efd"}
            size={56}
          />
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
      ) : null}
    </>
  );
}
