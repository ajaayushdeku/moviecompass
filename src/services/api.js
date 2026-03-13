// ─────────────────────────────────────────────────────────────────
//  api.js  –  MovieCompass TMDB Service
//  Base URL: https://api.themoviedb.org/3
//  Docs:     https://developer.themoviedb.org/reference/intro/getting-started
// ─────────────────────────────────────────────────────────────────

const API_KEY = "5b914fd415702e49b3b63fdf819a8013";
const BASE_URL = "https://api.themoviedb.org/3";

// ─────────────────────────────────────────────────────────────────
//  HELPER
//  Every fetch goes through this so we have one place to handle
//  network errors and non-OK HTTP status codes.
//  Without this, a 404 or 401 would silently return bad data
//  instead of throwing — very hard to debug.
// ─────────────────────────────────────────────────────────────────
const apiFetch = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);

  // Always attach the API key
  url.searchParams.set("api_key", API_KEY);

  // Attach any extra query params (page, sort_by, with_genres, etc.)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB API error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
};

// ═════════════════════════════════════════════════════════════════
//  ① EXISTING — Popular Movies
//
//  WHY: The default landing state of the Movies page.
//  TMDB sorts by a proprietary "popularity score" (views + votes
//  + watchlist adds). This is NOT the same as highest rated.
//  page param enables pagination — TMDB returns 20 results per page.
// ═════════════════════════════════════════════════════════════════
export const getPopularMovies = async (page = 1) => {
  const data = await apiFetch("/movie/popular", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

// ═════════════════════════════════════════════════════════════════
//  ② NEW — Top Rated Movies
//
//  WHY: Different from Popular. Uses TMDB's weighted rating formula
//  (similar to IMDb's Bayesian average) so a film needs enough votes
//  to appear — prevents small niche films gaming the list.
//  Use this for the "Top Rated" filter chip on the Movies page.
// ═════════════════════════════════════════════════════════════════
export const getTopRatedMovies = async (page = 1) => {
  const data = await apiFetch("/movie/top_rated", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

// ═════════════════════════════════════════════════════════════════
//  ③ NEW — Now Playing Movies
//
//  WHY: Shows movies currently in cinemas — TMDB filters by
//  release_date within a rolling window (roughly ±2 weeks from today).
//  This is what makes a "In Theatres" section feel live and current.
//  The response also includes a `dates` object with the exact window.
// ═════════════════════════════════════════════════════════════════
export const getNowPlayingMovies = async (page = 1) => {
  const data = await apiFetch("/movie/now_playing", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
    dates: data.dates, // { maximum: "2024-...", minimum: "2024-..." }
  };
};

// ═════════════════════════════════════════════════════════════════
//  ④ NEW — Upcoming Movies
//
//  WHY: Shows movies whose release_date is in the future.
//  Great for a "Coming Soon" section. Also returns `dates` so you
//  can display a "releasing between X and Y" label in the UI.
// ═════════════════════════════════════════════════════════════════
export const getUpcomingMovies = async (page = 1) => {
  const data = await apiFetch("/movie/upcoming", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
    dates: data.dates,
  };
};

// ═════════════════════════════════════════════════════════════════
//  ⑤ NEW — Discover Movies (the most powerful endpoint)
//
//  WHY: The /discover/movie endpoint lets you filter AND sort in
//  one call. This powers the genre chips + sort dropdown working
//  together. Instead of fetching all movies and filtering on the
//  client (slow, limited to 20 results), TMDB does it server-side.
//
//  Key params:
//    with_genres   – comma-separated genre IDs e.g. "28,12"
//    sort_by       – "popularity.desc" | "vote_average.desc" |
//                    "release_date.desc" | "revenue.desc"
//    vote_count.gte – minimum votes (avoids obscure films rising
//                    to the top when sorting by rating)
//    page          – pagination
// ═════════════════════════════════════════════════════════════════
export const discoverMovies = async ({
  genreIds = [],
  sortBy = "popularity.desc",
  page = 1,
  voteCountMin = 100,
} = {}) => {
  const data = await apiFetch("/discover/movie", {
    with_genres: genreIds.join(",") || undefined,
    sort_by: sortBy,
    "vote_count.gte": voteCountMin,
    page,
  });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

// ═════════════════════════════════════════════════════════════════
//  ⑥ NEW — Movie Genres List
//
//  WHY: TMDB uses numeric genre IDs (e.g. Action = 28, Comedy = 35).
//  The genre chips in the UI need the human-readable names.
//  This endpoint returns the full id→name map.
//  Call it ONCE on app load and cache the result — it almost
//  never changes so there's no reason to re-fetch it.
// ═════════════════════════════════════════════════════════════════
export const getMovieGenres = async () => {
  const data = await apiFetch("/genre/movie/list");
  // Returns: [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }, ...]
  return data.genres;
};

// ═════════════════════════════════════════════════════════════════
//  ⑦ NEW — Movie Details (single movie)
//
//  WHY: The list endpoints (/popular, /top_rated etc.) return a
//  "summary" object — no runtime, no tagline, no budget, no
//  production companies, no full genre objects.
//  When a user clicks a movie card to see its detail page, you
//  need this endpoint to get the complete data.
//
//  append_to_response lets you bundle extra sub-requests into
//  ONE network call instead of three separate fetches:
//    credits  → cast & crew
//    videos   → trailers (replaces your getMovieVideos)
//    similar  → similar movie recommendations
// ═════════════════════════════════════════════════════════════════
export const getMovieDetails = async (movieId) => {
  const data = await apiFetch(`/movie/${movieId}`, {
    append_to_response: "credits,videos,similar",
  });

  return {
    ...data,
    // Shape the nested arrays for easy access
    cast: data.credits?.cast ?? [],
    crew: data.credits?.crew ?? [],
    videos: data.videos?.results ?? [],
    similar: data.similar?.results ?? [],
  };
};

// ═════════════════════════════════════════════════════════════════
//  ⑧ EXISTING — Movie Videos (kept for backward compatibility)
//
//  WHY STILL HERE: Your MovieCard and MovieTrailerModal components
//  already use this. Once you migrate to getMovieDetails with
//  append_to_response, you can remove this function.
//  For now it stays so nothing breaks.
// ═════════════════════════════════════════════════════════════════
export const getMovieVideos = async (movieId) => {
  const data = await apiFetch(`/movie/${movieId}/videos`);
  return data.results;
};

// ═════════════════════════════════════════════════════════════════
//  ⑨ EXISTING — Search Movies (upgraded with pagination)
//
//  WHY UPGRADED: The original didn't return page info, so you
//  couldn't tell if there were more results to load.
//  Now returns totalPages so a "Load More" button knows when to stop.
// ═════════════════════════════════════════════════════════════════
export const searchMovies = async (query, page = 1) => {
  const data = await apiFetch("/search/movie", {
    query: encodeURIComponent(query),
    page,
  });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

// ─────────────────────────────────────────────────────────────────
//  SORT OPTIONS MAP
//  Export this so the Movies page sort dropdown and discoverMovies
//  use the exact same keys — no magic strings scattered in the UI.
// ─────────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Release Date", value: "release_date.desc" },
  { label: "Revenue", value: "revenue.desc" },
  { label: "Title A–Z", value: "original_title.asc" },
];

// ─────────────────────────────────────────────────────────────────
//  CATEGORY → FETCH FUNCTION MAP
//  The Movies page filter chips map directly to these.
//  Instead of a big if/else in the component, just do:
//    CATEGORY_FETCHERS[activeFilter](page)
// ─────────────────────────────────────────────────────────────────
export const CATEGORY_FETCHERS = {
  Popular: getPopularMovies,
  "Top Rated": getTopRatedMovies,
  "Now Playing": getNowPlayingMovies,
  Upcoming: getUpcomingMovies,
};

// ═════════════════════════════════════════════════════════════════
//  TV SHOWS
// ═════════════════════════════════════════════════════════════════

export const getPopularTvShows = async (page = 1) => {
  const data = await apiFetch("/tv/popular", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

export const getTopRatedTvShows = async (page = 1) => {
  const data = await apiFetch("/tv/top_rated", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

export const getAiringTodayTvShows = async (page = 1) => {
  const data = await apiFetch("/tv/airing_today", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

export const getOnTheAirTvShows = async (page = 1) => {
  const data = await apiFetch("/tv/on_the_air", { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

export const discoverTvShows = async ({
  genreIds = [],
  sortBy = "popularity.desc",
  page = 1,
} = {}) => {
  const data = await apiFetch("/discover/tv", {
    with_genres: genreIds.join(",") || undefined,
    sort_by: sortBy,
    page,
  });
  return {
    results: data.results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    currentPage: data.page,
  };
};

export const getTvGenres = async () => {
  const data = await apiFetch("/genre/tv/list");
  return data.genres;
};

export const TV_CATEGORY_FETCHERS = {
  Popular: getPopularTvShows,
  "Top Rated": getTopRatedTvShows,
  "Airing Today": getAiringTodayTvShows,
  "On The Air": getOnTheAirTvShows,
};

// ═════════════════════════════════════════════════════════════════
//  TV Show Videos
//
//  WHY: TV shows from list endpoints (/airing_today, /popular etc.)
//  do NOT include video data. You must call this separately with
//  the show's id to get trailers, teasers and clips from YouTube.
//  Mirrors getMovieVideos but hits the /tv/ path instead of /movie/.
// ═════════════════════════════════════════════════════════════════
export const getTvShowVideos = async (tvId) => {
  const data = await apiFetch(`/tv/${tvId}/videos`);
  return data.results ?? [];
};
// ═════════════════════════════════════════════════════════════════
//  TRENDING  (works for movies, tv, or all)
// ═════════════════════════════════════════════════════════════════

// mediaType: "all" | "movie" | "tv"
// timeWindow: "day" | "week"
export const getTrending = async (
  mediaType = "all",
  timeWindow = "day",
  page = 1,
) => {
  const data = await apiFetch(`/trending/${mediaType}/${timeWindow}`, { page });
  return {
    results: data.results,
    totalPages: data.total_pages,
    currentPage: data.page,
  };
};

// ═════════════════════════════════════════════════════════════════
//  GENRES (combined movie + tv)
// ═════════════════════════════════════════════════════════════════

export const getAllGenres = async () => {
  const [movieGenres, tvGenres] = await Promise.all([
    apiFetch("/genre/movie/list"),
    apiFetch("/genre/tv/list"),
  ]);
  // Merge and deduplicate by id
  const map = new Map();
  [...movieGenres.genres, ...tvGenres.genres].forEach((g) => map.set(g.id, g));
  return Array.from(map.values());
};

// Fetch movies by a single genre id via discover
export const getMoviesByGenre = async (genreId, page = 1) => {
  const data = await apiFetch("/discover/movie", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    page,
  });
  return {
    results: data.results,
    totalPages: data.total_pages,
    currentPage: data.page,
  };
};

// Fetch TV shows by a single genre id via discover
export const getTvByGenre = async (genreId, page = 1) => {
  const data = await apiFetch("/discover/tv", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    page,
  });
  return {
    results: data.results,
    totalPages: data.total_pages,
    currentPage: data.page,
  };
};

export const TV_SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "First Air Date", value: "first_air_date.desc" },
  { label: "Title A–Z", value: "original_name.asc" },
];
