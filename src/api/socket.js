// NOTE: this module is intentionally only ever loaded via dynamic import()
// from AuthContext, after a successful login. sockjs-client touches Node-style
// globals at module-evaluation time, so we don't want it pulled into the
// eagerly-loaded module graph that includes /login and /register.
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Matches com.chatapp.config.WebSocketConfig:
//   endpoint:        /ws            (SockJS fallback enabled)
//   app prefix:      /app           (client -> server, e.g. /app/chat.send)
//   broker prefixes: /topic, /queue (server -> client)
//
// Destinations used by ChatWebSocketController:
//   SEND  /app/chat.send    body: ChatMessageRequest { senderId, receiverId|groupId, message, attachmentId }
//   SEND  /app/chat.typing  body: TypingMessage       { roomId, senderId, senderName }
//   SEND  /app/chat.online  body: PresenceMessage     { userId, username, online }
//   SEND  /app/chat.offline body: PresenceMessage
//
//   SUB   /topic/chat/{chatRoomId}        -> ChatMessageResponse (private messages)
//   SUB   /topic/group/{groupId}          -> ChatMessageResponse (group messages)
//   SUB   /topic/chat/{roomId}/typing     -> TypingMessage
//   SUB   /topic/presence                 -> PresenceMessage

let client = null;

export function connectSocket({ onConnect, onError }) {
  client = new Client({
    webSocketFactory: () => new SockJS("/ws"),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => onConnect?.(client),
    onStompError: (frame) => onError?.(frame),
    onWebSocketError: (event) => onError?.(event),
  });
  client.activate();
  return client;
}

export function disconnectSocket() {
  client?.deactivate();
  client = null;
}

export function sendChatMessage({ senderId, receiverId, groupId, message, attachmentId }) {
  client?.publish({
    destination: "/app/chat.send",
    body: JSON.stringify({ senderId, receiverId, groupId, message, attachmentId }),
  });
}

export function sendTyping({ roomId, senderId, senderName }) {
  client?.publish({
    destination: "/app/chat.typing",
    body: JSON.stringify({ roomId, senderId, senderName }),
  });
}

export function sendPresence(destination, { userId, username, online }) {
  client?.publish({
    destination: `/app/chat.${destination}`, // "online" | "offline"
    body: JSON.stringify({ userId, username, online }),
  });
}

export function subscribe(destination, callback) {
  if (!client?.connected) return () => {};
  const sub = client.subscribe(destination, (frame) => {
    try {
      callback(JSON.parse(frame.body));
    } catch {
      callback(frame.body);
    }
  });
  return () => sub.unsubscribe();
}
