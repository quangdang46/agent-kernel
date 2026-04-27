import { deleteSessionState, readJsonFromStdin, stopFailureHookSchema } from "./common.js";

async function main() {
  const input = stopFailureHookSchema.parse(await readJsonFromStdin());
  await deleteSessionState(input.session_id);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
