import { describe, expect, test } from "bun:test";

import type { HonchoEnv, HonchoNames } from "../src/config.js";
import { runStopHook } from "../src/hooks/stop.js";
import { runUserPromptSubmit } from "../src/hooks/user-prompt-submit.js";

const names = {
  HONCHO_WORKSPACE_ID: "agent-kernel",
  HONCHO_ENVIRONMENT: "production",
  HONCHO_USER_NAME: "alice",
  HONCHO_ASSISTANT_NAME: "Agent Kernel",
} satisfies HonchoNames;

const env = {
  HONCHO_API_KEY: "test-key",
  HONCHO_WORKSPACE_ID: "agent-kernel",
  HONCHO_ENVIRONMENT: "production",
  HONCHO_USER_NAME: "alice",
  HONCHO_ASSISTANT_NAME: "Agent Kernel",
} satisfies HonchoEnv;

describe("user prompt submit hook", () => {
  test("stores prompt state and suppresses output when Honcho is unavailable", async () => {
    let writtenState:
      | {
          sessionId: string;
          prompt: string;
          submittedAt: string;
          userId: string;
          assistantId: string;
        }
      | undefined;

    const result = await runUserPromptSubmit(
      {
        session_id: "session-1",
        hook_event_name: "UserPromptSubmit",
        prompt: "remember this",
      },
      {
        loadNames: () => names,
        loadEnvIfAvailable: () => null,
        now: () => "2026-04-27T00:00:00.000Z",
        writeState: async (state) => {
          writtenState = state;
        },
      },
    );

    expect(writtenState).toEqual({
      sessionId: "session-1",
      prompt: "remember this",
      submittedAt: "2026-04-27T00:00:00.000Z",
      userId: "alice",
      assistantId: "Agent Kernel",
    });
    expect(result).toEqual({
      suppressOutput: true,
    });
  });

  test("injects recalled Honcho context when it exists", async () => {
    const result = await runUserPromptSubmit(
      {
        session_id: "session-2",
        hook_event_name: "UserPromptSubmit",
        prompt: "what should you remember",
      },
      {
        loadNames: () => names,
        loadEnvIfAvailable: () => env,
        writeState: async () => {},
        getContext: async () => ({
          sessionId: "session-2",
          messageCount: 2,
          summary: "The user prefers concise technical updates.",
          peerRepresentation: null,
          peerCard: null,
          messages: [
            {
              role: "user",
              content: "status?",
            },
            {
              role: "assistant",
              content: "all green",
            },
          ],
        }),
      },
    );

    expect(result.hookSpecificOutput?.hookEventName).toBe("UserPromptSubmit");
    expect(result.hookSpecificOutput?.additionalContext).toContain(
      "The user prefers concise technical updates.",
    );
    expect(result.hookSpecificOutput?.additionalContext).toContain(
      "user: status?",
    );
    expect(result.hookSpecificOutput?.additionalContext).toContain(
      "assistant: all green",
    );
  });
});

describe("stop hook", () => {
  test("deletes pending state when Honcho is unavailable", async () => {
    const deleted: string[] = [];

    await runStopHook(
      {
        session_id: "session-3",
        hook_event_name: "Stop",
        stop_hook_active: false,
        last_assistant_message: "done",
      },
      {
        readState: async () => ({
          sessionId: "session-3",
          prompt: "remember this",
          submittedAt: "2026-04-27T00:00:00.000Z",
          userId: "alice",
          assistantId: "Agent Kernel",
        }),
        loadEnvIfAvailable: () => null,
        deleteState: async (sessionId) => {
          deleted.push(sessionId);
        },
      },
    );

    expect(deleted).toEqual(["session-3"]);
  });

  test("records turns, waits for derivation, and clears state", async () => {
    const steps: string[] = [];
    let recordedTurn:
      | {
          sessionId: string;
          userId: string;
          assistantId: string;
          userMessage: string;
          assistantMessage: string;
          metadata?: Record<string, unknown>;
        }
      | undefined;

    await runStopHook(
      {
        session_id: "session-4",
        hook_event_name: "Stop",
        stop_hook_active: false,
        last_assistant_message: "completed",
      },
      {
        readState: async () => ({
          sessionId: "session-4",
          prompt: "ship it",
          submittedAt: "2026-04-27T00:00:00.000Z",
          userId: "alice",
          assistantId: "Agent Kernel",
        }),
        loadEnvIfAvailable: () => env,
        record: async (turn) => {
          steps.push("record");
          recordedTurn = turn;
        },
        wait: async () => {
          steps.push("wait");
        },
        deleteState: async () => {
          steps.push("delete");
        },
      },
    );

    expect(recordedTurn).toEqual({
      sessionId: "session-4",
      userId: "alice",
      assistantId: "Agent Kernel",
      userMessage: "ship it",
      assistantMessage: "completed",
      metadata: {
        source: "claude-code-stop-hook",
      },
    });
    expect(steps).toEqual(["record", "wait", "delete"]);
  });

  test("clears state even when turn persistence fails", async () => {
    const steps: string[] = [];

    await expect(
      runStopHook(
        {
          session_id: "session-5",
          hook_event_name: "Stop",
          stop_hook_active: false,
          last_assistant_message: "completed",
        },
        {
          readState: async () => ({
            sessionId: "session-5",
            prompt: "ship it",
            submittedAt: "2026-04-27T00:00:00.000Z",
            userId: "alice",
            assistantId: "Agent Kernel",
          }),
          loadEnvIfAvailable: () => env,
          record: async () => {
            steps.push("record");
            throw new Error("persist failed");
          },
          deleteState: async () => {
            steps.push("delete");
          },
        },
      ),
    ).rejects.toThrow("persist failed");

    expect(steps).toEqual(["record", "delete"]);
  });
});
