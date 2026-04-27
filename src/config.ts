import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const honchoEnvironmentSchema = z.enum(["local", "production"]);

const honchoEnvSchema = z.object({
  HONCHO_API_KEY: z.string().min(1, "HONCHO_API_KEY is required"),
  HONCHO_WORKSPACE_ID: z.string().min(1).default("agent-kernel"),
  HONCHO_ENVIRONMENT: honchoEnvironmentSchema.default("production"),
  HONCHO_BASE_URL: z.string().url().optional(),
  HONCHO_USER_NAME: z.string().min(1).default("quangdang"),
  HONCHO_ASSISTANT_NAME: z.string().min(1).default("Agent Kernel"),
});

export type HonchoEnv = z.infer<typeof honchoEnvSchema>;
export type HonchoNames = Pick<
  HonchoEnv,
  "HONCHO_WORKSPACE_ID" | "HONCHO_ENVIRONMENT" | "HONCHO_BASE_URL" | "HONCHO_USER_NAME" | "HONCHO_ASSISTANT_NAME"
>;

function parseDotEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const parsed: Record<string, string> = {};
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function loadHonchoEnv(env: NodeJS.ProcessEnv = process.env): HonchoEnv {
  return honchoEnvSchema.parse(loadMergedEnv(env));
}

export function loadMergedEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string | undefined> {
  const dotEnv = parseDotEnvFile(resolve(process.cwd(), ".env"));
  return {
    ...dotEnv,
    ...env,
  };
}

export function loadHonchoNames(env: NodeJS.ProcessEnv = process.env): HonchoNames {
  const merged = loadMergedEnv(env);
  return honchoEnvSchema
    .omit({ HONCHO_API_KEY: true })
    .parse(merged);
}

export function loadHonchoEnvIfAvailable(
  env: NodeJS.ProcessEnv = process.env,
): HonchoEnv | null {
  const merged = loadMergedEnv(env);
  if (!merged.HONCHO_API_KEY) {
    return null;
  }
  return honchoEnvSchema.parse(merged);
}
