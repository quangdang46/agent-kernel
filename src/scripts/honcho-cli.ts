import {
  askUserModel,
  getAnthropicContext,
  getSessionWorkingMemory,
  recordTurn,
  waitForDerivedMemory,
} from "../memory/honcho.js";
import { loadHonchoNames } from "../config.js";

type CommandName = "record" | "context" | "working-rep" | "ask" | "wait";

function usage(): string {
  return [
    "Usage:",
    "  bun run honcho -- record --session <id> --user-message <text> --assistant-message <text> [--user-id <id>] [--assistant-id <id>]",
    "  bun run honcho -- context --session <id> [--assistant-id <id>] [--tokens <n>]",
    "  bun run honcho -- working-rep --session <id> --peer <id> [--target <id>]",
    "  bun run honcho -- ask --user-id <id> --query <text> [--session <id>]",
    "  bun run honcho -- wait [--session <id>] [--timeout-ms <n>]",
  ].join("\n");
}

function parseArgs(argv: string[]): { command: CommandName; flags: Map<string, string> } {
  const [commandRaw, ...rest] = argv;
  if (!commandRaw) {
    throw new Error(usage());
  }

  const command = commandRaw as CommandName;
  if (!["record", "context", "working-rep", "ask", "wait"].includes(command)) {
    throw new Error(usage());
  }

  const flags = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected token: ${token}\n\n${usage()}`);
    }
    const key = token.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}\n\n${usage()}`);
    }
    flags.set(key, value);
    index += 1;
  }

  return { command, flags };
}

function required(flags: Map<string, string>, name: string): string {
  const value = flags.get(name);
  if (!value) {
    throw new Error(`Missing --${name}\n\n${usage()}`);
  }
  return value;
}

function optionalInt(flags: Map<string, string>, name: string): number | undefined {
  const raw = flags.get(name);
  if (!raw) {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`--${name} must be an integer`);
  }
  return parsed;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const names = loadHonchoNames();

  switch (command) {
    case "record": {
      await recordTurn({
        sessionId: required(flags, "session"),
        userId: flags.get("user-id") ?? names.HONCHO_USER_NAME,
        assistantId: flags.get("assistant-id") ?? names.HONCHO_ASSISTANT_NAME,
        userMessage: required(flags, "user-message"),
        assistantMessage: required(flags, "assistant-message"),
      });
      console.log(JSON.stringify({ ok: true }));
      return;
    }

    case "context": {
      const result = await getAnthropicContext({
        sessionId: required(flags, "session"),
        assistantId: flags.get("assistant-id") ?? names.HONCHO_ASSISTANT_NAME,
        tokens: optionalInt(flags, "tokens"),
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case "working-rep": {
      const result = await getSessionWorkingMemory({
        sessionId: required(flags, "session"),
        peerId: required(flags, "peer"),
        targetPeerId: flags.get("target"),
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case "ask": {
      const result = await askUserModel({
        userId: required(flags, "user-id"),
        query: required(flags, "query"),
        sessionId: flags.get("session"),
      });
      console.log(JSON.stringify({ answer: result }, null, 2));
      return;
    }

    case "wait": {
      await waitForDerivedMemory({
        sessionId: flags.get("session"),
        timeoutMs: optionalInt(flags, "timeout-ms"),
      });
      console.log(JSON.stringify({ ok: true }));
      return;
    }
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
