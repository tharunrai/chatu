import { useState, useEffect, useRef, useCallback } from "react";
import Pusher, { Channel } from "pusher-js";
import { Message } from "@/types/chat";

interface UseChatRoomOptions {
  onJoinSuccess?: (roomId: string, username: string) => void;
}

export function useChatRoom(options?: UseChatRoomOptions) {
  const { onJoinSuccess } = options || {};

  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loginError, setLoginError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const channelRef = useRef<Channel | null>(null);

  // Initialize Pusher connection when attempting to join a room
  useEffect(() => {
    if (!inRoom || !roomId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.error("Missing Pusher environment variables. Check .env.local");
      setLoginError("Missing Pusher configuration on server.");
      setInRoom(false);
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

    // Subscribe to presence channel
    const channelName = `presence-room-${roomId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Handle successful subscription
    channel.bind("pusher:subscription_succeeded", (members: any) => {
      setLoginError("");
      const users: string[] = [];
      members.each((member: any) => users.push(member.info.username));
      setActiveUsers(users);

      if (onJoinSuccess) {
        onJoinSuccess(roomId, username);
      }

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
  }, [inRoom, roomId, username, onJoinSuccess]);

  const joinRoom = useCallback((u: string, r: string) => {
    setUsername(u);
    setRoomId(r);
    setLoginError("");
    setInRoom(true);
  }, []);

  const leaveRoom = useCallback(() => {
    if (channelRef.current?.subscribed) {
      channelRef.current.trigger("client-typing", { username, isTyping: false });
    }
    setInRoom(false);
    setMessages([]);
    setTypingUsers(new Set());
    setReplyTo(null);
    setPusherClient(null);
  }, [username]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current?.subscribed) {
      channelRef.current.trigger("client-typing", { username, isTyping });
    }
  }, [username]);

  const sendMessage = useCallback(async (text: string) => {
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
  }, [roomId, username, replyTo]);

  return {
    inRoom,
    username,
    roomId,
    loginError,
    pusherClient,
    messages,
    activeUsers,
    typingUsers,
    replyTo,
    joinRoom,
    leaveRoom,
    sendMessage,
    handleTyping,
    setReplyTo,
    setLoginError,
  };
}
