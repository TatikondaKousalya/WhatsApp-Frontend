import { useRef, useState } from "react";
import { updateProfile, updateProfilePicture } from "../api/users";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

// Rendered via a React portal so it sits above the sidebar layout,
// not clipped inside it. The modal-backdrop / modal classes already
// exist in chat.css from the NewChatDialog, so we reuse them.
import { createPortal } from "react-dom";

export default function ProfileDialog({ onClose }) {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName:   user?.firstName   ?? "",
    lastName:    user?.lastName    ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    bio:         user?.bio         ?? "",
  });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  // Preview the picked image immediately before upload
  const [previewSrc, setPreviewSrc] = useState(
    user?.profileImage ?? null   // ← correct field name from backend
  );

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Save text fields ──────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser(updated);          // ← refresh AuthContext so sidebar name updates instantly
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't save profile.");
    } finally {
      setSaving(false);
    }
  }

  // ── Upload profile picture ────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately — no waiting for the server
    setPreviewSrc(URL.createObjectURL(file));
    setError(""); setSuccess("");
    setUploading(true);
    try {
      const updated = await updateProfilePicture(file); // PUT /api/users/profile-picture
      setUser(updated);          // ← refresh AuthContext so avatar updates in sidebar
      setSuccess("Profile picture updated.");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Picture upload failed.");
      setPreviewSrc(user?.profileImage ?? null); // revert preview on error
    } finally {
      setUploading(false);
      e.target.value = "";       // allow picking the same file again
    }
  }

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
      >
        {/* ── Avatar section ── */}
        <div className="profile-modal__avatar-row">
          <div
            className="profile-modal__avatar-wrap"
            title="Change photo"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewSrc
              ? <img src={previewSrc} alt="" className="profile-modal__avatar-img" />
              : <Avatar name={fullName} size={80} />
            }
            <div className="profile-modal__avatar-overlay">
              {uploading ? "…" : "📷"}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <div>
            <div className="profile-modal__name">{fullName}</div>
            <div className="profile-modal__email">{user?.email}</div>
            <button
              type="button"
              className="profile-modal__change-photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
        </div>

        {/* ── Feedback banners ── */}
        {error   && <div className="banner-error">{error}</div>}
        {success && <div className="banner-success">{success}</div>}

        {/* ── Form ── */}
        <form onSubmit={handleSave}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-first">First name</label>
              <input id="pf-first" value={form.firstName} onChange={update("firstName")} required />
            </div>
            <div className="field">
              <label htmlFor="pf-last">Last name</label>
              <input id="pf-last" value={form.lastName} onChange={update("lastName")} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pf-phone">Phone number</label>
            <input id="pf-phone" value={form.phoneNumber} onChange={update("phoneNumber")} />
          </div>
          <div className="field">
            <label htmlFor="pf-bio">Bio</label>
            <input id="pf-bio" value={form.bio} onChange={update("bio")} placeholder="Something about you…" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "auto" }}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body   // ← portal: renders outside sidebar DOM, no more clipping
  );
}
