import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPersonDetails } from "../services/api";
import ActorProfileDetailView from "../components/ActorProfileDetailView";

const ActorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [actor, setActor] = useState(null);
  const [credits, setCredits] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Scroll to top whenever the id changes (user navigates to a
    // different actor without unmounting the component)
    window.scrollTo({ top: 0, behavior: "instant" });

    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPersonDetails(Number(id));
        setActor(data);

        // Sort credits newest-first so filmography shows latest work at top
        const sorted = [...data.credits].sort((a, b) =>
          (b.release_date ?? b.first_air_date ?? "").localeCompare(
            a.release_date ?? a.first_air_date ?? "",
          ),
        );

        setCredits(sorted);
        setImages(data.images.slice(0, 10));
      } catch (err) {
        console.log(err);
        setError("Failed to load actor profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]); // re-fetch whenever the URL id changes

  // ── Back handler — go to the actors browse page ──────────────────
  const handleBack = () => {
    navigate("/actors");
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="actor-page">
        <div className="actor-loading-state">
          <span className="actor-loading-spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !actor) {
    return (
      <div className="actor-page">
        <div className="actor-loading-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.3 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error ?? "Actor not found."}</p>
          <button
            type="button"
            className="actor-back-btn"
            style={{ marginTop: 12 }}
            onClick={handleBack}
          >
            ← Back to Actors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="actor-page">
      <ActorProfileDetailView
        actor={actor}
        credits={credits}
        images={images}
        onBack={handleBack}
      />
    </div>
  );
};

export default ActorProfilePage;
