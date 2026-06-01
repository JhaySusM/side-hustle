"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Form, FormGroup, Label, Input, Button,
  Card, CardBody, Alert,
} from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function PostPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "" });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkAuthAndFetchCategories() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push("/");
          return;
        } else {
          setUser(data.user);
        }
        // Fetch categories
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        if (catRes.ok && catData.categories) {
          setCategories(catData.categories);
        }
      } catch {
        router.push("/");
      }
    }
    checkAuthAndFetchCategories();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description || !form.price || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isNaN(form.price) || Number(form.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!imageFiles.length) {
      setError("Please upload at least one image.");
      return;
    }
    const selectedCategory = categories.find((cat) => cat.category_name === form.category);
    if (!selectedCategory) {
      setError("Invalid category selected.");
      return;
    }
    try {
      let imageUrl = null;
      let extraUrls = [];
      if (imageFiles.length) {
        setUploading(true);
        const uploaded = await Promise.all(imageFiles.map(uploadToCloudinary));
        setUploading(false);
        imageUrl = uploaded[0];
        extraUrls = uploaded.slice(1);
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: form.title,
          price: form.price,
          description: form.description,
          image: imageUrl,
          images: extraUrls.length ? extraUrls : null,
          category_table_id: selectedCategory.id,
          user_id: user.id,
          upload_date_time: new Date().toISOString(),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post ad.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setUploading(false);
      setError("Failed to post ad. Please try again.");
    }
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <Container className="py-5" style={{ maxWidth: 660 }}>
        <h4 className="fw-bold mb-4">Post a New Ad</h4>
        <Card className="border-0 shadow-sm">
          <CardBody className="p-4">
            {error && <Alert color="danger">{error}</Alert>}
            {success && <Alert color="success">Ad posted! Redirecting to dashboard...</Alert>}
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Title <span className="text-danger">*</span></Label>
                <Input
                  placeholder="e.g. iPhone 14 Pro Max – Like New"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Category <span className="text-danger">*</span></Label>
                <Input
                  type="select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">— Select a category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup>
                <Label>Price (₱) <span className="text-danger">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 5000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Description <span className="text-danger">*</span></Label>
                <Input
                  type="textarea"
                  rows={4}
                  placeholder="Describe your item — condition, what's included, etc."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Images <span className="text-danger">*</span> <span className="text-muted small">(first = thumbnail, up to 5)</span></Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #dee2e6", borderRadius: 8, padding: 16,
                    textAlign: "center", cursor: "pointer", background: "#f8fafc",
                    minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <div className="text-muted">
                    <div style={{ fontSize: 28 }}>📷</div>
                    <div className="small mt-1">Click to add images</div>
                    <div className="small text-muted">JPG, PNG, WEBP — up to 5</div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setImageFiles((prev) => {
                      const combined = [...prev, ...newFiles].slice(0, 5);
                      setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
                      return combined;
                    });
                    fileInputRef.current.value = "";
                  }}
                />
                {imagePreviews.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src} alt={`preview ${i}`}
                          style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 6,
                            border: i === 0 ? "2px solid #0a9e8f" : "2px solid #dee2e6" }}
                        />
                        {i === 0 && (
                          <span style={{
                            position: "absolute", bottom: 4, left: 4,
                            background: "#0a9e8f", color: "#fff",
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10,
                          }}>COVER</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setImageFiles((prev) => { const n = prev.filter((_, j) => j !== i); setImagePreviews(n.map((f) => URL.createObjectURL(f))); return n; });
                          }}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "#dc3545", color: "#fff", border: "none",
                            fontSize: 12, lineHeight: 1, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormGroup>
              <div className="d-flex gap-2 mt-2">
                <Button color="primary" type="submit" disabled={uploading}>
                  {uploading ? `Uploading images...` : "Post Ad"}
                </Button>
                <Button color="light" className="border" type="button" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}
