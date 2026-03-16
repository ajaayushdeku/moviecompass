import React, { useEffect, useState, useRef } from "react";
import MovieCard from "../components/MovieCard";
import "../css/Home.css";
import {
  getCombinedPopular,
  // searchMovies,
  // searchTvShows,
  searchMulti,
  getMovieVideos,
  getTvShowVideos,
  getCombinedTopRated,
  getNowPlayingMovies,
  getTrending,
} from "../services/api";
import MovieTrailerModal from "../components/MovieTrailerModal";

/* ── quick-search suggestions ── */
const HINTS = ["Inception", "Action", "2024", "Marvel", "Horror", "Sci-Fi"];

/* ── Skeleton placeholder ── */
const SkeletonGrid = ({ count = 10 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div
        className="skeleton-card"
        key={i}
        style={{ animationDelay: `${i * 40}ms` }}
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

/* ── Fetch videos for every show and attach via spread ──────────────*/
const attachVideos = async (shows, { media_type } = {}) => {
  const results = await Promise.all(
    shows.map((show) => {
      const type = show.media_type || media_type;

      if (type === "movie") {
        return getMovieVideos(show.id);
      }

      if (type === "tv") {
        return getTvShowVideos(show.id);
      }

      return [];
    }),
  );

  return shows.map((show, i) => ({
    ...show,
    media_type: show.media_type || media_type,
    videos: results[i],
  }));
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropDown, setShowDropDown] = useState(false);
  const [movies, setMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [trendingToday, setTrendingToday] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nowPlayingBanner, setNowPlayingBanner] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropDown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  //Fetch results as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropDown(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await searchMulti(searchQuery, 1);
        setResults(data.results.slice(0, 5));
        setShowDropDown(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  /* ── load popular on mount ── */
  useEffect(() => {
    const loadContents = async () => {
      try {
        // const popularMovies = await getPopularMovies();
        const [popularData, topRatedData, trendingData, nowPlayingMovieData] =
          await Promise.all([
            getCombinedPopular(1),
            getCombinedTopRated(1),
            getTrending("all", "day", 1),
            getNowPlayingMovies(1),
          ]);
        // const moviesWithVideos = await Promise.all(
        //   popularMovies.map(async (movie) => {
        //     const videos = await getMovieVideos(movie.id);
        //     return { ...movie, videos };
        //   }),
        // );

        const [
          withVideos,
          topRatedWithVideos,
          nowPlayingMovieWithVideos,
          trendingWithVideos,
        ] = await Promise.all([
          attachVideos(popularData.results.slice(0, 14)),
          attachVideos(topRatedData.results.slice(0, 7)),
          attachVideos(nowPlayingMovieData.results.slice(0, 1), {
            media_type: "movie",
          }),
          attachVideos(trendingData.results.slice(0, 7), {
            media_type: "movie",
          }),
        ]);

        setMovies(withVideos);
        setTotalPages(popularData.totalPages);
        setTopRated(topRatedWithVideos);
        setTrendingToday(trendingWithVideos);

        // Use the first now-playing movie as the hero banner
        if (nowPlayingMovieWithVideos.length > 0) {
          setNowPlayingBanner(nowPlayingMovieWithVideos[0]);
        }
      } catch (err) {
        console.log(err);
        setError("Failed to load movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadContents();
  }, []);

  /* ── Load more (pagination) ── */
  const handleLoadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = isSearchResult
        ? await searchMulti(searchQuery, nextPage)
        : await getCombinedPopular(nextPage);
      const withVideos = await attachVideos(data.results);
      setMovies((prev) => [...prev, ...withVideos]);
      setCurrentPage(nextPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.log(err);
      setError("Failed to load more movies.");
    } finally {
      setLoadingMore(false);
    }
  };

  /* ── Search handler ── */
  const handleSearch = async (e) => {
    e.preventDefault();

    const q = searchQuery.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await searchMulti(q, 1);
      const withVideos = await attachVideos(data.results);
      setMovies(withVideos);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
      setIsSearchResult(true);
    } catch (err) {
      console.log(err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Hint chip clicked ── */
  const handleHint = (hint) => {
    setSearchQuery(hint);
    inputRef.current.focus();
  };

  /* ── clear search, reload popular ── */
  const handleClear = async () => {
    setSearchQuery("");
    setIsSearchResult(false);
    setLoading(true);
    setError(null);

    try {
      const data = await getCombinedPopular(1);
      const withVideos = await attachVideos(data.results);
      setMovies(withVideos);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
      setError("Failed to load movies.");
    } finally {
      setLoading(false);
    }
  };

  console.log("Now Playing Banner Data:", nowPlayingBanner);
  const hasTrailer = nowPlayingBanner?.videos?.some(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  return (
    <div className="home">
      {/* ══ HERO ══════════════════════════════ */}
      <section className="hero">
        <p className="hero-eyebrow">Discover · Watch · Explore</p>
        <h1 className="hero-title">
          Your Next
          <br />
          <span>Obsession</span>
          <br />
          Awaits
        </h1>
        <p className="hero-sub">
          Browse millions of titles, catch trailers, and save your favourites —
          all in one place.
        </p>

        {/* ── Search bar ── */}
        <div className="search-section">
          <span id="search" />
          <form onSubmit={handleSearch} className="search-form">
            {/* search icon */}
            <span className="search-icon">
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
            </span>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search movies, tvshows, genres, years…"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowDropDown(true)}
              autoComplete="off"
            />
            <button type="submit" className="search-button">
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
              <span> Search</span>
            </button>

            {showDropDown && results.length > 0 && (
              <ul
                className="dropdown"
                ref={dropdownRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#000000",
                  border: "1px solid #6a6a6a",
                  borderRadius: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                }}
              >
                {results.map((item) => (
                  <li
                    key={item.id}
                    // onClick={() => handleSelect(item)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {item.title || item.name} ({item.media_type || "movie"})
                  </li>
                ))}
              </ul>
            )}
          </form>

          {/* quick-search chips */}
          <div className="search-hints">
            {HINTS.map((hint) => (
              <button
                key={hint}
                className="hint-chip"
                onClick={() => handleHint(hint)}
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ NOW PLAYING BANNER ════════════════ */}
      {!isSearchResult && !loading && nowPlayingBanner && (
        <div className="now-playing-banner">
          <div
            className="now-playing-bg"
            style={{
              backgroundImage: nowPlayingBanner.backdrop_path
                ? `url(https://image.tmdb.org/t/p/w1280${nowPlayingBanner.backdrop_path})`
                : undefined,
            }}
          />
          <div className="now-playing-overlay" />
          <div className="now-playing-content">
            <p className="now-playing-eyebrow">🎬 Now In Cinemas</p>
            <h2 className="now-playing-title">{nowPlayingBanner.title}</h2>
            <p className="now-playing-desc">
              {nowPlayingBanner.overview?.slice(0, 120)}…
            </p>
            <div className="now-playing-meta">
              <span className="now-playing-rating">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#f5c518"
                  stroke="none"
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                {nowPlayingBanner.vote_average?.toFixed(1)}
              </span>
              <span>{nowPlayingBanner.release_date?.split("-")[0]}</span>
              <div className="spotlight-actions">
                {/* ── Watch Trailer ── */}
                <button
                  className="btn-primary"
                  onClick={() => setShowTrailer(true)}
                  disabled={loading || !hasTrailer}
                  title={
                    loading
                      ? "Loading trailer…"
                      : !hasTrailer
                        ? "No trailer available"
                        : "Watch Trailer"
                  }
                  style={{ opacity: !loading && !hasTrailer ? 0.5 : 1 }}
                >
                  {loading ? (
                    /* mini spinner */
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        border: "1.5px solid rgba(255,255,255,0.25)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                  {loading
                    ? "Loading…"
                    : hasTrailer
                      ? "Watch Trailer"
                      : "No Trailer"}
                </button>
              </div>

              {/* ── Trailer Modal ── */}
              {showTrailer && (
                <MovieTrailerModal
                  movie={nowPlayingBanner}
                  onClose={() => setShowTrailer(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ ERROR ═════════════════════════════ */}
      {error && (
        <div className="error-banner">
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
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ══ MOVIES ════════════════════════════ */}
      {loading ? (
        <SkeletonGrid count={14} />
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
          <h3>No movies found</h3>
          <p>
            Try a different title, genre, or year. Or go back to popular movies.
          </p>
          <button
            className="search-button"
            style={{ marginTop: 8 }}
            onClick={handleClear}
          >
            Show Popular
          </button>
        </div>
      ) : (
        <>
          {/* ── Search results OR Popular grid ── */}
          <div className="section-header">
            <h2 className="section-title">
              {isSearchResult ? `Results for "${searchQuery}"` : "Popular Now"}
            </h2>

            <span className="section-count">
              {movies.length} title{movies.length !== 1 ? "s" : ""}
              {isSearchResult && (
                <button onClick={handleClear} className="back-btn">
                  ← Back to Popular
                </button>
              )}
            </span>
          </div>

          <div className="movies-section">
            <div className="movies-grid">
              {movies.map((movie, i) => (
                <div
                  key={movie.id}
                  style={{
                    opacity: 0,
                    animation: `fadeUp 0.45s ${Math.min(i * 45, 600)}ms forwards`,
                  }}
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>

          {/* Load More */}
          {currentPage < totalPages && (
            <div className="load-more-wrap">
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

          {/* ── Top Rated row (only shown on non-search) ── */}
          {!isSearchResult && topRated.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 40 }}>
                <h2 className="section-title">⭐ Top Rated</h2>
              </div>

              <div className="movies-section">
                <div className="movies-grid">
                  {topRated.map((movie, i) => (
                    <div
                      key={movie.id}
                      style={{
                        opacity: 0,
                        animation: `fadeUp 0.45s ${Math.min(i * 50, 500)}ms forwards`,
                      }}
                    >
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Trending Today row ── */}
          {!isSearchResult && trendingToday.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 40 }}>
                <h2 className="section-title">🔥 Trending Today</h2>
              </div>
              <div className="movies-section">
                <div className="movies-grid">
                  {trendingToday.map((movie, i) => (
                    <div
                      key={movie.id}
                      style={{
                        opacity: 0,
                        animation: `fadeUp 0.45s ${Math.min(i * 50, 500)}ms forwards`,
                      }}
                    >
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
