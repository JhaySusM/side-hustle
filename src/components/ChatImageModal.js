"use client";
import { Modal, ModalBody } from "reactstrap";

export default function ChatImageModal({ isOpen, toggle, imageUrl }) {
  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" contentClassName="border-0 bg-transparent shadow-none">
      <ModalBody className="p-0 position-relative d-flex justify-content-center align-items-center" style={{ minHeight: 240 }}>
        <button
          type="button"
          onClick={toggle}
          aria-label="Close image viewer"
          style={{
            position: "absolute",
            top: -14,
            right: -14,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "rgba(15, 23, 42, 0.9)",
            color: "#fff",
            fontSize: 22,
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          ×
        </button>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Expanded chat attachment"
            style={{
              width: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 18,
              background: "#fff",
            }}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
