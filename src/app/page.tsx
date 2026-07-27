"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import RecentRooms from "@/components/chat/RecentRooms";
import JoinRoomForm from "@/components/chat/JoinRoomForm";
import JoinRoomModal from "@/components/chat/JoinRoomModal";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatArea from "@/components/chat/ChatArea";
import ChatInput from "@/components/chat/ChatInput";
import { useRecentRooms } from "@/hooks/useRecentRooms";
import { useChat } from "@/hooks/useChat";
import { RecentRoom } from "@/types/chat";

export default function ChatApp() {
  const [session, setSession] = useState<{ username: string; roomId: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { recentRooms, saveRecentRoom, deleteRecentRoom } = useRecentRooms();

  const handleJoinSuccess = useCallback(
    (rId: string, uName: string) => {
      saveRecentRoom(rId, uName);
    },
    [saveRecentRoom]
  );

  const {
    messages,
    users,
    typingUsers,
    replyTo,
    loginError,
    pusherClient,
    sendMessage,
    leaveRoom: leaveChatRoom,
    handleTyping,
    setReplyTo,
  } = useChat(session?.roomId ?? "", session?.username ?? "", {
    onJoinSuccess: handleJoinSuccess,
  });

  const handleJoin = (u: string, r: string) => {
    setSession({ username: u, roomId: r });
    setShowForm(false);
  };

  const handleLeave = () => {
    leaveChatRoom();
    setSession(null);
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomToDelete: RecentRoom) => {
    deleteRecentRoom(e, roomToDelete, () => setShowForm(true));
  };

  const inRoom = Boolean(session?.roomId && session?.username && !loginError);

  if (!inRoom) {
    return (
      <div className="min-h-[100dvh] bg-gray-950 flex flex-col p-4 sm:p-6 text-gray-100 font-sans relative">
        {/* Top Branding */}
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-4 sm:py-6 mb-4 sm:mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ChatU Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-contain bg-en-50 border border-indigo-500/20 p-1"
            />
            <h1 className="text-2xl font-bold tracking-tight">ChatU</h1>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
          {loginError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl flex items-start gap-3 w-full max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-200">{loginError}</p>
            </div>
          )}

          {recentRooms.length > 0 ? (
            <RecentRooms
              recentRooms={recentRooms}
              onJoinRoom={handleJoin}
              onDeleteRoom={handleDeleteRoom}
              onJoinNewRoomClick={() => setShowForm(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center mt-[-10vh]">
              <div className="w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold text-center mb-2 text-gray-100">Welcome</h2>
                <p className="text-gray-400 text-center mb-8 text-sm">Join a real-time room to start chatting</p>

                <JoinRoomForm
                  initialUsername={session?.username ?? ""}
                  initialRoomId={session?.roomId ?? ""}
                  onJoin={handleJoin}
                />
              </div>
            </div>
          )}
        </div>

        <JoinRoomModal
          isOpen={showForm && recentRooms.length > 0}
          onClose={() => setShowForm(false)}
          onJoin={handleJoin}
          initialUsername={session?.username ?? ""}
          initialRoomId={session?.roomId ?? ""}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gray-950 flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-col bg-gray-900/40 relative sm:border-x sm:border-gray-800/50 shadow-2xl">
        <ChatHeader
          roomId={session?.roomId ?? ""}
          username={session?.username ?? ""}
          activeUsers={users}
          typingUsers={typingUsers}
          isConnected={!!pusherClient}
          onLeave={handleLeave}
        />

        <ChatArea
          messages={messages}
          typingUsersCount={typingUsers.size}
          onReplyToMessage={setReplyTo}
        />

        <ChatInput
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
