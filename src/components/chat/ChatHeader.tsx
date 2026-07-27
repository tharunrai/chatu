import React from "react";
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
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center relative group cursor-pointer hover:bg-indigo-500/30 transition-colors">
          <Users className="w-5 h-5 text-indigo-400" />
          <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-gray-800 border border-gray-700 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Active Users ({activeUsers.length})
            </h3>
            <ul className="space-y-1">
              {activeUsers.map((u) => (
                <li key={u} className="text-sm text-gray-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="truncate max-w-[120px] inline-block">{u}</span>
                  {u === username && <span className="text-gray-500 text-xs shrink-0">(You)</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="font-semibold text-gray-100">Room: {roomId}</h2>
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
      <button
        onClick={onLeave}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        Leave
      </button>
    </header>
  );
}
