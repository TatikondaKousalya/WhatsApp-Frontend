export default function SidebarSearch({ mode, value, onChange }) {
  const placeholder = mode === "new-chat" ? "Search users" : "Search conversations";

  return (
    <div className="sidebar__search">
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}
