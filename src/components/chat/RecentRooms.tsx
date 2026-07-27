import React from "react";
import { Clock, Users, Trash2, Plus } from "lucide-react";
import { RecentRoom } from "@/types/chat";

interface RecentRoomsProps {
  recentRooms: RecentRoom[];
  onJoinRoom: (roomId: string, username: string) => void;
  onDeleteRoom: (e: React.MouseEvent, room: RecentRoom) => void;
  onJoinNewRoomClick: () => void;
}

export default function RecentRooms({
  recentRooms,
  onJoinRoom,
  onDeleteRoom,
  onJoinNewRoomClick,
}: RecentRoomsProps) {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-2 text-gray-400">
        <Clock className="w-5 h-5" />
        <h2 className="text-lg font-medium">Recent Rooms</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recentRooms.map((room, idx) => (
          <div
            key={`${room.roomId}-${room.username}-${idx}`}
            onClick={() => onJoinRoom(room.roomId, room.username)}
            className="relative p-6 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all group flex flex-col items-start gap-4"
          >
            <button
              onClick={(e) => onDeleteRoom(e, room)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-100 mb-1 truncate">{room.roomId}</h3>
              <p className="text-sm text-gray-500 truncate">
                Joined as <span className="text-gray-300 font-medium">{room.username}</span>
              </p>
            </div>
          </div>
        ))}

        <div
          onClick={onJoinNewRoomClick}
          className="p-6 bg-gray-950 hover:bg-gray-900 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-indigo-400 min-h-[160px]"
        >
          <Plus className="w-8 h-8" />
          <span className="font-medium">Join New Room</span>
        </div>
      </div>
    </div>
  );
}
