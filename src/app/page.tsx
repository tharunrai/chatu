"use client";

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import { Send, MessageSquare, LogIn, Users } from "lucide-react";

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

export default function ChatApp() {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  
  // State for login/setup
  const [inRoom, setInRoom] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  
  // State for chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Pusher connection when entering a room
  useEffect(() => {
    if (inRoom && roomId) {
      // Create Pusher instance
      // We use the environment variables from the browser (NEXT_PUBLIC_)
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!pusherKey || !pusherCluster) {
        console.error("Missing Pusher environment variables. Check .env.local");
        return;
      }

      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      setPusherClient(pusher);

      // Subscribe to the room channel
      const channel = pusher.subscribe(`room-${roomId}`);

      channel.bind("new-message", (data: any) => {
        // Since we also trigger the POST request, we receive our own messages from Pusher.
        // We can filter out our own messages if we want, or just let Pusher render them.
        // To prevent double rendering, we only add messages sent by others, 
        // OR we don't optimistically update our own messages. Let's not optimistically update to keep it simple, 
        // and just let Pusher handle all incoming messages, including our own.
        // Or better, we optimistically update locally, and ignore the Pusher broadcast if the username matches (simple approach).
        
        // Let's use a simple approach: if it's not from us, add it.
        // If we want multiple tabs of the same user to sync, we should probably check an ID.
        // For this demo, let's just render all incoming messages as "not self" if they aren't us.
        setMessages((prev) => {
          // Prevent duplicates if we already added it locally
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
            },
          ];
        });
      });

      return () => {
        pusher.unsubscribe(`room-${roomId}`);
        pusher.disconnect();
      };
    }
  }, [inRoom, roomId, username]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      setInRoom(true);
      
      // Add a system message for ourselves
      setMessages([
        {
          id: Math.random().toString(36).substring(7),
          username: "System",
          text: `You joined room: ${roomId}`,
          timestamp: Date.now(),
          isSelf: false,
        }
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      const msgData = {
        roomId,
        username,
        text: inputText,
        timestamp: Date.now(),
      };
      
      // Optimistically add message locally
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          username: username,
          text: inputText,
          timestamp: msgData.timestamp,
          isSelf: true,
        },
      ]);
      
      setInputText("");

      // Send to the serverless API route to trigger Pusher
      try {
        await fetch('/api/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(msgData),
        });
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  if (!inRoom) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-gray-100 font-sans">
        <div className="w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">ChatU</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Join a real-time room to start chatting (Pusher Edition)</p>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
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
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-100">Room: {roomId}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${pusherClient ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                <span className="text-xs text-gray-400">{pusherClient ? "Connected" : "Connecting..."}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setInRoom(false);
              setMessages([]);
            }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Leave
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            if (msg.username === "System") {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="text-xs text-gray-500 bg-gray-950/50 px-3 py-1 rounded-full border border-gray-800">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${msg.isSelf ? "items-end" : "items-start"}`}>
                  <span className="text-xs text-gray-500 mb-1 ml-1">{msg.username}</span>
                  <div 
                    className={`px-4 py-3 rounded-2xl ${
                      msg.isSelf 
                        ? "bg-indigo-600 text-white rounded-tr-sm" 
                        : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 mt-1 mr-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900/80 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 placeholder:text-gray-600 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
