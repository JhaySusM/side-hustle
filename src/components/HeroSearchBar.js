"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PAKISTAN_CITIES, NO_LOCATION_LABEL } from "@/lib/pakistan-cities";

const LOCATION_OPTIONS = [NO_LOCATION_LABEL, ...PAKISTAN_CITIES.map((city) => city.name)];

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

export default function HeroSearchBar({ mobileTeal = false, onSearch, onLocationChange }) {
  const router = useRouter();
  const [location, setLocation] = useState(NO_LOCATION_LABEL);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("q") || "";
    const nextLocation = params.get("location") || NO_LOCATION_LABEL;

    setQuery(nextQuery);
    setLocation(nextLocation);
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    if (onSearch) {
      onSearch(query.trim());
      return;
    }

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (location.trim() && location !== NO_LOCATION_LABEL) {
      params.set("location", location.trim());
    }

    router.push(params.toString() ? `/listings?${params.toString()}` : "/listings");
  }

  function handleLocationSelect(event) {
    const value = event.target.value;
    setLocation(value);
    onLocationChange?.(value);
  }

  if (mobileTeal) {
    return (
      <div className="hero-mobile-teal-panel">
        <div className="hero-mobile-teal-top">
          <Image
            src="/img/header/Logo TradiGo.png"
            alt="TradiGo"
            width={112}
            height={35}
            className="hero-mobile-teal-logo"
          />
          <label className="hero-mobile-location-pill" aria-label="Select location">
            <span className="hero-mobile-location-pin"><LocationPinIcon /></span>
            <span className="hero-mobile-location-value">{location}</span>
            <span className="hero-mobile-location-caret">▾</span>
            <select
              value={location}
              onChange={handleLocationSelect}
              className="hero-mobile-location-select"
            >
              {LOCATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <form className="hero-mobile-teal-search" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find cars, mobiles, furniture..."
            className="hero-mobile-teal-search-input"
          />
          <button type="submit" className="hero-mobile-teal-search-btn" aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>
    );
  }

  return (
    <form className="hero-search-shell" onSubmit={handleSearch}>
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

      <label className="hero-query-field" aria-label="Search listings">
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
