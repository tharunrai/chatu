import React, { useState, useRef } from "react";
import { Send, X, Image as ImageIcon, Loader2, CircleAlert } from "lucide-react";
import Image from "next/image";
import { Message } from "@/types/chat";

interface ChatInputProps {
  onSendMessage: (text: string, imageUrl?: string, isViewOnce?: boolean) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

// Client-side image WebP compression helper
function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Output WebP format for high compression ratio (~20KB)
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({
  onSendMessage,
  onTyping,
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputError, setInputError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setInputError("Please select a valid image file.");
      return;
    }

    setInputError("");
    setIsProcessing(true);

    try {
      // Compress image directly on canvas to lightweight WebP data URL
      const compressedWebP = await compressImage(file);
      setSelectedImage(compressedWebP);
    } catch (err) {
      console.error("Compression error:", err);
      setInputError("Failed to process photo.");
      setSelectedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

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
    if ((inputText.trim() || selectedImage) && !isProcessing) {
      onSendMessage(inputText.trim(), selectedImage ?? undefined, isViewOnce);
      setInputText("");
      setSelectedImage(null);
      setIsViewOnce(false);

      // Notify typing stopped
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const canSubmit = (Boolean(inputText.trim()) || Boolean(selectedImage)) && !isProcessing;

  return (
    <div className="p-4 bg-gray-900/80 border-t border-gray-800 relative">
      {/* Input Error Banner */}
      {inputError && (
        <div className="mb-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-center justify-between">
          <span>{inputError}</span>
          <button onClick={() => setInputError("")} className="hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Reply Context Bar */}
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

      {/* Image Preview Bar with WhatsApp View Once (1) Toggle */}
      {(selectedImage || isProcessing) && (
        <div className="mb-3 flex items-center gap-3 bg-gray-950/90 border border-indigo-500/30 rounded-2xl p-2.5 max-w-sm relative animate-in fade-in-50 duration-200">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            ) : selectedImage ? (
              <Image
                src={selectedImage}
                alt="Upload preview"
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-200 block truncate">
              {isProcessing ? "Processing photo..." : "Attached photo"}
            </span>
            <span className="text-[10px] text-gray-500 block">
              {isProcessing ? "Optimizing image" : isViewOnce ? "Strict View Once enabled" : "Standard media photo"}
            </span>
          </div>

          {!isProcessing && selectedImage && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* WhatsApp View Once (1) Toggle Button */}
              <button
                type="button"
                onClick={() => setIsViewOnce(!isViewOnce)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isViewOnce
                    ? "bg-emerald-600/30 text-emerald-400 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200"
                }`}
                title={isViewOnce ? "View Once active" : "Enable View Once"}
              >
                <CircleAlert className="w-3.5 h-3.5" />
                <span>1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setIsViewOnce(false);
                }}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-colors shrink-0"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-center">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="p-3 text-gray-400 hover:text-indigo-400 hover:bg-gray-800/80 active:scale-95 disabled:opacity-50 transition-all rounded-xl border border-gray-800 bg-gray-950 shrink-0"
          title="Attach photo"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onPaste={handlePaste}
          placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
          className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-100 placeholder:text-gray-600 transition-all"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
