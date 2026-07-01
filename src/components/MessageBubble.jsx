import { format } from "date-fns";
import { downloadUrl } from "../api/attachments";

function formatTime(value) {
  if (!value) return "";
  try {
    return format(new Date(value), "h:mm a");
  } catch {
    return "";
  }
}

function statusGlyph(status) {
  if (status === "READ") return "✓✓";
  if (status === "DELIVERED") return "✓✓";
  if (status === "SENT") return "✓";
  return "";
}

export default function MessageBubble({ message, isMine, showSender }) {
  return (
    <div className={`bubble-row ${isMine ? "mine" : ""}`}>
      <div className={`bubble ${isMine ? "mine" : "theirs"}`}>
        {showSender && !isMine && <div className="bubble__sender">{message.senderName}</div>}
        <div>{message.message}</div>

        {message.attachmentUrl && (
          <a
            className="bubble__attachment"
            href={
              message.attachmentUrl.startsWith("http")
                ? message.attachmentUrl
                : downloadUrl(message.attachmentUrl)
            }
            target="_blank"
            rel="noreferrer"
          >
            📎 Attachment
          </a>
        )}

        <div className="bubble__meta">
          <span>{formatTime(message.createdAt)}</span>
          {isMine && <span>{statusGlyph(message.messageStatus)}</span>}
        </div>
      </div>
    </div>
  );
}
