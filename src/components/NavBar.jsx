import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";
import "../css/NavBar.css";

const NavBar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      {/* ── Left ── */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          {/* <img src={logo} alt="MovieCompass" /> */}
          MovieCompass
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>

          <Link
            to="/movies"
            className={`nav-link ${pathname === "/movies" ? "active" : ""}`}
          >
            Movies
          </Link>

          <Link
            to="/tvshows"
            className={`nav-link ${pathname === "/tvshows" ? "active" : ""}`}
          >
            TV Shows
          </Link>

          <Link
            to="/trending"
            className={`nav-link ${pathname === "/trending" ? "active" : ""}`}
          >
            Trending
          </Link>

          <Link
            to="/genres"
            className={`nav-link ${pathname === "/genres" ? "active" : ""}`}
          >
            Genres
          </Link>

          <Link
            to="/favorites"
            className={`nav-link ${pathname === "/favorites" ? "active" : ""}`}
          >
            Favorites
          </Link>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="navbar-right">
        {/* Search icon – wired to Home's search bar via a quick hash scroll */}
        <a href="#search" className="nav-icon-btn" title="Search">
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
        </a>

        {/* Avatar */}
        <div className="nav-avatar" title="Profile">
          MC
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
