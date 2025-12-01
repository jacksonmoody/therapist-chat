"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/types/chat";

interface SessionSummary {
  sessionId: string;
  startedAt: string;
  messageCount: number;
  filename: string;
}

interface SessionHistoryProps {
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  currentSessionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionHistory({
  onSelectSession,
  onNewSession,
  currentSessionId,
  isOpen,
  onClose,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      onClose();
      return;
    }

    setLoadingSession(sessionId);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (data.session) {
        onSelectSession(data.session);
        onClose();
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoadingSession(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-0 top-0 h-full w-80 bg-stone-50 border-r border-stone-200 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-stone-800">Sessions</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
            New Session
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-stone-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <div className="text-3xl mb-2 opacity-50">📝</div>
              <p className="text-sm">No previous sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => handleSelectSession(session.sessionId)}
                  disabled={loadingSession === session.sessionId}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    currentSessionId === session.sessionId
                      ? "bg-stone-200 border-stone-300"
                      : "bg-white hover:bg-stone-100 border-stone-200"
                  } border`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-500 font-medium">
                      {formatDate(session.startedAt)}
                    </span>
                    {currentSessionId === session.sessionId && (
                      <span className="text-xs bg-stone-800 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-700">
                      {session.messageCount} messages
                    </span>
                    {loadingSession === session.sessionId && (
                      <span className="text-xs text-stone-500">Loading...</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

