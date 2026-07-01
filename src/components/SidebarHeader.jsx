export default function SidebarHeader({ mode, onTogglePlus, onLogout, logoutTitle }) {
  const isNewChat = mode === "new-chat";

  return (
    <div className="sidebar__header">
      <span className="sidebar__brand">Thread</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="icon-btn"
          title={isNewChat ? "Back to conversations" : "New chat"}
          onClick={onTogglePlus}
          type="button"
        >
          {isNewChat ? "←" : "+"}
        </button>
        <button className="icon-btn" title={logoutTitle} onClick={onLogout} type="button">
          ⎋
        </button>
      </div>
    </div>
  );
}
