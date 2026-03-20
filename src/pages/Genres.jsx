import React, { useEffect, useState, useCallback } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";
import "../css/Genres.css";
import {
  getAllGenres,
  getCombinedContentByGenre,
  getMoviesByGenre,
  getMovieVideos,
  getTvByGenre,
  getTvShowVideos,
} from "../services/api";

const GENRE_TABS = ["All", "Movies", "TV Shows"];

const GENRE_VISUAL = {
  Action: {
    icon: "💥",
    gradient: "linear-gradient(135deg, #1a0505 0%, #3d0a0a 100%)",
    accent: "#e50914",
  },
  Adventure: {
    icon: "🌍",
    gradient: "linear-gradient(135deg, #051a0a 0%, #0a3d1a 100%)",
    accent: "#10b981",
  },
  Animation: {
    icon: "🎨",
    gradient: "linear-gradient(135deg, #1a100a 0%, #3d200a 100%)",
    accent: "#f97316",
  },
  Comedy: {
    icon: "😂",
    gradient: "linear-gradient(135deg, #0a1a05 0%, #1a3d0a 100%)",
    accent: "#22c55e",
  },
  Crime: {
    icon: "🕵️",
    gradient: "linear-gradient(135deg, #0f0a05 0%, #1a1005 100%)",
    accent: "#d97706",
  },
  Documentary: {
    icon: "🎥",
    gradient: "linear-gradient(135deg, #0a0f0a 0%, #101a10 100%)",
    accent: "#84cc16",
  },
  Drama: {
    icon: "🎭",
    gradient: "linear-gradient(135deg, #050a1a 0%, #0a1a3d 100%)",
    accent: "#3b82f6",
  },
  Family: {
    icon: "👨‍👩‍👧",
    gradient: "linear-gradient(135deg, #051a10 0%, #0a3d20 100%)",
    accent: "#059669",
  },
  Fantasy: {
    icon: "🧙",
    gradient: "linear-gradient(135deg, #0a0a1a 0%, #15053d 100%)",
    accent: "#8b5cf6",
  },
  History: {
    icon: "📜",
    gradient: "linear-gradient(135deg, #1a1205 0%, #3d2a0a 100%)",
    accent: "#ca8a04",
  },
  Horror: {
    icon: "👻",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0520 100%)",
    accent: "#a855f7",
  },
  Music: {
    icon: "🎵",
    gradient: "linear-gradient(135deg, #10051a 0%, #20053d 100%)",
    accent: "#d946ef",
  },
  Mystery: {
    icon: "🌀",
    gradient: "linear-gradient(135deg, #05100a 0%, #0a1a15 100%)",
    accent: "#14b8a6",
  },
  Romance: {
    icon: "❤️",
    gradient: "linear-gradient(135deg, #1a0510 0%, #3d0a20 100%)",
    accent: "#ec4899",
  },
  "Science Fiction": {
    icon: "🚀",
    gradient: "linear-gradient(135deg, #05101a 0%, #0a2030 100%)",
    accent: "#06b6d4",
  },
  "TV Movie": {
    icon: "📺",
    gradient: "linear-gradient(135deg, #0a0f1a 0%, #101a2a 100%)",
    accent: "#6366f1",
  },
  Thriller: {
    icon: "🔍",
    gradient: "linear-gradient(135deg, #0d0d05 0%, #1a1a05 100%)",
    accent: "#eab308",
  },
  War: {
    icon: "⚔️",
    gradient: "linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 100%)",
    accent: "#6b7280",
  },
  Western: {
    icon: "🤠",
    gradient: "linear-gradient(135deg, #1a1005 0%, #3d2005 100%)",
    accent: "#b45309",
  },
  "Action & Adventure": {
    icon: "🔥",
    gradient: "linear-gradient(135deg, #1a0a05 0%, #3d1505 100%)",
    accent: "#f97316",
  },
  Kids: {
    icon: "🧸",
    gradient: "linear-gradient(135deg, #0a1a10 0%, #1a3d20 100%)",
    accent: "#34d399",
  },
  News: {
    icon: "📰",
    gradient: "linear-gradient(135deg, #0a0a0f 0%, #14141e 100%)",
    accent: "#94a3b8",
  },
  Reality: {
    icon: "🎬",
    gradient: "linear-gradient(135deg, #1a050a 0%, #3d0a15 100%)",
    accent: "#fb7185",
  },
  "Sci-Fi & Fantasy": {
    icon: "🌌",
    gradient: "linear-gradient(135deg, #05051a 0%, #0a0a3d 100%)",
    accent: "#818cf8",
  },
  Soap: {
    icon: "💫",
    gradient: "linear-gradient(135deg, #1a0515 0%, #3d0a30 100%)",
    accent: "#e879f9",
  },
  Talk: {
    icon: "🎙️",
    gradient: "linear-gradient(135deg, #0a100f 0%, #0f1a18 100%)",
    accent: "#2dd4bf",
  },
  "War & Politics": {
    icon: "🏛️",
    gradient: "linear-gradient(135deg, #0f0f0a 0%, #1a1a0a 100%)",
    accent: "#a3a3a3",
  },

  // ── Fallback ─────────────────────────────────────────────────────
  default: {
    icon: "🎬",
    gradient: "linear-gradient(135deg, #0f0f18 0%, #1a1a2a 100%)",
    accent: "#e50914",
  },
};
const getVisual = (name) => GENRE_VISUAL[name] ?? GENRE_VISUAL.default;

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

/* ── Single genre card ── */
const GenreCard = ({ genre, isActive, onClick, delay }) => {
  const v = getVisual(genre.name);
  return (
    <div
      className={`genre-card ${isActive ? "genre-selected-card" : ""}`}
      style={{
        opacity: 0,
        animation: `fadeUp 0.45s ${delay}ms forwards`,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div className="genre-card-bg" style={{ background: v.gradient }} />
      <div className="genre-card-texture" style={{ borderColor: v.accent }} />
      <div className="genre-card-overlay" />
      <div className="genre-card-body">
        <span className="genre-card-icon">{v.icon}</span>
        <h3 className="genre-card-name">{genre.name}</h3>
      </div>
      <div className="genre-card-arrow" style={{ background: v.accent }}>
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
      <div className="genre-card-accent-bar" style={{ background: v.accent }} />
    </div>
  );
};

/* ── Normalize TV so MovieCard works ── */
const normalizeTv = (item) => ({
  ...item,
  title: item.name ?? item.original_name ?? item.title,
  release_date: item.first_air_date ?? item.release_date,
  videos: [],
  media_type: "tv",
});

/* ── Fetch videos for every show and attach via spread ──────────────*/
const attachVideos = async (shows) => {
  const results = await Promise.all(
    shows.map((show) => {
      if (show.media_type === "tv") {
        return getTvShowVideos(show.id);
      } else {
        return getMovieVideos(show.id);
      }
    }),
  );

  return shows.map((show, i) => ({
    ...show,
    videos: results[i],
  }));
};

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ── Load genres on mount ── */
  useEffect(() => {
    getAllGenres()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setGenres(sorted);
      })
      .catch(() => setError("Failed to load genres."))
      .finally(() => setLoadingGenres(false));
  }, []);

  /* ── Fetch titles for selected genre ── */
  const fetchResults = useCallback(
    async (genreId, tab, page = 1, append = false) => {
      page === 1 ? setLoadingResults(true) : setLoadingMore(true);
      setError(null);
      try {
        let data;
        if (tab === "TV Shows") {
          data = await getTvByGenre(genreId, page);
          const normalized = data.results.map(normalizeTv);
          const withVideos = await attachVideos(normalized);
          setResults((prev) =>
            append ? [...prev, ...withVideos] : withVideos,
          );
        } else if (tab === "Movies") {
          // "All" and "Movies" both use movies endpoint (closest to /discover/movie)
          data = await getMoviesByGenre(genreId, page);
          const withVideos = await attachVideos(data.results);
          setResults((prev) =>
            append ? [...prev, ...withVideos] : withVideos,
          );
        } else {
          data = await getCombinedContentByGenre(genreId, page);
          const normalized = data.results
            .slice(0, 12)
            .map((item) =>
              item.media_type === "tv" ? normalizeTv(item) : item,
            );
          const withVideos = await attachVideos(normalized);
          setResults((prev) =>
            append ? [...prev, ...withVideos] : withVideos,
          );
        }

        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err) {
        setError("Failed to load titles for this genre.");
        console.error(err);
      } finally {
        setLoadingResults(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  /* ── Re-fetch when tab changes while a genre is selected ── */
  useEffect(() => {
    if (selectedGenre) fetchResults(selectedGenre.id, activeTab, 1, false);
  }, [activeTab, fetchResults, selectedGenre]);

  const handleGenreClick = (genre) => {
    if (selectedGenre?.id === genre.id) {
      // Deselect
      setSelectedGenre(null);
      setResults([]);
    } else {
      setSelectedGenre(genre);
      fetchResults(genre.id, activeTab, 1, false);
      // Scroll to results
      setTimeout(() => {
        document
          .getElementById("genre-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleLoadMore = () => {
    if (selectedGenre)
      fetchResults(selectedGenre.id, activeTab, currentPage + 1, true);
  };

  /* ── Filter genres by tab ── */
  // TMDB genre IDs: movie-only IDs don't appear in TV list and vice versa
  // We keep all and just change the fetch source based on tab
  const displayedGenres = genres;

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

      {/* ══ FEATURED STRIP (top 3) ════════ */}
      {!loadingGenres && genres.length >= 3 && (
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
          <div className="featured-genre-strip">
            {genres.slice(0, 3).map((genre, i) => {
              const v = getVisual(genre.name);
              return (
                <div
                  key={genre.id}
                  className="featured-genre-card"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    opacity: 0,
                    animation: `fadeUp 0.5s ${i * 80}ms forwards`,
                    cursor: "pointer",
                  }}
                  onClick={() => handleGenreClick(genre)}
                >
                  <div
                    className="featured-genre-bg"
                    style={{ background: v.gradient }}
                  />
                  <div className="featured-genre-overlay" />
                  <div className="featured-genre-body">
                    <span className="featured-genre-icon">{v.icon}</span>
                    <div>
                      <h3 className="featured-genre-name">{genre.name}</h3>
                    </div>
                  </div>
                  <div
                    className="featured-genre-bar"
                    style={{
                      background: `linear-gradient(to right, ${v.accent}, transparent)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ALL GENRES GRID ═══════════════ */}
      <div style={{ padding: "0 5vw" }}>
        <div
          className="section-header"
          style={{ padding: 0, marginBottom: 18 }}
        >
          <h2 className="section-title">All Genres</h2>
          <span className="sort-label">
            {loadingGenres ? "…" : `${displayedGenres.length} categories`}
          </span>
        </div>

        {loadingGenres ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  aspectRatio: "16/9",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  animation: "shimmer 1.5s infinite",
                  backgroundSize: "200% 100%",
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="genres-grid">
            {displayedGenres.map((genre, i) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isActive={selectedGenre?.id === genre.id}
                onClick={() => handleGenreClick(genre)}
                delay={Math.min(i * 45, 700)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ RESULTS SECTION ═══════════════ */}
      {selectedGenre && (
        <div id="genre-results" style={{ padding: "48px 5vw 0" }}>
          <div
            style={{
              height: 1,
              background: "linear-gradient(to right, var(--red), transparent)",
              marginBottom: 32,
            }}
          />
          <div
            className="section-header"
            style={{ padding: 0, marginBottom: 22 }}
          >
            <h2 className="section-title">
              {getVisual(selectedGenre.name).icon} {selectedGenre.name}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  letterSpacing: "normal",
                  marginLeft: 12,
                  fontWeight: 400,
                }}
              >
                {activeTab === "TV Shows"
                  ? "TV Shows"
                  : activeTab === "Movies"
                    ? "Movies"
                    : "All"}{" "}
              </span>
            </h2>
            <button
              onClick={() => {
                setSelectedGenre(null);
                setResults([]);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--red)",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontFamily: "var(--font-body)",
              }}
            >
              ✕ Close
            </button>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: 24 }}>
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
              </svg>
              {error}
            </div>
          )}

          {loadingResults ? (
            <SkeletonGrid count={12} />
          ) : results.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem 0" }}>
              <h3>No titles found</h3>
              <p>Try switching between Movies and TV Shows above.</p>
            </div>
          ) : (
            <>
              <div className="page-grid">
                {results.map((item, i) => (
                  <div
                    key={`${item.id}-${i}`}
                    style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
                  >
                    <MovieCard movie={item} />
                  </div>
                ))}
              </div>
              {currentPage < totalPages && (
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
                        Load More
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
      )}
    </div>
  );
};

export default Genres;
