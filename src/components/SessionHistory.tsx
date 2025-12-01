"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/types/chat";
import { getAllSessions, exportSession, downloadAsJson } from "@/lib/storage";

interface SessionHistoryProps {
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  onExportAll: () => void;
  currentSessionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionHistory({
  onSelectSession,
  onNewSession,
  onExportAll,
  currentSessionId,
  isOpen,
  onClose,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = () => {
    const allSessions = getAllSessions();
    // Sort by date, newest first
    allSessions.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    setSessions(allSessions);
  };

  const handleSelectSession = (session: Session) => {
    if (session.sessionId === currentSessionId) {
      onClose();
      return;
    }
    onSelectSession(session);
    onClose();
  };

  const handleExportSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const data = exportSession(sessionId);
    if (data) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadAsJson(data, `session-${timestamp}.json`);
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
              className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 cursor-pointer"
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                onNewSession();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
              New
            </button>
            <button
              onClick={onExportAll}
              disabled={sessions.length === 0}
              className="py-2.5 px-4 bg-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              title="Export all sessions"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export All
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <div className="text-3xl mb-2 opacity-50">📝</div>
              <p className="text-sm">No previous sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => handleSelectSession(session)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSelectSession(session);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                    currentSessionId === session.sessionId
                      ? "bg-stone-200 border-stone-300"
                      : "bg-white hover:bg-stone-100 border-stone-200"
                  } border group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-500 font-medium">
                      {formatDate(session.startedAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {currentSessionId === session.sessionId && (
                        <span className="text-xs bg-stone-800 text-white px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                      <button
                        onClick={(e) => handleExportSession(e, session.sessionId)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-200 transition-all text-stone-500 cursor-pointer"
                        title="Export this session"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-700">
                      {session.messages.length} messages
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
