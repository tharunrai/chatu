"use client";

import { useEffect, useState, useRef } from "react";
import Pusher, { Channel } from "pusher-js";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Message, RecentRoom } from "@/types/chat";
import RecentRooms from "@/components/chat/RecentRooms";
import JoinRoomForm from "@/components/chat/JoinRoomForm";
import JoinRoomModal from "@/components/chat/JoinRoomModal";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatArea from "@/components/chat/ChatArea";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatApp() {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);

  // State for login/setup
  const [inRoom, setInRoom] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [showForm, setShowForm] = useState(false);

  // State for chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const channelRef = useRef<Channel | null>(null);

  // Load recent rooms from local storage
  useEffect(() => {
    const saved = localStorage.getItem("chatu_recent_rooms");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentRooms(parsed);
      } catch (e) {
        console.error("Failed to parse recent rooms", e);
      }
    }
  }, []);

  // Initialize Pusher connection when attempting to join a room
  useEffect(() => {
    if (inRoom && roomId) {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!pusherKey || !pusherCluster) {
        console.error("Missing Pusher environment variables. Check .env.local");
        return;
      }

      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
          params: { username },
        },
      });

      setPusherClient(pusher);

      // Subscribe to the presence channel
      const channelName = `presence-room-${roomId}`;
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      // Handle successful subscription
      channel.bind("pusher:subscription_succeeded", (members: any) => {
        setLoginError("");
        const users: string[] = [];
        members.each((member: any) => users.push(member.info.username));
        setActiveUsers(users);

        // Save to recent rooms on successful join
        setRecentRooms((prev) => {
          const newRoom = { roomId, username, lastJoined: Date.now() };
          const filtered = prev.filter((r) => r.roomId !== roomId || r.username !== username);
          const updated = [newRoom, ...filtered].slice(0, 5); // keep top 5
          localStorage.setItem("chatu_recent_rooms", JSON.stringify(updated));
          return updated;
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            username: "System",
            text: `You joined room: ${roomId}`,
            timestamp: Date.now(),
            isSelf: false,
          },
        ]);
      });

      // Handle subscription errors
      channel.bind("pusher:subscription_error", (status: number) => {
        if (status === 409) {
          setLoginError("Username is already taken in this room.");
        } else {
          setLoginError("Failed to join the room. Please try again.");
        }
        setInRoom(false);
        pusher.unsubscribe(channelName);
        pusher.disconnect();
      });

      // Handle new members joining
      channel.bind("pusher:member_added", (member: any) => {
        setActiveUsers((prev) => [...prev, member.info.username]);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            username: "System",
            text: `${member.info.username} joined the room.`,
            timestamp: Date.now(),
            isSelf: false,
          },
        ]);
      });

      // Handle members leaving
      channel.bind("pusher:member_removed", (member: any) => {
        setActiveUsers((prev) => prev.filter((u) => u !== member.info.username));
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(member.info.username);
          return newSet;
        });
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            username: "System",
            text: `${member.info.username} left the room.`,
            timestamp: Date.now(),
            isSelf: false,
          },
        ]);
      });

      // Handle incoming messages
      channel.bind("new-message", (data: any) => {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (msg) => msg.timestamp === data.timestamp && msg.username === data.username
          );
          if (alreadyExists) return prev;

          return [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              username: data.username,
              text: data.text,
              timestamp: data.timestamp,
              isSelf: data.username === username,
              replyTo: data.replyTo,
            },
          ];
        });

        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      });

      // Handle typing indicator via Client Events
      channel.bind("client-typing", (data: { username: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      });

      return () => {
        pusher.unsubscribe(channelName);
        pusher.disconnect();
        channelRef.current = null;
      };
    }
  }, [inRoom, roomId, username]);

  const handleJoin = (u: string, r: string) => {
    setUsername(u);
    setRoomId(r);
    setLoginError("");
    setInRoom(true);
    setShowForm(false);
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomToDelete: RecentRoom) => {
    e.stopPropagation();
    setRecentRooms((prev) => {
      const updated = prev.filter(
        (r) => r.roomId !== roomToDelete.roomId || r.username !== roomToDelete.username
      );
      localStorage.setItem("chatu_recent_rooms", JSON.stringify(updated));
      if (updated.length === 0) setShowForm(true);
      return updated;
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (channelRef.current?.subscribed) {
      channelRef.current.trigger("client-typing", { username, isTyping });
    }
  };

  const handleSendMessage = async (text: string) => {
    const msgData: any = {
      roomId,
      username,
      text,
      timestamp: Date.now(),
    };

    if (replyTo) {
      msgData.replyTo = {
        username: replyTo.username,
        text: replyTo.text,
      };
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        username: username,
        text,
        timestamp: msgData.timestamp,
        isSelf: true,
        replyTo: msgData.replyTo,
      },
    ]);

    setReplyTo(null);

    try {
      await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msgData),
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleLeave = () => {
    if (channelRef.current?.subscribed) {
      channelRef.current.trigger("client-typing", { username, isTyping: false });
    }
    setInRoom(false);
    setMessages([]);
    setTypingUsers(new Set());
    setReplyTo(null);
    setPusherClient(null);
  };

  if (!inRoom) {
    return (
      <div className="min-h-[100dvh] bg-gray-950 flex flex-col p-4 sm:p-6 text-gray-100 font-sans relative">
        {/* Top Branding */}
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-4 sm:py-6 mb-4 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
            </div>
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
                  initialUsername={username}
                  initialRoomId={roomId}
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
          initialUsername={username}
          initialRoomId={roomId}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gray-950 flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-col bg-gray-900/40 relative sm:border-x sm:border-gray-800/50 shadow-2xl">
        <ChatHeader
          roomId={roomId}
          username={username}
          activeUsers={activeUsers}
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
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
