import React, { useCallback, useEffect, useRef, useState } from "react";
import "../css/Actors.css";
import "../css/PagesShared.css";
import {
  searchPeople,
  // getPersonDetails,
  getPopularPeople,
} from "../services/api";
import { ActorSearchBar } from "../components/ActorSearchBar";
import ActorProfileDetailView from "../components/ActorProfileDetailView";
import { ProfilePlaceholder } from "../components/ProfilePlaceholder";
import { useNavigate } from "react-router-dom";

// ══════════════════════════════════════════════════════════════════
//  ACTOR GRID CARD  (used in both "default" and "grid" views)
// ══════════════════════════════════════════════════════════════════
const ActorGridCard = ({ person, onClick, delay = 0 }) => {
  const photo = person.profile_path
    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
    : null;

  const knownFor = person.known_for
    ?.slice(0, 2)
    .map((k) => k.title ?? k.name)
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      className="actor-grid-card"
      onClick={() => onClick(person)}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`View ${person.name}`}
    >
      {/* Photo */}
      <div className="actor-grid-photo">
        {photo ? (
          <img src={photo} alt={person.name} loading="lazy" />
        ) : (
          <ProfilePlaceholder size={36} />
        )}
      </div>

      {/* Info */}
      <div className="actor-grid-info">
        <h3 className="actor-grid-name">{person.name}</h3>
        {person.known_for_department && (
          <span className="actor-grid-dept">{person.known_for_department}</span>
        )}
        {knownFor && (
          <div className="actor-grid-known">
            <div>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <span>{knownFor}</span>
          </div>
        )}
      </div>

      {/* Popularity badge */}
      {person.popularity && (
        <div className="actor-grid-pop">
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="#f5c518"
            stroke="none"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          {person.popularity.toFixed(0)}
        </div>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────
const Actors = () => {
  const navigate = useNavigate();

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [dropDownResults, setDropDownResults] = useState([]);
  const [showDropDown, setShowDropDown] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);

  // ── View state: "default" | "grid" | "profile" ──
  const [view, setView] = useState("default");

  // ── Grid state (search results or popular) ──
  const [gridItems, setGridItems] = useState([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState(null);
  const [gridTitle, setGridTitle] = useState("Popular People");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Profile state ──
  // const [actor, setActor] = useState(null);
  // const [credits, setCredits] = useState([]);
  // const [images, setImages] = useState([]);
  // const [profileLoading, setProfileLoading] = useState(false);
  // const [profileError, setProfileError] = useState(null);

  const formRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const loadPopular = async () => {
      try {
        const data = await getPopularPeople(1);
        setGridItems(data.results);
        setTotalPages(data.totalPages);
        setCurrentPage(1);
        setGridTitle("Popular People");
        setView("default");
      } catch (err) {
        console.log(err);
        setGridError("Failed to load people.");
      } finally {
        setGridLoading(false);
      }
    };

    loadPopular();
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setShowDropDown(false);
        setActiveDropdownIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Fetch & Debounced dropdown as user types ── */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setDropDownResults([]);
      setShowDropDown(false);
      setActiveDropdownIndex(-1);
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await searchPeople(searchQuery.trim(), 1);
        setDropDownResults(data.results.slice(0, 6));
        setShowDropDown(true);
        setActiveDropdownIndex(-1);
      } catch (err) {
        console.error("Actor Dropdown error:", err);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  /* ── Keyboard navigation in dropdown ── */
  const handleKeyDown = (e) => {
    if (!showDropDown || dropDownResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveDropdownIndex((i) =>
        Math.min(i + 1, dropDownResults.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveDropdownIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeDropdownIndex >= 0) {
      e.preventDefault();
      handleDropdownSelect(dropDownResults[activeDropdownIndex]);
    } else if (e.key === "Escape") {
      setShowDropDown(false);
      setActiveDropdownIndex(-1);
    }
  };

  /* ── Select a dropdown item → fill input and run search ── */
  const handleDropdownSelect = useCallback(
    async (person) => {
      const actorName = person.name ?? "";
      setSearchQuery(actorName);
      setShowDropDown(false);
      setActiveDropdownIndex(-1);
      inputRef.current?.focus();

      // await loadProfile(person.id);

      navigate(`/actors/${person.id}`);
    },
    [navigate],
  );

  /* ── Grid card clicked → navigate to profile page ── */
  const handleCardClick = useCallback(
    (person) => {
      navigate(`/actors/${person.id}`);
    },
    [navigate],
  );

  // /* ── Load full actor profile ── */
  // const loadProfile = async (personId) => {
  //   setProfileLoading(true);
  //   setProfileError(null);

  //   try {
  //     const data = await getPersonDetails(personId);
  //     setActor(data);
  //     // Sort credits by release date descending
  //     const sorted = [...data.credits].sort((a, b) =>
  //       (b.release_date ?? b.first_air_date ?? "").localeCompare(
  //         a.release_date ?? a.first_air_date ?? "",
  //       ),
  //     );

  //     setCredits(sorted);
  //     setImages(data.images.slice(0, 10));
  //     setView("profile");
  //   } catch (err) {
  //     console.log(err);
  //     setProfileError("Failed to load actor profile.");
  //   } finally {
  //     setProfileLoading(false);
  //   }
  // };

  /* ── Form submit → show search results grid ── */
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setShowDropDown(false);
    setGridLoading(true);
    setGridError(null);
    try {
      const data = await searchPeople(q, 1);

      setGridItems(data.results);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
      setGridTitle(`Results for "${q}"`);
      setView("grid");
    } catch (err) {
      console.log(err);
      setGridError("Search failed. Please try again.");
    } finally {
      setGridLoading(false);
    }
  };

  /* ── Load more (pagination) ── */
  const handleLoadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const data =
        view === "grid"
          ? await searchPeople(searchQuery.trim(), nextPage)
          : await getPopularPeople(nextPage);
      setGridItems((prev) => [...prev, ...data.results]);
      setCurrentPage(nextPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.log(err);
      setGridError("Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  };

  /* ── clear search, reload popular ── */
  const handleClear = async () => {
    setSearchQuery("");
    setGridLoading(true);
    setGridError(null);
    setDropDownResults([]);
    setShowDropDown(false);
    setView("default");

    try {
      const data = await getPopularPeople(1);
      setGridItems(data.results);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
      setGridTitle("Popular People");
    } catch (err) {
      console.log(err);
      setGridError("Failed to load content.");
    } finally {
      setGridLoading(false);
    }
  };

  // ── Back from profile → previous grid view ──
  // const handleBack = () => {
  //   setView(searchQuery.trim() ? "grid" : "default");
  //   setActor(null);
  // };

  // console.log(
  //   "View:",
  //   view,
  //   "Grid items:",
  //   gridItems.length,
  //   "Actor:",
  //   actor?.name,
  // );

  return (
    <div className="page actor-page">
      {/* ══ HERO HEADER ════════════════════════════════════════════ */}
      {view !== "profile" && (
        <>
          <header className=" page-hero actor-page-hero ">
            <p className="page-eyebrow">Discover Talent</p>
            <h1 className="page-title">
              Browse <span>Actors</span>
            </h1>
            <p className="page-desc">
              Search for actors, directors and crew — click a result to explore
              their full profile and filmography.
            </p>
          </header>

          <div className="page-divider" />
        </>
      )}

      {/* ══ SEARCH BAR ═════════════════════════════════════════════ */}
      <div
        className={`actor-search-wrap ${view === "profile" ? "actor-search-wrap--profile" : ""}`}
      >
        <ActorSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          handleClear={handleClear}
          dropDownResults={dropDownResults}
          showDropDown={showDropDown}
          setShowDropDown={setShowDropDown}
          activeDropdownIndex={activeDropdownIndex}
          setActiveDropdownIndex={setActiveDropdownIndex}
          handleDropdownSelect={handleDropdownSelect}
          handleKeyDown={handleKeyDown}
          inputRef={inputRef}
          formRef={formRef}
          dropdownRef={dropdownRef}
        />
      </div>

      {/* ══ PROFILE VIEW ═══════════════════════════════════════════ */}
      {/* {view === "profile" && profileLoading && (
        <div className="actor-loading-state">
          <span className="actor-loading-spinner" />
          <p>Loading profile…</p>
        </div>
      )}
      {view === "profile" && profileError && (
        <div className="actor-error-banner">{profileError}</div>
      )}

      {view === "profile" && actor && !profileLoading && (
        <ActorProfileDetailView
          actor={actor}
          credits={credits}
          images={images}
          onBack={handleBack}
        />
      )} */}

      {/* ══ GRID VIEW (default popular / search results) ══════════ */}
      {/* {(view === "default" || view === "grid") && ( */}
      <section className="actor-grid-section">
        {/* Section header */}
        <div className="actor-grid-header">
          <h2 className="actor-section-title">{gridTitle}</h2>
          <div className="actor-section-count">
            {gridItems.length} title{gridItems.length !== 1 ? "s" : ""}
            {view === "grid" && (
              <button
                type="button"
                className="actor-back-link"
                onClick={handleClear}
              >
                ← Popular People
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {gridError && <div className="actor-error-banner">{gridError}</div>}

        {/* Skeleton */}
        {gridLoading ? (
          <div className="actor-people-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="actor-grid-card actor-grid-card--skeleton"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="actor-grid-photo actor-grid-photo--skeleton" />
                <div className="actor-grid-info">
                  <div className="actor-skeleton-line actor-skeleton-line--med" />
                  <div className="actor-skeleton-line actor-skeleton-line--short" />
                </div>
              </div>
            ))}
          </div>
        ) : gridItems.length === 0 ? (
          <div className="actor-empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.25 }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3>No results found</h3>
            <p>Try a different name or spelling.</p>
          </div>
        ) : (
          <div className="actor-people-grid">
            {gridItems.map((person, i) => (
              <ActorGridCard
                key={person.id}
                person={person}
                // onClick={(p) => loadProfile(p.id)}
                onClick={handleCardClick}
                delay={Math.min(i * 40, 500)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!gridLoading && currentPage < totalPages && (
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
      {/* )} */}
    </div>
  );
};

export default Actors;
