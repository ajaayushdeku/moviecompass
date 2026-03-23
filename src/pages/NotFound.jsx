import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
    <h1
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "4rem",
        color: "var(--red)",
      }}
    >
      404
    </h1>
    <p style={{ color: "var(--muted)" }}>Page not found.</p>
    <Link to="/" style={{ color: "var(--red)" }}>
      ← Back to Home
    </Link>
  </div>
);

export default NotFound;
