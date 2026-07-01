import { useEffect, useState } from "react";
import * as usersApi from "../api/users";
import * as chatsApi from "../api/chats";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function NewChatDialog({ onClose, onCreated }) {
  const { user: me } = useAuth();
  const [mode, setMode] = useState("private"); // "private" | "group"
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    usersApi
      .getAllUsers()
      .then((data) => setUsers((data || []).filter((u) => u.id !== me?.id)))
      .catch(() => setUsers([]));
  }, [me]);

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSelect = (id) => {
    if (mode === "private") {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    setError("");
    if (selected.length === 0) {
      setError(mode === "private" ? "Pick someone to message." : "Pick at least one member.");
      return;
    }
    if (mode === "group" && !groupName.trim()) {
      setError("Give your group a name.");
      return;
    }

    setSubmitting(true);
    try {
      const room =
        mode === "private"
          ? await chatsApi.createPrivateChat(selected[0])
          : await chatsApi.createGroupChat(groupName.trim(), selected);
      onCreated(room);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create the chat. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Start a conversation</h2>

        <div className="btn-tab-row">
          <button
            type="button"
            className={`btn-tab ${mode === "private" ? "active" : ""}`}
            onClick={() => {
              setMode("private");
              setSelected([]);
            }}
          >
            Direct message
          </button>
          <button
            type="button"
            className={`btn-tab ${mode === "group" ? "active" : ""}`}
            onClick={() => {
              setMode("group");
              setSelected([]);
            }}
          >
            New group
          </button>
        </div>

        {mode === "group" && (
          <div className="field">
            <label htmlFor="groupName">Group name</label>
            <input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="userSearch">{mode === "private" ? "Find a person" : "Add members"}</label>
          <input id="userSearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" />
        </div>

        {error && <div className="banner-error">{error}</div>}

        <div className="user-pick-list">
          {filtered.length === 0 && <div className="empty-rooms">No matching people.</div>}
          {filtered.map((u) => (
            <div
              key={u.id}
              className={`user-pick-item ${selected.includes(u.id) ? "selected" : ""}`}
              onClick={() => toggleSelect(u.id)}
            >
              <Avatar name={`${u.firstName} ${u.lastName}`} src={u.profileImage} size={32} />
              <span className="user-pick-item__name">
                {u.firstName} {u.lastName}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={handleSubmit} disabled={submitting} type="button">
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
