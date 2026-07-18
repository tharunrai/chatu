"use client";

import { useEffect, useState, useRef } from "react";
import Pusher, { Channel } from "pusher-js";
import { Send, MessageSquare, LogIn, Users, AlertCircle, Clock, Plus, X, Trash2 } from "lucide-react";

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

interface RecentRoom {
  roomId: string;
  username: string;
  lastJoined: number;
}

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
  const [inputText, setInputText] = useState("");
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<Channel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          const filtered = prev.filter(r => r.roomId !== roomId || r.username !== username);
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
          }
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
          }
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
          }
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      setLoginError("");
      setInRoom(true);
    }
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomToDelete: RecentRoom) => {
    e.stopPropagation();
    setRecentRooms((prev) => {
      const updated = prev.filter(r => r.roomId !== roomToDelete.roomId || r.username !== roomToDelete.username);
      localStorage.setItem("chatu_recent_rooms", JSON.stringify(updated));
      if (updated.length === 0) setShowForm(true);
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (channelRef.current && channelRef.current.subscribed) {
      channelRef.current.trigger('client-typing', { username, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current?.subscribed) {
          channelRef.current.trigger('client-typing', { username, isTyping: false });
        }
      }, 2000);
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
      
      if (channelRef.current && channelRef.current.subscribed) {
        channelRef.current.trigger('client-typing', { username, isTyping: false });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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

  const getTypingText = () => {
    const users = Array.from(typingUsers);
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`;
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
            <div className="w-full">
              <div className="mb-6 flex items-center gap-2 text-gray-400">
                <Clock className="w-5 h-5" />
                <h2 className="text-lg font-medium">Recent Rooms</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentRooms.map((room, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setUsername(room.username);
                      setRoomId(room.roomId);
                      setLoginError("");
                      setInRoom(true);
                    }}
                    className="relative p-6 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all group flex flex-col items-start gap-4"
                  >
                    <button
                      onClick={(e) => handleDeleteRoom(e, room)}
                      className="absolute top-4 right-4 p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100 mb-1 truncate">{room.roomId}</h3>
                      <p className="text-sm text-gray-500 truncate">Joined as <span className="text-gray-300 font-medium">{room.username}</span></p>
                    </div>
                  </div>
                ))}
                
                <div 
                  onClick={() => setShowForm(true)}
                  className="p-6 bg-gray-950 hover:bg-gray-900 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-indigo-400 min-h-[160px]"
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-medium">Join New Room</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center mt-[-10vh]">
              <div className="w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold text-center mb-2 text-gray-100">Welcome</h2>
                <p className="text-gray-400 text-center mb-8 text-sm">Join a real-time room to start chatting</p>
                
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
          )}
        </div>

        {/* Modal for adding a new room when recent rooms exist */}
        {showForm && recentRooms.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md p-6 bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-100 mb-1">Add New Room</h2>
              <p className="text-sm text-gray-400 mb-6">Enter a room name and your username to join.</p>
              
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
        )}
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gray-950 flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-col bg-gray-900/40 relative sm:border-x sm:border-gray-800/50 shadow-2xl">
        
        {/* Header */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center relative group cursor-pointer hover:bg-indigo-500/30 transition-colors">
              <Users className="w-5 h-5 text-indigo-400" />
              <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-gray-800 border border-gray-700 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Users ({activeUsers.length})</h3>
                <ul className="space-y-1">
                  {activeUsers.map(u => (
                    <li key={u} className="text-sm text-gray-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {u} {u === username && <span className="text-gray-500 text-xs">(You)</span>}
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
                  <span className="text-xs font-medium text-indigo-400">
                    {getTypingText()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${pusherClient ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                  <span className="text-xs text-gray-400">{pusherClient ? `${activeUsers.length} members` : "Connecting..."}</span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              if (channelRef.current?.subscribed) {
                channelRef.current.trigger('client-typing', { username, isTyping: false });
              }
              setInRoom(false);
              setMessages([]);
              setTypingUsers(new Set());
            }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Leave
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[60%] ${msg.isSelf ? "items-end" : "items-start"}`}>
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
        <div className="p-4 bg-gray-900/80 border-t border-gray-800 relative">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
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
