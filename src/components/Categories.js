"use client";
import { Row, Col } from "reactstrap";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ICONS = {
  Electronics: "https://img.icons8.com/ios-filled/50/000000/laptop.png",
  Vehicles: "https://img.icons8.com/ios-filled/50/000000/car.png",
  Furniture: "https://img.icons8.com/ios-filled/50/000000/sofa.png",
  Fashion: "https://img.icons8.com/ios-filled/50/000000/t-shirt.png",
  Sports: "https://img.icons8.com/ios-filled/50/000000/basketball.png",
  Books: "https://img.icons8.com/ios-filled/50/000000/book.png",
  Music: "https://img.icons8.com/ios-filled/50/000000/musical-notes.png",
  Gaming: "https://img.icons8.com/ios-filled/50/000000/controller.png",
};
const FALLBACK_ICON = "https://img.icons8.com/ios-filled/50/000000/category.png";

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok && data.categories) {
          setCategories(data.categories);
        }
      } catch {}
    }
    fetchCategories();
  }, []);

  return (
    <section id="marketplace" className="container py-4">
      <h3 className="fw-bold mb-4">Browse Categories</h3>
      <Row className="g-3">
        {categories.map((cat) => {
          const icon = ICONS[cat.category_name] || FALLBACK_ICON;
          return (
            <Col key={cat.id} xs={6} md={3} className="text-center">
              <div
                  onClick={() => router.push(`/listings?category=${encodeURIComponent(cat.category_name)}`)}
                style={{ cursor: "pointer" }}
                  className="py-3 rounded-3 border border-transparent"
              >
                  <div className="category-icon mb-2" style={{ margin: "0 auto" }}>
                  <Image src={icon} width={40} height={40} alt={cat.category_name} />
                </div>
                  <div style={{ fontWeight: 400 }}>
                  {cat.category_name}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
