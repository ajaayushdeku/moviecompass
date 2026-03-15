import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "../css/MovieTrailerModal.css";

const MovieTrailerModal = ({ movie, onClose }) => {
  const videos = movie.videos ?? [];

  // Prefer an official Trailer, fall back to Teaser, then any YouTube video
  const trailer =
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ??
    videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ??
    videos.find((v) => v.site === "YouTube");

  // Label shown in the footer changes based on what we found
  const videoLabel =
    trailer?.type === "Trailer"
      ? "Official Trailer"
      : trailer?.type === "Teaser"
        ? "Official Teaser"
        : trailer
          ? "Official Clip"
          : "No Video";

  // TV shows use `name`, movies use `title`
  const displayTitle =
    movie.title ?? movie.name ?? movie.original_name ?? "Untitled";

  /* ── Close on Escape ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const modal = (
    <div className="trailer-modal" onClick={onClose}>
      <div className="trailer-dialog" onClick={(e) => e.stopPropagation()}>
        {/* ── Close ── */}
        <button
          className="trailer-close"
          onClick={onClose}
          aria-label="Close trailer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Video ── */}
        {trailer ? (
          <div className="trailer-content">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={trailer.name}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="trailer-no-video">
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
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <p>No trailer available for this title.</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="trailer-footer">
          <span className="trailer-movie-title">{displayTitle}</span>
          <span className="trailer-label">{videoLabel}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default MovieTrailerModal;
