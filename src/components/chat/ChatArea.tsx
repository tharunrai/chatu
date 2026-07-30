import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CornerUpLeft, X, ZoomIn } from "lucide-react";
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
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsersCount]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative">
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
            className={`flex items-start gap-2.5 group ${msg.isSelf ? "justify-end" : "justify-start"}`}
          >
            {!msg.isSelf && (
              <div className="shrink-0 mt-5">
                <Image
                  src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(msg.username)}`}
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
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs text-gray-500">{msg.username}</span>
                {/* Dedicated Mobile & Desktop Reply Button */}
                {onReplyToMessage && (
                  <button
                    type="button"
                    onClick={() => onReplyToMessage(msg)}
                    title="Reply to message"
                    className="p-1 text-gray-500 hover:text-indigo-400 active:text-indigo-300 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-800/60 active:scale-95 touch-manipulation"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                onDoubleClick={() => onReplyToMessage?.(msg)}
                title="Double-click or tap arrow to reply"
                className={`p-3.5 rounded-2xl select-none transition-all hover:brightness-110 active:scale-[0.99] ${
                  msg.isSelf
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50"
                }`}
              >
                {/* Reply Context Block */}
                {msg.replyTo && (
                  <div
                    className={`text-xs mb-2 px-2.5 py-1.5 rounded-lg border-l-2 text-left truncate max-w-full ${
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

                {/* Attached Image */}
                {msg.imageUrl && (
                  <div className="mb-2 relative rounded-xl overflow-hidden group/img cursor-pointer bg-gray-950/40 border border-black/10">
                    <div
                      className="relative max-h-72 w-full flex justify-center items-center overflow-hidden rounded-xl"
                      onClick={() => setActiveLightboxImage(msg.imageUrl ?? null)}
                    >
                      <img
                        src={msg.imageUrl}
                        alt="Shared media"
                        className="max-h-72 w-auto max-w-full object-contain rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                          <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Text Caption */}
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                )}
              </div>

              <span className="text-[10px] text-gray-600 mt-1 mr-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {msg.isSelf && (
              <div className="shrink-0 mt-5">
                <Image
                  src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(msg.username)}`}
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

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2.5 bg-gray-900/80 hover:bg-gray-800 rounded-full transition-colors z-50"
            title="Close image"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightboxImage}
              alt="Fullscreen shared view"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
