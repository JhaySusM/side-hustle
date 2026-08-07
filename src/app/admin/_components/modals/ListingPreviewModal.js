import Overlay from "./Overlay";

export default function ListingPreviewModal({ listing, onClose }) {
  return (
    <Overlay show={Boolean(listing)} onClose={onClose} maxWidth={860}>
      <h3>{listing?.title || "Listing Preview"}</h3>
      <div className="listing-preview-grid">
        <div className="listing-preview-stack">
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="listing-preview-media"
              src={listing?.imageUrl || "https://placehold.co/720x420?text=No+Image"}
              alt="Listing preview"
            />
            {listing?.imageUrl ? (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => window.open(listing.imageUrl, "_blank")}
                style={{ position: "absolute", right: 10, bottom: 10, background: "#fff" }}
              >
                🔍 View Full Image
              </button>
            ) : null}
          </div>
          <div className="listing-preview-desc">{listing?.description || "No description available."}</div>
        </div>
        <div className="listing-preview-stack">
          <div className="listing-preview-meta">
            <div className="listing-preview-box">
              <div className="k">Seller</div>
              <div className="v">{listing?.seller || "-"}</div>
            </div>
            <div className="listing-preview-box">
              <div className="k">Price</div>
              <div className="v">{listing?.price || "-"}</div>
            </div>
            <div className="listing-preview-box">
              <div className="k">Category</div>
              <div className="v">{listing?.cat || "-"}</div>
            </div>
            <div className="listing-preview-box">
              <div className="k">City</div>
              <div className="v">{listing?.city || "-"}</div>
            </div>
            <div className="listing-preview-box">
              <div className="k">Status</div>
              <div className="v">{listing?.status || "-"}</div>
            </div>
            <div className="listing-preview-box">
              <div className="k">Flag</div>
              <div className="v">{listing?.flagLabel || "-"}</div>
            </div>
          </div>
          <div className="listing-preview-box">
            <div className="k">Listed</div>
            <div className="v">{listing?.time || "-"}</div>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      </div>
    </Overlay>
  );
}
