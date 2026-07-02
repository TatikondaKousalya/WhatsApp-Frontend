import { useEffect, useState, useCallback } from "react";
import { getGroupMembers, addGroupMember } from "../api/groupApi";
import { getAllUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";

function isRealImage(src) {
  return typeof src === "string" && src.startsWith("http");
}

function MemberAvatar({ name, src, size = 40 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("")
    : "?";
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
      {isRealImage(src) ? <img src={src} alt={name ?? ""} /> : initials}
    </div>
  );
}

function MemberRow({ member, isMe }) {
  return (
    <div className={`gm-row ${isMe ? "gm-row--me" : ""}`}>
      <MemberAvatar name={member.username} src={member.profileImage} size={38} />
      <div className="gm-row__body">
        <span className="gm-row__name">
          {member.username}
          {isMe && <span className="gm-row__you">You</span>}
        </span>
        {member.admin && <span className="gm-row__badge">Admin</span>}
      </div>
    </div>
  );
}

// ── Add Members sub-panel ─────────────────────────────────────────────────────
function AddMembersPanel({ groupId, currentMemberIds, onMemberAdded, onBack }) {
  const [allUsers, setAllUsers]     = useState([]);
  const [query, setQuery]           = useState("");
  const [adding, setAdding]         = useState(null);   // userId currently being added
  const [added, setAdded]           = useState({});     // userId -> true  (session feedback)
  const [error, setError]           = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then(setAllUsers)
      .catch(() => setError("Couldn't load users."))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Only show users who are NOT already in the group
  const candidates = allUsers.filter(u => {
    if (currentMemberIds.has(u.id)) return false;
    const q = query.toLowerCase();
    return (
      !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = useCallback(async (user) => {
    setError("");
    setAdding(user.id);
    try {
      await addGroupMember(groupId, user.id);
      setAdded(prev => ({ ...prev, [user.id]: true }));
      onMemberAdded({
        userId: user.id,
        username: `${user.firstName} ${user.lastName}`.trim() || user.email,
        profileImage: user.profileImage ?? null,
        admin: false,
        joinedAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err?.response?.data?.message;
      // Backend throws "User already exists in group" — treat as success
      if (msg?.toLowerCase().includes("already")) {
        setAdded(prev => ({ ...prev, [user.id]: true }));
        onMemberAdded(null); // signal refresh without new member object
      } else {
        setError(msg || "Couldn't add member.");
      }
    } finally {
      setAdding(null);
    }
  }, [groupId, onMemberAdded]);

  return (
    <div className="gm-add-panel">
      {/* Header */}
      <div className="gm-add-panel__header">
        <button
          type="button"
          className="gm-back-btn"
          onClick={onBack}
          title="Back to members"
        >
          ←
        </button>
        <span className="gm-add-panel__title">Add Members</span>
      </div>

      {/* Search */}
      <div className="gm-add-panel__search">
        <input
          autoFocus
          placeholder="Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && <div className="gm-add-error">{error}</div>}

      {/* User list */}
      <div className="gm-add-list">
        {loadingUsers && <div className="gm-empty">Loading users…</div>}

        {!loadingUsers && candidates.length === 0 && (
          <div className="gm-empty">
            {query ? "No matching users." : "Everyone is already in this group."}
          </div>
        )}

        {candidates.map(u => {
          const displayName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
          const isAdding    = adding === u.id;
          const isDone      = !!added[u.id];

          return (
            <div key={u.id} className="gm-add-row">
              <MemberAvatar name={displayName} src={u.profileImage} size={38} />
              <div className="gm-add-row__info">
                <span className="gm-add-row__name">{displayName}</span>
                <span className="gm-add-row__email">{u.email}</span>
              </div>
              <button
                type="button"
                className={`gm-add-btn ${isDone ? "gm-add-btn--done" : ""}`}
                onClick={() => handleAdd(u)}
                disabled={isAdding || isDone}
                title={isDone ? "Added" : `Add ${displayName}`}
              >
                {isAdding ? (
                  <span className="gm-add-btn__spinner" />
                ) : isDone ? (
                  "✓"
                ) : (
                  "+"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GroupMembers({ groupId, groupName, onClose }) {
  const { user: me } = useAuth();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [view, setView]         = useState("members"); // "members" | "add"

  const fetchMembers = useCallback(() => {
    if (!groupId) return;
    setLoading(true);
    setError("");
    getGroupMembers(groupId)
      .then(setMembers)
      .catch(() => setError("Couldn't load members."))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Called by AddMembersPanel when a user is successfully added
  const handleMemberAdded = useCallback((newMember) => {
    if (newMember) {
      // Optimistically append so the count updates immediately
      setMembers(prev => [...prev, newMember]);
    } else {
      // Edge case: already a member — just re-fetch to get ground truth
      fetchMembers();
    }
  }, [fetchMembers]);

  const sorted = [...members].sort((a, b) => {
    if (a.admin !== b.admin) return a.admin ? -1 : 1;
    return (a.username || "").localeCompare(b.username || "");
  });
  const admins = sorted.filter(m => m.admin);
  const others = sorted.filter(m => !m.admin);

  // Set of current member userIds — passed to AddMembersPanel to filter them out
  const currentMemberIds = new Set(members.map(m => m.userId));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <aside className="group-members-panel">
      {/* ── Shared header ── */}
      <div className="gm-header">
        <div className="gm-header__titles">
          <span className="gm-header__label">Group Info</span>
          <h2 className="gm-header__name">{groupName || "Group"}</h2>
        </div>
        <button className="gm-close" onClick={onClose} title="Close" type="button">✕</button>
      </div>

      {view === "members" ? (
        <>
          {/* ── Group hero ── */}
          <div className="gm-hero">
            <div className="gm-hero__avatar">
              {(groupName || "G").slice(0, 2).toUpperCase()}
            </div>
            <div className="gm-hero__count">
              {loading ? "…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </div>

            {/* Add members button lives in the hero, always visible */}
            <button
              type="button"
              className="gm-add-members-btn"
              onClick={() => setView("add")}
            >
              + Add Members
            </button>
          </div>

          {/* ── Member list ── */}
          <div className="gm-list">
            {loading && <div className="gm-empty">Loading members…</div>}
            {error   && <div className="gm-empty gm-empty--error">{error}</div>}

            {!loading && !error && (
              <>
                {admins.length > 0 && (
                  <div className="gm-section">
                    <div className="gm-section__label">
                      Admin{admins.length > 1 ? "s" : ""} · {admins.length}
                    </div>
                    {admins.map(m => (
                      <MemberRow key={m.userId} member={m} isMe={m.userId === me?.id} />
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="gm-section">
                    <div className="gm-section__label">Members · {others.length}</div>
                    {others.map(m => (
                      <MemberRow key={m.userId} member={m} isMe={m.userId === me?.id} />
                    ))}
                  </div>
                )}
                {members.length === 0 && <div className="gm-empty">No members found.</div>}
              </>
            )}
          </div>
        </>
      ) : (
        <AddMembersPanel
          groupId={groupId}
          currentMemberIds={currentMemberIds}
          onMemberAdded={handleMemberAdded}
          onBack={() => setView("members")}
        />
      )}
    </aside>
  );
}
