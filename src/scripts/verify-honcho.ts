import { createHonchoClient } from "../memory/honcho.js";

async function main() {
  const client = createHonchoClient();

  const workspaces = await client.getWorkspaces();
  const metadata = await client.getMetadata();

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: client.workspaceId,
        visibleWorkspaces: workspaces,
        metadataKeys: Object.keys(metadata),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
