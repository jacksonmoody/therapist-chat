"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Message, Session } from "@/types/chat";
import MessageList from "./MessageList";
import SessionHistory from "./SessionHistory";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update session ID if new
      if (!sessionId) {
        setSessionId(data.sessionId);
      }

      // Add therapist response
      const therapistMessage: Message = {
        role: "therapist",
        content: data.content,
        timestamp: new Date().toISOString(),
        segments: data.segments,
      };
      setMessages((prev) => [...prev, therapistMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectSession = useCallback((session: Session) => {
    setSessionId(session.sessionId);
    setMessages(session.messages);
  }, []);

  const handleNewSession = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-stone-100 to-stone-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowHistory(true)}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600"
          title="View sessions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-serif text-stone-800">
            CS 2790R Final Project
          </h1>
          <p className="text-xs text-stone-500">Jackson Moody and Sein Yun</p>
        </div>

        <button
          onClick={handleNewSession}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600"
          title="New session"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />
      <div ref={messagesEndRef} />

      {/* Input */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-stone-200">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white rounded-2xl border border-stone-300 p-2 shadow-sm focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-200 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-stone-800 placeholder-stone-400 focus:outline-none text-base leading-relaxed"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-stone-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Session History Panel */}
      <SessionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        currentSessionId={sessionId}
      />
    </div>
  );
}
