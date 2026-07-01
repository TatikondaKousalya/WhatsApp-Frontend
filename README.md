# Thread — React frontend for the WhatsApp-style backend

This is a React (Vite) frontend built specifically against your Spring Boot
backend (`WhatsApp-webhook-and-websocket`). It implements:

- Email/password auth with JWT access + refresh tokens, auto-refresh on 401
- Chat list (private + group), creating new private/group chats
- Real-time messaging over STOMP/SockJS (`/ws`), with REST used only for
  loading message history
- Typing indicators and online/offline presence
- File attachments (upload then sent as `attachmentId` in messages)

## 1. Run the backend first

From the Spring Boot project root:

```bash
./mvnw spring-boot:run
```

It should come up on `http://localhost:8080`. Confirm `/api/auth/register`
responds before moving on — the frontend has nothing to talk to otherwise.

## 2. Install and run the frontend

```bash
cd chat-frontend
npm install
npm run dev
```

This opens on `http://localhost:5173`. `vite.config.js` proxies `/api` and
`/ws` to `localhost:8080`, so you don't need to touch CORS settings or change
ports for local dev.

If your backend runs somewhere else, edit the `target` values in
`vite.config.js`.

## 3. How it maps to your backend

| Frontend | Backend |
|---|---|
| `src/api/auth.js` | `AuthController` (`/api/auth/...`) |
| `src/api/chats.js` | `ChatController` (`/api/chats/...`) |
| `src/api/messages.js` | `MessageController` (`/api/messages/...`) — used for history only |
| `src/api/users.js` | `UserController` (`/api/users/...`) |
| `src/api/attachments.js` | `AttachmentController` (`/api/files/...`) |
| `src/api/socket.js` | `WebSocketConfig` + `ChatWebSocketController` (`/ws`, `/app/chat.*`, `/topic/...`) |

Live messages are sent over the socket (`/app/chat.send`) rather than the
REST `POST /api/messages/private` or `/group` endpoints, since that's what
`ChatWebSocketController` is built to broadcast from. The REST message
endpoints in `src/api/messages.js` are kept for completeness (e.g. if you
want a "resend" or admin tool later) but the chat UI itself only uses them
for loading history.

## 4. Known coupling points to double check

- `ChatRoomResponse.roomType` must be exactly `"PRIVATE"` or `"GROUP"` —
  the frontend branches on that string.
- For private chats, the frontend reads `receiverId` off the room to know
  who to message; for group chats, it reads `groupId`. Both come from
  `ChatController`'s `mapToPrivateResponse` / `mapToGroupResponse` helpers,
  which your backend code already sets up correctly.
- Presence is driven entirely by the `/topic/presence` broadcast — the
  REST `PresenceController` endpoints aren't currently called by this UI,
  since presence is announced over the socket on connect/disconnect instead
  (see `AuthContext.jsx`). Wire those REST calls in if you want presence to
  also survive page reloads via initial REST fetch.
- CORS: your `CorsConfig` allows all origins, so this also works if you
  later point the frontend at a deployed backend URL instead of the proxy —
  just set `baseURL` in `src/api/client.js` and `webSocketFactory` in
  `src/api/socket.js` to the full backend URL instead of relative paths.

## 5. What's not implemented yet

- Group member management UI (add/remove) — `GroupController` supports it,
  just no screen for it yet.
- Notifications panel — `NotificationController` isn't wired into the UI.
- Read/delivered receipts are rendered if present on a message, but nothing
  currently calls `PUT /api/messages/{id}/read` or `/delivered` — hook those
  into `MessageBubble`'s visibility logic (e.g. an IntersectionObserver) if
  you want real read receipts.
