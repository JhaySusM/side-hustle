"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Container, Input } from "reactstrap";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  fetchInbox,
  getConversationPreview,
  markConversationRead,
  sendMessage,
  subscribeToInbox,
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

function Bubble({ message, currentUserId }) {
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
          {message.body}
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
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadEndRef = useRef(null);

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

      return nextConversations[0].id;
    });
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
    if (!activeConversation || !draft.trim()) {
      return;
    }

    setSending(true);
    setError("");
    try {
      await sendMessage({
        conversationId: activeConversation.id,
        body: draft.trim(),
      });
      setDraft("");
      await loadMessages();
    } catch (replyError) {
      setError(replyError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-0">Messages</h4>
            <p className="text-muted small mb-0">Real-time conversations about your listings and inquiries</p>
          </div>
          <Button color="light" className="border" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5 text-muted">Loading messages...</CardBody>
          </Card>
        ) : conversations.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5 text-muted">
              <div style={{ fontSize: 48 }}>💬</div>
              <div className="fw-semibold mt-2">No messages yet</div>
              <div className="small mt-1">When someone contacts you about a listing, it will appear here.</div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="d-flex flex-column flex-lg-row" style={{ minHeight: 560 }}>
              <div style={{ width: "100%", maxWidth: 360, borderRight: "1px solid #eef2f7", background: "#fff" }}>
                <div className="px-3 py-3 border-bottom">
                  <div className="fw-semibold">Inbox</div>
                  <div className="text-muted small">
                    {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div style={{ maxHeight: 500, overflowY: "auto" }}>
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

              <div className="d-flex flex-column flex-grow-1" style={{ background: "#f8fafc" }}>
                {activeConversation && (
                  <>
                    <div
                      className="d-flex align-items-center gap-3 px-4 py-3"
                      style={{ background: "#fff", borderBottom: "1px solid #eef2f7" }}
                    >
                      <Avatar name={activeConversation.otherParty.name} color="#0a9e8f" />
                      <div>
                        <div className="fw-semibold">{activeConversation.otherParty.name}</div>
                        <div className="text-muted small">Re: {activeConversation.listingTitle}</div>
                      </div>
                    </div>

                    <CardBody
                      style={{
                        flex: 1,
                        background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fb 100%)",
                        padding: "20px",
                        overflowY: "auto",
                      }}
                    >
                      {activeConversation.messages.map((message) => (
                        <Bubble key={message.id} message={message} currentUserId={user.id} />
                      ))}
                      <div ref={threadEndRef} />
                    </CardBody>

                    <div className="px-3 py-3 border-top bg-white">
                      {error && <div className="text-danger small mb-2">{error}</div>}
                      <div className="d-flex gap-2 align-items-center">
                        <Avatar name={user.name || user.email} color="#0d6efd" />
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
                          disabled={sending || !draft.trim()}
                          style={{
                            backgroundColor: "#0a9e8f",
                            border: "none",
                            fontWeight: 600,
                            borderRadius: 20,
                            padding: "8px 20px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </Container>
      <Footer />
    </div>
  );
}
