import React, { useState } from "react";
import { LogIn } from "lucide-react";

interface JoinRoomFormProps {
  initialUsername?: string;
  initialRoomId?: string;
  onJoin: (username: string, roomId: string) => void;
  buttonText?: string;
}

export default function JoinRoomForm({
  initialUsername = "",
  initialRoomId = "",
  onJoin,
  buttonText = "Join Room",
}: JoinRoomFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [roomId, setRoomId] = useState(initialRoomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      onJoin(username.trim(), roomId.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-100 placeholder:text-gray-600"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Room ID</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="e.g. general, tech, gaming"
          className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-100 placeholder:text-gray-600"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors mt-6"
      >
        <LogIn className="w-5 h-5" />
        {buttonText}
      </button>
    </form>
  );
}
