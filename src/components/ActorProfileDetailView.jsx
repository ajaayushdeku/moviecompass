import React, { useState } from "react";
import { ProfilePlaceholder } from "./ProfilePlaceholder";
import MediaIcon from "./MediaIcon";
import MovieTrailerModal from "./MovieTrailerModal";
import { getMovieVideos, getTvShowVideos } from "../services/api";
import { PosterPlaceholder } from "./PosterPlaceholder";
import "../css/Actors.css";
import "../css/PagesShared.css";

const FILTER_CHIPS = ["All", "Movies", "TV Shows"];

// ── Helpers ───────────────────────────────────────────────────────
const calcAge = (birthday) => {
  if (!birthday) return null;
  return Math.floor(
    (Date.now() - new Date(birthday)) / (1000 * 60 * 60 * 24 * 365.25),
  );
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ══════════════════════════════════════════════════════════════════
//  CREDIT CARD
// ══════════════════════════════════════════════════════════════════
const CreditCard = ({ credit, delay }) => {
  const [videos, setVideos] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const onPlayClick = async () => {
    // Already fetched (even if empty) — open modal immediately
    if (videos !== null) {
      setShowTrailer(true);
      return;
    }

    // First click — fetch videos, then open
    setLoadingVideo(true);
    try {
      const results =
        credit.media_type === "tv"
          ? await getTvShowVideos(credit.id)
          : await getMovieVideos(credit.id);
      setVideos(results);
    } catch (err) {
      console.error("Failed to fetch videos for credit:", credit.id, err);
      setVideos([]); // mark as fetched so we don't retry on next click
    } finally {
      setLoadingVideo(false);
      setShowTrailer(true);
    }
  };

  // Build the object passed to the modal — needs title + videos
  const creditForModal = {
    ...credit,
    title: credit.title ?? credit.name,
    videos: videos ?? [],
  };

  return (
    <>
      <div
        className="actor-credit-card"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* ── Poster ── */}
        <div className="actor-credit-poster">
          {credit.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
              alt={credit.title ?? credit.name}
              loading="lazy"
            />
          ) : (
            <PosterPlaceholder size={24} />
          )}

          {/* Play button — shows spinner while fetching */}
          <div className="play-overlay" onClick={onPlayClick}>
            <div className="play-btn-circle">
              {loadingVideo ? (
                <span
                  style={{
                    display: "block",
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="none"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </div>
          </div>

          {/* Rating badge */}
          <div className="actor-credit-rating">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="#f5c518"
              stroke="none"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            {credit.vote_average?.toFixed(1) ?? "—"}
          </div>

          {/* Media type badge */}
          <div
            className={`actor-credit-type actor-credit-type--${credit.media_type}`}
          >
            <MediaIcon type={credit.media_type === "tv" ? "tv" : "movie"} />
            {credit.media_type === "tv" ? "TV" : "Movie"}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="actor-credit-info">
          <h3 className="actor-credit-title">{credit.title ?? credit.name}</h3>
          <span className="actor-credit-year">
            {(credit.release_date ?? credit.first_air_date ?? "").split(
              "-",
            )[0] || "—"}
          </span>
          {credit.character && (
            <span className="actor-credit-role">{credit.character}</span>
          )}
        </div>
      </div>

      {/* Modal is rendered outside the card via createPortal (inside MovieTrailerModal) */}
      {showTrailer && (
        <MovieTrailerModal
          movie={creditForModal}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
//  ACTOR PROFILE DETAIL VIEW
// ══════════════════════════════════════════════════════════════════
const ActorProfileDetailView = ({ actor, credits, images, onBack }) => {
  const [activeMediaType, setActiveMediaType] = useState("All");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [creditLoad, setCreditLoad] = useState(10); // how many credits to show before "Load More"

  const [loadingMore, setLoadingMore] = useState(false);
  const currentPage = Math.ceil(creditLoad / 10);
  const totalPages = Math.ceil(credits.length / 10);

  const actorAge = calcAge(actor.birthday);
  const shortBio = actor.biography?.slice(0, 320);
  const bioIsTruncated = (actor.biography?.length ?? 0) > 320;

  const filteredCredits = credits.filter((c) => {
    if (activeMediaType === "Movies") return c.media_type === "movie";
    if (activeMediaType === "TV Shows") return c.media_type === "tv";
    return true;
  });

  /* ── Load more Credit ── */
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setCreditLoad((prev) => prev + 10);
      setLoadingMore(false);
    }, 1500); // Simulate loading delay
  };

  return (
    <div className="actor-profile-view">
      {/* ── Back button ── */}
      <button type="button" className="actor-back-btn" onClick={onBack}>
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
        Back to results
      </button>

      {/* ── Hero ── */}
      <section className="actor-hero">
        <div className="actor-hero-bg" />
        <div className="actor-hero-noise" />
        <div className="actor-hero-inner">
          {/* Photo */}
          <div className="actor-photo-wrap">
            {actor.profile_path ? (
              <img
                className="actor-photo"
                src={`https://image.tmdb.org/t/p/w342${actor.profile_path}`}
                alt={actor.name}
              />
            ) : (
              <div className="actor-photo actor-photo--placeholder">
                <ProfilePlaceholder size={52} />
              </div>
            )}

            <div className="actor-popularity-badge" title="TMDB popularity">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="#f5c518"
                stroke="none"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              {actor.popularity?.toFixed(0)}
            </div>
          </div>

          {/* Identity */}
          <div className="actor-identity">
            <p className="actor-known-for">
              {actor.known_for_department ?? "Actor"}
            </p>
            <h1 className="actor-name">{actor.name}</h1>

            <div className="actor-quick-stats">
              {actor.gender && (
                <div className="actor-stat">
                  {actor.gender === 1 ? (
                    <>
                      {/* Female Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="8" r="5" />
                        <line x1="12" y1="12" x2="12" y2="23" />
                        <line x1="8" y1="19" x2="16" y2="19" />
                      </svg>
                      <span>Female</span>
                    </>
                  ) : (
                    <>
                      {/* Male Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="10" cy="14" r="5" />
                        <line x1="14" y1="10" x2="20" y2="4" />
                        <line x1="15" y1="4" x2="20" y2="4" />
                        <line x1="20" y1="3" x2="20" y2="9" />
                      </svg>
                      <span>Male</span>
                    </>
                  )}
                </div>
              )}

              {actor.birthday && (
                <div className="actor-stat">
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
                  <span>{formatDate(actor.birthday)}</span>
                  {actorAge && (
                    <span className="actor-stat-muted">({actorAge} yrs)</span>
                  )}
                </div>
              )}

              {actor.place_of_birth && (
                <div className="actor-stat">
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
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{actor.place_of_birth}</span>
                </div>
              )}
            </div>

            {actor.also_known_as?.length > 0 && (
              <div className="actor-aliases">
                <span className="actor-aliases-label">Also known as</span>
                {actor.also_known_as.slice(0, 3).map((a, idx) => (
                  <span key={idx} className="actor-alias-chip">
                    {a}
                  </span>
                ))}
              </div>
            )}

            <div className="actor-bio-wrap">
              <p className="actor-bio">
                {bioExpanded ? actor.biography : shortBio}
                {!bioExpanded && bioIsTruncated && "…"}
              </p>
              {bioIsTruncated && (
                <button
                  type="button"
                  className="actor-bio-toggle"
                  onClick={() => setBioExpanded((v) => !v)}
                >
                  {bioExpanded ? "Show less ↑" : "Read more ↓"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="actor-divider" />

      {/* ── Stats strip ── */}
      <div className="actor-stats-strip">
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
                {/* Clapperboard — Credits */}
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            ),
            value: credits.length,
            label: "Credits",
            color: "#ff3943",
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
                {/* Star — Avg Rating */}
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ),
            value:
              credits.length > 0
                ? (
                    credits.reduce((s, c) => s + (c.vote_average || 0), 0) /
                    credits.length
                  ).toFixed(1)
                : "—",
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
                {/* Calendar — Latest Work */}
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
            value: credits[0]?.release_date?.split("-")[0] ?? "—",
            label: "Latest Work",
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
                {/* Trophy — Acclaimed */}
                <polyline points="8 21 12 17 16 21" />
                <path d="M6 3H18" />
                <path d="M6 3v4a6 6 0 0 0 12 0V3" />
                <path d="M6 7c-1.11 0-2 .89-2 2v1a4 4 0 0 0 8 0V9a2 2 0 0 0-2-2" />
                <path d="M18 7c1.11 0 2 .89 2 2v1a4 4 0 0 1-8 0V9a2 2 0 0 1 2-2" />
                <line x1="12" y1="17" x2="12" y2="12" />
              </svg>
            ),
            value: credits.filter((c) => c.vote_average >= 8).length,
            label: "Acclaimed",
            color: "#f59e0b",
          },
        ].map((stat, idx) => (
          <div
            className="actor-stats-pill"
            key={stat.label}
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <span className="actor-stats-icon" style={{ color: stat.color }}>
              {stat.icon}
            </span>
            <div className="actor-stats-body">
              <span className="actor-stats-value" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="actor-stats-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Photos strip ── */}
      {images.length > 0 && (
        <section className="actor-photos-section">
          <div className="actor-section-header">
            <h2 className="actor-section-title">📸 Photos</h2>
            <span className="actor-section-count">{images.length} images</span>
          </div>
          <div className="actor-photos-strip">
            {images.map((img, i) => (
              <button
                key={img.file_path ?? i}
                type="button"
                className={`actor-photo-thumb ${activeImage === i ? "actor-photo-thumb--active" : ""}`}
                onClick={() => setActiveImage(activeImage === i ? null : i)}
                style={{ animationDelay: `${i * 55}ms` }}
                aria-label={`Photo ${i + 1}`}
              >
                {img.file_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${img.file_path}`}
                    alt={`${actor.name} photo ${i + 1}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="actor-photo-thumb-placeholder">
                    <ProfilePlaceholder size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Filmography ── */}
      <section className="actor-credits-section">
        <div className="actor-section-header">
          <h2 className="actor-section-title">🎬 Filmography</h2>
          <div className="actor-filter-bar">
            {FILTER_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className={`filter-chip ${activeMediaType === chip ? "active" : ""}`}
                onClick={() => setActiveMediaType(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {filteredCredits.length === 0 ? (
          <div className="actor-empty-state">
            <p>
              No{" "}
              {activeMediaType !== "All" ? activeMediaType.toLowerCase() : ""}{" "}
              credits found.
            </p>
          </div>
        ) : (
          <div className="actor-credits-grid">
            {filteredCredits.slice(0, creditLoad).map((credit, idx) => (
              <CreditCard
                // key={`${credit.id}-${credit.media_type}`}
                key={idx}
                credit={credit}
                delay={Math.min(idx * 45, 500)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {currentPage < totalPages && (
          <div className="actor-load-more-wrap">
            <button
              className="actor-load-more-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <span className="actor-loading-spinner actor-loading-spinner--sm" />
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
      </section>
    </div>
  );
};

export default ActorProfileDetailView;
