"use client";
import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, CardBody, Button, Badge } from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [pendingSoldId, setPendingSoldId] = useState(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [msgCount, setMsgCount] = useState(0);
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push("/");
        } else {
          setUser(data.user);
        }
      } catch {
        router.push("/");
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    async function fetchListings() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        if (res.ok && data.products) {
          setListings(data.products);
        } else {
          setListings([]);
        }
      } catch {
        setListings([]);
      }
      // TODO: Replace message count logic with API if needed
      setMsgCount(0);
    }
    fetchListings();
  }, [user]);

  function handleDelete(id) {
    const all = JSON.parse(localStorage.getItem("batjee_listings") || "[]");
    const updated = all.filter((l) => l.id !== id);
    localStorage.setItem("batjee_listings", JSON.stringify(updated));
    setListings(updated.filter((l) => l.sellerEmail === user.email));
  }

  if (!user) return null;

  const activeCount = listings.filter((l) => l.product_status === "Active").length;
  const soldCount = listings.filter((l) => l.product_status === "Sold").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5">
        {/* Welcome Banner */}
        <div className="mb-4 p-4 rounded-3" style={{ background: "linear-gradient(90deg,#0d6efd 0%,#6610f2 100%)", color: "#fff" }}>
          <h3 className="fw-bold mb-1">Welcome back, {user.name}! 👋</h3>
          <p className="mb-0" style={{ opacity: 0.85 }}>{user.email}</p>
        </div>

        {/* Stats */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center h-100">
              <CardBody>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#0d6efd" }}>{listings.length}</div>
                <div className="text-muted small">Total Listings</div>
              </CardBody>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center h-100">
              <CardBody>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#198754" }}>{activeCount}</div>
                <div className="text-muted small">Active</div>
              </CardBody>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center h-100">
              <CardBody>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#6610f2" }}>{soldCount}</div>
                <div className="text-muted small">Sold</div>
              </CardBody>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center h-100">
              <CardBody>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fd7e14" }}>{msgCount}</div>
                <div className="text-muted small">Messages</div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* My Listings */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">My Listings</h5>
          <Button color="primary" size="sm" onClick={() => router.push("/post")}>+ Post New Ad</Button>
        </div>
        <Card className="border-0 shadow-sm">
          <CardBody className="p-0">
            {listings.length === 0 ? (
              <div className="text-center text-muted py-5">
                You have no listings yet.{" "}
                <span style={{ color: "#0d6efd", cursor: "pointer" }} onClick={() => router.push("/post")}>Post your first ad!</span>
              </div>
            ) : (
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Title</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="ps-3 fw-semibold">{listing.product_name}</td>
                      <td className="text-muted">{listing.category_name}</td>
                      <td>₱{Number(listing.price).toLocaleString()}</td>
                      <td>
                        {listing.product_status === "Sold" ? (
                          <Badge color="secondary" pill>Sold</Badge>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <Button
                              size="sm"
                              color={listing.product_status === "Active" ? "success" : "secondary"}
                              style={{ opacity: listing.product_status === "Active" ? 1 : 0.5, pointerEvents: listing.product_status === "Active" ? "none" : "auto" }}
                              disabled={listing.product_status === "Active"}
                              onClick={async () => {
                                if (listing.product_status !== "Active") {
                                  await fetch("/api/products/status", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: listing.id, product_status: "Active" })
                                  });
                                  const res = await fetch("/api/dashboard");
                                  const data = await res.json();
                                  if (res.ok && data.products) setListings(data.products);
                                }
                              }}
                            >
                              Active
                            </Button>
                            <Button
                              size="sm"
                              color={listing.product_status === "Inactive" ? "danger" : "secondary"}
                              style={{ opacity: listing.product_status === "Inactive" ? 1 : 0.5, pointerEvents: listing.product_status === "Inactive" ? "none" : "auto" }}
                              disabled={listing.product_status === "Inactive"}
                              onClick={async () => {
                                if (listing.product_status !== "Inactive") {
                                  await fetch("/api/products/status", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: listing.id, product_status: "Inactive" })
                                  });
                                  const res = await fetch("/api/dashboard");
                                  const data = await res.json();
                                  if (res.ok && data.products) setListings(data.products);
                                }
                              }}
                            >
                              Inactive
                            </Button>
                            <Button
                              size="sm"
                              color="warning"
                              style={{ color: "#fff" }}
                              onClick={() => {
                                setPendingSoldId(listing.id);
                                setShowSoldModal(true);
                              }}
                            >
                              Sold
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="text-muted">{listing.upload_date_time ? new Date(listing.upload_date_time).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                      {/* Sold Modal */}
                      <Modal isOpen={showSoldModal} toggle={() => setShowSoldModal(false)}>
                        <ModalHeader toggle={() => setShowSoldModal(false)}>Mark as Sold</ModalHeader>
                        <ModalBody>
                          <div className="fw-bold mb-2">Are you sure you want to mark this item as <span style={{color:'#fd7e14'}}>Sold</span>?</div>
                          <div>Once marked as <b>Sold</b>, this item cannot be made active again. This helps keep your listings accurate and prevents accidental reactivation of sold items.</div>
                        </ModalBody>
                        <ModalFooter>
                          <Button color="secondary" onClick={() => setShowSoldModal(false)}>Cancel</Button>
                          <Button color="warning" style={{color:'#fff'}} onClick={async () => {
                            if (pendingSoldId) {
                              await fetch("/api/products/status", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: pendingSoldId, product_status: "Sold" })
                              });
                              setShowSoldModal(false);
                              setPendingSoldId(null);
                              // Refresh listings
                              const res = await fetch("/api/dashboard");
                              const data = await res.json();
                              if (res.ok && data.products) setListings(data.products);
                            }
                          }}>Yes, mark as Sold</Button>
                        </ModalFooter>
                      </Modal>
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Account Details */}
        <h5 className="fw-bold mt-5 mb-3">Account Details</h5>
        <Card className="border-0 shadow-sm">
          <CardBody>
            <Row className="g-3">
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Full Name</label>
                <div className="fw-semibold">{user.name}</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Email Address</label>
                <div className="fw-semibold">{user.email}</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Member Since</label>
                <div className="fw-semibold">May 2026</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Account Status</label>
                <Badge color="success" pill>Active</Badge>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}
