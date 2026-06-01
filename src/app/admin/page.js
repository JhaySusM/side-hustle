"use client";
import { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, CardBody, Button, Badge,
  Input, Table, Nav, NavItem, NavLink, TabContent, TabPane, Alert,
} from "reactstrap";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin1234";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const session = sessionStorage.getItem("batjee_admin");
    if (session === "true") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  async function loadData() {
    try {
      const [uRes, pRes, cRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      const cData = await cRes.json();
      setUsers(uData.users || []);
      setListings(pData.products || []);
      setCategories(cData.categories || []);
    } catch {
      // silently fail — table will show empty
    }
  }

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
          <Button size="sm" color="light" className="border" onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>

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
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
