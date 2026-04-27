import { createHash } from "node:crypto";
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
export type UserPromptSubmitInput = z.infer<typeof userPromptSubmitSchema>;

export const stopHookSchema = hookInputSchema.extend({
  hook_event_name: z.literal("Stop"),
  stop_hook_active: z.boolean(),
  last_assistant_message: z.string(),
});
export type StopHookInput = z.infer<typeof stopHookSchema>;

export const stopFailureHookSchema = hookInputSchema.extend({
  hook_event_name: z.literal("StopFailure"),
  error: z.string(),
  error_details: z.string().optional(),
  last_assistant_message: z.string().optional(),
});
export type StopFailureHookInput = z.infer<typeof stopFailureHookSchema>;

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

export function sessionStateFileName(sessionId: string): string {
  return `${createHash("sha256").update(sessionId).digest("hex")}.json`;
}

function legacySessionStateFileName(sessionId: string): string | null {
  return /^[A-Za-z0-9._-]+$/.test(sessionId) ? `${sessionId}.json` : null;
}

function resolveStateFile(fileName: string): string {
  return resolve(stateRoot(), fileName);
}

function statePath(sessionId: string): string {
  return resolveStateFile(sessionStateFileName(sessionId));
}

function statePathCandidates(sessionId: string): string[] {
  const paths = [statePath(sessionId)];
  const legacyFileName = legacySessionStateFileName(sessionId);

  if (legacyFileName) {
    paths.push(resolveStateFile(legacyFileName));
  }

  return paths;
}

export async function writeSessionState(state: SessionState): Promise<void> {
  await mkdir(stateRoot(), { recursive: true });
  await writeFile(statePath(state.sessionId), JSON.stringify(state, null, 2));
}

export async function readSessionState(sessionId: string): Promise<SessionState | null> {
  for (const candidate of statePathCandidates(sessionId)) {
    try {
      const content = await readFile(candidate, "utf8");
      return sessionStateSchema.parse(JSON.parse(content));
    } catch {
      continue;
    }
  }

  return null;
}

export async function deleteSessionState(sessionId: string): Promise<void> {
  await Promise.all(
    statePathCandidates(sessionId).map((candidate) =>
      rm(candidate, { force: true }),
    ),
  );
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
