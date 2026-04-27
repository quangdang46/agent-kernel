import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

export const hookInputSchema = z.object({
  session_id: z.string(),
  transcript_path: z.string().optional(),
  cwd: z.string().optional(),
  permission_mode: z.string().optional(),
  hook_event_name: z.string(),
});

export const userPromptSubmitSchema = hookInputSchema.extend({
  hook_event_name: z.literal("UserPromptSubmit"),
  prompt: z.string(),
});

export const stopHookSchema = hookInputSchema.extend({
  hook_event_name: z.literal("Stop"),
  stop_hook_active: z.boolean(),
  last_assistant_message: z.string(),
});

export const stopFailureHookSchema = hookInputSchema.extend({
  hook_event_name: z.literal("StopFailure"),
  error: z.string(),
  error_details: z.string().optional(),
  last_assistant_message: z.string().optional(),
});

const sessionStateSchema = z.object({
  sessionId: z.string(),
  prompt: z.string(),
  submittedAt: z.string(),
  userId: z.string(),
  assistantId: z.string(),
});

export type SessionState = z.infer<typeof sessionStateSchema>;

export async function readJsonFromStdin(): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();
  return body ? JSON.parse(body) : {};
}

function stateRoot(): string {
  return resolve(process.cwd(), ".agent-kernel", "state");
}

function statePath(sessionId: string): string {
  return resolve(stateRoot(), `${sessionId}.json`);
}

export async function writeSessionState(state: SessionState): Promise<void> {
  await mkdir(stateRoot(), { recursive: true });
  await writeFile(statePath(state.sessionId), JSON.stringify(state, null, 2));
}

export async function readSessionState(sessionId: string): Promise<SessionState | null> {
  try {
    const content = await readFile(statePath(sessionId), "utf8");
    return sessionStateSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function deleteSessionState(sessionId: string): Promise<void> {
  await rm(statePath(sessionId), { force: true });
}

export function printJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}
