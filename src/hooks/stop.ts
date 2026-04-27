import { loadHonchoEnvIfAvailable } from "../config.js";
import { recordTurn, waitForDerivedMemory } from "../memory/honcho.js";
import {
  deleteSessionState,
  readJsonFromStdin,
  readSessionState,
  type StopHookInput,
  stopHookSchema,
} from "./common.js";

export interface StopHookDeps {
  deleteState?: typeof deleteSessionState;
  loadEnvIfAvailable?: typeof loadHonchoEnvIfAvailable;
  readState?: typeof readSessionState;
  record?: typeof recordTurn;
  wait?: typeof waitForDerivedMemory;
}

export async function runStopHook(
  input: StopHookInput,
  deps: StopHookDeps = {},
): Promise<void> {
  const readStateFn = deps.readState ?? readSessionState;
  const loadEnvIfAvailableFn = deps.loadEnvIfAvailable ?? loadHonchoEnvIfAvailable;
  const deleteStateFn = deps.deleteState ?? deleteSessionState;
  const recordFn = deps.record ?? recordTurn;
  const waitFn = deps.wait ?? waitForDerivedMemory;

  if (input.stop_hook_active) {
    return;
  }

  const state = await readStateFn(input.session_id);
  if (!state) {
    return;
  }

  const env = loadEnvIfAvailableFn();
  if (!env) {
    await deleteStateFn(input.session_id);
    return;
  }

  try {
    await recordFn(
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

    await waitFn(
      {
        sessionId: input.session_id,
        timeoutMs: 30000,
      },
      env,
    );
  } finally {
    await deleteStateFn(input.session_id);
  }
}

async function main() {
  const input = stopHookSchema.parse(await readJsonFromStdin());
  await runStopHook(input);
}

if (import.meta.main) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
