"use client";
import { useState } from "react";
import { Row, Col, Button } from "reactstrap";
import Image from "next/image";
import AuthModal from "./AuthModal";
import { useRouter } from "next/navigation";

export default function CallToAction() {
  const router = useRouter();
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = localStorage.getItem("batjee_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [authOpen, setAuthOpen] = useState(false);

  function handleClick() {
    if (user) {
      router.push("/post");
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <section className="container py-5">
      <Row className="align-items-center">
        <Col md={7}>
          <h3 className="fw-bold mb-3">Ready to Start Selling?</h3>
          <p>Join thousands of sellers on Batjee.com and reach buyers in your area today.</p>
          <Button color="success" size="lg" onClick={handleClick}>
            Post Your First Ad — Free
          </Button>
        </Col>
        <Col md={5} className="text-center mt-4 mt-md-0">
          <Image
            src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80"
            alt="Woman shopping"
            width={400}
            height={280}
            className="img-fluid rounded shadow"
          />
        </Col>
      </Row>

      <AuthModal
        isOpen={authOpen}
        toggle={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
        onLoginSuccess={() => {
          setAuthOpen(false);
          router.push("/post");
        }}
      />
    </section>
  );
}
