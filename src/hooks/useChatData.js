import { useCallback, useEffect, useRef, useState } from "react";
import * as chatsApi from "../api/chats";
import * as messagesApi from "../api/messages";
import { subscribe, sendChatMessage, sendTyping } from "../api/socket";
import { useAuth } from "../context/AuthContext";

// Central hook: owns the room list, the active room's message history,
// and wires up live STOMP topics. roomType comes from ChatRoomResponse.roomType
// ("PRIVATE" | "GROUP") which decides whether we hit the private or group
// REST history endpoint and which /topic we subscribe to.
export function useChatData(socketReady) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [presence, setPresence] = useState({}); // userId -> boolean online

  const typingTimeout = useRef(null);

  const refreshRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const data = await chatsApi.getChatRooms();
      setRooms(data || []);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  // Load history whenever the active room changes.
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    setTypingUser(null);

    const loader =
      activeRoom.roomType === "GROUP"
        ? messagesApi.getGroupHistory(activeRoom.groupId)
        : messagesApi.getPrivateHistory(activeRoom.id);

    loader
      .then((data) => setMessages(data || []))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [activeRoom]);

  // Subscribe to the live topic for the active room (matches
  // ChatWebSocketController's /topic/chat/{chatRoomId} or /topic/group/{groupId}).
  useEffect(() => {
    if (!socketReady || !activeRoom) return;

    const topic =
      activeRoom.roomType === "GROUP"
        ? `/topic/group/${activeRoom.groupId}`
        : `/topic/chat/${activeRoom.id}`;

    const unsubMessages = subscribe(topic, (incoming) => {
      // ChatMessageResponse uses `message`/`status`; normalize to the same
      // shape as MessageResponse (`message`/`messageStatus`) used for history.
      setMessages((prev) => [
        ...prev,
        {
          id: incoming.messageId,
          senderId: incoming.senderId,
          senderName: incoming.senderName,
          receiverId: incoming.receiverId,
          groupId: incoming.groupId,
          message: incoming.message,
          messageType: incoming.messageType,
          attachmentUrl: incoming.attachmentUrl,
          messageStatus: incoming.status,
          createdAt: incoming.createdAt,
        },
      ]);
      refreshRooms();
    });

    const typingTopic = `/topic/chat/${activeRoom.id}/typing`;
    const unsubTyping = subscribe(typingTopic, (incoming) => {
      if (incoming.senderId === user?.id) return;
      setTypingUser(incoming.senderName);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2500);
    });

    return () => {
      unsubMessages();
      unsubTyping();
      clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketReady, activeRoom]);

  // Global presence feed, independent of which room is open.
  useEffect(() => {
    if (!socketReady) return;
    return subscribe("/topic/presence", (incoming) => {
      setPresence((prev) => ({ ...prev, [incoming.userId]: incoming.online }));
    });
  }, [socketReady]);

  const sendMessage = useCallback(
    (text, attachmentId) => {
      if (!activeRoom || !user) return;
      sendChatMessage({
        senderId: user.id,
        receiverId: activeRoom.roomType === "GROUP" ? null : activeRoom.receiverId,
        groupId: activeRoom.roomType === "GROUP" ? activeRoom.groupId : null,
        message: text,
        attachmentId: attachmentId || null,
      });
    },
    [activeRoom, user]
  );

  const notifyTyping = useCallback(() => {
    if (!activeRoom || !user) return;
    sendTyping({ roomId: activeRoom.id, senderId: user.id, senderName: `${user.firstName} ${user.lastName}` });
  }, [activeRoom, user]);

  return {
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
  };
}
