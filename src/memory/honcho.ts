import { Honcho, type SessionContext } from "@honcho-ai/sdk";

import { loadHonchoEnv, type HonchoEnv } from "../config.js";

export interface ConversationTurn {
  sessionId: string;
  userId: string;
  assistantId: string;
  userMessage: string;
  assistantMessage: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface AnthropicContextSnapshot {
  sessionId: string;
  messageCount: number;
  summary: string | null;
  peerRepresentation: string | null;
  peerCard: string[] | null;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export function createHonchoClient(env: HonchoEnv = loadHonchoEnv()): Honcho {
  return new Honcho({
    apiKey: env.HONCHO_API_KEY,
    environment: env.HONCHO_ENVIRONMENT,
    baseURL: env.HONCHO_BASE_URL,
    workspaceId: env.HONCHO_WORKSPACE_ID,
  });
}

async function getSessionActors(
  client: Honcho,
  turn: Pick<ConversationTurn, "sessionId" | "userId" | "assistantId">,
) {
  const [session, user, assistant] = await Promise.all([
    client.session(turn.sessionId, {
      metadata: {
        source: "agent-kernel",
      },
    }),
    client.peer(turn.userId, {
      metadata: {
        kind: "user",
      },
    }),
    client.peer(turn.assistantId, {
      metadata: {
        kind: "assistant",
      },
    }),
  ]);

  await session.addPeers([user, assistant]);

  return { session, user, assistant };
}

export async function recordTurn(
  turn: ConversationTurn,
  env: HonchoEnv = loadHonchoEnv(),
): Promise<void> {
  const client = createHonchoClient(env);
  const { session, user, assistant } = await getSessionActors(client, turn);

  const userMessage = user.message(turn.userMessage, {
    metadata: turn.metadata,
    createdAt: turn.createdAt,
  });
  const assistantMessage = assistant.message(turn.assistantMessage, {
    metadata: turn.metadata,
    createdAt: turn.createdAt,
  });

  await session.addMessages([userMessage, assistantMessage]);
}

function toAnthropicSnapshot(
  sessionId: string,
  context: SessionContext,
  assistantId: string,
): AnthropicContextSnapshot {
  return {
    sessionId,
    messageCount: context.length,
    summary: context.summary?.content ?? null,
    peerRepresentation: context.peerRepresentation,
    peerCard: context.peerCard,
    messages: context.toAnthropic(assistantId),
  };
}

export async function getAnthropicContext(
  params: {
    sessionId: string;
    assistantId: string;
    tokens?: number;
    summary?: boolean;
  },
  env: HonchoEnv = loadHonchoEnv(),
): Promise<AnthropicContextSnapshot> {
  const client = createHonchoClient(env);
  const session = await client.session(params.sessionId);
  const context = await session.context({
    summary: params.summary ?? true,
    tokens: params.tokens,
    peerPerspective: params.assistantId,
  });

  return toAnthropicSnapshot(params.sessionId, context, params.assistantId);
}

export async function getSessionWorkingMemory(
  params: {
    sessionId: string;
    peerId: string;
    targetPeerId?: string;
  },
  env: HonchoEnv = loadHonchoEnv(),
): Promise<string> {
  const client = createHonchoClient(env);
  const session = await client.session(params.sessionId);
  return session.representation(params.peerId, {
    target: params.targetPeerId,
  });
}

export async function askUserModel(
  params: {
    userId: string;
    query: string;
    sessionId?: string;
  },
  env: HonchoEnv = loadHonchoEnv(),
): Promise<string | null> {
  const client = createHonchoClient(env);
  const user = await client.peer(params.userId);
  return user.chat(params.query, {
    session: params.sessionId,
  });
}

export async function waitForDerivedMemory(
  params: {
    sessionId?: string;
    timeoutMs?: number;
  } = {},
  env: HonchoEnv = loadHonchoEnv(),
): Promise<void> {
  const client = createHonchoClient(env);
  const timeoutMs = params.timeoutMs ?? 30000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = params.sessionId
      ? await client.queueStatus({ session: params.sessionId })
      : await client.queueStatus();

    if (status.pendingWorkUnits === 0 && status.inProgressWorkUnits === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for Honcho queue to settle");
}
