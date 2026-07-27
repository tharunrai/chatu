import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Message } from "@/types/chat";

interface ChatAreaProps {
  messages: Message[];
  typingUsersCount: number;
  onReplyToMessage?: (message: Message) => void;
}

export default function ChatArea({
  messages,
  typingUsersCount,
  onReplyToMessage,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsersCount]);

  return (
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
          <div
            key={msg.id}
            className={`flex items-end gap-2.5 ${msg.isSelf ? "justify-end" : "justify-start"}`}
          >
            {!msg.isSelf && (
              <div className="shrink-0 mb-5">
                <Image
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(msg.username)}`}
                  alt={msg.username}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700/80 object-cover"
                />
              </div>
            )}
            <div
              className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[60%] ${
                msg.isSelf ? "items-end" : "items-start"
              }`}
            >
              <span className="text-xs text-gray-500 mb-1 ml-1">{msg.username}</span>
              <div
                onDoubleClick={() => onReplyToMessage?.(msg)}
                title="Double-click to reply"
                className={`px-4 py-3 rounded-2xl cursor-pointer select-none transition-all hover:brightness-110 active:scale-[0.99] ${
                  msg.isSelf
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50"
                }`}
              >
                {/* Reply Context Block */}
                {msg.replyTo && (
                  <div
                    className={`text-xs mb-1.5 px-2 py-1 rounded border-l-2 text-left truncate max-w-full ${
                      msg.isSelf
                        ? "bg-indigo-700/50 border-indigo-300 text-indigo-200"
                        : "bg-gray-900/60 border-indigo-500 text-gray-400"
                    }`}
                  >
                    <span className="font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                      Replying to {msg.replyTo.username}
                    </span>
                    {msg.replyTo.text}
                  </div>
                )}

                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
              <span className="text-[10px] text-gray-600 mt-1 mr-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {msg.isSelf && (
              <div className="shrink-0 mb-5">
                <Image
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(msg.username)}`}
                  alt={msg.username}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/50 object-cover"
                />
              </div>
            )}
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
