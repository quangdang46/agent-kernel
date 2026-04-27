import { describe, expect, test } from "bun:test";

import { parseBrowseCliArgs } from "../src/scripts/browse-cli.js";

describe("browse cli argument parsing", () => {
  test("parses text command with selector", () => {
    expect(
      parseBrowseCliArgs([
        "text",
        "--url",
        "https://example.com",
        "--selector",
        "main",
      ]),
    ).toEqual({
      command: "text",
      path: undefined,
      selector: "main",
      url: "https://example.com",
    });
  });

  test("parses screenshot command with output path", () => {
    expect(
      parseBrowseCliArgs([
        "screenshot",
        "--url",
        "https://example.com",
        "--path",
        "artifacts/example.png",
      ]),
    ).toEqual({
      command: "screenshot",
      path: "artifacts/example.png",
      selector: undefined,
      url: "https://example.com",
    });
  });

  test("rejects missing url", () => {
    expect(() => parseBrowseCliArgs(["links"])).toThrow("Missing --url");
  });
});
