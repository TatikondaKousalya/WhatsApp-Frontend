import { useState } from "react";
import Avatar from "./Avatar";
import NewChatDialog from "./NewChatDialog";
import CurrentUserPanel from "./CurrentUserPanel";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ rooms, roomsLoading, activeRoom, onSelectRoom, onRoomCreated, presence }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = rooms.filter((r) => (r.name || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="sidebar__brand">Thread</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="icon-btn" title="New chat" onClick={() => setDialogOpen(true)}>
            +
          </button>
          <button className="icon-btn" title="Settings" type="button">
            ⚙
          </button>
        </div>
      </div>

      <div className="sidebar__search">
        <input placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Scrollable conversation list — the sticky profile panel below stays
          fixed at the bottom regardless of how far this scrolls. */}
      <div className="room-list">
        {roomsLoading && <div className="empty-rooms">Loading conversations…</div>}

        {!roomsLoading && filtered.length === 0 && (
          <div className="empty-rooms">
            No conversations yet.
            <br />
            Tap + to start one.
          </div>
        )}

        {filtered.map((room) => {
          const isOnline =
            room.roomType === "PRIVATE" ? presence[room.receiverId] ?? room.online : false;
          return (
            <button
              key={room.id}
              className={`room-item ${activeRoom?.id === room.id ? "active" : ""}`}
              onClick={() => onSelectRoom(room)}
              type="button"
            >
              <Avatar name={room.name} src={room.profilePicture} online={isOnline} />
              <div className="room-item__body">
                <div className="room-item__top">
                  <span className="room-item__name">{room.name}</span>
                  <span className="room-item__tag">{room.roomType === "GROUP" ? "GROUP" : ""}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <CurrentUserPanel user={user} onLogout={logout} />

      {dialogOpen && (
        <NewChatDialog
          onClose={() => setDialogOpen(false)}
          onCreated={(room) => {
            setDialogOpen(false);
            onRoomCreated(room);
          }}
        />
      )}
    </aside>
  );
}
