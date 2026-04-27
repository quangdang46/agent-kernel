import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  loadBrowseConfig,
  loadHonchoEnv,
  loadHonchoEnvIfAvailable,
  loadHonchoNames,
} from "../src/config.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(() => {
  process.chdir(originalCwd);
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

describe("config loading", () => {
  test("reads names from explicit env without API key", () => {
    const config = loadHonchoNames({
      HONCHO_WORKSPACE_ID: "workspace-a",
      HONCHO_ENVIRONMENT: "production",
      HONCHO_USER_NAME: "alice",
      HONCHO_ASSISTANT_NAME: "kernel",
    });

    expect(config.HONCHO_WORKSPACE_ID).toBe("workspace-a");
    expect(config.HONCHO_USER_NAME).toBe("alice");
    expect(config.HONCHO_ASSISTANT_NAME).toBe("kernel");
  });

  test("returns null when API key is unavailable", () => {
    const config = loadHonchoEnvIfAvailable({
      HONCHO_WORKSPACE_ID: "workspace-a",
      HONCHO_ENVIRONMENT: "production",
      HONCHO_USER_NAME: "alice",
      HONCHO_ASSISTANT_NAME: "kernel",
    });

    expect(config).toBeNull();
  });

  test("merges values from .env file", () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-kernel-config-"));
    tempDirs.push(dir);

    writeFileSync(
      join(dir, ".env"),
      [
        "HONCHO_API_KEY=test-key",
        "HONCHO_WORKSPACE_ID=workspace-dotenv",
        "HONCHO_ENVIRONMENT=production",
        "HONCHO_USER_NAME=dotenv-user",
        "HONCHO_ASSISTANT_NAME=dotenv-assistant",
      ].join("\n"),
    );

    process.chdir(dir);

    const config = loadHonchoEnv({});
    expect(config.HONCHO_API_KEY).toBe("test-key");
    expect(config.HONCHO_WORKSPACE_ID).toBe("workspace-dotenv");
    expect(config.HONCHO_USER_NAME).toBe("dotenv-user");
  });

  test("parses browse config with boolean and numeric env values", () => {
    const config = loadBrowseConfig({
      BROWSE_HEADLESS: "false",
      BROWSE_TIMEOUT_MS: "22000",
      BROWSE_VIEWPORT_WIDTH: "1440",
      BROWSE_VIEWPORT_HEIGHT: "900",
      BROWSE_ARTIFACT_DIR: ".agent-kernel/browser-artifacts",
    });

    expect(config.BROWSE_HEADLESS).toBe(false);
    expect(config.BROWSE_TIMEOUT_MS).toBe(22000);
    expect(config.BROWSE_VIEWPORT_WIDTH).toBe(1440);
    expect(config.BROWSE_VIEWPORT_HEIGHT).toBe(900);
    expect(config.BROWSE_ARTIFACT_DIR).toBe(".agent-kernel/browser-artifacts");
  });
});
