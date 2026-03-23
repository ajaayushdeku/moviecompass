import React, { useEffect, useState, useRef, useCallback } from "react";
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
import MediaIcon from "../components/MediaIcon";
import { useMovieContext } from "../contexts/MovieContext";

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

      return Promise.resolve([]);
    }),
  );

  return shows.map((show, i) => ({
    ...show,
    media_type: show.media_type || media_type,
    videos: results[i],
  }));
};

const Home = () => {
  const {
    isFavorite,
    isWatchListed,
    addToFavorites,
    addWatchList,
    removeFromFavorites,
    removeFromWatchList,
  } = useMovieContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropDown, setShowDropDown] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(-1);
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
  const formRef = useRef(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setShowDropDown(false);
        setActiveDropdownIndex(-1);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ── Fetch results as user types ── */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropDown(false);
      setActiveDropdownIndex(-1);
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await searchMulti(searchQuery.trim(), 1);
        setResults(data.results.slice(0, 6));
        setShowDropDown(true);
        setActiveDropdownIndex(-1);
      } catch (err) {
        console.error("Dropdown search error:", err);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  /* ── Load popular on mount ── */
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
      setError("Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  };

  /* ── Select a dropdown item → fill input and run search ── */
  const handleDropdownSelect = useCallback(async (item) => {
    const title = item.title ?? item.name ?? "";
    setSearchQuery(title);
    setShowDropDown(false);
    setActiveDropdownIndex(-1);
    inputRef.current?.focus();

    // Trigger full search with the selected title
    runSearch(title);
  }, []);

  /* ── Core search runner (shared by form submit + dropdown select) ── */
  const runSearch = async (q) => {
    const query = q.trim();
    if (!query || loading) return;

    setLoading(true);
    setError(null);
    setShowDropDown(false);
    try {
      const data = await searchMulti(query, 1);
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

  /* ── Form submit ── */
  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  /* ── Keyboard navigation in dropdown ── */
  const handleKeyDown = (e) => {
    if (!showDropDown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveDropdownIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveDropdownIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeDropdownIndex >= 0) {
      e.preventDefault();
      handleDropdownSelect(results[activeDropdownIndex]);
    } else if (e.key === "Escape") {
      setShowDropDown(false);
      setActiveDropdownIndex(-1);
    }
  };

  /* ── Hint chip clicked ── */
  const handleHint = (hint) => {
    setSearchQuery(hint);
    inputRef.current?.focus();
  };

  /* ── clear search, reload popular ── */
  const handleClear = async () => {
    setSearchQuery("");
    setIsSearchResult(false);
    setLoading(true);
    setError(null);
    setShowDropDown(false);

    try {
      const data = await getCombinedPopular(1);
      const withVideos = await attachVideos(data.results);
      setMovies(withVideos);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
      setError("Failed to load content.");
    } finally {
      setLoading(false);
    }
  };

  const hasTrailer = nowPlayingBanner?.videos?.some(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  const favorite = nowPlayingBanner ? isFavorite(nowPlayingBanner.id) : false;
  const watchlisted = nowPlayingBanner
    ? isWatchListed(nowPlayingBanner.id)
    : false;

  // ── Favourite toggle ─────────────────────────────────────────────
  const onFavoriteClick = () => {
    if (favorite) {
      removeFromFavorites(nowPlayingBanner.id);
    } else {
      // Normalize TV fields + strip videos before storing in favorites
      const { status: _s, ...cleanShow } = nowPlayingBanner;
      addToFavorites({
        ...cleanShow,
        title:
          nowPlayingBanner.title ??
          nowPlayingBanner.name ??
          nowPlayingBanner.original_name,
        release_date: nowPlayingBanner.first_air_date,
      });
    }
  };

  // ── Watchlist toggle ─────────────────────────────────────────────
  const onWatchListClick = () => {
    if (watchlisted) {
      removeFromWatchList(nowPlayingBanner.id);
    } else {
      // Strip videos, status, and normalize TV fields before storing.
      // addWatchList in context also strips status, but doing it here
      // keeps the stored object clean and predictable.
      const { status: _s, ...cleanShow } = nowPlayingBanner;
      addWatchList({
        ...cleanShow,
        title:
          nowPlayingBanner.title ??
          nowPlayingBanner.name ??
          nowPlayingBanner.original_name,
        release_date: nowPlayingBanner.first_air_date,
      });
    }
  };

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
          <form
            ref={formRef}
            onSubmit={handleSearch}
            className={`search-form ${showDropDown && results.length > 0 ? "search-form--open" : ""}`}
            autoComplete="off"
          >
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
              placeholder="Search movies, tv shows, genres, years…"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowDropDown(true)}
              autoComplete="off"
              onKeyDown={handleKeyDown}
              aria-label="Search"
              aria-autocomplete="list"
              aria-expanded={showDropDown}
              aria-controls="search-dropdown"
            />

            {/* clear × button — only when there's text */}
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setShowDropDown(false);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                tabIndex={-1}
              >
                ✖
              </button>
            )}

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

            {/* ── Dropdown ── */}
            {showDropDown && results.length > 0 && (
              <ul
                id="search-dropdown"
                className="search-dropdown"
                ref={dropdownRef}
                role="listbox"
              >
                {results.map((item, idx) => {
                  const title = item.title ?? item.name ?? "Untitled";
                  const year = (
                    item.release_date ??
                    item.first_air_date ??
                    ""
                  ).slice("-");
                  const type = item.media_type ?? "movie";
                  const typeLabel = type === "tv" ? "TV" : "Movie";
                  const poster = item.poster_path
                    ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                    : null;

                  return (
                    <li
                      key={`${item.id}-${type}`}
                      role="option"
                      aria-selected={idx === activeDropdownIndex}
                      className={`search-dropdown-item ${idx === activeDropdownIndex ? "search-dropdown-item--active" : ""}`}
                      onMouseDown={(e) => {
                        // mouseDown fires before input blur — prevent blur closing dropdown first
                        e.preventDefault();
                        handleDropdownSelect(item);
                      }}
                      onMouseEnter={() => setActiveDropdownIndex(idx)}
                    >
                      {/* Thumbnail */}
                      <div className="dropdown-thumb">
                        {poster ? (
                          <img src={poster} alt={title} loading="lazy" />
                        ) : (
                          <div className="dropdown-thumb-placeholder">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ opacity: 0.3 }}
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

                      {/* Text */}
                      <div className="dropdown-text">
                        <span className="dropdown-title">{title}</span>
                        {year && <span className="dropdown-year">{year}</span>}
                      </div>

                      {/* Type badge */}
                      <span
                        className={`dropdown-type-badge dropdown-type-badge--${type}`}
                      >
                        <MediaIcon type={type} />
                        {typeLabel}
                      </span>
                    </li>
                  );
                })}

                {/* Footer hint */}
                <li className="search-dropdown-footer" aria-hidden="true">
                  Press <kbd>↵</kbd> to search all results
                </li>
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
              <span className="now-playing-rating" style={{ color: "#f5c518" }}>
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
              <span className="now-playing-rating">
                {nowPlayingBanner.release_date?.split("-")[0]}
              </span>

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

                {/* Add to Favourite */}
                <div
                  type="button"
                  className={`detail-fav-btn ${favorite ? "detail-fav-btn--active" : ""}`}
                  onClick={onFavoriteClick}
                  title={
                    favorite ? "Remove from Favorites" : "Add to Favorites"
                  }
                  aria-pressed={favorite}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill={favorite ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorite ? "Saved" : "Add to Favorites"}
                </div>

                {/* Add to Watchlist — use <button> not <div> */}
                <div
                  type="button"
                  className={`detail-watchlist-btn ${watchlisted ? "detail-watchlist-btn--active" : ""}`}
                  onClick={onWatchListClick}
                  aria-label={
                    watchlisted ? "Remove from watchlist" : "Add to watchlist"
                  }
                  aria-pressed={watchlisted}
                >
                  {watchlisted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      aria-hidden="true"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
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
                  {watchlisted ? "In Watchlist" : "Add to Watchlist"}
                </div>
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
