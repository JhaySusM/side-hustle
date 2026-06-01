export default function Hero() {
  return (
    <section
      id="home"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        minHeight: 420,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.48)",
      }} />

      {/* Content */}
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div style={{ maxWidth: 560 }}>
          <h2 className="fw-bold mb-3 text-white" style={{ fontSize: "2.2rem" }}>
            Buy &amp; Sell Anything Near You
          </h2>
          <p className="mb-4 text-white" style={{ opacity: 0.9 }}>
            Post your items, chat with buyers, and close deals — all in one place.
          </p>
        </div>
      </div>
    </section>
  );
}
