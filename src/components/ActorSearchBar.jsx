import React from "react";
import "../css/Actors.css";
import { ProfilePlaceholder } from "./ProfilePlaceholder";

export const ActorSearchBar = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  handleClear,
  dropDownResults,
  showDropDown,
  setShowDropDown,
  activeDropdownIndex,
  setActiveDropdownIndex,
  handleDropdownSelect,
  handleKeyDown,
  inputRef,
  formRef,
  dropdownRef,
}) => {
  return (
    <div className="actor-search-section">
      <form
        ref={formRef}
        onSubmit={handleSearch}
        className={`actor-search-form ${showDropDown && dropDownResults.length > 0 ? "actor-search-form--open" : ""}`}
        autoComplete="off"
      >
        {/* Search icon */}
        <span className="actor-search-icon">
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

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className="actor-search-input"
          placeholder="Search actors, directors, crew…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => dropDownResults.length > 0 && setShowDropDown(true)}
          autoComplete="off"
          onKeyDown={handleKeyDown}
          aria-label="Search Actors, Directors, Crew"
          aria-autocomplete="list"
          aria-expanded={showDropDown}
          aria-controls="actor-dropdown"
        />

        {/* Clear × button — only when there's text */}
        {searchQuery && (
          <button
            type="button"
            className="actor-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            ✖
          </button>
        )}

        {/* Submit */}
        <button type="submit" className="actor-search-btn">
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
          <span>Search</span>
        </button>

        {/* ── Dropdown ── */}
        {showDropDown && dropDownResults.length > 0 && (
          <ul
            id="actor-dropdown"
            className="actor-dropdown"
            ref={dropdownRef}
            role="listbox"
          >
            {dropDownResults.map((person, idx) => {
              const photo = person.profile_path
                ? `https://image.tmdb.org/t/p/w92${person.profile_path}`
                : null;

              const dept = person.known_for_department ?? "Actor";

              return (
                <li
                  key={person.id}
                  role="option"
                  aria-selected={idx === activeDropdownIndex}
                  className={`actor-dropdown-item ${idx === activeDropdownIndex ? "actor-dropdown-item--active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDropdownSelect(person);
                  }}
                  onMouseEnter={() => setActiveDropdownIndex(idx)}
                >
                  {/* Thumbnail */}
                  <div className="dropdown-thumb">
                    {photo ? (
                      <img src={photo} alt={person.name} loading="lazy" />
                    ) : (
                      <ProfilePlaceholder size={18} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="actor-dropdown-text">
                    <span className="actor-dropdown-name">{person.name}</span>
                    <span className="actor-dropdown-dept">{dept}</span>
                  </div>

                  {/* Popularity */}
                  {person.popularity && (
                    <span className="actor-dropdown-pop">
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
                    </span>
                  )}
                </li>
              );
            })}

            {/* Footer hint */}
            <li className="actor-dropdown-footer" aria-hidden="true">
              Press <kbd>↵</kbd> to see all results
            </li>
          </ul>
        )}
      </form>
    </div>
  );
};
