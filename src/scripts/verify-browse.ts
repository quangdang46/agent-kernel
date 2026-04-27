import { verifyBrowseRuntime } from "../browse/runtime.js";

async function main() {
  const result = await verifyBrowseRuntime();
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
          ok: false,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  });
}
