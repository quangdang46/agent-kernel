import {
  capturePageScreenshot,
  readPageHtml,
  readPageLinks,
  readPageText,
} from "../browse/runtime.js";

export type BrowseCliCommand =
  | "html"
  | "links"
  | "screenshot"
  | "text";

export interface BrowseCliArgs {
  command: BrowseCliCommand;
  path?: string;
  selector?: string;
  url: string;
}

function usage(): string {
  return [
    "Usage:",
    "  bun run browse -- text --url <url> [--selector <css>]",
    "  bun run browse -- html --url <url> [--selector <css>]",
    "  bun run browse -- links --url <url>",
    "  bun run browse -- screenshot --url <url> [--selector <css>] [--path <file>]",
  ].join("\n");
}

export function parseBrowseCliArgs(argv: string[]): BrowseCliArgs {
  const [commandRaw, ...rest] = argv;
  if (!commandRaw) {
    throw new Error(usage());
  }

  if (!["text", "html", "links", "screenshot"].includes(commandRaw)) {
    throw new Error(usage());
  }

  const command = commandRaw as BrowseCliCommand;
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

  const url = flags.get("url");
  if (!url) {
    throw new Error(`Missing --url\n\n${usage()}`);
  }

  return {
    command,
    path: flags.get("path"),
    selector: flags.get("selector"),
    url,
  };
}

async function main() {
  const args = parseBrowseCliArgs(process.argv.slice(2));

  switch (args.command) {
    case "text":
      console.log(
        JSON.stringify(
          await readPageText({
            selector: args.selector,
            url: args.url,
          }),
          null,
          2,
        ),
      );
      return;

    case "html":
      console.log(
        JSON.stringify(
          await readPageHtml({
            selector: args.selector,
            url: args.url,
          }),
          null,
          2,
        ),
      );
      return;

    case "links":
      console.log(
        JSON.stringify(
          await readPageLinks({
            url: args.url,
          }),
          null,
          2,
        ),
      );
      return;

    case "screenshot":
      console.log(
        JSON.stringify(
          await capturePageScreenshot({
            path: args.path,
            selector: args.selector,
            url: args.url,
          }),
          null,
          2,
        ),
      );
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
