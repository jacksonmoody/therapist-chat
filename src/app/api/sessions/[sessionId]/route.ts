import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Session } from "@/types/chat";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const transcriptsDir = path.join(process.cwd(), "transcripts");

    // Check if directory exists
    try {
      await fs.access(transcriptsDir);
    } catch {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const files = await fs.readdir(transcriptsDir);
    const sessionFile = files.find(
      (f) => f.includes(sessionId) && f.endsWith(".json")
    );

    if (!sessionFile) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const filePath = path.join(transcriptsDir, sessionFile);
    const data = await fs.readFile(filePath, "utf-8");
    const session: Session = JSON.parse(data);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}

