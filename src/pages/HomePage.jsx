import { useAuth } from "../context/AuthContext";
import { useChatData } from "../hooks/useChatData";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";

export default function HomePage() {
  const { socketReady } = useAuth();
  const {
    rooms,
    roomsLoading,
    refreshRooms,
    activeRoom,
    setActiveRoom,
    messages,
    messagesLoading,
    typingUser,
    presence,
    sendMessage,
    notifyTyping,
  } = useChatData(socketReady);

  return (
    <div className="app-shell">
      <Sidebar
        rooms={rooms}
        roomsLoading={roomsLoading}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        presence={presence}
        onRoomCreated={(room) => {
          refreshRooms();
          setActiveRoom(room);
        }}
      />
      <ChatWindow
        room={activeRoom}
        messages={messages}
        loading={messagesLoading}
        typingUser={typingUser}
        presence={presence}
        onSend={sendMessage}
        onTyping={notifyTyping}
      />
    </div>
  );
}
