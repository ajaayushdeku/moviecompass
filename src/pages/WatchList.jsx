import React, { useEffect, useMemo, useState } from "react";
import "../css/WatchList.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";
import MediaIcon from "../components/MediaIcon";

const SORT_OPTIONS = [
  { label: "Date Added", value: "added" },
  { label: "Rating ↓", value: "rating" },
  { label: "Year ↓", value: "year" },
  { label: "Title A–Z", value: "title" },
];

const FILTER_CHIPS = ["All", "Movies", "TV Shows"];

const STATUS_OPTIONS = [
  { value: "all", label: "All", color: "var(--muted)" },
  { value: "unwatched", label: "Unwatched", color: "#3b82f6" },
  { value: "watching", label: "Watching", color: "#f59e0b" },
  { value: "watched", label: "Watched", color: "#22c55e" },
];

// ── Progress badge ────────────────────────────────────────────────
const ProgressBadge = ({ status }) => {
  const map = {
    unwatched: {
      label: "Unwatched",
      color: "#3b82f6",
      icon: (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    watching: {
      label: "Watching",
      color: "#f59e0b",
      icon: (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <polygon points="5,3 19,12 5,21" />
        </svg>
      ),
    },
    watched: {
      label: "Watched",
      color: "#22c55e",
      icon: (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
  };
  const s = map[status] ?? map.unwatched;
  return (
    <span
      className="wl-progress-badge"
      style={{
        color: s.color,
        borderColor: `${s.color}40`,
        background: `${s.color}14`,
      }}
    >
      {s.icon}
      {s.label}
    </span>
  );
};

// ═════════════════════════════════════════════════════════════════
const WatchList = () => {
  const {
    watchList,
    updateStatus,
    resetStatus,
    getWatchStatus,
    isWatchListed,
    removeFromWatchList,
  } = useMovieContext();

  const count = watchList.length;

  const [sortBy, setSortBy] = useState("added");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLoad, setCurrentLoad] = useState(viewMode === "grid" ? 10 : 5);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /* ── Reset pagination whenever any filter/sort/search changes ── */
  useEffect(() => {
    setCurrentLoad(viewMode === "grid" ? 10 : 5);
  }, [sortBy, viewMode, filterType, filterStatus, searchQuery]);

  /* ── Filter by media type ── */
  const mediaTypeFiltered = useMemo(() => {
    if (filterType === "Movies")
      return watchList.filter((m) => m.media_type === "movie");
    if (filterType === "TV Shows")
      return watchList.filter((m) => m.media_type === "tv");
    return watchList;
  }, [filterType, watchList]);

  /* ── Filter by watch status ── */
  const statusFiltered = useMemo(() => {
    if (filterStatus === "all") return mediaTypeFiltered;
    return mediaTypeFiltered.filter((m) => m.status === filterStatus);
  }, [mediaTypeFiltered, filterStatus]);

  /* ── Sort ── */
  const sorted = useMemo(() => {
    const arr = [...statusFiltered];
    switch (sortBy) {
      case "rating":
        return arr.sort(
          (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
        );
      case "year":
        return arr.sort((a, b) =>
          (b.release_date ?? "").localeCompare(a.release_date ?? ""),
        );
      case "title":
        return arr.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
      default:
        return arr; // "added" = insertion order
    }
  }, [statusFiltered, sortBy]);

  /* ── Search filter ── */
  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) =>
      (m.title ?? m.name ?? "").toLowerCase().includes(q),
    );
  }, [sorted, searchQuery]);

  /* ── Pagination ── */
  const totalItems = searched.length;
  const hasMore = currentLoad < totalItems;
  const visibleWatchListItems = searched.slice(0, currentLoad);

  /* ── Load more handler ── */
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setCurrentLoad((prev) => Math.min(prev + 5, count));
      setLoadingMore(false);
    }, 1500); // Simulate loading delay
  };

  /* ── Stats ── */
  const movieCount = watchList.filter((m) => m.media_type === "movie").length;
  const tvCount = watchList.filter((m) => m.media_type === "tv").length;
  const watchedCount = watchList.filter((m) => m.status === "watched").length;
  const watchingCount = watchList.filter((m) => m.status === "watching").length;
  const avgRating =
    count > 0
      ? (
          watchList.reduce((s, m) => s + (m.vote_average ?? 0), 0) / count
        ).toFixed(1)
      : "—";

  // ── Active filter indicator ───────────────────────────────────────
  const isFiltered =
    searchQuery.trim() !== "" || filterType !== "All" || filterStatus !== "all";

  /* ════ EMPTY STATE ════════════════════════════════════════════════ */
  if (count === 0) {
    return (
      <div className="page wl-page">
        <div className="wl-empty-page">
          <div className="wl-empty-icon-wrap">
            <div className="wl-empty-icon-inner">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <h2>Your Watchlist is Empty</h2>
          <p>
            Browse movies and TV shows and hit the&nbsp;
            <span style={{ color: "#3b82f6" }}>🔖</span>
            &nbsp;button to save titles you want to watch later.
          </p>
          <Link to="/" className="wl-btn-browse">
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
            Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  /* ════ HAS ITEMS ══════════════════════════════════════════════════ */
  return (
    <div className="page wl-page">
      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <header className="page-hero wl-hero">
        {/* <div className="wl-hero-bg" />
        <div className="wl-hero-noise" /> */}
        {/* <div className="wl-hero-content"> */}
        <p className="wl-eyebrow">Up Next</p>
        <h1 className="wl-title">
          My <span>Watchlist</span>
        </h1>
        <div className="wl-hero-meta">
          <span className="wl-count-badge">
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
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {count} {count === 1 ? "title" : "titles"}
          </span>
          <span className="wl-hero-sub">saved to watch later</span>
        </div>
        {/* </div> */}
      </header>

      <div className="wl-divider" />

      {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
      <div className="wl-stats-strip">
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
                {/* Clapperboard — Movies */}
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            ),
            value: movieCount,
            label: "Movies",
            color: "#ff3943",
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
                {/* TV screen — TV Shows */}
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
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Checkmark circle — Watched */}
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
            value: watchedCount,
            label: "Watched",
            color: "#22c55e",
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
                {/* Play circle — Watching */}
                <circle cx="12" cy="12" r="10" />
                <polygon
                  points="10 8 16 12 10 16 10 8"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            ),
            value: watchingCount,
            label: "Watching",
            color: "#f59e0b",
          },
          {
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#f5c518"
                stroke="none"
              >
                {/* Star — Avg Rating */}
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ),
            value: avgRating,
            label: "Avg Rating",
            color: "#f5c518",
          },
        ].map((s, i) => (
          <div
            className="wl-stat-pill"
            key={s.label}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="wl-stat-icon" style={{ color: s.color }}>
              {s.icon}
            </span>
            <div className="wl-stat-body">
              <span className="wl-stat-value" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="wl-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TOOLBAR ══════════════════════════════════════════════════ */}
      <div className="wl-toolbar">
        {/* ── Search bar ── */}
        <div className="wl-search-wrap">
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
            placeholder="Search your watchlist…"
            className="wl-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search watchlist"
          />

          {/* clear × button — only when there's text */}
          {searchQuery && (
            <button
              type="button"
              className="wl-search-clear"
              onClick={() => {
                setSearchQuery("");
              }}
              aria-label="Clear search"
              tabIndex={-1}
            >
              ✖
            </button>
          )}
        </div>

        {/* Sort + view toggle */}
        <div className="wl-toolbar-right">
          <span className="wl-sort-label">Sort</span>
          <select
            className="wl-sort-select"
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
          <div className="wl-view-toggle">
            <div
              type="button"
              className={`wl-view-btn ${viewMode === "grid" ? "wl-view-btn--active" : ""}`}
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
              className={`wl-view-btn ${viewMode === "list" ? "wl-view-btn--active" : ""}`}
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
      <div className="wl-filter-row">
        {/* Media type */}
        <div className="wl-chips-group">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`wl-chip ${filterType === chip ? "wl-chip--active" : ""}`}
              onClick={() => setFilterType(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        <span className="wl-filter-divider">|</span>

        {/* Watch status */}
        <div className="wl-chips-group">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`wl-chip wl-chip--status ${filterStatus === opt.value ? "wl-chip--status-active" : ""}`}
              style={
                filterStatus === opt.value
                  ? {
                      borderColor: opt.color,
                      color: opt.color,
                      background: `${opt.color}14`,
                    }
                  : {}
              }
              onClick={() => {
                setFilterStatus(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count when filtering */}
      {isFiltered && (
        <div className="wl-result-count">
          {searched.length} result{searched.length !== 1 ? "s" : ""}
          {searchQuery.trim() && ` for "${searchQuery.trim()}"`}
          <button
            type="button"
            className="wl-clear-filters"
            onClick={() => {
              setSearchQuery("");
              setFilterType("All");
              setFilterStatus("all");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      {searched.length === 0 ? (
        <div className="wl-empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.25 }}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <h3>No matches</h3>
          {searchQuery.trim() !== "" ? (
            <p>
              No titles matching "<strong>{searchQuery.trim()}</strong>"
            </p>
          ) : (
            <p>Try adjusting your filters.</p>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            /* ── GRID VIEW ── */
            <section className="wl-grid-section">
              <div className="wl-grid">
                {visibleWatchListItems.map((movie, i) => (
                  <div
                    key={movie.id}
                    style={{ animationDelay: `${Math.min(i * 50, 700)}ms` }}
                  >
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* ── LIST VIEW ── */
            <section className="wl-list-section">
              <div className="wl-list">
                {visibleWatchListItems.map((movie, i) => {
                  const currentStatus = getWatchStatus(movie.id);
                  const watchlisted = isWatchListed(movie.id);

                  return (
                    <div
                      key={movie.id}
                      className="wl-list-row"
                      style={{ animationDelay: `${Math.min(i * 35, 500)}ms` }}
                    >
                      <div className="wl-list-main">
                        {/* Rank */}
                        <span className="wl-list-rank">#{i + 1}</span>

                        {/* Poster */}
                        <div className="wl-list-thumb">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="wl-list-thumb-placeholder">
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
                                <rect
                                  x="2"
                                  y="2"
                                  width="20"
                                  height="20"
                                  rx="2.18"
                                />
                                <line x1="7" y1="2" x2="7" y2="22" />
                                <line x1="17" y1="2" x2="17" y2="22" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="wl-list-info">
                          <h3 className="wl-list-title">{movie.title}</h3>
                          <div className="wl-list-meta">
                            <span className="wl-list-year">
                              {movie.release_date?.split("-")[0]}
                            </span>
                            <span
                              className={`wl-list-type wl-list-type--${movie.media_type}`}
                            >
                              <MediaIcon type={movie.media_type} />
                              {movie.media_type === "tv" ? "TV" : "Movie"}
                            </span>
                            <span className="wl-list-rating">
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
                            <p className="wl-list-overview">{movie.overview}</p>
                          )}
                        </div>
                      </div>

                      {/* Status + actions */}
                      <div className="wl-list-actions">
                        {/* Visual badge showing current status */}
                        <ProgressBadge status={currentStatus} />

                        <div className="wl-list-status-mod">
                          {/* Dropdown — value bound to THIS movie's status from context */}
                          <select
                            className="wl-sort-select"
                            value={currentStatus}
                            onChange={(e) =>
                              updateStatus(movie.id, e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.filter(
                              (o) => o.value !== "all",
                            ).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <span
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                            }}
                          >
                            {/* Reset status button */}
                            <div
                              type="button"
                              className="wl-list-reset-btn"
                              aria-label="Reset status to Unwatched"
                              title="Reset status to Unwatched"
                              onClick={() => resetStatus(movie.id)}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </div>

                            {/* Watchlist Remove */}
                            <div
                              type="button"
                              className={`wl-list-btn ${watchlisted ? "active" : ""}`}
                              onClick={() => removeFromWatchList(movie.id)}
                              title={"Remove from Watchlist"}
                              aria-label={`Remove ${movie.title} from watchlist`}
                              aria-pressed={watchlisted}
                            >
                              {watchlisted ? (
                                /* Bookmarked (filled) */
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  stroke="none"
                                  aria-hidden="true"
                                >
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                              ) : (
                                /* Not bookmarked (outline) */
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                              )}
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {hasMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "32px 0 8px",
              }}
            >
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="load-more-spinner" />
                ) : (
                  <>
                    Load More{" "}
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
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WatchList;
