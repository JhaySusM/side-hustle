"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedListings from "@/components/FeaturedListings";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { NO_LOCATION_LABEL } from "@/lib/pakistan-cities";

export default function Home() {
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function scrollToFeatured() {
    document.getElementById("featured-listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelectCategory(nextCategory, nextSubcategory = "") {
    setCategory(nextCategory);
    setSubcategory(nextSubcategory);
    scrollToFeatured();
  }

  function handleSearch(nextQuery) {
    setQuery(nextQuery);
    scrollToFeatured();
  }

  function handleLocationChange(nextLocation) {
    setLocation(nextLocation === NO_LOCATION_LABEL ? "" : nextLocation);
    scrollToFeatured();
  }

  return (
    <div>
      <Navbar />
      <Hero
        activeCategory={category}
        activeSubcategory={subcategory}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onLocationChange={handleLocationChange}
      />
      <Categories />
      <div id="featured-listings">
        <FeaturedListings
          filter={category}
          subcategoryFilter={subcategory}
          search={query}
          locationFilter={location}
        />
      </div>
      <CallToAction />
      <Footer />
    </div>
  );
}
