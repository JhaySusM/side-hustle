export default function Overlay({ show, onClose, children, maxWidth }) {
  if (!show) return null;

  return (
    <div
      className="modal-overlay show"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-modal" style={maxWidth ? { maxWidth } : undefined}>
        {children}
      </div>
    </div>
  );
}
