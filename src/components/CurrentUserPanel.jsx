import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

// Always-visible "who am I" panel, pinned to the bottom of the sidebar.
// Clicking it opens a small menu (View Profile / Settings / Logout); the
// primary requirement — showing the logged-in user — works even if the
// caller doesn't wire up onViewProfile/onSettings, since Logout alone covers
// the must-have action.
export default function CurrentUserPanel({ user, onLogout, onViewProfile, onSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  if (!user) return null;

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  return (
    <div className="current-user" ref={panelRef}>
      {menuOpen && (
        <div className="current-user__menu" role="menu">
          <button
            type="button"
            className="current-user__menu-item"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onViewProfile?.();
            }}
          >
            View Profile
          </button>
          <button
            type="button"
            className="current-user__menu-item"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onSettings?.();
            }}
          >
            Settings
          </button>
          <div className="current-user__menu-divider" />
          <button
            type="button"
            className="current-user__menu-item current-user__menu-item--danger"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}

      <button
        type="button"
        className="current-user__trigger"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <Avatar name={fullName} src={user.profilePicture} online size={40} onClick={onViewProfile} />
        <div className="current-user__info" onClick={() => setMenuOpen(open => !open)}>
          <span className="current-user__name">{fullName}</span>
          <span className="current-user__email">{user.email}</span>
          <span className="current-user__status">
            <span className="current-user__status-dot" />
            Online
          </span>
        </div>
      </button>
    </div>
  );
}
