import React, { useState } from "react";
import "../css/Favorites.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

const SORT_OPTIONS = [
  { label: "Date Added", value: "added" },
  { label: "Rating ↓", value: "rating" },
  { label: "Year ↓", value: "year" },
  { label: "Title A–Z", value: "title" },
];

const FILTER_CHIPS = ["All", "Movies", "TV Shows"];

const Favorites = () => {
  const { favorites } = useMovieContext();
  const count = favorites.length;

  // UI-only state — logic wired in next step
  const [sortBy, setSortBy] = useState("added");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  /* ════ EMPTY STATE ════════════════════════════════════════════════ */
  if (count === 0) {
    return (
      <div className="page favorites-page">
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
  }

  // Counts for stat pills (UI only — no filtering logic yet)
  const movieCount = favorites.filter((m) => m.media_type !== "tv").length;
  const tvCount = favorites.filter((m) => m.media_type === "tv").length;
  const avgRating = (
    favorites.reduce((s, m) => s + (m.vote_average ?? 0), 0) / count
  ).toFixed(1);

  // ── Active filter indicator ───────────────────────────────────────
  const isFiltered = searchQuery.trim() !== "" || filterType !== "All";

  /* ════ HAS ITEMS ══════════════════════════════════════════════════ */
  return (
    <div className="page favorites-page">
      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <header className="page-hero favorites-hero">
        <p className="favorites-eyebrow">Your Collection</p>
        <h1 className="favorites-heading">
          My <span>Favorites</span>
        </h1>
        <div className="favorites-meta">
          <span className="favorites-count-badge">
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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {count} {count === 1 ? "title" : "titles"}
          </span>
          <span className="favorites-sub">saved to your collection</span>
        </div>
      </header>

      <div className="favorites-divider" />

      {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
      <div className="fav-stats-strip">
        {[
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            ),
            value: movieCount,
            label: "Movies",
            color: "#e50914",
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            ),
            value: tvCount,
            label: "TV Shows",
            color: "#3b82f6",
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#f5c518"
                stroke="none"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ),
            value: avgRating,
            label: "Avg Rating",
            color: "#f5c518",
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="8 21 12 17 16 21" />
                <path d="M6 3H18" />
                <path d="M6 3v4a6 6 0 0 0 12 0V3" />
                <path d="M6 7c-1.11 0-2 .89-2 2v1a4 4 0 0 0 8 0V9a2 2 0 0 0-2-2" />
                <path d="M18 7c1.11 0 2 .89 2 2v1a4 4 0 0 1-8 0V9a2 2 0 0 1 2-2" />
                <line x1="12" y1="17" x2="12" y2="12" />
              </svg>
            ),
            value: favorites.filter((m) => (m.vote_average ?? 0) >= 8).length,
            label: "Acclaimed",
            color: "#f59e0b",
          },
        ].map((s, i) => (
          <div
            className="fav-stat-pill"
            key={s.label}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="fav-stat-icon" style={{ color: s.color }}>
              {s.icon}
            </span>
            <div className="fav-stat-body">
              <span className="fav-stat-value" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="fav-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TOOLBAR ══════════════════════════════════════════════════ */}
      <div className="favorites-toolbar">
        {/* Search */}
        <div className="fav-search-wrap">
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Filter your favorites…"
            className="fav-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Filter favorites"
          />
          {searchQuery && (
            <button
              type="button"
              className="fav-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort + view toggle */}
        <div className="fav-toolbar-right">
          <span className="fav-sort-label">Sort</span>
          <select
            className="fav-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Grid / List toggle */}
          <div className="fav-view-toggle">
            <div
              type="button"
              className={`fav-view-btn ${viewMode === "grid" ? "fav-view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div
              type="button"
              className={`fav-view-btn ${viewMode === "list" ? "fav-view-btn--active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FILTER CHIPS ═════════════════════════════════════════════ */}
      <div className="fav-filter-row">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`filter-chip ${filterType === chip ? "active" : ""}`}
            onClick={() => setFilterType(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Result count when filtering */}
      {isFiltered && (
        <div className="wl-result-count">
          {favorites.length} result{favorites.length !== 1 ? "s" : ""}
          {searchQuery.trim() && ` for "${searchQuery.trim()}"`}
          <button
            type="button"
            className="fav-clear-filters"
            onClick={() => {
              setSearchQuery("");
              setFilterType("All");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ══ GRID VIEW ════════════════════════════════════════════════ */}
      {viewMode === "grid" && (
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
      )}

      {/* ══ LIST VIEW ════════════════════════════════════════════════ */}
      {viewMode === "list" && (
        <section className="fav-list-section">
          {favorites.map((movie, i) => (
            <div
              key={movie.id}
              className="fav-list-row"
              style={{ animationDelay: `${Math.min(i * 35, 500)}ms` }}
            >
              {/* Rank */}
              <span className="fav-list-rank">#{i + 1}</span>

              {/* Poster */}
              <div className="fav-list-thumb">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="fav-list-thumb-placeholder">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ opacity: 0.2 }}
                    >
                      <rect x="2" y="2" width="20" height="20" rx="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="fav-list-info">
                <h3 className="fav-list-title">{movie.title ?? movie.name}</h3>
                <div className="fav-list-meta">
                  <span className="fav-list-year">
                    {
                      (movie.release_date ?? movie.first_air_date ?? "").split(
                        "-",
                      )[0]
                    }
                  </span>
                  <span
                    className={`fav-list-type fav-list-type--${movie.media_type ?? "movie"}`}
                  >
                    {movie.media_type === "tv" ? "TV" : "Movie"}
                  </span>
                  <span className="fav-list-rating">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="#f5c518"
                      stroke="none"
                    >
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                    {movie.vote_average?.toFixed(1) ?? "—"}
                  </span>
                </div>
                {movie.overview && (
                  <p className="fav-list-overview">{movie.overview}</p>
                )}
              </div>

              {/* Favourite (filled heart — always active on this page) */}
              <div className="fav-list-heart">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#e50914"
                  stroke="none"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default Favorites;
