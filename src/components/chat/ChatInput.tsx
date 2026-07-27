import React, { useState, useRef } from "react";
import { Send, X } from "lucide-react";
import { Message } from "@/types/chat";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export default function ChatInput({
  onSendMessage,
  onTyping,
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Notify typing state
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText("");

      // Notify typing stopped
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-900/80 border-t border-gray-800 relative">
      {replyTo && (
        <div className="mb-3 flex items-center justify-between bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex-1 min-w-0 pr-4">
            <span className="font-semibold block text-[10px] text-indigo-400 uppercase tracking-wider mb-0.5">
              Replying to {replyTo.username}
            </span>
            <span className="truncate block text-gray-400">{replyTo.text}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
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
  );
}
