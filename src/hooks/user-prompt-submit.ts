import { loadHonchoEnvIfAvailable, loadHonchoNames } from "../config.js";
import { getAnthropicContext } from "../memory/honcho.js";
import {
  printJson,
  readJsonFromStdin,
  type SessionState,
  truncate,
  type UserPromptSubmitInput,
  userPromptSubmitSchema,
  writeSessionState,
} from "./common.js";

export interface UserPromptSubmitResult {
  suppressOutput: true;
  hookSpecificOutput?: {
    hookEventName: "UserPromptSubmit";
    additionalContext: string;
  };
}

export interface UserPromptSubmitDeps {
  getContext?: typeof getAnthropicContext;
  loadEnvIfAvailable?: typeof loadHonchoEnvIfAvailable;
  loadNames?: typeof loadHonchoNames;
  now?: () => string;
  writeState?: (state: SessionState) => Promise<void>;
}

export function renderContextBlock(
  snapshot: Awaited<ReturnType<typeof getAnthropicContext>>,
): string {
  const lines: string[] = [];

  if (snapshot.summary) {
    lines.push("Honcho session summary:");
    lines.push(snapshot.summary);
    lines.push("");
  }

  if (snapshot.messages.length > 0) {
    lines.push("Honcho recalled messages:");
    for (const message of snapshot.messages.slice(-8)) {
      lines.push(`${message.role}: ${truncate(message.content, 600)}`);
    }
  }

  return lines.join("\n").trim();
}

export async function runUserPromptSubmit(
  input: UserPromptSubmitInput,
  deps: UserPromptSubmitDeps = {},
): Promise<UserPromptSubmitResult> {
  const loadNamesFn = deps.loadNames ?? loadHonchoNames;
  const writeStateFn = deps.writeState ?? writeSessionState;
  const loadEnvIfAvailableFn = deps.loadEnvIfAvailable ?? loadHonchoEnvIfAvailable;
  const getContextFn = deps.getContext ?? getAnthropicContext;
  const nowFn = deps.now ?? (() => new Date().toISOString());
  const names = loadNamesFn();

  await writeStateFn({
    sessionId: input.session_id,
    prompt: input.prompt,
    submittedAt: nowFn(),
    userId: names.HONCHO_USER_NAME,
    assistantId: names.HONCHO_ASSISTANT_NAME,
  });

  const env = loadEnvIfAvailableFn();
  if (!env) {
    return {
      suppressOutput: true,
    };
  }

  try {
    const context = await getContextFn(
      {
        sessionId: input.session_id,
        assistantId: names.HONCHO_ASSISTANT_NAME,
        tokens: 2500,
        summary: true,
      },
      env,
    );

    const additionalContext = renderContextBlock(context);
    if (!additionalContext) {
      return {
        suppressOutput: true,
      };
    }

    return {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext,
      },
      suppressOutput: true,
    };
  } catch {
    return {
      suppressOutput: true,
    };
  }
}

async function main() {
  const input = userPromptSubmitSchema.parse(await readJsonFromStdin());
  printJson(await runUserPromptSubmit(input));
}

if (import.meta.main) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
