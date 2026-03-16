// ═════════════════════════════════════════════════════════════════════════════
//
//  api.js  –  MovieCompass  ·  TMDB API Service Layer
//
//  All network calls to TMDB go through this file.
//  Nothing outside this file should construct URLs or touch fetch() directly.
//
//  Base URL : https://api.themoviedb.org/3
//  Docs     : https://developer.themoviedb.org/reference/intro/getting-started
//  Images   : https://image.tmdb.org/t/p/{size}{poster_path}
//             common sizes → w92 · w185 · w342 · w500 · w780 · original
//
//  Sections in this file
//  ─────────────────────
//  1.  Core helper        (apiFetch)
//  2.  Movies             (popular · top-rated · now-playing · upcoming · discover · genres · details · videos · search)
//  3.  TV Shows           (popular · top-rated · airing-today · on-the-air · discover · genres · videos)
//  4.  Trending           (movies · tv · combined)
//  5.  Combined / Mixed   (popular mix · top-rated mix)
//  6.  Genres             (all genres merged · discover by genre)
//  7.  Exported constants (sort options · category fetcher maps)
//
// ═════════════════════════════════════════════════════════════════════════════

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL =
  import.meta.env.VITE_BASE_URL || "https://api.themoviedb.org/3";

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1 · CORE HELPER
//
//  Every request flows through apiFetch so error handling, API key injection,
//  and query-string building all live in exactly one place.
//  A non-OK HTTP status (401 bad key, 404 not found, 429 rate-limited, etc.)
//  throws immediately instead of silently returning malformed data.
// ─────────────────────────────────────────────────────────────────────────────

const apiFetch = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);

  url.searchParams.set("api_key", API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB ${response.status}: ${response.statusText} — ${endpoint}`,
    );
  }

  return response.json();
};

// Shared response shaper — keeps every paginated return consistent
const paginated = (data) => ({
  results: data.results ?? [],
  totalPages: data.total_pages ?? 1,
  totalResults: data.total_results ?? 0,
  currentPage: data.page ?? 1,
});

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2 · MOVIES
// ─────────────────────────────────────────────────────────────────────────────

// ── 2a. Popular ──────────────────────────────────────────────────────────────
//  Default landing list. TMDB "popularity" is a composite score based on
//  page-views, votes, and watchlist adds — NOT the same as highest-rated.
//  Returns 20 results per page; use `page` to paginate.
export const getPopularMovies = async (page = 1) =>
  paginated(await apiFetch("/movie/popular", { page }));

// ── 2b. Top Rated ────────────────────────────────────────────────────────────
//  Uses TMDB's Bayesian weighted-average formula (similar to IMDb's).
//  A film needs a minimum vote count to qualify, which prevents obscure
//  titles with a handful of 10/10 votes from gaming the list.
export const getTopRatedMovies = async (page = 1) =>
  paginated(await apiFetch("/movie/top_rated", { page }));

// ── 2c. Now Playing ──────────────────────────────────────────────────────────
//  Films currently in cinemas. TMDB uses a rolling ±2-week window from today.
//  Response also includes a `dates` object ({ minimum, maximum }) so you can
//  display "In cinemas between X and Y" in the UI.
export const getNowPlayingMovies = async (page = 1) => {
  const data = await apiFetch("/movie/now_playing", { page });
  return { ...paginated(data), dates: data.dates };
};

// ── 2d. Upcoming ─────────────────────────────────────────────────────────────
//  Films with a future release_date. Great for a "Coming Soon" rail.
//  Also returns `dates` for display purposes.
export const getUpcomingMovies = async (page = 1) => {
  const data = await apiFetch("/movie/upcoming", { page });
  return { ...paginated(data), dates: data.dates };
};

// ── 2e. Discover Movies ──────────────────────────────────────────────────────
//  The most powerful movie endpoint — lets you combine genre filtering AND
//  sorting in a single server-side call. Avoids the anti-pattern of fetching
//  20 results and filtering on the client (you'd miss 99% of matching films).
//
//  Key params:
//    genreIds     – array of TMDB genre IDs   e.g. [28, 12]
//    sortBy       – one of the SORT_OPTIONS values
//    voteCountMin – minimum votes guard (prevents obscure films rising to top
//                   when sorting by rating)
//    page         – pagination
export const discoverMovies = async ({
  genreIds = [],
  sortBy = "popularity.desc",
  page = 1,
  voteCountMin = 100,
} = {}) =>
  paginated(
    await apiFetch("/discover/movie", {
      with_genres: genreIds.join(",") || undefined,
      sort_by: sortBy,
      "vote_count.gte": voteCountMin,
      page,
    }),
  );

// ── 2f. Movie Genre List ─────────────────────────────────────────────────────
//  Returns the full id → name map for movie genres.
//  Call this ONCE on page load and cache — it almost never changes.
//  e.g. [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }, ...]
export const getMovieGenres = async () => {
  const data = await apiFetch("/genre/movie/list");
  return data.genres;
};

// ── 2g. Movie Details ────────────────────────────────────────────────────────
//  Full details for a single film. The list endpoints (/popular, /top_rated
//  etc.) only return summary objects — no runtime, tagline, budget, cast, or
//  trailers. Use this when a user opens a movie's detail page.
//
//  append_to_response bundles three sub-requests into one network call:
//    credits  → full cast & crew arrays
//    videos   → trailers, teasers, clips (replaces getMovieVideos)
//    similar  → recommended similar titles
export const getMovieDetails = async (movieId) => {
  const data = await apiFetch(`/movie/${movieId}`, {
    append_to_response: "credits,videos,similar",
  });
  return {
    ...data,
    cast: data.credits?.cast ?? [],
    crew: data.credits?.crew ?? [],
    videos: data.videos?.results ?? [],
    similar: data.similar?.results ?? [],
  };
};

// ── 2h. Movie Videos ─────────────────────────────────────────────────────────
//  Fetches trailers, teasers and clips for a single movie.
//  Kept as a standalone function for MovieCard's lazy-fetch pattern
//  (videos are fetched on first play-button click, not on card render).
//  Returns the raw results array — filter by type/site in the component.
export const getMovieVideos = async (movieId) => {
  const data = await apiFetch(`/movie/${movieId}/videos`);
  return data.results ?? [];
};

// ── 2i. Search Movies ────────────────────────────────────────────────────────
//  Full-text search across TMDB's movie catalogue only.
//  Use searchMulti (below) when you want movies + TV in one call.
//  Note: query is encoded here so callers pass raw strings.
export const searchMovies = async (query, page = 1) =>
  paginated(
    await apiFetch("/search/movie", {
      query: encodeURIComponent(query),
      page,
    }),
  );

// ── 2j. Search TV Shows ──────────────────────────────────────────────────────
//  Full-text search across TMDB's TV catalogue only.
//  Returns the same paginated shape as searchMovies.
//  TV results have `name` / `first_air_date` — normalize before passing
//  to MovieCard (see normalizeTvItem in Section 5).
export const searchTvShows = async (query, page = 1) =>
  paginated(
    await apiFetch("/search/tv", {
      query: encodeURIComponent(query),
      page,
    }),
  );

// ── 2k. Multi Search (movies + TV shows + people) ────────────────────────────
//  TMDB's /search/multi endpoint searches movies, TV shows, and people
//  in a single API call — no need to run two searches and merge them.
//
//  Every result carries a `media_type` field:
//    "movie"  → has title, release_date, poster_path  (same as movie objects)
//    "tv"     → has name, first_air_date, poster_path (normalize before use)
//    "person" → has name, profile_path, known_for[]   (no poster_path)
//
//  The `includeTypes` param lets callers filter to only the types they want.
//  Default ["movie", "tv"] — pass ["movie", "tv", "person"] to include people.
//
//  TV and person results are normalized here so the returned array is
//  consistent: every item has `title`, `release_date`, and `media_type`.
export const searchMulti = async (
  query,
  page = 1,
  includeTypes = ["movie", "tv"],
) => {
  const data = await apiFetch("/search/multi", {
    query: encodeURIComponent(query),
    page,
  });

  // Normalize TV and person fields to match movie shape
  const normalized = (data.results ?? [])
    .filter((item) => includeTypes.includes(item.media_type))
    .map((item) => {
      if (item.media_type === "tv") {
        return {
          ...item,
          title: item.name ?? item.original_name,
          release_date: item.first_air_date,
        };
      }
      if (item.media_type === "person") {
        return {
          ...item,
          title: item.name,
          release_date: null,
          // poster_path is profile_path for people — map it so
          // any image component that reads poster_path still works
          poster_path: item.profile_path,
        };
      }
      return item; // media_type === "movie" — already the right shape
    });

  return {
    results: normalized,
    totalPages: data.total_pages ?? 1,
    totalResults: data.total_results ?? 0,
    currentPage: data.page ?? 1,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 3 · TV SHOWS
// ─────────────────────────────────────────────────────────────────────────────
//  TV shows use `name` and `first_air_date` instead of `title` / `release_date`.
//  Normalize these fields before passing to MovieCard (see normalizeTv in
//  TvShows.jsx) so shared components don't need to know about the difference.

// ── 3a. Popular TV ───────────────────────────────────────────────────────────
export const getPopularTvShows = async (page = 1) =>
  paginated(await apiFetch("/tv/popular", { page }));

// ── 3b. Top Rated TV ─────────────────────────────────────────────────────────
export const getTopRatedTvShows = async (page = 1) =>
  paginated(await apiFetch("/tv/top_rated", { page }));

// ── 3c. Airing Today ─────────────────────────────────────────────────────────
//  Shows with at least one episode airing on today's date in any region.
//  Used as the source for the SpotlightBanner featured show.
export const getAiringTodayTvShows = async (page = 1) =>
  paginated(await apiFetch("/tv/airing_today", { page }));

// ── 3d. On The Air ───────────────────────────────────────────────────────────
//  Shows airing at any point in the next 7 days — a broader window than
//  "Airing Today" and good for a "Don't miss this week" section.
export const getOnTheAirTvShows = async (page = 1) =>
  paginated(await apiFetch("/tv/on_the_air", { page }));

// ── 3e. Discover TV Shows ────────────────────────────────────────────────────
//  Same server-side filter+sort power as discoverMovies but for TV.
//  Note: TV sort keys differ from movie — use TV_SORT_OPTIONS values.
export const discoverTvShows = async ({
  genreIds = [],
  sortBy = "popularity.desc",
  page = 1,
} = {}) =>
  paginated(
    await apiFetch("/discover/tv", {
      with_genres: genreIds.join(",") || undefined,
      sort_by: sortBy,
      page,
    }),
  );

// ── 3f. TV Genre List ────────────────────────────────────────────────────────
//  Returns the id → name map for TV genres.
//  TV and movie genres share some IDs but not all — keep them separate unless
//  you intentionally merge them (see getAllGenres in Section 6).
export const getTvGenres = async () => {
  const data = await apiFetch("/genre/tv/list");
  return data.genres;
};

// ── 3g. TV Show Videos ───────────────────────────────────────────────────────
//  Fetches trailers, teasers and clips for a single TV show.
//  TV list endpoints never include video data, so this must be called
//  separately. Used by SpotlightBanner and the TvShows grid's attachVideos
//  helper to pre-load trailers before cards are rendered.
export const getTvShowVideos = async (tvId) => {
  const data = await apiFetch(`/tv/${tvId}/videos`);
  return data.results ?? [];
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 4 · TRENDING
// ─────────────────────────────────────────────────────────────────────────────
//  TMDB trending is calculated from real-time page views, votes, and watchlist
//  activity over the chosen time window. It is completely separate from the
//  static "popularity score" used in /movie/popular and /tv/popular.

// ── 4a. Trending (generic) ───────────────────────────────────────────────────
//  Single function that powers all trending variants via params:
//    mediaType  : "all" | "movie" | "tv"
//    timeWindow : "day" | "week"
//  "all" returns a mixed list of movies and TV shows — each item carries a
//  `media_type` field ("movie" or "tv") so you can tell them apart.
export const getTrending = async (
  mediaType = "all",
  timeWindow = "day",
  page = 1,
) =>
  paginated(await apiFetch(`/trending/${mediaType}/${timeWindow}`, { page }));

// ── 4b. Trending Movies ──────────────────────────────────────────────────────
//  Convenience wrapper — same as getTrending("movie", timeWindow).
//  Use when you specifically want only movies and don't need the mixed list.
export const getTrendingMovies = async (timeWindow = "day", page = 1) =>
  getTrending("movie", timeWindow, page);

// ── 4c. Trending TV Shows ────────────────────────────────────────────────────
//  Convenience wrapper — same as getTrending("tv", timeWindow).
export const getTrendingTvShows = async (timeWindow = "day", page = 1) =>
  getTrending("tv", timeWindow, page);

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 5 · COMBINED / MIXED  (movies + TV shows together)
// ─────────────────────────────────────────────────────────────────────────────
//  These functions fetch from both movies and TV in parallel then interleave
//  the results. Useful for a home-page "Popular" row that shows the best of
//  both without the user having to switch tabs.
//
//  Each item is tagged with `media_type: "movie"` or `media_type: "tv"` so
//  downstream components (MovieCard, favorites context, etc.) can branch on it.
//  TV items are also normalized (name → title, first_air_date → release_date).

// ── Normalize a TV show so it looks like a movie object ──────────────────────
const normalizeTvItem = (show) => ({
  ...show,
  title: show.name ?? show.original_name,
  release_date: show.first_air_date,
  media_type: "tv",
});

// ── Interleave two arrays (m[0], t[0], m[1], t[1], …) ───────────────────────
//  Produces a naturally mixed list rather than all movies then all TV.
const interleave = (movies, tvShows) => {
  const out = [];
  const len = Math.max(movies.length, tvShows.length);
  for (let i = 0; i < len; i++) {
    if (movies[i]) out.push({ ...movies[i], media_type: "movie" });
    if (tvShows[i]) out.push(normalizeTvItem(tvShows[i]));
  }
  return out;
};

// ── 5a. Combined Popular ─────────────────────────────────────────────────────
//  Fetches popular movies AND popular TV shows in parallel, then interleaves
//  them into a single list. Great for the Home page hero grid.
//
//  Returns:
//    results      – interleaved array (movies + tv, media_type tagged)
//    moviePages   – total pages available for movies
//    tvPages      – total pages available for TV shows
export const getCombinedPopular = async (page = 1) => {
  const [movies, tvShows] = await Promise.all([
    getPopularMovies(page),
    getPopularTvShows(page),
  ]);
  return {
    results: interleave(movies.results, tvShows.results),
    moviePages: movies.totalPages,
    tvPages: tvShows.totalPages,
    currentPage: page,
  };
};

// ── 5b. Combined Top Rated ───────────────────────────────────────────────────
//  Fetches top-rated movies AND top-rated TV shows in parallel, interleaves
//  them, then sorts the combined list by vote_average descending so the
//  highest-rated titles across both categories bubble to the top.
//
//  Returns:
//    results      – interleaved + sorted array (highest rated first)
//    moviePages   – total pages available for movies
//    tvPages      – total pages available for TV shows
export const getCombinedTopRated = async (page = 1) => {
  const [movies, tvShows] = await Promise.all([
    getTopRatedMovies(page),
    getTopRatedTvShows(page),
  ]);
  const merged = interleave(movies.results, tvShows.results).sort(
    (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
  );
  return {
    results: merged,
    moviePages: movies.totalPages,
    tvPages: tvShows.totalPages,
    currentPage: page,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 6 · GENRES
// ─────────────────────────────────────────────────────────────────────────────

// ── 6a. All Genres (merged) ──────────────────────────────────────────────────
//  Fetches both the movie and TV genre lists and merges them into one
//  deduplicated array keyed by genre ID. Some genres exist in both lists
//  with the same ID (e.g. Action = 28 in both); deduplication prevents
//  duplicates in the Genres page grid.
export const getAllGenres = async () => {
  const [movieData, tvData] = await Promise.all([
    apiFetch("/genre/movie/list"),
    apiFetch("/genre/tv/list"),
  ]);
  const map = new Map();
  [...movieData.genres, ...tvData.genres].forEach((g) => map.set(g.id, g));
  return Array.from(map.values());
};

// ── 6b. Movies by Genre ──────────────────────────────────────────────────────
//  Discover movies filtered to a single genre ID.
//  voteCountMin = 50 keeps the results reasonably popular without being as
//  strict as the general discover endpoint (100 votes).
export const getMoviesByGenre = async (genreId, page = 1) =>
  paginated(
    await apiFetch("/discover/movie", {
      with_genres: genreId,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      page,
    }),
  );

// ── 6c. TV Shows by Genre ────────────────────────────────────────────────────
//  Discover TV shows filtered to a single genre ID.
export const getTvByGenre = async (genreId, page = 1) =>
  paginated(
    await apiFetch("/discover/tv", {
      with_genres: genreId,
      sort_by: "popularity.desc",
      page,
    }),
  );

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 7 · EXPORTED CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// ── 7a. Movie Sort Options ───────────────────────────────────────────────────
//  Used by the Movies page sort dropdown AND passed as `sortBy` to
//  discoverMovies. Single source of truth — no magic strings in components.
export const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Release Date", value: "release_date.desc" },
  { label: "Revenue", value: "revenue.desc" },
  { label: "Title A–Z", value: "original_title.asc" },
];

// ── 7b. TV Sort Options ──────────────────────────────────────────────────────
//  TV sort keys differ from movie — "first_air_date" instead of
//  "release_date", and "original_name" instead of "original_title".
export const TV_SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "First Air Date", value: "first_air_date.desc" },
  { label: "Title A–Z", value: "original_name.asc" },
];

// ── 7c. Movie Category → Fetch Function Map ──────────────────────────────────
//  Maps filter chip labels to their fetch functions.
//  Usage in Movies.jsx:  CATEGORY_FETCHERS[activeFilter](page)
//  "All" is handled separately via getPopularMovies (the default).
export const CATEGORY_FETCHERS = {
  Popular: getPopularMovies,
  "Top Rated": getTopRatedMovies,
  "Now Playing": getNowPlayingMovies,
  Upcoming: getUpcomingMovies,
};

// ── 7d. TV Category → Fetch Function Map ─────────────────────────────────────
//  Same pattern as CATEGORY_FETCHERS but for the TV Shows page.
export const TV_CATEGORY_FETCHERS = {
  Popular: getPopularTvShows,
  "Top Rated": getTopRatedTvShows,
  "Airing Today": getAiringTodayTvShows,
  "On The Air": getOnTheAirTvShows,
};
