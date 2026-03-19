import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import logo from "../assets/images/logo.png";
import "../css/NavBar.css";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/tvshows", label: "TV Shows" },
  { to: "/actors", label: "Actors" },
  { to: "/trending", label: "Trending" },
  { to: "/genres", label: "Genres" },
  { to: "/favorites", label: "Favorites" },
  { to: "/watchlist", label: "Watch List" },
];

const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);

  /* close drawer on route change */
  useEffect(() => {
    setTimeout(() => setDrawerOpen(false), 100); // slight delay to allow click to register
  }, [pathname]);

  /* close drawer on outside click */
  useEffect(() => {
    if (!drawerOpen) return;

    const handler = (e) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target)
      ) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  /* lock body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const scrollToSearch = () => {
    if (pathname === "/") {
      // Already on Home — just scroll to the search anchor
      document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        document.querySelector(".search-input")?.focus();
      }, 400);
    } else {
      // Navigate to Home, then scroll after the page renders
      navigate("/");
      setTimeout(() => {
        document
          .getElementById("search")
          ?.scrollIntoView({ behavior: "smooth" });
        document.querySelector(".search-input")?.focus();
      }, 300);
    }
  };

  return (
    <section>
      <nav className="navbar">
        {/* ── Left ── */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            {/* <img src={logo} alt="MovieCompass" /> */}
            CinemaTracker
          </Link>

          <div className="navbar-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${pathname === to ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="navbar-right">
          {/* Search icon – wired to Home's search bar via a quick hash scroll */}
          <div
            className="nav-icon-btn"
            title="Search"
            aria-label="Go to search"
            onClick={scrollToSearch}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Avatar */}
          <div className="nav-avatar" title="Profile">
            CT
          </div>

          {/* hamburger */}
          <button
            ref={hamburgerRef}
            className={`nav-hamburger ${drawerOpen ? "open" : ""}`}
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="mobile-drawer" ref={drawerRef}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-link ${pathname === to ? "active" : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default NavBar;
