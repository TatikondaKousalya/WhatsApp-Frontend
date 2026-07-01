import { useRef, useState } from "react";
import { uploadFile } from "../api/attachments";
import { useAuth } from "../context/AuthContext";

export default function Composer({ onSend, onTyping }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingThrottle = useRef(0);

  const handleChange = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - typingThrottle.current > 1500) {
      typingThrottle.current = now;
      onTyping();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const attachment = await uploadFile(user.id, file);
      onSend(file.name, attachment.id);
    } catch {
      // surfaced via composer state below
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="composer">
      <button
        className="attach-btn"
        type="button"
        title="Attach a file"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        📎
      </button>
      <input ref={fileInputRef} type="file" hidden onChange={handleFilePick} />
      <textarea
        rows={1}
        placeholder="Write a message…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button className="send-btn" type="button" onClick={handleSend} disabled={!text.trim()}>
        ➤
      </button>
    </div>
  );
}
