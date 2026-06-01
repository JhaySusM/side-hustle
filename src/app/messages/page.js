"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container, Card, CardBody, Badge, Button, Input } from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function Avatar({ name, color }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: color, color: "#fff", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 14,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Bubble({ text, isMe, senderName, date, avatarColor }) {
  return (
    <div
      className="d-flex align-items-end gap-2 mb-2"
      style={{ flexDirection: isMe ? "row-reverse" : "row" }}
    >
      <Avatar name={senderName} color={avatarColor} />
      <div style={{ maxWidth: "65%" }}>
        {!isMe && (
          <div className="text-muted mb-1" style={{ fontSize: 11, paddingLeft: 4 }}>
            {senderName}
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
          {text}
        </div>
        <div
          className="text-muted mt-1"
          style={{ fontSize: 11, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}
        >
          {date}
        </div>
      </div>
    </div>
  );
}

function Thread({ msg, user, onReply }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const isSeller = msg.sellerEmail === user.email;
  const otherParty = isSeller ? msg.buyerName : msg.sellerName;
  const otherRole = isSeller ? "Buyer" : "Seller";
  const otherColor = isSeller ? "#0d6efd" : "#6c757d";

  function handleSend() {
    if (!replyText.trim()) return;
    setSending(true);
    onReply(msg.id, replyText.trim());
    setReplyText("");
    setSending(false);
  }

  // Build all bubbles: original message + replies
  const allBubbles = [
    { id: msg.id + "_orig", senderEmail: msg.buyerEmail, senderName: msg.buyerName, message: msg.message, date: msg.date },
    ...(msg.replies || []),
  ];

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* Chat header */}
      <div
        className="d-flex align-items-center gap-2 px-4 py-3"
        style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}
      >
        <Avatar name={otherParty} color={otherColor} />
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold" style={{ fontSize: 15 }}>{otherParty}</span>
            <Badge color={isSeller ? "primary" : "success"} pill style={{ fontSize: 10 }}>
              {otherRole}
            </Badge>
          </div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Re: <span className="fw-semibold text-dark">{msg.listingTitle}</span>
          </div>
        </div>
      </div>

      {/* Bubbles */}
      <CardBody
        style={{
          background: "#f8fafc",
          padding: "20px 20px 12px",
          maxHeight: 420,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {allBubbles.map((b) => {
          const isMe = b.senderEmail === user.email;
          const avatarColor = isMe ? "#0d6efd" : otherColor;
          return (
            <Bubble
              key={b.id}
              text={b.message}
              isMe={isMe}
              senderName={b.senderName}
              date={b.date}
              avatarColor={avatarColor}
            />
          );
        })}
      </CardBody>

      {/* Reply input */}
      <div
        className="d-flex gap-2 align-items-center px-3 py-3"
        style={{ background: "#fff", borderTop: "1px solid #f0f0f0" }}
      >
        <Avatar name={user.name} color="#0d6efd" />
        <Input
          type="text"
          placeholder="Write a message..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{ fontSize: 14, borderRadius: 20, background: "#f1f5f9", border: "none" }}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !replyText.trim()}
          style={{
            backgroundColor: "#0a9e8f", border: "none", fontWeight: 600,
            borderRadius: 20, padding: "8px 20px", whiteSpace: "nowrap",
          }}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const loadMessages = useCallback((u) => {
    const allMsgs = JSON.parse(localStorage.getItem("batjee_messages") || "[]");
    const mine = allMsgs.filter(
      (m) => m.sellerEmail === u.email || m.buyerEmail === u.email
    );
    setMessages(mine);

    // Mark initial messages as read (for seller)
    const readIds = JSON.parse(localStorage.getItem("batjee_read_messages") || "[]");
    const newReadIds = [...new Set([...readIds, ...mine.map((m) => m.id)])];
    localStorage.setItem("batjee_read_messages", JSON.stringify(newReadIds));

    // Mark all replies as read for current user
    let changed = false;
    const updated = allMsgs.map((m) => {
      if (!m.replies) return m;
      const updatedReplies = m.replies.map((r) => {
        if (!r.readBy.includes(u.email)) {
          changed = true;
          return { ...r, readBy: [...r.readBy, u.email] };
        }
        return r;
      });
      return { ...m, replies: updatedReplies };
    });
    if (changed) localStorage.setItem("batjee_messages", JSON.stringify(updated));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("batjee_user");
    if (!stored) { router.push("/"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadMessages(u);
  }, [router, loadMessages]);

  function handleReply(msgId, text) {
    const allMsgs = JSON.parse(localStorage.getItem("batjee_messages") || "[]");
    const updated = allMsgs.map((m) => {
      if (m.id !== msgId) return m;
      const reply = {
        id: Date.now(),
        senderEmail: user.email,
        senderName: user.name,
        message: text,
        date: new Date().toLocaleString(),
        readBy: [user.email], // sender has already read their own reply
      };
      return { ...m, replies: [...(m.replies || []), reply] };
    });
    localStorage.setItem("batjee_messages", JSON.stringify(updated));
    loadMessages(user);
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-0">Messages</h4>
            <p className="text-muted small mb-0">Your conversations about listings</p>
          </div>
          <Button color="light" className="border" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        {messages.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5 text-muted">
              <div style={{ fontSize: 48 }}>💬</div>
              <div className="fw-semibold mt-2">No messages yet</div>
              <div className="small mt-1">When someone contacts you about a listing, it will appear here.</div>
            </CardBody>
          </Card>
        ) : (
          <div className="d-flex flex-column gap-3">
            {messages.map((msg) => (
              <Thread key={msg.id} msg={msg} user={user} onReply={handleReply} />
            ))}
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
}
