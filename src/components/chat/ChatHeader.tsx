import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Users } from "lucide-react";

interface ChatHeaderProps {
  roomId: string;
  username: string;
  activeUsers: string[];
  typingUsers: Set<string>;
  isConnected: boolean;
  onLeave: () => void;
}

export default function ChatHeader({
  roomId,
  username,
  activeUsers,
  typingUsers,
  isConnected,
  onLeave,
}: ChatHeaderProps) {
  const [showUsersPopover, setShowUsersPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowUsersPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const getTypingText = () => {
    const users = Array.from(typingUsers);
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`;
  };

  return (
    <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Room Shapes Avatar */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/80 shrink-0">
          <Image
            src={`https://api.dicebear.com/10.x/shape-grid/svg?seed=${encodeURIComponent(roomId)}`}
            alt={roomId}
            width={40}
            height={40}
            unoptimized
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2">
            <span>Room: {roomId}</span>
          </h2>
          {typingUsers.size > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5 mt-1">
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs font-medium text-indigo-400">{getTypingText()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? `${activeUsers.length} members` : "Connecting..."}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Users Button & Popover (Click & Touch Enabled) */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowUsersPopover((prev) => !prev)}
            aria-label="Toggle active users list"
            className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 rounded-xl flex items-center gap-2 transition-colors active:scale-95 touch-manipulation"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-gray-300">{activeUsers.length}</span>
          </button>

          {showUsersPopover && (
            <div className="absolute top-full right-0 mt-2 w-56 p-3 bg-gray-800 border border-gray-700 rounded-xl z-30 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Active Users ({activeUsers.length})
                </h3>
                <span className="text-[10px] text-gray-500">Live</span>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeUsers.map((u) => (
                  <li key={u} className="text-sm text-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 shrink-0 border border-gray-600">
                      <Image
                        src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                          u
                        )}`}
                        alt={u}
                        width={24}
                        height={24}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate max-w-[120px] inline-block">{u}</span>
                    {u === username && <span className="text-gray-500 text-xs shrink-0">(You)</span>}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto shrink-0"></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Current User Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-xl border border-gray-700/50">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 shrink-0">
            <Image
              src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                username
              )}`}
              alt={username}
              width={24}
              height={24}
              unoptimized
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">{username}</span>
        </div>

        <button
          onClick={onLeave}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors active:scale-95 touch-manipulation"
        >
          Leave
        </button>
      </div>
    </header>
  );
}
