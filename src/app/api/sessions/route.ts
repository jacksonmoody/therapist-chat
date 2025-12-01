import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Session } from "@/types/chat";

export async function GET() {
  try {
    const transcriptsDir = path.join(process.cwd(), "transcripts");

    // Check if directory exists
    try {
      await fs.access(transcriptsDir);
    } catch {
      return NextResponse.json({ sessions: [] });
    }

    const files = await fs.readdir(transcriptsDir);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f.startsWith("session-")
    );

    const sessions: Array<{
      sessionId: string;
      startedAt: string;
      messageCount: number;
      filename: string;
    }> = [];

    for (const filename of jsonFiles) {
      try {
        const filePath = path.join(transcriptsDir, filename);
        const data = await fs.readFile(filePath, "utf-8");
        const session: Session = JSON.parse(data);

        sessions.push({
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          messageCount: session.messages.length,
          filename,
        });
      } catch {
        // Skip invalid files
        continue;
      }
    }

    // Sort by date, newest first
    sessions.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}

