"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container, Row, Col, Card, CardBody, CardTitle, CardText,
  Badge, Button, Modal, ModalHeader, ModalBody, Input, Alert,
} from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sendMessage } from "@/lib/message-client";

const FALLBACK_IMG = "https://placehold.co/400x180?text=No+Image";

function ListingImage({ src, alt, style }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_IMG)}
      style={style}
    />
  );
}

function ListingModal({ item, isOpen, toggle, seller, viewer }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const sellerName = seller?.name || seller?.email || "Seller";

  function handleClose() {
    setSent(false); setError(""); setMessage(""); toggle();
  }

  async function handleContact() {
    setError("");
    if (!message.trim()) { setError("Please enter a message."); return; }
    if (!viewer) { setError("Please sign in to send a message."); return; }
    if (!seller?.id) { setError("Seller information is unavailable."); return; }

    try {
      await sendMessage({
        listingId: item.id,
        recipientId: seller.id,
        body: message.trim(),
      });
      setSent(true);
      setMessage("");
    } catch (contactError) {
      setError(contactError.message || "Failed to send message.");
    }
  }

  if (!item) return null;

  let extraImages = [];
  try { extraImages = item.images ? JSON.parse(item.images) : []; } catch (_) {}
  const gallery = [item.image, ...extraImages].filter(Boolean);
  const currentSrc = gallery[activeImg] || item.image;

  return (
    <>
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentSrc} alt={item.product_name} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} />
          {gallery.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + gallery.length) % gallery.length); }}
                style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, borderRadius: "50%", width: 48, height: 48, cursor: "pointer" }}>&#8249;</button>
              <button onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % gallery.length); }}
                style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, borderRadius: "50%", width: 48, height: 48, cursor: "pointer" }}>&#8250;</button>
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 13 }}>{activeImg + 1} / {gallery.length}</div>
            </>
          )}
          <button onClick={() => setLightbox(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer" }}>&times;</button>
        </div>
      )}
    <Modal isOpen={isOpen} toggle={handleClose} centered size="lg">
      <ModalHeader toggle={handleClose} style={{ borderBottom: "1px solid #f0f0f0" }}>
        Listing Details
      </ModalHeader>
      <ModalBody className="p-0">
        {/* Main image */}
        <div style={{ position: "relative", cursor: "zoom-in", background: "#000" }} onClick={() => setLightbox(true)}>
          <ListingImage
            src={currentSrc}
            alt={item.product_name}
            style={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
          />
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 20, pointerEvents: "none" }}>
            {gallery.length > 1 ? `${activeImg + 1} / ${gallery.length} — ` : ""}Click to zoom
          </div>
        </div>
        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div className="d-flex gap-2 px-4 pt-3" style={{ overflowX: "auto" }}>
            {gallery.map((src, i) => (
              <div key={i} onClick={() => setActiveImg(i)} style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 6, overflow: "hidden", border: i === activeImg ? "2px solid #0a9e8f" : "2px solid #dee2e6", cursor: "pointer", opacity: i === activeImg ? 1 : 0.65 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`img ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
        <div className="p-4">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Badge pill color={item.product_status === "Sold" ? "secondary" : "success"} style={{ fontSize: 12 }}>
              {item.product_status || "Active"}
            </Badge>
            <Badge pill color="light" className="text-muted border" style={{ fontSize: 12 }}>
              {item.category?.category_name}
            </Badge>
          </div>
          <h5 className="fw-bold mb-1">{item.product_name}</h5>
          <div className="fw-bold mb-3" style={{ fontSize: 22, color: "#0d6efd" }}>
            &#8369;{Number(item.price).toLocaleString()}
          </div>
          {item.description && (
            <div className="mb-3">
              <div className="fw-semibold small text-muted mb-1">Description</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444" }}>{item.description}</p>
            </div>
          )}
          <div
            className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
            style={{ background: "#f8fafc", border: "1px solid #e9ecef" }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, #0a9e8f, #0d6efd)",
              color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0,
            }}>
              {(sellerName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="fw-semibold" style={{ fontSize: 14 }}>{sellerName}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Posted {item.upload_date_time ? new Date(item.upload_date_time).toLocaleDateString() : ""}
              </div>
            </div>
          </div>
          {sent ? (
            <Alert color="success">Message sent! The seller will get back to you soon.</Alert>
          ) : (
            <>
              {error && <Alert color="danger">{error}</Alert>}
              <div className="fw-semibold small mb-1">Send a Message to Seller</div>
              <div className="d-flex gap-2">
                <Input
                  type="text"
                  placeholder={`Hi, is "${item.product_name}" still available?`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleContact()}
                  style={{ fontSize: 14 }}
                />
                <Button
                  onClick={handleContact}
                  style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
    </>
  );
}

export default function SellerProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    async function fetchSeller() {
      setLoading(true);
      try {
        const res = await fetch(`/api/seller/${id}`);
        const data = await res.json();
        if (res.ok) {
          setSeller(data.seller);
          setProducts(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
  }, [id]);

  useEffect(() => {
    async function fetchViewer() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.user) {
          setViewer(data.user);
        }
      } catch {
        // ignore
      }
    }

    fetchViewer();
  }, []);

  const activeProducts = products.filter((p) => p.product_status !== "Sold");
  const soldProducts = products.filter((p) => p.product_status === "Sold");

  const displayed =
    tab === "active" ? activeProducts :
    tab === "sold" ? soldProducts :
    products;

  const sellerName = seller?.name || String(id);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5">

        {/* Profile header */}
        <Card className="border-0 shadow-sm mb-4">
          <CardBody className="p-4">
            <div className="d-flex align-items-center gap-4">
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #0a9e8f, #0d6efd)",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: 30, flexShrink: 0,
              }}>
                {sellerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="fw-bold mb-1">{sellerName}</h4>
                <div className="text-muted small mb-2">{seller?.email}</div>
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill" style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 12 }}>
                    {products.length} listing{products.length !== 1 ? "s" : ""}
                  </span>
                  <span className="badge rounded-pill" style={{ background: "#e3f2fd", color: "#1565c0", fontSize: 12 }}>
                    {activeProducts.length} active
                  </span>
                  <span className="badge rounded-pill" style={{ background: "#fce4ec", color: "#c62828", fontSize: 12 }}>
                    {soldProducts.length} sold
                  </span>
                </div>
              </div>
              <Button color="light" className="border ms-auto" size="sm" onClick={() => router.back()}>
                &#8592; Back
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tab filter */}
        <div className="d-flex gap-2 mb-3">
          {[
            { key: "all", label: `All (${products.length})` },
            { key: "active", label: `Active (${activeProducts.length})` },
            { key: "sold", label: `Sold (${soldProducts.length})` },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              onClick={() => setTab(key)}
              style={{
                backgroundColor: tab === key ? "#0a9e8f" : "#fff",
                color: tab === key ? "#fff" : "#555",
                border: `1px solid ${tab === key ? "#0a9e8f" : "#dee2e6"}`,
                fontWeight: tab === key ? 600 : 400,
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Listings */}
        <h5 className="fw-bold mb-3">Listed Products</h5>
        {loading ? (
          <div className="text-muted py-4 text-center">Loading...</div>
        ) : displayed.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5 text-muted">
              <div style={{ fontSize: 40 }}>📦</div>
              <div className="fw-semibold mt-2">No listings yet</div>
            </CardBody>
          </Card>
        ) : (
          <Row className="g-4">
            {displayed.map((item) => (
              <Col key={item.id} xs={6} md={3}>
                <Card
                  className="h-100 shadow-sm border-0 d-flex flex-column"
                  style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", opacity: item.product_status === "Sold" ? 0.75 : 1 }}
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <div style={{ position: "relative" }}>
                    <ListingImage
                      src={item.image}
                      alt={item.product_name}
                      style={{ width: "100%", height: 160, objectFit: "cover" }}
                    />
                    {item.product_status === "Sold" && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      }}>
                        SOLD
                      </div>
                    )}
                  </div>
                  <CardBody className="d-flex flex-column">
                    <div className="d-flex gap-1 flex-wrap mb-2">
                      <Badge pill color={item.product_status === "Sold" ? "secondary" : "success"} style={{ fontSize: 11 }}>
                        {item.product_status || "Active"}
                      </Badge>
                      <Badge color="light" className="text-muted border" style={{ fontSize: 11 }}>
                        {item.category?.category_name}
                      </Badge>
                    </div>
                    <CardTitle tag="h6" className="fw-semibold mb-1">{item.product_name}</CardTitle>
                    <CardText className="text-primary fw-bold mb-1">&#8369;{Number(item.price).toLocaleString()}</CardText>
                    <div className="text-muted small mt-auto">
                      {item.upload_date_time ? new Date(item.upload_date_time).toLocaleDateString() : ""}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
      <Footer />

      <ListingModal
        key={selectedItem?.id || "empty-listing"}
        item={selectedItem}
        isOpen={!!selectedItem}
        toggle={() => setSelectedItem(null)}
        seller={seller}
        viewer={viewer}
      />
    </div>
  );
}
