import React, { useCallback, useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";
import "../css/Trending.css";
import { getMovieVideos, getTrending, getTvShowVideos } from "../services/api";

/* ── Time-window tabs ── */
const TIME_TABS = ["Today", "This Week"];

/* ── Category chips ── */
const CAT_CHIPS = ["All", "Movies", "TV Shows"];

/* ── Skeleton ── */
const SkeletonGrid = ({ count = 10 }) => (
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

/* ── Leaderboard row (top 5) ── */
const LeaderboardRow = ({ contents, index }) => (
  <div className="leaderboard-row">
    <span className="leaderboard-rank">#{index + 1}</span>

    {/* poster thumbnail */}
    <div className="leaderboard-thumb">
      {contents.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${contents.poster_path}`}
          alt={contents.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          className="leaderboard-thumb-bg"
          style={{
            background: `linear-gradient(135deg, hsl(${index + 1 * 37},40%,14%) 0%, hsl(${index + 1 * 37 + 60},30%,8%) 100%) , position: "absolute", inset: 0 `,
          }}
        />
      )}
    </div>

    <div className="leaderboard-info">
      <p className="leaderboard-title">{contents.title}</p>
      <p className="leaderboard-meta">
        {contents.release_date?.split("-")[0]} &nbsp;·&nbsp;
        <span style={{ color: "#f5c518" }}>
          ⭐ {contents.vote_average.toFixed(1)}
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
    </div>
  </div>
);

/* ── Normalize TV show object so MovieCard works (uses first_air_date, name) ── */
const normalizeTv = (show) => ({
  ...show,
  title: show.title ?? show.name ?? show.original_name,
  release_date: show.release_date ?? show.first_air_date,
  videos: [],
});

/* ── Fetch videos for every show and attach via spread ──────────────*/
const attachVideos = async (shows) => {
  const results = await Promise.all(
    shows.map((show) => {
      if (show.media_type === "movie") {
        return getMovieVideos(show.id);
      }
      if (show.media_type === "tv") {
        return getTvShowVideos(show.id);
      }
      return [];
    }),
  );

  return shows.map((show, i) => ({
    ...show,
    videos: results[i],
  }));
};

const Trending = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState("all");
  const [timeWindow, setTimeWindow] = useState("day");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ── Main fetch ── */
  const loadTrendingShows = useCallback(
    async (page = 1, append = false) => {
      page === 1 ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        let data = await getTrending(mediaType, timeWindow, page);

        let results = data.results.slice(0, 10); // limit to 10 results for performance

        if (mediaType === "all") {
          // remove people results
          results = results.filter((item) => item.media_type !== "person");

          // normalize tv shows
          results = results.map((item) =>
            item.media_type === "tv" ? normalizeTv(item) : item,
          );
        }

        if (mediaType === "tv") {
          results = results.map(normalizeTv);
        }

        const withVideos = await attachVideos(results);

        setContents((prev) => (append ? [...prev, ...withVideos] : withVideos));
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err) {
        setError("Failed to load trending content. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mediaType, timeWindow],
  );

  console.log("Media Type:", mediaType, "Time Window:", timeWindow);

  useEffect(() => {
    loadTrendingShows(1, false);
  }, [loadTrendingShows]);

  const handleFilterChange = (trendChoice) => {
    if (trendChoice === "All") {
      setMediaType("all");
    } else if (trendChoice === "Movies") {
      setMediaType("movie");
    } else if (trendChoice === "TV Shows") {
      setMediaType("tv");
    }
  };

  const handleTimeWindowChange = (windowChoice) => {
    if (windowChoice === "Today") {
      setTimeWindow("day");
    } else if (windowChoice === "This Week") {
      setTimeWindow("week");
    }
  };

  const handleLoadMore = () => loadTrendingShows(currentPage + 1, true);

  const timeWindowLabel = timeWindow === "day" ? "Today" : "This Week";
  const mediaTypeLabel =
    mediaType === "all"
      ? "All"
      : mediaType === "movie"
        ? "Movies"
        : mediaType === "tv"
          ? "TV Shows"
          : "";

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
        {TIME_TABS.map((time) => (
          <button
            key={time}
            className={`time-tab ${timeWindowLabel === time ? "active" : ""}`}
            onClick={() => handleTimeWindowChange(time)}
          >
            {time === "Today" ? (
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
            {time}
          </button>
        ))}
      </div>

      {/* ══ CATEGORY CHIPS ════════════════ */}
      <div className="filter-bar" style={{ paddingTop: 0 }}>
        {CAT_CHIPS.map((chip) => (
          <button
            key={chip}
            className={`filter-chip ${mediaTypeLabel === chip ? "active" : ""}`}
            onClick={() => handleFilterChange(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner" style={{ margin: "0 5vw 24px" }}>
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

      {/* ══ TWO-COLUMN LAYOUT ═════════════ */}
      {loading ? (
        <SkeletonGrid count={10} />
      ) : contents.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing trending right now</h3>
          <p>Check back soon.</p>
        </div>
      ) : (
        <div className="trending-layout">
          {/* ── Left: ranked card grid ── */}
          <div className="trending-grid-col">
            <div className="section-header">
              <h2 className="section-title">🔥 Trending {timeWindow}</h2>
            </div>
            <div
              className="page-grid"
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              {contents.map((content, i) => (
                <div
                  key={content.id}
                  className="trending-card-wrap"
                  style={{ animationDelay: `${Math.min(i * 50, 600)}ms` }}
                >
                  {/* big rank number behind card */}
                  <span className="rank-badge">{i + 1}</span>
                  <MovieCard movie={content} />
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
                    <>Load More</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Right: leaderboard ── */}
          <aside className="trending-sidebar">
            <div className="section-header" style={{ padding: "0 0 0px" }}>
              <h2 className="section-title">Top 5</h2>
              <span className="sort-label">{timeWindow}</span>
            </div>

            <div className="leaderboard">
              {contents.slice(0, 5).map((content, index) => (
                <LeaderboardRow
                  key={content.id}
                  contents={content}
                  index={index}
                />
              ))}
            </div>

            {/* ── Mini stat card ── */}
            <div className="sidebar-stat-card">
              <p className="sidebar-stat-heading">📊 Trending Insights</p>
              <div className="sidebar-stat-row">
                <span>Window</span>
                <strong>{timeWindowLabel}</strong>
              </div>

              <div className="sidebar-stat-row">
                <span>Category</span>
                <strong>{mediaTypeLabel}</strong>
              </div>

              <div className="sidebar-stat-row">
                <span>Top avg rating ({contents.length})</span>
                <strong style={{ color: "#f5c518" }}>
                  ⭐{" "}
                  {contents.length > 0
                    ? (
                        contents
                          .slice(0, contents.length)
                          .reduce((acc, m) => acc + (m.vote_average || 0), 0) /
                        contents.length
                      ).toFixed(1)
                    : "—"}
                </strong>
              </div>

              <div className="sidebar-stat-row">
                <span>Total results</span>
                <strong style={{ color: "var(--red)" }}>
                  {contents.length}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Trending;
