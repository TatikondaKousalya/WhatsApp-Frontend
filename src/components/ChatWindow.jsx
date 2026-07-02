import { Fragment, useEffect, useRef } from "react";
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
            const previous = messages[i - 1];

            const currentDate = getDateLabel(m.createdAt);
            const previousDate = previous
                ? getDateLabel(previous.createdAt)
                : null;

            const showDate = currentDate !== previousDate;

            const isMine = m.senderId === user?.id;

            const showSender =
                room.roomType === "GROUP" &&
                (!previous || previous.senderId !== m.senderId);

            return (
                <Fragment key={m.id ?? i}>
                    {showDate && (
                            <div className="date-divider-wrapper">
                                <div className="date-divider">
                                    {currentDate}
                                </div>
                            </div>
                        )}

                    <MessageBubble
                        message={m}
                        isMine={isMine}
                        showSender={showSender}
                    />
                </Fragment>
            );
        })}
      </div>

      {typingUser && <div className="typing-indicator">{typingUser} is typing…</div>}

      <Composer onSend={onSend} onTyping={onTyping} />
    </main>
  );
}

function getDateLabel(dateString) {
    const date = new Date(dateString);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
