import React from "react";
import "../css/Favorites.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { favorites } = useMovieContext();
  const count = favorites.length;

  if (count > 0) {
    return (
      <div className="favorites-page">
        {/* Hero header */}
        <header className="favorites-hero">
          <p className="favorites-eyebrow">Your Collection</p>
          <h1 className="favorites-heading">
            My <span>Favorites</span>
          </h1>
          <div className="favorites-meta">
            <span className="favorites-count-badge">
              {/* film-strip icon */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              {count} {count === 1 ? "title" : "titles"}
            </span>
            <span className="favorites-sub">saved to your list</span>
          </div>
        </header>

        {/* Red accent divider */}
        <div className="favorites-divider" />

        {/* Grid */}
        <section className="favorites-grid-section">
          <div className="movies-grid">
            {favorites.map((movie, i) => (
              <div
                key={movie.id}
                style={{ animationDelay: `${Math.min(i * 50, 700)}ms` }}
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── Empty state ── */
  return (
    <div className="favorites-page">
      <div className="favorites-empty">
        <div className="empty-icon-wrap">
          <div className="empty-icon-inner">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e50914"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>

        <h2>No Favorites Yet</h2>
        <p>
          Browse movies and tap the&nbsp;
          <span style={{ color: "#e50914" }}>❤</span>
          &nbsp;on any title to save it here.
        </p>

        <Link to="/" className="btn-go-home">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Discover Movies
        </Link>
      </div>
    </div>
  );
};

export default Favorites;
