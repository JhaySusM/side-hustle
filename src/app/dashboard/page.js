"use client";
import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, CardBody, Button, Badge } from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatDisplayCurrency } from "@/lib/currency";
import { formatUserAddress } from "@/lib/address";

const FALLBACK_IMG = "https://placehold.co/640x420?text=No+Image";

function FavoriteImage({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_IMG)}
      style={{
        width: "100%",
        height: 180,
        objectFit: "cover",
        borderTopLeftRadius: "inherit",
        borderTopRightRadius: "inherit",
        background: "#e2e8f0",
      }}
    />
  );
}

const REWARD_TRANSACTION_LABELS = {
  earn_referral: "Referral bonus",
  spend_premium_slot: "Premium slot",
  spend_boost: "Ad boost",
  spend_badge: "Referrer badge",
  admin_adjustment: "Admin adjustment",
};

export default function DashboardPage() {
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [pendingSoldId, setPendingSoldId] = useState(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [siteOrigin, setSiteOrigin] = useState("");
  const [copiedItem, setCopiedItem] = useState("");
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [rewardsTransactions, setRewardsTransactions] = useState([]);
  const [hasBadge, setHasBadge] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [premiumSlotTarget, setPremiumSlotTarget] = useState("");
  const [boostTarget, setBoostTarget] = useState("");
  const [redeemBusy, setRedeemBusy] = useState("");
  const [redeemMessage, setRedeemMessage] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteOrigin(window.location.origin);
    }
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setListings(data.products || []);
        setFavorites(data.favorites || []);
      } else {
        setListings([]);
        setFavorites([]);
      }
    } catch {
      setListings([]);
      setFavorites([]);
    }
  }

  async function loadRewards() {
    try {
      const [balanceRes, catalogRes] = await Promise.all([
        fetch("/api/rewards/balance", { cache: "no-store" }),
        fetch("/api/rewards/catalog", { cache: "no-store" }),
      ]);
      const balanceData = await balanceRes.json();
      const catalogData = await catalogRes.json();
      if (balanceRes.ok) {
        setRewardsBalance(balanceData.balance || 0);
        setRewardsTransactions(balanceData.transactions || []);
        setHasBadge(Boolean(balanceData.hasBadge));
      }
      if (catalogRes.ok) {
        setCatalog(catalogData);
      }
    } catch {
      // Leave existing rewards state as-is on failure.
    }
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push("/");
        } else {
          setUser(data.user);
          await Promise.all([loadDashboard(), loadRewards()]);
        }
      } catch {
        router.push("/");
      }
    }
    checkAuth();
  }, [router]);

  if (!user) return null;

  async function redeemReward(type, productId) {
    setRedeemBusy(type);
    setRedeemMessage(null);
    try {
      const url = type === "premium" ? "/api/rewards/premium-slot" : type === "boost" ? "/api/rewards/boost" : "/api/rewards/badge";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: productId ? JSON.stringify({ productId: Number(productId) }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem reward");
      }
      const successText =
        type === "premium"
          ? "Premium slot activated for your listing."
          : type === "boost"
          ? "Boost activated for your listing."
          : "Referrer badge purchased.";
      setRedeemMessage({ type: "success", text: successText });
      await loadRewards();
    } catch (err) {
      setRedeemMessage({ type: "error", text: err.message || "Failed to redeem reward" });
    } finally {
      setRedeemBusy("");
    }
  }

  function renderStatusControls(listing) {
    if (listing.product_status === "Sold") {
      return <Badge color="secondary" pill>Sold</Badge>;
    }

    if (listing.product_status === "Pending") {
      return (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge color="warning" pill>Pending Approval</Badge>
          <Button
            size="sm"
            color="secondary"
            onClick={async () => {
              await fetch("/api/products/status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: listing.id, product_status: "Inactive" })
              });
              await loadDashboard();
            }}
          >
            Withdraw
          </Button>
        </div>
      );
    }

    return (
      <div className="d-flex align-items-center gap-2 flex-wrap">
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
              await loadDashboard();
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
              await loadDashboard();
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
    );
  }

  const activeCount = listings.filter((l) => l.product_status === "Active").length;
  const pendingCount = listings.filter((l) => l.product_status === "Pending").length;
  const soldCount = listings.filter((l) => l.product_status === "Sold").length;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "Not available";
  const referralCode = user.referralCode || "Not available";
  const referralLink = user.referralCode ? `${siteOrigin || ""}/?ref=${encodeURIComponent(user.referralCode)}` : "";

  async function copyReferralValue(type, value) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedItem(type);
      window.setTimeout(() => {
        setCopiedItem((current) => (current === type ? "" : current));
      }, 1800);
    } catch {
      setCopiedItem("");
    }
  }

  return (
    <div className="user-dashboard-page" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5">
        {/* Welcome Banner */}
        <div className="mb-4 p-4 rounded-3" style={{ background: "#0f8a76", color: "#fff" }}>
          <h3 className="fw-bold mb-1">Welcome back{user.name ? `, ${user.name}` : ""}! 👋</h3>
          <p className="mb-0" style={{ opacity: 0.85 }}>{user.email || user.phone}</p>
        </div>

        {/* Stats */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center h-100">
              <CardBody>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#0f8a76" }}>{listings.length}</div>
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
                <div style={{ fontSize: 32, fontWeight: 700, color: "#f59f00" }}>{pendingCount}</div>
                <div className="text-muted small">Pending Approval</div>
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
        </Row>

        <div className="mb-3 text-muted small">
          New listings stay pending until an admin approves them.
        </div>

        <h5 className="fw-bold mb-3">My Referral</h5>
        <Card className="border-0 shadow-sm mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col lg={4} md={6}>
                <label className="text-muted small d-block mb-1">Referral Code</label>
                <div className="fw-semibold px-3 py-2 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", letterSpacing: "0.08em" }}>
                  {referralCode}
                </div>
              </Col>
              <Col lg={2} md={6}>
                <Button color="primary" className="w-100" disabled={!user.referralCode} onClick={() => copyReferralValue("code", user.referralCode)}>
                  {copiedItem === "code" ? "Copied" : "Copy Code"}
                </Button>
              </Col>
              <Col lg={6}>
                <label className="text-muted small d-block mb-1">Referral Link</label>
                <div className="d-flex gap-2 flex-column flex-md-row">
                  <div className="flex-grow-1 px-3 py-2 rounded-3 text-break" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    {referralLink || "Your referral link will appear here."}
                  </div>
                  <Button color="primary" disabled={!referralLink} onClick={() => copyReferralValue("link", referralLink)}>
                    {copiedItem === "link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </Col>
              <Col xs={12}>
                <div className="text-muted small">
                  Anyone who opens this link will land on registration with your referral code already filled in.
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <h5 className="fw-bold mb-3">Rewards</h5>
        <Card className="border-0 shadow-sm mb-4">
          <CardBody>
            <Row className="g-3 align-items-center mb-4">
              <Col xs={12} md="auto">
                <div style={{ fontSize: 32, fontWeight: 700, color: "#0f8a76" }}>{rewardsBalance.toLocaleString()}</div>
                <div className="text-muted small">Referral points{catalog ? ` · earn ${catalog.referralPointsPerConversion} pts per converted referral` : ""}</div>
              </Col>
            </Row>

            {redeemMessage ? (
              <div className={`alert ${redeemMessage.type === "success" ? "alert-success" : "alert-danger"} py-2 small`}>
                {redeemMessage.text}
              </div>
            ) : null}

            <Row className="g-3">
              <Col md={4}>
                <Card className="border h-100">
                  <CardBody>
                    <h6 className="fw-bold mb-1">⭐ Premium Slot</h6>
                    <p className="text-muted small mb-2">
                      {catalog ? `${catalog.premiumSlot.cost} pts · ${catalog.premiumSlot.durationDays} days` : "Loading..."}
                    </p>
                    <select
                      className="form-select form-select-sm mb-2"
                      value={premiumSlotTarget}
                      onChange={(e) => setPremiumSlotTarget(e.target.value)}
                    >
                      <option value="">Select a listing</option>
                      {listings.filter((l) => l.product_status === "Active").map((l) => (
                        <option key={l.id} value={l.id}>{l.product_name}</option>
                      ))}
                    </select>
                    <Button
                      color="primary"
                      size="sm"
                      className="w-100"
                      disabled={!premiumSlotTarget || redeemBusy === "premium" || (catalog && rewardsBalance < catalog.premiumSlot.cost)}
                      onClick={() => redeemReward("premium", premiumSlotTarget)}
                    >
                      {redeemBusy === "premium" ? "Redeeming..." : "Redeem"}
                    </Button>
                  </CardBody>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border h-100">
                  <CardBody>
                    <h6 className="fw-bold mb-1">🚀 Boost Ad</h6>
                    <p className="text-muted small mb-2">
                      {catalog ? `${catalog.boost.cost} pts · ${catalog.boost.durationDays} days` : "Loading..."}
                    </p>
                    <select
                      className="form-select form-select-sm mb-2"
                      value={boostTarget}
                      onChange={(e) => setBoostTarget(e.target.value)}
                    >
                      <option value="">Select a listing</option>
                      {listings.filter((l) => l.product_status === "Active").map((l) => (
                        <option key={l.id} value={l.id}>{l.product_name}</option>
                      ))}
                    </select>
                    <Button
                      color="primary"
                      size="sm"
                      className="w-100"
                      disabled={!boostTarget || redeemBusy === "boost" || (catalog && rewardsBalance < catalog.boost.cost)}
                      onClick={() => redeemReward("boost", boostTarget)}
                    >
                      {redeemBusy === "boost" ? "Redeeming..." : "Redeem"}
                    </Button>
                  </CardBody>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border h-100">
                  <CardBody>
                    <h6 className="fw-bold mb-1">🎖️ Referrer Badge</h6>
                    <p className="text-muted small mb-2">
                      {catalog ? `${catalog.badge.cost} pts · one-time, shows on your profile` : "Loading..."}
                    </p>
                    <Button
                      color="primary"
                      size="sm"
                      className="w-100 mt-4"
                      disabled={hasBadge || redeemBusy === "badge" || (catalog && rewardsBalance < catalog.badge.cost)}
                      onClick={() => redeemReward("badge", null)}
                    >
                      {hasBadge ? "Owned" : redeemBusy === "badge" ? "Redeeming..." : "Redeem"}
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {rewardsTransactions.length > 0 ? (
              <div className="mt-4">
                <div className="text-muted small fw-semibold mb-2">Recent activity</div>
                <div className="d-flex flex-column gap-1">
                  {rewardsTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="d-flex justify-content-between small border-bottom pb-1">
                      <span>{REWARD_TRANSACTION_LABELS[tx.type] || tx.type}</span>
                      <span className={tx.points >= 0 ? "text-success" : "text-danger"}>
                        {tx.points >= 0 ? "+" : ""}{tx.points} pts
                      </span>
                      <span className="text-muted">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

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
                <span style={{ color: "#0f8a76", cursor: "pointer" }} onClick={() => router.push("/post")}>Post your first ad!</span>
              </div>
            ) : (
              <>
                <table className="table table-hover mb-0 align-middle d-none d-sm-table">
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
                        <td>{formatDisplayCurrency(listing.price)}</td>
                        <td>{renderStatusControls(listing)}</td>
                        <td className="text-muted">{listing.upload_date_time ? new Date(listing.upload_date_time).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-sm-none">
                  {listings.map((listing) => (
                    <div key={listing.id} className="dashboard-listing-card">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <div className="fw-semibold">{listing.product_name}</div>
                        <div className="fw-bold text-primary text-nowrap">{formatDisplayCurrency(listing.price)}</div>
                      </div>
                      <div className="text-muted small mb-1">{listing.category_name}</div>
                      <div className="text-muted small mb-2">
                        Posted {listing.upload_date_time ? new Date(listing.upload_date_time).toLocaleDateString() : "-"}
                      </div>
                      {renderStatusControls(listing)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

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
                await loadDashboard();
              }
            }}>Yes, mark as Sold</Button>
          </ModalFooter>
        </Modal>

        <div id="favorites" className="d-flex align-items-center justify-content-between mt-5 mb-3" style={{ scrollMarginTop: 80 }}>
          <h5 className="fw-bold mb-0">Favorites</h5>
          <Button color="light" size="sm" onClick={() => router.push("/listings")}>Browse listings</Button>
        </div>
        <Row className="g-4">
          {favorites.length === 0 ? (
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <CardBody className="py-5 text-center text-muted">
                  You have no saved favorites yet. Save listings with the heart button to see them here.
                </CardBody>
              </Card>
            </Col>
          ) : favorites.map((favorite) => (
            <Col key={favorite.id} md={6} xl={4}>
              <Card className="border-0 shadow-sm h-100">
                <FavoriteImage src={favorite.image} alt={favorite.product_name} />
                <CardBody className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between gap-3 align-items-start">
                    <div>
                      <Badge color="secondary" pill className="mb-2">{favorite.category_name || "General"}</Badge>
                      <h6 className="fw-semibold mb-1">{favorite.product_name}</h6>
                      <div className="text-muted small">by {favorite.user?.name || "Unknown seller"}</div>
                      {favorite.user?.address ? <div className="text-muted small">{favorite.user.address}</div> : null}
                    </div>
                    <div className="fw-bold text-primary">{formatDisplayCurrency(favorite.price)}</div>
                  </div>
                  <div className="text-muted small">
                    Saved {favorite.favoriteCreatedAt ? new Date(favorite.favoriteCreatedAt).toLocaleDateString() : "recently"}
                  </div>
                  <div className="d-flex gap-2 mt-auto">
                    <Button color="primary" className="flex-grow-1" onClick={() => router.push(`/product/${favorite.id}`)}>
                      View listing
                    </Button>
                    <Button
                      color="light"
                      onClick={async () => {
                        await fetch("/api/favorites", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ productId: favorite.id }),
                        });
                        setFavorites((current) => current.filter((item) => item.id !== favorite.id));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

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
                <div className="fw-semibold">{user.email || "Not added yet"}</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Address</label>
                <div className="fw-semibold">{formatUserAddress(user) || "Not added yet"}</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Member Since</label>
                <div className="fw-semibold">{memberSince}</div>
              </Col>
              <Col md={6}>
                <label className="text-muted small d-block mb-1">Account Status</label>
                <Badge color={user.status === "active" ? "success" : "secondary"} pill>{user.status || "Active"}</Badge>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Connected sign-in methods */}
        <h5 className="fw-bold mt-5 mb-3">Connected Sign-In Methods</h5>
        <Card className="border-0 shadow-sm">
          <CardBody>
            <Row className="g-3">
              <Col md={4}>
                <label className="text-muted small d-block mb-1">Google</label>
                <Badge color={user.googleLinked ? "success" : "secondary"} pill>
                  {user.googleLinked ? "Connected" : "Not connected"}
                </Badge>
              </Col>
              <Col md={4}>
                <label className="text-muted small d-block mb-1">Facebook</label>
                <Badge color={user.facebookLinked ? "success" : "secondary"} pill>
                  {user.facebookLinked ? "Connected" : "Not connected"}
                </Badge>
              </Col>
              <Col md={4}>
                <label className="text-muted small d-block mb-1">Phone / WhatsApp</label>
                {user.phone ? (
                  <div>
                    <div className="fw-semibold small mb-1">{user.phone}</div>
                    <Badge color={user.phoneVerifiedAt ? "success" : "warning"} pill>
                      {user.phoneVerifiedAt ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                ) : (
                  <Badge color="secondary" pill>Not added</Badge>
                )}
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}
