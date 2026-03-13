import React, { useState } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";
import "../css/Trending.css";

/* ── Time-window tabs ── */
const TIME_TABS = ["Today", "This Week"];

/* ── Category chips ── */
const CAT_CHIPS = ["All", "Movies", "TV Shows", "People"];

const MOCK_TRENDING = Array.from({ length: 10 }, (_, i) => ({
  id: i + 200,
  title: [
    "Inside Out 2",
    "A Quiet Place: Day One",
    "Deadpool & Wolverine",
    "Alien: Romulus",
    "Twisters",
    "Longlegs",
    "Borderlands",
    "Speak No Evil",
    "The Substance",
    "Wolfs",
  ][i],
  release_date: `2024-0${(i % 9) + 1}-20`,
  vote_average: 9.1 - i * 0.15,
  overview:
    "A cinematic phenomenon taking the world by storm — bold, unexpected, and utterly impossible to look away from.",
  poster_path: null,
  videos: [],
  rank: i + 1,
}));

/* ── Leaderboard row (top 5) ── */
const LeaderboardRow = ({ movie }) => (
  <div className="leaderboard-row">
    <span className="leaderboard-rank">#{movie.rank}</span>

    {/* poster thumbnail */}
    <div className="leaderboard-thumb">
      <div
        className="leaderboard-thumb-bg"
        style={{
          background: `linear-gradient(135deg, hsl(${movie.rank * 37},40%,14%) 0%, hsl(${movie.rank * 37 + 60},30%,8%) 100%)`,
        }}
      />
    </div>

    <div className="leaderboard-info">
      <p className="leaderboard-title">{movie.title}</p>
      <p className="leaderboard-meta">
        {movie.release_date?.split("-")[0]} &nbsp;·&nbsp;
        <span style={{ color: "#f5c518" }}>
          ⭐ {movie.vote_average.toFixed(1)}
        </span>
      </p>
    </div>

    {/* trend arrow */}
    <div className="leaderboard-trend up">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span>{Math.floor(Math.random() * 40) + 5}%</span>
    </div>
  </div>
);

const Trending = () => {
  const [activeTab, setActiveTab] = useState("Today");
  const [activeCat, setActiveCat] = useState("All");

  return (
    <div className="page trending-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero trending-hero">
        <p className="page-eyebrow">What's Hot Right Now</p>
        <h1 className="page-title">
          <span>Trending</span>
        </h1>
        <p className="page-desc">
          The titles everyone is talking about — updated every day and every
          week based on real-time popularity across the globe.
        </p>
      </header>

      <div className="page-divider" />

      {/* ══ TIME TABS ═════════════════════ */}
      <div className="time-tabs">
        {TIME_TABS.map((tab) => (
          <button
            key={tab}
            className={`time-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Today" ? (
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
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
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
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* ══ CATEGORY CHIPS ════════════════ */}
      <div className="filter-bar" style={{ paddingTop: 0 }}>
        {CAT_CHIPS.map((chip) => (
          <button
            key={chip}
            className={`filter-chip ${activeCat === chip ? "active" : ""}`}
            onClick={() => setActiveCat(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ══ TWO-COLUMN LAYOUT ═════════════ */}
      <div className="trending-layout">
        {/* ── Left: ranked card grid ── */}
        <div className="trending-grid-col">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending {activeTab}</h2>
          </div>
          <div
            className="page-grid"
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            {MOCK_TRENDING.map((movie, i) => (
              <div
                key={movie.id}
                className="trending-card-wrap"
                style={{ animationDelay: `${Math.min(i * 50, 600)}ms` }}
              >
                {/* big rank number behind card */}
                <span className="rank-badge">{movie.rank}</span>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: leaderboard ── */}
        <aside className="trending-sidebar">
          <div className="section-header" style={{ padding: "0 0 18px" }}>
            <h2 className="section-title">Top 5</h2>
            <span className="sort-label">{activeTab}</span>
          </div>

          <div className="leaderboard">
            {MOCK_TRENDING.slice(0, 5).map((movie) => (
              <LeaderboardRow key={movie.id} movie={movie} />
            ))}
          </div>

          {/* ── Mini stat card ── */}
          <div className="sidebar-stat-card">
            <p className="sidebar-stat-heading">📊 Trending Insights</p>
            <div className="sidebar-stat-row">
              <span>Most searched genre</span>
              <strong>Action</strong>
            </div>
            <div className="sidebar-stat-row">
              <span>Avg rating today</span>
              <strong style={{ color: "#f5c518" }}>⭐ 8.1</strong>
            </div>
            <div className="sidebar-stat-row">
              <span>New titles this week</span>
              <strong style={{ color: "var(--red)" }}>+42</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Trending;
