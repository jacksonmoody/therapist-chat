import type { Session } from "@/types/chat";

const STORAGE_KEY = "2790-chat-sessions";

export function getAllSessions(): Session[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Session[];
  } catch {
    return [];
  }
}

export function getSession(sessionId: string): Session | null {
  const sessions = getAllSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;

  const sessions = getAllSessions();
  const existingIndex = sessions.findIndex(
    (s) => s.sessionId === session.sessionId
  );

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session); // Add to beginning (newest first)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(sessionId: string): void {
  if (typeof window === "undefined") return;

  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.sessionId !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function exportAllSessions(): string {
  const sessions = getAllSessions();
  return JSON.stringify(sessions, null, 2);
}

export function exportSession(sessionId: string): string | null {
  const session = getSession(sessionId);
  if (!session) return null;
  return JSON.stringify(session, null, 2);
}

export function downloadAsJson(data: string, filename: string): void {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
