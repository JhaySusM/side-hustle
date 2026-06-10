"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LOCATION_OPTIONS = [
  "Pakistan",
  "Islamabad",
  "Karachi",
  "Lahore",
  "Rawalpindi",
  "Peshawar",
];

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.4" />
    </svg>
  );
}

export default function HeroSearchBar({ homepage = false }) {
  const router = useRouter();
  const [location, setLocation] = useState("Pakistan");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("q") || "";
    const nextLocation = params.get("location") || "Pakistan";

    setQuery(nextQuery);
    setLocation(nextLocation);
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    router.push(params.toString() ? `/listings?${params.toString()}` : "/listings");
  }

  return (
    <form className={`hero-search-shell${homepage ? " hero-search-shell-home" : ""}`} onSubmit={handleSearch}>
      <label className="hero-location-field" aria-label="Select location">
        <span className="hero-field-icon hero-location-icon"><LocationPinIcon /></span>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="hero-location-select"
        >
          {LOCATION_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className={`hero-query-field${homepage ? " hero-query-field-home" : ""}`} aria-label="Search listings">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search For"
          className="hero-query-input"
        />
        <button type="submit" className="hero-search-button" aria-label="Search">
          <SearchIcon />
        </button>
      </label>
    </form>
  );
}
