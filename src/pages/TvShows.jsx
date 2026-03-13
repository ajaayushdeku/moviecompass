import React, { useState } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";

/* ── UI-only placeholder data ── */
const FILTER_CHIPS = [
  "All",
  "Popular",
  "Top Rated",
  "Airing Today",
  "On The Air",
];
const SORT_OPTIONS = ["Popularity", "Rating", "First Air Date", "Title A–Z"];

const MOCK_SHOWS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 100,
  title: [
    "The Bear",
    "Succession",
    "Severance",
    "The Last of Us",
    "Andor",
    "House of the Dragon",
    "The White Lotus",
    "Beef",
    "Shrinking",
    "Slow Horses",
    "The Diplomat",
    "Abbott Elementary",
  ][i],
  release_date: `202${2 + (i % 3)}-0${(i % 9) + 1}-01`,
  vote_average: 7.2 + (i % 28) / 10,
  overview:
    "A critically acclaimed series that redefines its genre, with complex characters and a deeply immersive world that keeps you hooked episode after episode.",
  poster_path: null,
  videos: [],
  media_type: "tv",
}));

/* ── Skeleton ── */
const SkeletonGrid = ({ count = 12 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div
        className="skeleton-card"
        key={i}
        style={{ animationDelay: `${i * 35}ms` }}
      >
        <div className="skeleton-poster" />
        <div className="skeleton-info">
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Spotlight banner (featured show) ── */
const SpotlightBanner = () => (
  <div className="spotlight-banner">
    {/* gradient bg stand-in */}
    <div
      className="spotlight-bg"
      style={{
        background:
          "linear-gradient(135deg, #0d1b2a 0%, #1a0a0b 50%, #0a0a14 100%)",
      }}
    />
    <div className="spotlight-noise" />

    <div className="spotlight-content">
      <p className="spotlight-eyebrow">Featured Series</p>
      <h2 className="spotlight-title">The Bear</h2>

      <div className="spotlight-meta">
        <span className="spotlight-meta-item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="#f5c518"
            stroke="none"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          9.4
        </span>
        <span className="spotlight-meta-item">Season 3 · 2024</span>
        <span className="spotlight-meta-item">Drama · Comedy</span>
      </div>

      <div className="spotlight-actions">
        <button className="btn-primary">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Watch Now
        </button>
        <button className="btn-ghost">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Add to List
        </button>
      </div>
    </div>
  </div>
);

const TvShows = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Popularity");
  const [loading] = useState(false);

  return (
    <div className="page tvshows-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero tvshows-hero">
        <p className="page-eyebrow">Stream & Binge</p>
        <h1 className="page-title">
          TV <span>Shows</span>
        </h1>
        <p className="page-desc">
          From prestige dramas to laugh-out-loud comedies — explore every show
          across every genre, sorted by what's trending right now.
        </p>
      </header>

      <div className="page-divider" />

      {/* ══ STAT PILLS ════════════════════ */}
      <div className="stat-pills">
        {[
          { icon: "📺", value: "8,500+", label: "TV Shows" },
          { icon: "🎭", value: "150+", label: "Genres" },
          { icon: "📡", value: "320", label: "Airing Today" },
          { icon: "🏆", value: "92", label: "Award Winners" },
        ].map((s) => (
          <div className="stat-pill" key={s.label}>
            <span className="stat-pill-icon">{s.icon}</span>
            <div className="stat-pill-body">
              <div className="stat-pill-value">{s.value}</div>
              <div className="stat-pill-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ FEATURED SPOTLIGHT ════════════ */}
      <SpotlightBanner />

      {/* ══ FILTER CHIPS ══════════════════ */}
      <div className="filter-bar">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            className={`filter-chip ${activeFilter === chip ? "active" : ""}`}
            onClick={() => setActiveFilter(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ══ SORT ROW ══════════════════════ */}
      <div className="sort-row">
        <div className="section-header" style={{ padding: 0, marginBottom: 0 }}>
          <h2 className="section-title">
            {activeFilter === "All" ? "All TV Shows" : activeFilter}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sort-label">Sort by</span>
          <select
            className="sort-select"
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ══ GRID ══════════════════════════ */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : (
        <div className="page-grid">
          {MOCK_SHOWS.map((show, i) => (
            <div
              key={show.id}
              style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }}
            >
              <MovieCard movie={show} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TvShows;
