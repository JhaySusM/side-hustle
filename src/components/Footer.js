"use client";
import { Row, Col } from "reactstrap";

export default function Footer() {
  return (
    <footer id="contact" className="footer py-5 mt-5">
      <div className="container">
        <Row>
          <Col md={4} className="mb-3">
            <h5>Batjee.com</h5>
            <p>The modern marketplace to post, talk, and deal. Buy and sell anything locally with confidence.</p>
          </Col>
          <Col md={4} className="mb-3">
            <h5>Quick Links</h5>
            <p>
              <a href="#">Home</a> &bull;{" "}
              <a href="#">Marketplace</a> &bull;{" "}
              <a href="#">About Us</a> &bull;{" "}
              <a href="#">Contact</a> &bull;{" "}
              <a href="#">Terms</a> &bull;{" "}
              <a href="#">Privacy</a>
            </p>
          </Col>
          <Col md={4} className="mb-3">
            <h5>Contact</h5>
            <p>
              hello@batjee.com
              <br />
              Tokyo, Japan
            </p>
          </Col>
        </Row>
        <div className="text-center mt-3">
          <small>© 2026 Batjee.com — All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}
