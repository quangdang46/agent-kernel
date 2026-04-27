import { loadHonchoEnvIfAvailable, loadHonchoNames } from "../config.js";
import { getAnthropicContext } from "../memory/honcho.js";
import {
  printJson,
  readJsonFromStdin,
  truncate,
  userPromptSubmitSchema,
  writeSessionState,
} from "./common.js";

function renderContextBlock(snapshot: Awaited<ReturnType<typeof getAnthropicContext>>): string {
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

async function main() {
  const input = userPromptSubmitSchema.parse(await readJsonFromStdin());
  const names = loadHonchoNames();

  await writeSessionState({
    sessionId: input.session_id,
    prompt: input.prompt,
    submittedAt: new Date().toISOString(),
    userId: names.HONCHO_USER_NAME,
    assistantId: names.HONCHO_ASSISTANT_NAME,
  });

  const env = loadHonchoEnvIfAvailable();
  if (!env) {
    printJson({
      suppressOutput: true,
    });
    return;
  }

  try {
    const context = await getAnthropicContext(
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
      return;
    }

    printJson({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext,
      },
      suppressOutput: true,
    });
  } catch {
    printJson({
      suppressOutput: true,
    });
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
