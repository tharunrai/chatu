import React from "react";
import Image from "next/image";
import { Clock, Trash2, Plus } from "lucide-react";
import { RecentRoom } from "@/types/chat";

interface RecentRoomsProps {
  recentRooms: RecentRoom[];
  onJoinRoom: (username: string, roomId: string) => void;
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
            onClick={() => onJoinRoom(room.username, room.roomId)}
            className="relative p-6 bg-gray-950/50 hover:bg-gray-800/80 active:bg-gray-800/90 border border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all group flex flex-col items-start gap-4 touch-manipulation"
          >
            <button
              type="button"
              onClick={(e) => onDeleteRoom(e, room)}
              title="Remove room"
              className="absolute top-3 right-3 p-2.5 sm:p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 active:bg-rose-500/20 rounded-xl transition-all z-10 touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/80 shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src={`https://api.dicebear.com/10.x/shape-grid/svg?seed=${encodeURIComponent(
                  room.roomId
                )}`}
                alt={room.roomId}
                width={48}
                height={48}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-100 mb-1 truncate max-w-[180px]">{room.roomId}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span>Joined as</span>
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-700 border border-gray-600 inline-block align-middle shrink-0">
                  <Image
                    src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                      room.username
                    )}`}
                    alt={room.username}
                    width={20}
                    height={20}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-gray-300 font-medium truncate max-w-[90px]">{room.username}</span>
              </div>
            </div>
          </div>
        ))}

        <div
          onClick={onJoinNewRoomClick}
          className="p-6 bg-gray-950 hover:bg-gray-900 active:bg-gray-900/90 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-indigo-400 min-h-[160px] touch-manipulation"
        >
          <Plus className="w-8 h-8" />
          <span className="font-medium">Join New Room</span>
        </div>
      </div>
    </div>
  );
}
