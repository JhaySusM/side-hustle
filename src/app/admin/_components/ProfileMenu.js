"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfileMenu({ onSignOut }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleDocClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  return (
    <div className="profile-wrap" ref={wrapRef}>
      <div
        className="admin-av"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        A
      </div>
      <div className={`profile-menu${open ? " show" : ""}`}>
        <button type="button" className="profile-item danger" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
