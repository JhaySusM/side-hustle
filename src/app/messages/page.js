"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Container, Input } from "reactstrap";
import ChatImageModal from "@/components/ChatImageModal";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  fetchInbox,
  getConversationPreview,
  markConversationRead,
  openSupportConversation,
  sendMessage,
  subscribeToInbox,
  uploadMessageImage,
} from "@/lib/message-client";

function Avatar({ name, color, size = 36 }) {
  const label = name || "U";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
      }}
    >
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

function Bubble({ message, currentUserId, onImageClick }) {
  const isMe = message.senderId === currentUserId;

  return (
    <div
      className="d-flex align-items-end gap-2 mb-3"
      style={{ flexDirection: isMe ? "row-reverse" : "row" }}
    >
      <Avatar name={message.senderName} color={isMe ? "#0d6efd" : "#0a9e8f"} size={32} />
      <div style={{ maxWidth: "70%" }}>
        {!isMe && (
          <div className="text-muted mb-1" style={{ fontSize: 11, paddingLeft: 4 }}>
            {message.senderName}
          </div>
        )}
        <div
          style={{
            background: isMe ? "#0a9e8f" : "#e9ecef",
            color: isMe ? "#fff" : "#212529",
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          {message.imageUrl && (
            <button
              type="button"
              onClick={() => onImageClick(message.imageUrl)}
              style={{ display: "block", padding: 0, border: "none", background: "transparent", cursor: "zoom-in", width: "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Shared in conversation"
                style={{ display: "block", maxWidth: 260, width: "100%", borderRadius: 12, marginBottom: message.body ? 10 : 0 }}
              />
            </button>
          )}
          {message.body && <div>{message.body}</div>}
        </div>
        <div
          className="text-muted mt-1"
          style={{
            fontSize: 11,
            textAlign: isMe ? "right" : "left",
            paddingLeft: isMe ? 0 : 4,
            paddingRight: isMe ? 4 : 0,
          }}
        >
          {message.date}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [viewerImage, setViewerImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadEndRef = useRef(null);
  const imageInputRef = useRef(null);

  function clearSelectedImage() {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(null);
    setSelectedImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  }

  const loadMessages = useCallback(async () => {
    const inbox = await fetchInbox();
    const nextConversations = inbox.conversations || [];
    setConversations(nextConversations);
    setActiveConversationId((currentId) => {
      if (!nextConversations.length) {
        return null;
      }

      if (currentId && nextConversations.some((conversation) => conversation.id === currentId)) {
        return currentId;
      }

      if (isMobile) {
        return null;
      }

      return nextConversations[0].id;
    });
  }, [isMobile]);

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
    let cancelled = false;

    async function loadPage() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.user) {
          router.push("/");
          return;
        }

        if (cancelled) {
          return;
        }

        setUser(data.user);
        await loadMessages();
      } catch {
        if (!cancelled) {
          router.push("/");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [router, loadMessages]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeToInbox(() => {
      loadMessages().catch(() => {
        // Ignore transient stream failures.
      });
    });
  }, [user, loadMessages]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;
  const showInboxList = !isMobile || !activeConversation;
  const showThreadPane = !isMobile || Boolean(activeConversation);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  useEffect(() => {
    if (!activeConversation || !activeConversation.unreadCount) {
      return;
    }

    markConversationRead(activeConversation.id)
      .then(() => loadMessages())
      .catch(() => {
        // Ignore passive read-state failures.
      });
  }, [activeConversation, loadMessages]);

  async function handleReply() {
    if (!activeConversation || (!draft.trim() && !selectedImage)) {
      return;
    }

    setSending(true);
    setError("");
    try {
      const imageUrl = selectedImage ? await uploadMessageImage(selectedImage) : null;
      await sendMessage({
        conversationId: activeConversation.id,
        body: draft.trim(),
        imageUrl,
      });
      setDraft("");
      clearSelectedImage();
      await loadMessages();
    } catch (replyError) {
      setError(replyError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleContactAdmin() {
    setError("");

    try {
      const result = await openSupportConversation();
      setActiveConversationId(result.conversation.id);
      await loadMessages();
    } catch (supportError) {
      setError(supportError.message || "Failed to open admin support chat.");
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: isMobile ? "#ffffff" : "#f8fafc" }}>
      <ChatImageModal isOpen={Boolean(viewerImage)} toggle={() => setViewerImage("")} imageUrl={viewerImage} />
      <Navbar />
      <Container className={isMobile ? "px-0 py-0" : "py-5"}>
        {!isMobile ? (
          <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-0">Messages</h4>
            <p className="text-muted small mb-0">Real-time conversations about your listings and inquiries</p>
          </div>
          <Button color="light" className="border" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
          </div>
        ) : null}

        {!isMobile ? (
        <Card className="border-0 shadow-sm mb-4">
          <CardBody className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <div className="fw-semibold" style={{ color: "#0f172a" }}>Need help with a concern?</div>
              <div className="text-muted small">
                Open an in-app support chat with Batjee Admin for account, listing, or platform concerns.
              </div>
            </div>
            <Button
              onClick={handleContactAdmin}
              style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              Contact Admin
            </Button>
          </CardBody>
        </Card>
        ) : null}

        {loading ? (
          <Card className={`border-0 ${isMobile ? "shadow-none rounded-0" : "shadow-sm"}`}>
            <CardBody className="text-center py-5 text-muted">Loading messages...</CardBody>
          </Card>
        ) : conversations.length === 0 ? (
          <Card className={`border-0 ${isMobile ? "shadow-none rounded-0" : "shadow-sm"}`}>
            <CardBody className="text-center py-5 text-muted">
              <div style={{ fontSize: 48 }}>💬</div>
              <div className="fw-semibold mt-2">No messages yet</div>
              <div className="small mt-1">When someone contacts you about a listing, it will appear here.</div>
            </CardBody>
          </Card>
        ) : (
          <Card className={`border-0 overflow-hidden ${isMobile ? "shadow-none rounded-0" : "shadow-sm"}`}>
            <div className="d-flex flex-column flex-lg-row" style={{ minHeight: isMobile ? "100dvh" : 560 }}>
              {showInboxList ? (
              <div style={{ width: "100%", maxWidth: isMobile ? "none" : 360, borderRight: isMobile ? "none" : "1px solid #eef2f7", background: "#fff" }}>
                <div className="px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div>
                      <div className="fw-semibold">{isMobile ? "Messages" : "Inbox"}</div>
                      <div className="text-muted small">
                        {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <Button
                      onClick={handleContactAdmin}
                      color="light"
                      size="sm"
                      className="border"
                    >
                      Contact Admin
                    </Button>
                  </div>
                </div>

                {isMobile ? (
                  <div style={{ margin: 12, padding: "12px 14px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      Need admin help?
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                      Open a direct support chat with Batjee Admin.
                    </div>
                    <button
                      type="button"
                      onClick={handleContactAdmin}
                      style={{ display: "inline-block", marginTop: 8, color: "#0a9e8f", fontSize: 12, fontWeight: 700, textDecoration: "none", border: "none", background: "transparent", padding: 0 }}
                    >
                      Contact Admin →
                    </button>
                  </div>
                ) : null}

                <div style={{ maxHeight: isMobile ? "calc(100dvh - 160px)" : 500, overflowY: "auto" }}>
                  {conversations.map((conversation) => {
                    const active = conversation.id === activeConversationId;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setActiveConversationId(conversation.id)}
                        className="w-100 text-start border-0"
                        style={{
                          background: active ? "#f0fdf9" : "#fff",
                          padding: "16px 18px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <Avatar name={conversation.otherParty.name} color={active ? "#0a9e8f" : "#0d6efd"} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <div className="fw-semibold text-truncate">{conversation.otherParty.name}</div>
                              {conversation.unreadCount > 0 && <Badge pill color="success">{conversation.unreadCount}</Badge>}
                            </div>
                            <div className="text-muted small text-truncate">{conversation.listingTitle}</div>
                            <div
                              className="small mt-1 text-truncate"
                              style={{
                                color: conversation.unreadCount ? "#212529" : "#6c757d",
                                fontWeight: conversation.unreadCount ? 600 : 400,
                              }}
                            >
                              {getConversationPreview(conversation)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              ) : null}

              {showThreadPane ? (
              <div className="d-flex flex-column flex-grow-1" style={{ background: "#f8fafc", minHeight: isMobile ? "100dvh" : undefined }}>
                {activeConversation ? (
                  <>
                    <div
                      className="d-flex align-items-center gap-3 px-4 py-3"
                      style={{ background: "#fff", borderBottom: "1px solid #eef2f7" }}
                    >
                      {isMobile ? (
                        <Button
                          onClick={() => setActiveConversationId(null)}
                          color="light"
                          size="sm"
                          className="border"
                        >
                          ←
                        </Button>
                      ) : null}
                      <Avatar name={activeConversation.otherParty.name} color="#0a9e8f" />
                      <div>
                        <div className="fw-semibold">{activeConversation.otherParty.name}</div>
                        <div className="text-muted small">Re: {activeConversation.listingTitle}</div>
                      </div>
                      <Button
                        onClick={handleContactAdmin}
                        color="light"
                        size="sm"
                        className="border ms-auto"
                      >
                        Contact Admin
                      </Button>
                    </div>

                    <CardBody
                      style={{
                        flex: 1,
                        background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fb 100%)",
                        padding: isMobile ? "16px" : "20px",
                        overflowY: "auto",
                      }}
                    >
                      {activeConversation.messages.map((message) => (
                        <Bubble
                          key={message.id}
                          message={message}
                          currentUserId={user.id}
                          onImageClick={setViewerImage}
                        />
                      ))}
                      <div ref={threadEndRef} />
                    </CardBody>

                    <div className="px-3 py-3 border-top bg-white">
                      {error && <div className="text-danger small mb-2">{error}</div>}
                      {selectedImagePreview && (
                        <div className="mb-2 position-relative" style={{ width: 120 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedImagePreview}
                            alt="Selected attachment preview"
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 14, border: "1px solid #dbe3ea" }}
                          />
                          <button
                            type="button"
                            onClick={clearSelectedImage}
                            style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", border: "none", background: "#dc3545", color: "#fff", fontWeight: 700, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <div className="d-flex gap-2 align-items-center">
                        <Avatar name={user.name || user.email} color="#0d6efd" />
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageChange}
                        />
                        <Button
                          type="button"
                          color="light"
                          className="border"
                          onClick={() => imageInputRef.current?.click()}
                          title="Attach image"
                          style={{ width: 42, height: 42, borderRadius: "50%", padding: 0, flexShrink: 0 }}
                        >
                          📷
                        </Button>
                        <Input
                          type="text"
                          placeholder="Write a message..."
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && handleReply()}
                          style={{ fontSize: 14, borderRadius: 20, background: "#f1f5f9", border: "none" }}
                        />
                        <Button
                          onClick={handleReply}
                          disabled={sending || (!draft.trim() && !selectedImage)}
                          style={{
                            backgroundColor: "#0a9e8f",
                            border: "none",
                            fontWeight: 600,
                            borderRadius: 20,
                            padding: isMobile ? "8px 14px" : "8px 20px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              ) : null}
            </div>
          </Card>
        )}
      </Container>
      <Footer />
    </div>
  );
}
