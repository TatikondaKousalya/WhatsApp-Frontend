import { useEffect, useRef } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { useAuth } from "../context/AuthContext";

export default function ChatWindow({ room, messages, loading, typingUser, presence, onSend, onTyping, onGroupClick }) {
  const { user } = useAuth();
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingUser]);

  if (!room) {
    return (
      <main className="chat-window">
        <div className="chat-window__placeholder">
          <span>Thread</span>
          <span>Pick a conversation, or start a new one.</span>
        </div>
      </main>
    );
  }

  const isOnline = room.roomType === "PRIVATE" ? presence[room.receiverId] ?? room.online : false;

  return (
    <main className="chat-window">
      <header className="chat-header">
        <Avatar name={room.name} src={room.profilePicture} online={isOnline} size={40} />
        <div>
        <div
            className="chat-header__name"
            style={{
                cursor: room.roomType === "GROUP" ? "pointer" : "default"
            }}
            onClick={() => {
                if (room.roomType === "GROUP") {
                    onGroupClick();
                }
            }}
        >
            {room.name}
        </div>
          <div className="chat-header__status">
            {room.roomType === "GROUP" ? "Group" : isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </header>

      <div className="message-list" ref={listRef}>
        {loading && <div className="empty-rooms">Loading messages…</div>}
        {!loading && messages.length === 0 && <div className="empty-rooms">Say hello 👋</div>}
        {messages.map((m, i) => {
          const isMine = m.senderId === user?.id;
          const prev = messages[i - 1];
          const showSender = room.roomType === "GROUP" && (!prev || prev.senderId !== m.senderId);
          return <MessageBubble key={m.id ?? i} message={m} isMine={isMine} showSender={showSender} />;
        })}
      </div>

      {typingUser && <div className="typing-indicator">{typingUser} is typing…</div>}

      <Composer onSend={onSend} onTyping={onTyping} />
    </main>
  );
}
