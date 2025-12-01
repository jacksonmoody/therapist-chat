"use client";

import type { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-stone-500">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-6 opacity-60">🌿</div>
          <h2 className="text-xl font-serif text-stone-700 mb-3">Welcome!</h2>
          <p className="text-stone-500 leading-relaxed">
            Please share what is on your mind. Responses may come from either a
            licensed therapist or an AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] ${
              message.role === "user"
                ? "bg-gradient-to-br from-stone-800 to-stone-900 text-stone-100 rounded-2xl rounded-br-sm px-5 py-3"
                : "bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm"
            }`}
          >
            <p
              className={
                message.role === "user"
                  ? "text-stone-100"
                  : "text-stone-800 leading-relaxed"
              }
            >
              {message.content}
            </p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
