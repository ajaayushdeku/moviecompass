import { createContext, useContext, useEffect, useState } from "react";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

// ─────────────────────────────────────────────────────────────────
//  Valid watch statuses — single source of truth
// ─────────────────────────────────────────────────────────────────
export const WATCH_STATUSES = ["unwatched", "watching", "watched"];

export const MovieProvider = ({ children }) => {
  // ── Favorites ──────────────────────────────────────────────────
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem("favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (movie) => {
    setFavorites((prev) =>
      prev.some((f) => f.id === movie.id) ? prev : [...prev, movie],
    );
  };

  const removeFromFavorites = (movieId) => {
    setFavorites((prev) => prev.filter((m) => m.id !== movieId));
  };

  const isFavorite = (movieId) => favorites.some((m) => m.id === movieId);

  // ── Watchlist ──────────────────────────────────────────────────
  const [watchList, setWatchList] = useState(() => {
    try {
      const stored = localStorage.getItem("watchList");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("watchList", JSON.stringify(watchList));
  }, [watchList]);

  // Add movie — always sets a default status of "unwatched"
  const addWatchList = (movie) => {
    setWatchList((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      return [...prev, { ...movie, status: "unwatched" }];
    });
  };

  const removeFromWatchList = (movieId) => {
    setWatchList((prev) => prev.filter((m) => m.id !== movieId));
  };

  // Wipe the entire watchlist — used by "Clear all" button
  const clearWatchList = () => setWatchList([]);

  const isWatchListed = (movieId) => watchList.some((m) => m.id === movieId);

  // Always returns a valid string — never undefined
  const getWatchStatus = (movieId) => {
    const movie = watchList.find((m) => m.id === movieId);
    return movie?.status ?? "unwatched";
  };

  // Update status — validates input before applying so bad values can't
  // slip into localStorage from a typo or a future refactor
  const updateStatus = (movieId, newStatus) => {
    if (!WATCH_STATUSES.includes(newStatus)) {
      console.warn(
        `MovieContext: invalid status "${newStatus}". ` +
          `Must be one of: ${WATCH_STATUSES.join(", ")}`,
      );
      return;
    }
    setWatchList((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, status: newStatus } : m)),
    );
  };

  // Reset a single item back to "unwatched" without removing it
  const resetStatus = (movieId) => updateStatus(movieId, "unwatched");

  const value = {
    // Favorites
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,

    // Watchlist
    watchList,
    addWatchList,
    removeFromWatchList,
    clearWatchList,
    isWatchListed,
    getWatchStatus,
    updateStatus,
    resetStatus,
  };

  return (
    <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
  );
};
