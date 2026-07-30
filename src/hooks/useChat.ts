import { useReducer, useEffect, useRef, useCallback } from "react";
import Pusher, { Channel } from "pusher-js";
import { Message } from "@/types/chat";

export interface PusherMember {
  id: string;
  info: {
    username: string;
  };
}

export interface PusherMembers {
  each: (callback: (member: PusherMember) => void) => void;
}

export interface ChatMessageEvent {
  username: string;
  text: string;
  timestamp: number;
  imageUrl?: string;
  replyTo?: {
    username: string;
    text: string;
  };
}

export interface TypingEvent {
  username: string;
  isTyping: boolean;
}

export interface ChatState {
  messages: Message[];
  users: string[];
  typingUsers: Set<string>;
  replyTo: Message | null;
  loginError: string;
  pusherClient: Pusher | null;
}

type ChatAction =
  | { type: "SET_PUSHER_CLIENT"; client: Pusher | null }
  | { type: "SUBSCRIPTION_SUCCEEDED"; users: string[]; systemMessage: Message }
  | { type: "SUBSCRIPTION_ERROR"; error: string }
  | { type: "MEMBER_ADDED"; username: string; systemMessage: Message }
  | { type: "MEMBER_REMOVED"; username: string; systemMessage: Message }
  | { type: "MESSAGE_RECEIVED"; message: Message; senderUsername: string }
  | { type: "MESSAGE_SENT"; message: Message }
  | { type: "TYPING_CHANGED"; username: string; isTyping: boolean }
  | { type: "SET_REPLY_TO"; message: Message | null }
  | { type: "LEAVE_ROOM" };

const initialState: ChatState = {
  messages: [],
  users: [],
  typingUsers: new Set(),
  replyTo: null,
  loginError: "",
  pusherClient: null,
};

function createSystemMessage(text: string): Message {
  return {
    id: crypto.randomUUID(),
    username: "System",
    text,
    timestamp: Date.now(),
    isSelf: false,
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_PUSHER_CLIENT":
      return { ...state, pusherClient: action.client };

    case "SUBSCRIPTION_SUCCEEDED":
      return {
        ...state,
        loginError: "",
        users: action.users,
        messages: [...state.messages, action.systemMessage],
      };

    case "SUBSCRIPTION_ERROR":
      return {
        ...state,
        loginError: action.error,
        pusherClient: null,
      };

    case "MEMBER_ADDED":
      return {
        ...state,
        users: [...state.users, action.username],
        messages: [...state.messages, action.systemMessage],
      };

    case "MEMBER_REMOVED": {
      const nextTyping = new Set(state.typingUsers);
      nextTyping.delete(action.username);
      return {
        ...state,
        users: state.users.filter((u) => u !== action.username),
        typingUsers: nextTyping,
        messages: [...state.messages, action.systemMessage],
      };
    }

    case "MESSAGE_RECEIVED": {
      const exists = state.messages.some(
        (m) => m.timestamp === action.message.timestamp && m.username === action.message.username
      );
      const nextTyping = new Set(state.typingUsers);
      nextTyping.delete(action.senderUsername);

      if (exists) {
        return { ...state, typingUsers: nextTyping };
      }

      return {
        ...state,
        messages: [...state.messages, action.message],
        typingUsers: nextTyping,
      };
    }

    case "MESSAGE_SENT":
      return {
        ...state,
        messages: [...state.messages, action.message],
        replyTo: null,
      };

    case "TYPING_CHANGED": {
      const nextTyping = new Set(state.typingUsers);
      if (action.isTyping) {
        nextTyping.add(action.username);
      } else {
        nextTyping.delete(action.username);
      }
      return { ...state, typingUsers: nextTyping };
    }

    case "SET_REPLY_TO":
      return { ...state, replyTo: action.message };

    case "LEAVE_ROOM":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

interface UseChatOptions {
  onJoinSuccess?: (roomId: string, username: string) => void;
}

export function useChat(roomId: string, username: string, options?: UseChatOptions) {
  const { onJoinSuccess } = options || {};
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!roomId || !username) {
      dispatch({ type: "LEAVE_ROOM" });
      return;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.error("Missing Pusher environment variables.");
      dispatch({ type: "SUBSCRIPTION_ERROR", error: "Missing Pusher configuration." });
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

    dispatch({ type: "SET_PUSHER_CLIENT", client: pusher });

    const channelName = `presence-room-${roomId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: PusherMembers) => {
      const userList: string[] = [];
      members.each((member: PusherMember) => userList.push(member.info.username));

      if (onJoinSuccess) {
        onJoinSuccess(roomId, username);
      }

      dispatch({
        type: "SUBSCRIPTION_SUCCEEDED",
        users: userList,
        systemMessage: createSystemMessage(`You joined room: ${roomId}`),
      });
    });

    channel.bind("pusher:subscription_error", (status: number) => {
      const errorMsg =
        status === 409
          ? "Username is already taken in this room."
          : "Failed to join the room. Please try again.";

      dispatch({ type: "SUBSCRIPTION_ERROR", error: errorMsg });
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    });

    channel.bind("pusher:member_added", (member: PusherMember) => {
      dispatch({
        type: "MEMBER_ADDED",
        username: member.info.username,
        systemMessage: createSystemMessage(`${member.info.username} joined the room.`),
      });
    });

    channel.bind("pusher:member_removed", (member: PusherMember) => {
      dispatch({
        type: "MEMBER_REMOVED",
        username: member.info.username,
        systemMessage: createSystemMessage(`${member.info.username} left the room.`),
      });
    });

    channel.bind("new-message", (data: ChatMessageEvent) => {
      const incomingMessage: Message = {
        id: crypto.randomUUID(),
        username: data.username,
        text: data.text,
        timestamp: data.timestamp,
        isSelf: data.username === username,
        imageUrl: data.imageUrl,
        replyTo: data.replyTo,
      };

      dispatch({
        type: "MESSAGE_RECEIVED",
        message: incomingMessage,
        senderUsername: data.username,
      });
    });

    channel.bind("client-typing", (data: TypingEvent) => {
      dispatch({
        type: "TYPING_CHANGED",
        username: data.username,
        isTyping: data.isTyping,
      });
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      channelRef.current = null;
    };
  }, [roomId, username, onJoinSuccess]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current?.subscribed) {
      channelRef.current.trigger("client-typing", { username, isTyping: false });
    }
    dispatch({ type: "LEAVE_ROOM" });
  }, [username]);

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (channelRef.current?.subscribed) {
        channelRef.current.trigger("client-typing", { username, isTyping });
      }
    },
    [username]
  );

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
      if (!roomId || !username) return;

      const msgTimestamp = Date.now();
      const replyData = state.replyTo
        ? { username: state.replyTo.username, text: state.replyTo.text }
        : undefined;

      const selfMessage: Message = {
        id: crypto.randomUUID(),
        username,
        text,
        timestamp: msgTimestamp,
        isSelf: true,
        imageUrl,
        replyTo: replyData,
      };

      dispatch({ type: "MESSAGE_SENT", message: selfMessage });

      try {
        await fetch("/api/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            username,
            text,
            timestamp: msgTimestamp,
            imageUrl,
            replyTo: replyData,
          }),
        });
      } catch (error) {
        console.error("Failed to send message", error);
      }
    },
    [roomId, username, state.replyTo]
  );

  const setReplyTo = useCallback((message: Message | null) => {
    dispatch({ type: "SET_REPLY_TO", message });
  }, []);

  return {
    messages: state.messages,
    users: state.users,
    typingUsers: state.typingUsers,
    replyTo: state.replyTo,
    loginError: state.loginError,
    pusherClient: state.pusherClient,
    sendMessage,
    leaveRoom,
    handleTyping,
    setReplyTo,
  };
}
