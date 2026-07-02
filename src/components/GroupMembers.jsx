import { useEffect, useState } from "react";
import { getGroupMembers } from "../api/groupApi";
import { useAuth } from "../context/AuthContext";

// Returns true only for a real remote URL.
// The backend sends "default-profile.png" (bare filename, no path) as the
// placeholder — that has no base URL and would 404, so we treat it as absent.
function isRealImage(src) {
  return typeof src === "string" && src.startsWith("http");
}

function MemberAvatar({ name, src, size = 40 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("")
    : "?";

  // Deterministic colour so each person always gets the same avatar bg
  const hue = name
    ? [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
    : 200;

  return (
    <div
      className="gm-avatar"
      style={{
        width: size,
        height: size,
        background: isRealImage(src) ? "transparent" : `hsl(${hue}, 35%, 42%)`,
      }}
    >
      {isRealImage(src) ? (
        <img src={src} alt={name ?? ""} />
      ) : (
        initials
      )}
    </div>
  );
}

function MemberRow({ member, isMe }) {
  return (
    <div className={`gm-row ${isMe ? "gm-row--me" : ""}`}>
      {/* src is passed here — MemberAvatar now actually uses it */}
      <MemberAvatar name={member.username} src={member.profileImage} size={38} />
      <div className="gm-row__body">
        <span className="gm-row__name">
          {member.username}
          {isMe && <span className="gm-row__you">You</span>}
        </span>
        {member.admin && (
          <span className="gm-row__badge">Admin</span>
        )}
      </div>
    </div>
  );
}

export default function GroupMembers({ groupId, groupName, onClose }) {
  const { user: me } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError("");
    getGroupMembers(groupId)
      .then(setMembers)
      .catch(() => setError("Couldn't load members."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const sorted = [...members].sort((a, b) => {
    if (a.admin !== b.admin) return a.admin ? -1 : 1;
    return (a.username || "").localeCompare(b.username || "");
  });

  const admins = sorted.filter(m => m.admin);
  const others = sorted.filter(m => !m.admin);

  return (
    <aside className="group-members-panel">
      <div className="gm-header">
        <div className="gm-header__titles">
          <span className="gm-header__label">Group Info</span>
          <h2 className="gm-header__name">{groupName || "Group"}</h2>
        </div>
        <button className="gm-close" onClick={onClose} title="Close" type="button">✕</button>
      </div>

      <div className="gm-hero">
        <div className="gm-hero__avatar">
          {(groupName || "G").slice(0, 2).toUpperCase()}
        </div>
        <div className="gm-hero__count">
          {loading ? "…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="gm-list">
        {loading && <div className="gm-empty">Loading members…</div>}
        {error   && <div className="gm-empty gm-empty--error">{error}</div>}

        {!loading && !error && (
          <>
            {admins.length > 0 && (
              <div className="gm-section">
                <div className="gm-section__label">Admin{admins.length > 1 ? "s" : ""} · {admins.length}</div>
                {admins.map(m => <MemberRow key={m.userId} member={m} isMe={m.userId === me?.id} />)}
              </div>
            )}
            {others.length > 0 && (
              <div className="gm-section">
                <div className="gm-section__label">Members · {others.length}</div>
                {others.map(m => <MemberRow key={m.userId} member={m} isMe={m.userId === me?.id} />)}
              </div>
            )}
            {members.length === 0 && <div className="gm-empty">No members found.</div>}
          </>
        )}
      </div>
    </aside>
  );
}
