import Avatar from "./Avatar";

export default function ConversationList({ rooms, roomsLoading, activeRoom, onSelectRoom, presence }) {
  if (roomsLoading) {
    return <div className="empty-rooms">Loading conversations…</div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="empty-rooms">
        No conversations yet.
        <br />
        Tap + to start one.
      </div>
    );
  }

  return (
    <>
      {rooms.map((room) => {
        const isOnline = room.roomType === "PRIVATE" ? presence[room.receiverId] ?? room.online : false;
        return (
          <button
            key={room.id}
            className={`room-item ${activeRoom?.id === room.id ? "active" : ""}`}
            onClick={() => onSelectRoom(room)}
            type="button"
          >
            <Avatar name={room.name} src={room.profilePicture} online={isOnline} />
            <div className="room-item__body">
              <div className="room-item__top">
                <span className="room-item__name">{room.name}</span>
                <span className="room-item__tag">{room.roomType === "GROUP" ? "GROUP" : ""}</span>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}
