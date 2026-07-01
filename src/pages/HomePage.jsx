import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChatData } from "../hooks/useChatData";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import GroupMembers from "../components/GroupMembers";
import "../styles/chat.css";

export default function HomePage() {
  const { socketReady } = useAuth();
  const [showGroupMembers, setShowGroupMembers] = useState(false);
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

  // Close the members panel whenever the user switches rooms
  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setShowGroupMembers(false);
  };

  return (
    <div className={`app-shell ${showGroupMembers ? "show-members" : ""}`}>
      <Sidebar
        rooms={rooms}
        roomsLoading={roomsLoading}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        presence={presence}
        onRoomCreated={(room) => {
          refreshRooms();
          setActiveRoom(room);
          setShowGroupMembers(false);
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
        onGroupClick={() => setShowGroupMembers(v => !v)}
      />

      {showGroupMembers && activeRoom?.roomType === "GROUP" && (
        <GroupMembers
          groupId={activeRoom.groupId}
          groupName={activeRoom.name}
          onClose={() => setShowGroupMembers(false)}
        />
      )}
    </div>
  );
}
