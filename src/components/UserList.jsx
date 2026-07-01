import { useEffect, useState } from "react";
import * as usersApi from "../api/users";
import * as chatsApi from "../api/chats";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

// Inline replacement for the old NewChatDialog. Lists every other user;
// clicking one calls chatsApi.createPrivateChat (POST /api/chats/private,
// body { receiverId }) which the backend treats as "find or create" — the
// frontend doesn't need to know which one happened, it just opens whatever
// ChatRoom comes back.
export default function UserList({ query, onChatReady }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    usersApi
      .getAllUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers((data || []).filter((u) => u.id !== me?.id));
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me]);

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = async (userId) => {
    if (pendingUserId) return; // ignore double-clicks while a request is in flight
    setError("");
    setPendingUserId(userId);
    try {
      const room = await chatsApi.createPrivateChat(userId);
      onChatReady(room);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't open that chat. Try again.");
    } finally {
      setPendingUserId(null);
    }
  };

  if (loading) {
    return <div className="empty-rooms">Loading users…</div>;
  }

  return (
    <>
      {error && <div className="banner-error" style={{ margin: "8px 8px 0" }}>{error}</div>}

      {filtered.length === 0 && <div className="empty-rooms">No matching people.</div>}

      {filtered.map((u) => (
        <button
          key={u.id}
          className="room-item"
          onClick={() => handleSelect(u.id)}
          disabled={pendingUserId === u.id}
          type="button"
        >
          <Avatar name={`${u.firstName} ${u.lastName}`} src={u.profileImage} />
          <div className="room-item__body">
            <div className="room-item__top">
              <span className="room-item__name">
                {u.firstName} {u.lastName}
              </span>
              {pendingUserId === u.id && <span className="room-item__tag">OPENING…</span>}
            </div>
          </div>
        </button>
      ))}
    </>
  );
}
