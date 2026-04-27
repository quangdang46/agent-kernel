import { loadHonchoEnvIfAvailable } from "../config.js";
import { recordTurn, waitForDerivedMemory } from "../memory/honcho.js";
import {
  deleteSessionState,
  readJsonFromStdin,
  readSessionState,
  stopHookSchema,
} from "./common.js";

async function main() {
  const input = stopHookSchema.parse(await readJsonFromStdin());

  if (input.stop_hook_active) {
    return;
  }

  const state = await readSessionState(input.session_id);
  if (!state) {
    return;
  }

  const env = loadHonchoEnvIfAvailable();
  if (!env) {
    await deleteSessionState(input.session_id);
    return;
  }

  try {
    await recordTurn(
      {
        sessionId: input.session_id,
        userId: state.userId,
        assistantId: state.assistantId,
        userMessage: state.prompt,
        assistantMessage: input.last_assistant_message,
        metadata: {
          source: "claude-code-stop-hook",
        },
      },
      env,
    );

    await waitForDerivedMemory(
      {
        sessionId: input.session_id,
        timeoutMs: 30000,
      },
      env,
    );
  } finally {
    await deleteSessionState(input.session_id);
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
