import React from "react";
import { X } from "lucide-react";
import JoinRoomForm from "./JoinRoomForm";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (username: string, roomId: string) => void;
  initialUsername?: string;
  initialRoomId?: string;
}

export default function JoinRoomModal({
  isOpen,
  onClose,
  onJoin,
  initialUsername = "",
  initialRoomId = "",
}: JoinRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-100 mb-1">Add New Room</h2>
        <p className="text-sm text-gray-400 mb-6">Enter a room name and your username to join.</p>

        <JoinRoomForm
          initialUsername={initialUsername}
          initialRoomId={initialRoomId}
          onJoin={onJoin}
        />
      </div>
    </div>
  );
}
