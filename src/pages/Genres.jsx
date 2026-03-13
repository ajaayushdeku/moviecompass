import React, { useState } from "react";
import "../css/PagesShared.css";
import "../css/Genres.css";

/* ── Genre data (UI only) ── */
const GENRE_TABS = ["All", "Movies", "TV Shows"];

const GENRES = [
  {
    id: 1,
    name: "Action",
    icon: "💥",
    count: "2,840",
    gradient: "linear-gradient(135deg, #1a0505 0%, #3d0a0a 100%)",
    accent: "#e50914",
  },
  {
    id: 2,
    name: "Comedy",
    icon: "😂",
    count: "3,120",
    gradient: "linear-gradient(135deg, #0a1a05 0%, #1a3d0a 100%)",
    accent: "#22c55e",
  },
  {
    id: 3,
    name: "Drama",
    icon: "🎭",
    count: "4,560",
    gradient: "linear-gradient(135deg, #050a1a 0%, #0a1a3d 100%)",
    accent: "#3b82f6",
  },
  {
    id: 4,
    name: "Horror",
    icon: "👻",
    count: "1,230",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0520 100%)",
    accent: "#a855f7",
  },
  {
    id: 5,
    name: "Sci-Fi",
    icon: "🚀",
    count: "1,870",
    gradient: "linear-gradient(135deg, #05101a 0%, #0a2030 100%)",
    accent: "#06b6d4",
  },
  {
    id: 6,
    name: "Romance",
    icon: "❤️",
    count: "2,100",
    gradient: "linear-gradient(135deg, #1a0510 0%, #3d0a20 100%)",
    accent: "#ec4899",
  },
  {
    id: 7,
    name: "Thriller",
    icon: "🔍",
    count: "1,650",
    gradient: "linear-gradient(135deg, #0d0d05 0%, #1a1a05 100%)",
    accent: "#eab308",
  },
  {
    id: 8,
    name: "Animation",
    icon: "🎨",
    count: "980",
    gradient: "linear-gradient(135deg, #1a100a 0%, #3d200a 100%)",
    accent: "#f97316",
  },
  {
    id: 9,
    name: "Documentary",
    icon: "🎥",
    count: "2,340",
    gradient: "linear-gradient(135deg, #0a0f0a 0%, #101a10 100%)",
    accent: "#84cc16",
  },
  {
    id: 10,
    name: "Fantasy",
    icon: "🧙",
    count: "1,420",
    gradient: "linear-gradient(135deg, #0a0a1a 0%, #15053d 100%)",
    accent: "#8b5cf6",
  },
  {
    id: 11,
    name: "Crime",
    icon: "🕵️",
    count: "1,760",
    gradient: "linear-gradient(135deg, #0f0a05 0%, #1a1005 100%)",
    accent: "#d97706",
  },
  {
    id: 12,
    name: "Adventure",
    icon: "🌍",
    count: "2,050",
    gradient: "linear-gradient(135deg, #051a0a 0%, #0a3d1a 100%)",
    accent: "#10b981",
  },
];

/* ── Single genre card ── */
const GenreCard = ({ genre, delay }) => (
  <div
    className="genre-card"
    style={{
      animationDelay: `${delay}ms`,
      opacity: 0,
      animation: `fadeUp 0.45s ${delay}ms forwards`,
    }}
  >
    {/* coloured gradient bg */}
    <div className="genre-card-bg" style={{ background: genre.gradient }} />

    {/* diagonal stripe texture */}
    <div className="genre-card-texture" style={{ borderColor: genre.accent }} />

    <div className="genre-card-overlay" />

    <div className="genre-card-body">
      <span className="genre-card-icon">{genre.icon}</span>
      <h3 className="genre-card-name">{genre.name}</h3>
      <p className="genre-card-count">{genre.count} titles</p>
    </div>

    {/* hover arrow */}
    <div className="genre-card-arrow" style={{ background: genre.accent }}>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>

    {/* accent bottom line */}
    <div
      className="genre-card-accent-bar"
      style={{ background: genre.accent }}
    />
  </div>
);

/* ── Featured genre strip (large banner cards) ── */
const FeaturedStrip = () => {
  const featured = GENRES.slice(0, 3);
  return (
    <div className="featured-genre-strip">
      {featured.map((genre, i) => (
        <div
          key={genre.id}
          className="featured-genre-card"
          style={{
            animationDelay: `${i * 80}ms`,
            opacity: 0,
            animation: `fadeUp 0.5s ${i * 80}ms forwards`,
          }}
        >
          <div
            className="featured-genre-bg"
            style={{ background: genre.gradient }}
          />
          <div className="featured-genre-overlay" />

          <div className="featured-genre-body">
            <span className="featured-genre-icon">{genre.icon}</span>
            <div>
              <h3 className="featured-genre-name">{genre.name}</h3>
              <p className="featured-genre-count">{genre.count} titles</p>
            </div>
          </div>

          <div
            className="featured-genre-bar"
            style={{
              background: `linear-gradient(to right, ${genre.accent}, transparent)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Genres = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [activeGenre, setActiveGenre] = useState(null);

  return (
    <div className="page genres-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero genres-hero">
        <p className="page-eyebrow">Explore by Category</p>
        <h1 className="page-title">
          Browse <span>Genres</span>
        </h1>
        <p className="page-desc">
          Whether you're in the mood for edge-of-your-seat thrills or heartfelt
          drama, find exactly what you want by genre.
        </p>
      </header>

      <div className="page-divider" />

      {/* ══ TYPE TABS ═════════════════════ */}
      <div className="filter-bar">
        {GENRE_TABS.map((tab) => (
          <button
            key={tab}
            className={`filter-chip ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══ FEATURED STRIP ════════════════ */}
      <div
        style={{
          padding: "0 5vw",
          marginBottom: 36,
          opacity: 0,
          animation: "fadeUp 0.5s 0.3s forwards",
        }}
      >
        <div
          className="section-header"
          style={{ padding: 0, marginBottom: 18 }}
        >
          <h2 className="section-title">🌟 Featured</h2>
        </div>
        <FeaturedStrip />
      </div>

      {/* ══ ALL GENRES GRID ═══════════════ */}
      <div style={{ padding: "0 5vw" }}>
        <div
          className="section-header"
          style={{ padding: 0, marginBottom: 18 }}
        >
          <h2 className="section-title">All Genres</h2>
          <span className="sort-label">{GENRES.length} categories</span>
        </div>

        <div className="genres-grid">
          {GENRES.map((genre, i) => (
            <div
              key={genre.id}
              onClick={() =>
                setActiveGenre(activeGenre === genre.id ? null : genre.id)
              }
              className={activeGenre === genre.id ? "genre-selected" : ""}
            >
              <GenreCard genre={genre} delay={Math.min(i * 50, 700)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Genres;
