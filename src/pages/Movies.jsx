import React, { useState } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";

/* ── UI-only placeholder data ── */
const FILTER_CHIPS = ["All", "Popular", "Top Rated", "Now Playing", "Upcoming"];
const SORT_OPTIONS = ["Popularity", "Rating", "Release Date", "Title A–Z"];

const MOCK_MOVIES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: [
    "Dune: Part Two",
    "Oppenheimer",
    "The Batman",
    "Poor Things",
    "Killers of the Flower Moon",
    "Saltburn",
    "Past Lives",
    "All of Us Strangers",
    "Priscilla",
    "Ferrari",
    "May December",
    "Nyad",
  ][i],
  release_date: `202${3 + (i % 2)}-0${(i % 9) + 1}-15`,
  vote_average: 6.5 + (i % 35) / 10,
  overview:
    "A visually stunning cinematic experience that pushes the boundaries of storytelling with breathtaking performances and a gripping narrative.",
  poster_path: null,
  videos: [],
}));

/* ── Skeleton loader ── */
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

const Movies = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Popularity");
  const [loading, setLoading] = useState(false);

  return (
    <div className="page movies-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero movies-hero">
        <p className="page-eyebrow">Discover Cinema</p>
        <h1 className="page-title">
          Browse <span>Movies</span>
        </h1>
        <p className="page-desc">
          Millions of films at your fingertips — from blockbuster hits to indie
          gems, filtered and sorted exactly how you like.
        </p>
      </header>

      <div className="page-divider" />

      <div className="stat-pills">
        {[
          { icon: "🎬", value: "10,000+", label: "Movies" },
          { icon: "⭐", value: "8.9", label: "Avg Rating" },
          { icon: "🌍", value: "50+", label: "Languages" },
          { icon: "📅", value: "2025", label: "Latest Year" },
        ].map((stat) => (
          <div className="stat-pill" key={stat.label}>
            <span className="stat-pill-icon">{stat.icon}</span>
            <div className="stat-pill-body">
              <div className="stat-pill-value">{stat.value}</div>
              <div className="stat-pill-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

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
            {activeFilter === "All" ? "All Movies" : activeFilter}
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
          {MOCK_MOVIES.map((movie, i) => (
            <div
              key={movie.id}
              style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;
