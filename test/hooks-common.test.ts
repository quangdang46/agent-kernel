import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deleteSessionState,
  readSessionState,
  sessionStateFileName,
  truncate,
  writeSessionState,
} from "../src/hooks/common.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(() => {
  process.chdir(originalCwd);
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

describe("hook common helpers", () => {
  test("writes and reads session state", async () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-kernel-hooks-"));
    tempDirs.push(dir);
    process.chdir(dir);

    await writeSessionState({
      sessionId: "s-1",
      prompt: "remember this",
      submittedAt: "2026-04-27T00:00:00.000Z",
      userId: "quangdang",
      assistantId: "Agent Kernel",
    });

    const state = await readSessionState("s-1");
    expect(state?.prompt).toBe("remember this");

    await deleteSessionState("s-1");
    const deleted = await readSessionState("s-1");
    expect(deleted).toBeNull();
  });

  test("truncate keeps short strings and shortens long ones", () => {
    expect(truncate("short", 20)).toBe("short");
    expect(truncate("abcdefghij", 6)).toBe("abcde…");
  });

  test("hashes state filenames for complex session ids", async () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-kernel-hooks-"));
    tempDirs.push(dir);
    process.chdir(dir);

    const sessionId = "nested/session?id=42";

    await writeSessionState({
      sessionId,
      prompt: "persist safely",
      submittedAt: "2026-04-27T00:00:00.000Z",
      userId: "quangdang",
      assistantId: "Agent Kernel",
    });

    const stateDir = join(dir, ".agent-kernel", "state");
    expect(readdirSync(stateDir)).toContain(sessionStateFileName(sessionId));
    expect(existsSync(join(stateDir, "nested"))).toBe(false);

    const state = await readSessionState(sessionId);
    expect(state?.prompt).toBe("persist safely");
  });
});
