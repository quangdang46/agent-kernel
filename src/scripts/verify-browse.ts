import { spawnSync } from "node:child_process";

export function doctorHasNoFailures(output: string): boolean {
  const summaryMatch = output.match(
    /Summary:\s+(\d+)\s+pass,\s+(\d+)\s+warn,\s+(\d+)\s+fail/i,
  );

  if (!summaryMatch) {
    return false;
  }

  return Number.parseInt(summaryMatch[3] ?? "1", 10) === 0;
}

async function main() {
  const result = spawnSync("agent-browser", ["doctor"], {
    encoding: "utf8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = [stdout, stderr].filter(Boolean).join("\n");

  if (stdout) {
    process.stdout.write(stdout);
  }

  if (stderr) {
    process.stderr.write(stderr);
  }

  if (!doctorHasNoFailures(combined)) {
    process.exit(result.status && result.status !== 0 ? result.status : 1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
