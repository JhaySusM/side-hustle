"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, Button, Badge,
  Input, Table, Nav, NavItem, NavLink, TabContent, TabPane, Alert, Modal, ModalBody, ModalFooter,
} from "reactstrap";
import ChatImageModal from "@/components/ChatImageModal";
import { getConversationPreview, uploadMessageImage } from "@/lib/message-client";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin1234";

function Avatar({ name, color = "#0a9e8f", size = 34 }) {
  const label = name || "U";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
      }}
    >
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

const FALLBACK_IMG = "https://placehold.co/60x60?text=No+Img";

function StatCard({ label, value, color }) {
  return (
    <Card className="border-0 shadow-sm text-center h-100">
      <CardBody>
        <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
        <div className="text-muted small">{label}</div>
      </CardBody>
    </Card>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageImage, setMessageImage] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState("");
  const [viewerImage, setViewerImage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const imageInputRef = useRef(null);

  const adminHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-email": ADMIN_EMAIL,
      "x-admin-password": ADMIN_PASSWORD,
    }),
    []
  );

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      setAuthed(sessionStorage.getItem("batjee_admin") === "true");
      setAuthChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(restoreId);
    };
  }, []);

  function clearMessageImage() {
    if (messageImagePreview) {
      URL.revokeObjectURL(messageImagePreview);
    }

    setMessageImage(null);
    setMessageImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function handleMessageImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (messageImagePreview) {
      URL.revokeObjectURL(messageImagePreview);
    }

    setMessageImage(file);
    setMessageImagePreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    if (!authed) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const [uRes, pRes, cRes, mRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/products"),
          fetch("/api/categories"),
          fetch("/api/admin/messages", { headers: adminHeaders }),
        ]);
        const uData = await uRes.json();
        const pData = await pRes.json();
        const cData = await cRes.json();
        const mData = await mRes.json();

        if (cancelled) {
          return;
        }

        setUsers(uData.users || []);
        setListings(pData.products || []);
        setCategories(cData.categories || []);
        setConversations(mData.conversations || []);
      } catch {
        // silently fail — table will show empty
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [adminHeaders, authed]);

  function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("batjee_admin", "true");
      setAuthed(true);
    } else {
      setLoginError("Invalid admin credentials.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("batjee_admin");
    setAuthed(false);
    setLogoutModalOpen(false);
  }

  function flash(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function toggleUser(userId) {
    const target = users.find((u) => u.id === userId);
    const newStatus = target.status === "active" ? "inactive" : "active";
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus } : u));
      flash(`User "${target.name}" has been ${newStatus === "inactive" ? "deactivated" : "activated"}.`);
    } catch {
      flash("Failed to update user status.");
    }
  }

  async function toggleListing(id) {
    const target = listings.find((l) => l.id === id);
    const newStatus = target.product_status === "Active" ? "Inactive" : "Active";
    try {
      await fetch("/api/products/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, product_status: newStatus }),
      });
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, product_status: newStatus } : l));
      flash(`Product "${target.product_name}" has been ${newStatus === "Inactive" ? "deactivated" : "activated"}.`);
    } catch {
      flash("Failed to update product status.");
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    setCategoryError("");
    if (!newCategory.trim()) { setCategoryError("Category name is required."); return; }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: newCategory.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setCategoryError(data.error || "Failed to add category."); return; }
    setCategories((prev) => [...prev, data.category].sort((a, b) => a.category_name.localeCompare(b.category_name)));
    setNewCategory("");
    flash(`Category "${data.category.category_name}" added.`);
  }

  async function handleDeleteCategory(id, name) {
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Failed to delete category."); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    flash(`Category "${name}" deleted.`);
  }

  async function openConversation(conversationId) {
    setActiveTab("messages");
    setMessageError("");
    setActiveConversationId(conversationId);

    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ conversationId }),
      });

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unreadCount: 0,
                messages: conversation.messages.map((message) => ({
                  ...message,
                  isRead: true,
                })),
              }
            : conversation
        )
      );
    } catch {
      setMessageError("Failed to mark messages as read.");
    }
  }

  async function handleAdminReply() {
    if (!activeConversation || (!messageDraft.trim() && !messageImage)) {
      return;
    }

    setSendingReply(true);
    setMessageError("");

    try {
      const imageUrl = messageImage ? await uploadMessageImage(messageImage) : null;

      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          conversationId: activeConversation.id,
          body: messageDraft.trim(),
          imageUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessageError(data.error || "Failed to send reply.");
        return;
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === data.conversation.id ? data.conversation : conversation
        )
      );
      setMessageDraft("");
      clearMessageImage();
      flash("Reply sent.");
    } catch {
      setMessageError("Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredListings = listings.filter(
    (l) =>
      (l.product_name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (l.user?.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (l.category?.category_name || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const activeUsers = users.filter((u) => u.status === "active").length;
  const activeProducts = listings.filter((l) => l.product_status === "Active").length;
  const [activeConversationId, setActiveConversationId] = useState(null);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0] || null;

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-muted small">Loading admin panel...</div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg,#0a9e8f,#0d6efd)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Card style={{ width: 380, borderRadius: 16, border: "none" }} className="shadow-lg">
          <CardBody className="p-5">
            <div className="text-center mb-4">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg,#0a9e8f,#0d6efd)",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 26, margin: "0 auto 12px",
              }}>🛡️</div>
              <h5 className="fw-bold mb-0">Admin Panel</h5>
              <div className="text-muted small">Batjee.com</div>
            </div>
            {loginError && <Alert color="danger">{loginError}</Alert>}
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email</label>
                <Input
                  type="email" placeholder="admin@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Password</label>
                <Input
                  type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit" className="w-100 fw-bold"
                style={{ background: "linear-gradient(90deg,#0a9e8f,#0d6efd)", border: "none", borderRadius: 8, padding: "10px" }}
              >
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <ChatImageModal isOpen={Boolean(viewerImage)} toggle={() => setViewerImage("")} imageUrl={viewerImage} />
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "14px 24px" }}
        className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span className="fw-bold" style={{ fontSize: 18 }}>Batjee Admin</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          {successMsg && (
            <span style={{ fontSize: 13, color: "#0a9e8f", fontWeight: 500 }}>✓ {successMsg}</span>
          )}
          <Button size="sm" color="light" className="border" onClick={() => setLogoutModalOpen(true)}>Sign Out</Button>
        </div>
      </div>

      <Modal isOpen={logoutModalOpen} toggle={() => setLogoutModalOpen(false)} centered>
        <ModalBody className="p-0">
          <div className="logout-modal-panel logout-modal-panel-admin">
            <div className="logout-modal-icon logout-modal-icon-admin">↪</div>
            <h5 className="logout-modal-title">Leave the admin panel?</h5>
            <p className="logout-modal-copy">
              Your admin session will end now. Sign in again if you need to manage users, products, or categories later.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="border-0 pt-0 px-4 pb-4 d-flex justify-content-center gap-2">
          <Button color="light" className="logout-modal-cancel" onClick={() => setLogoutModalOpen(false)}>
            Cancel
          </Button>
          <Button className="logout-modal-confirm logout-modal-confirm-admin" onClick={handleLogout}>
            Yes, sign out
          </Button>
        </ModalFooter>
      </Modal>

      <Container className="py-4">
        {/* Stats */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <StatCard label="Total Users" value={users.length} color="#0d6efd" />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Active Users" value={activeUsers} color="#198754" />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Total Products" value={listings.length} color="#6610f2" />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Active Products" value={activeProducts} color="#0a9e8f" />
          </Col>
        </Row>

        {/* Tabs */}
        <Card className="border-0 shadow-sm">
          <CardBody>
            <Nav tabs className="mb-4">
              <NavItem>
                <NavLink
                  href="#" active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                  style={{ cursor: "pointer", fontWeight: activeTab === "users" ? 700 : 400 }}
                >
                  👤 Users
                  <Badge color="secondary" pill className="ms-2">{users.length}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#" active={activeTab === "products"}
                  onClick={() => setActiveTab("products")}
                  style={{ cursor: "pointer", fontWeight: activeTab === "products" ? 700 : 400 }}
                >
                  📦 Products
                  <Badge color="secondary" pill className="ms-2">{listings.length}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#" active={activeTab === "categories"}
                  onClick={() => setActiveTab("categories")}
                  style={{ cursor: "pointer", fontWeight: activeTab === "categories" ? 700 : 400 }}
                >
                  🏷️ Categories
                  <Badge color="secondary" pill className="ms-2">{categories.length}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#" active={activeTab === "messages"}
                  onClick={() => setActiveTab("messages")}
                  style={{ cursor: "pointer", fontWeight: activeTab === "messages" ? 700 : 400 }}
                >
                  💬 Messages
                  <Badge color="secondary" pill className="ms-2">{conversations.length}</Badge>
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab}>
              {/* ── Users tab ── */}
              <TabPane tabId="users">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-3"
                  style={{ maxWidth: 360 }}
                />
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-muted py-4">No users found.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Listings</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const userListings = listings.filter((l) => l.user_id === u.id).length;
                          const isInactive = u.status === "inactive";
                          return (
                            <tr key={u.id} style={{ opacity: isInactive ? 0.5 : 1 }}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{
                                    width: 34, height: 34, borderRadius: "50%",
                                    background: isInactive ? "#adb5bd" : "#0d6efd",
                                    color: "#fff", display: "flex", alignItems: "center",
                                    justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
                                  }}>
                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                  </div>
                                  <span className="fw-semibold">{u.name || "—"}</span>
                                </div>
                              </td>
                              <td className="text-muted">{u.email}</td>
                              <td>{userListings}</td>
                              <td>
                                <Badge pill color={isInactive ? "secondary" : "success"} style={{ fontSize: 11 }}>
                                  {isInactive ? "Deactivated" : "Active"}
                                </Badge>
                              </td>
                              <td>
                                <Button size="sm" color={isInactive ? "success" : "danger"} outline
                                  onClick={() => toggleUser(u.id)}>
                                  {isInactive ? "Activate" : "Deactivate"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabPane>

              {/* ── Products tab ── */}
              <TabPane tabId="products">
                <Input
                  placeholder="Search products by title, seller or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-3"
                  style={{ maxWidth: 420 }}
                />
                {filteredListings.length === 0 ? (
                  <div className="text-center text-muted py-4">No products found.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Seller</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListings.map((l) => (
                          <tr key={l.id} style={{ opacity: l.deactivated ? 0.5 : 1 }}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={l.image || FALLBACK_IMG}
                                  alt={l.product_name}
                                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
                                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                                />
                                <span className="fw-semibold" style={{ maxWidth: 160 }}>{l.product_name}</span>
                              </div>
                            </td>
                            <td className="text-muted">{l.category?.category_name || "—"}</td>
                            <td className="text-primary fw-semibold">₱{Number(l.price).toLocaleString()}</td>
                            <td className="text-muted">{l.user?.name || "—"}</td>
                            <td className="text-muted" style={{ whiteSpace: "nowrap" }}>{l.upload_date_time ? new Date(l.upload_date_time).toLocaleDateString() : "—"}</td>
                            <td>
                              <Badge pill color={l.product_status === "Inactive" ? "secondary" : "success"} style={{ fontSize: 11 }}>
                                {l.product_status}
                              </Badge>
                            </td>
                            <td>
                              <Button size="sm" color={l.product_status === "Inactive" ? "success" : "danger"} outline
                                onClick={() => toggleListing(l.id)}>
                                {l.product_status === "Inactive" ? "Activate" : "Deactivate"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabPane>

              {/* ── Categories tab ── */}
              <TabPane tabId="categories">
                <form onSubmit={handleAddCategory} className="d-flex gap-2 mb-4" style={{ maxWidth: 420 }}>
                  <Input
                    placeholder="New category name..."
                    value={newCategory}
                    onChange={(e) => { setNewCategory(e.target.value); setCategoryError(""); }}
                    invalid={!!categoryError}
                  />
                  <Button type="submit" style={{ background: "#0a9e8f", border: "none", whiteSpace: "nowrap" }}>
                    + Add
                  </Button>
                </form>
                {categoryError && <div className="text-danger small mb-3">{categoryError}</div>}
                {categories.length === 0 ? (
                  <div className="text-center text-muted py-4">No categories yet.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Category Name</th>
                          <th>Products</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c, i) => (
                          <tr key={c.id}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold">{c.category_name}</td>
                            <td>{c._count?.products ?? 0}</td>
                            <td>
                              <Button
                                size="sm" color="danger" outline
                                disabled={(c._count?.products ?? 0) > 0}
                                title={(c._count?.products ?? 0) > 0 ? "Has products — cannot delete" : "Delete"}
                                onClick={() => handleDeleteCategory(c.id, c.category_name)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabPane>

              <TabPane tabId="messages">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted py-4">No support messages yet.</div>
                ) : (
                  <div className="d-flex flex-column flex-lg-row border rounded overflow-hidden" style={{ minHeight: 540 }}>
                    <div style={{ width: "100%", maxWidth: 360, borderRight: "1px solid #eef2f7", background: "#fff" }}>
                      <div className="px-3 py-3 border-bottom">
                        <div className="fw-semibold">Support Inbox</div>
                        <div className="text-muted small">
                          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div style={{ maxHeight: 480, overflowY: "auto" }}>
                        {conversations.map((conversation) => {
                          const active = conversation.id === activeConversation?.id;
                          return (
                            <button
                              key={conversation.id}
                              type="button"
                              onClick={() => openConversation(conversation.id)}
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
                                    {conversation.unreadCount > 0 && (
                                      <Badge pill color="success">{conversation.unreadCount}</Badge>
                                    )}
                                  </div>
                                  <div className="text-muted small text-truncate">{conversation.listingTitle}</div>
                                  <div className="small mt-1 text-truncate" style={{ color: conversation.unreadCount ? "#212529" : "#6c757d", fontWeight: conversation.unreadCount ? 600 : 400 }}>
                                    {getConversationPreview(conversation) || "No messages yet"}
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
                          <div className="d-flex align-items-center gap-3 px-4 py-3" style={{ background: "#fff", borderBottom: "1px solid #eef2f7" }}>
                            <Avatar name={activeConversation.otherParty.name} color="#0a9e8f" />
                            <div>
                              <div className="fw-semibold">{activeConversation.otherParty.name}</div>
                              <div className="text-muted small">Re: {activeConversation.listingTitle}</div>
                            </div>
                          </div>

                          <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fb 100%)" }}>
                            {activeConversation.messages.map((message) => {
                              const isAdmin = message.senderEmail === ADMIN_EMAIL;
                              return (
                                <div
                                  key={message.id}
                                  className="d-flex align-items-end gap-2 mb-3"
                                  style={{ flexDirection: isAdmin ? "row-reverse" : "row" }}
                                >
                                  <Avatar name={message.senderName} color={isAdmin ? "#0d6efd" : "#0a9e8f"} size={32} />
                                  <div style={{ maxWidth: "72%" }}>
                                    {!isAdmin && (
                                      <div className="text-muted mb-1" style={{ fontSize: 11, paddingLeft: 4 }}>
                                        {message.senderName}
                                      </div>
                                    )}
                                    <div style={{ background: isAdmin ? "#0a9e8f" : "#e9ecef", color: isAdmin ? "#fff" : "#212529", borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>
                                      {message.imageUrl && (
                                        <button
                                          type="button"
                                          onClick={() => setViewerImage(message.imageUrl)}
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
                                    <div className="text-muted mt-1" style={{ fontSize: 11, textAlign: isAdmin ? "right" : "left", paddingLeft: isAdmin ? 0 : 4, paddingRight: isAdmin ? 4 : 0 }}>
                                      {message.date}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="px-3 py-3 border-top bg-white">
                            {messageError && <div className="text-danger small mb-2">{messageError}</div>}
                            {messageImagePreview && (
                              <div className="mb-2 position-relative" style={{ width: 120 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={messageImagePreview}
                                  alt="Selected attachment preview"
                                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 14, border: "1px solid #dbe3ea" }}
                                />
                                <button
                                  type="button"
                                  onClick={clearMessageImage}
                                  style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", border: "none", background: "#dc3545", color: "#fff", fontWeight: 700, lineHeight: 1 }}
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <div className="d-flex gap-2 align-items-center">
                              <Avatar name="Batjee Admin" color="#0d6efd" />
                              <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleMessageImageChange}
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
                                placeholder="Reply to this concern..."
                                value={messageDraft}
                                onChange={(e) => setMessageDraft(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdminReply()}
                                style={{ fontSize: 14, borderRadius: 20, background: "#f1f5f9", border: "none" }}
                              />
                              <Button
                                onClick={handleAdminReply}
                                disabled={sendingReply || (!messageDraft.trim() && !messageImage)}
                                style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600, borderRadius: 20, padding: "8px 20px", whiteSpace: "nowrap" }}
                              >
                                {sendingReply ? "Sending..." : "Send"}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
