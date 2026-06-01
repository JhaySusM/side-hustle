"use client";
import { Row, Col } from "reactstrap";
import Image from "next/image";

const steps = [
  {
    icon: "https://img.icons8.com/ios-filled/50/000000/add-image.png",
    title: "Post Your Ad",
    desc: "Snap a photo, set your price, and publish in seconds.",
  },
  {
    icon: "https://img.icons8.com/ios-filled/50/000000/chat.png",
    title: "Chat with Buyers",
    desc: "Negotiate directly with interested buyers through in-app chat.",
  },
  {
    icon: "https://img.icons8.com/ios-filled/50/000000/handshake.png",
    title: "Close the Deal",
    desc: "Meet up, exchange, and leave a rating. Simple as that.",
  },
];

export default function HowItWorks() {
  return (
    <section id="about" className="container py-5">
      <h3 className="fw-bold mb-4">How It Works</h3>
      <Row className="text-center g-4">
        {steps.map((step) => (
          <Col key={step.title} md={4}>
            <Image src={step.icon} width={56} height={56} alt={step.title} className="how-img mb-2" />
            <h5>{step.title}</h5>
            <p>{step.desc}</p>
          </Col>
        ))}
      </Row>
    </section>
  );
}
