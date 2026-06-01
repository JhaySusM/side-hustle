"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedListings from "@/components/FeaturedListings";
import HowItWorks from "@/components/HowItWorks";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  function handleCategorySelect(cat) {
    setSelectedCategory(cat === selectedCategory ? null : cat);
  }

  return (
    <div>
      <Navbar />
      <Hero />
      <Categories selected={selectedCategory} onSelect={handleCategorySelect} />
      <FeaturedListings filter={selectedCategory} />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </div>
  );
}
