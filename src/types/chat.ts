// Segment with word-for-word strategy annotations
export interface Segment {
  text: string;
  strategies: string[];
}

// Message in the chat
export interface Message {
  role: "user" | "therapist";
  content: string;
  timestamp: string;
  segments?: Segment[]; // Only for therapist messages
}

// Chat session
export interface Session {
  sessionId: string;
  startedAt: string;
  messages: Message[];
}

// API response from chat endpoint
export interface ChatResponse {
  content: string;
  segments: Segment[];
}

// OpenAI structured output schema response
export interface TherapistResponse {
  segments: Segment[];
}

// Available therapeutic strategies
export const THERAPEUTIC_STRATEGIES = [
  "active_listening",
  "validation",
  "cognitive_reframing",
  "empathy",
  "open_ended_questions",
  "reflection",
  "normalization",
  "psychoeducation",
  "grounding",
  "summarization",
] as const;

export type TherapeuticStrategy = (typeof THERAPEUTIC_STRATEGIES)[number];

