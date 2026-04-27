# Agent Kernel

`agent-kernel` is a clean-room Claude Code plugin scaffold that uses Honcho for memory and user insight retrieval.

## Why Honcho

- Honcho exposes both an MCP integration and a TypeScript SDK.
- The MCP path gives Claude Code tool access for memory operations.
- The SDK path lets local runtime code store turns and query synthesized user insights.

Primary references:

- `https://docs.honcho.dev/v2/integrations/mcp`
- `https://docs.honcho.dev/v3/documentation/introduction/quickstart`
- `https://docs.honcho.dev/v3/documentation/reference/sdk`

## Project Scope

This repository intentionally starts smaller than `holyclaude`.

Current milestone:

- plugin manifest
- Honcho MCP config
- TypeScript memory adapter scaffold
- local setup and verification scripts
- Claude Code hooks for prompt hydration and turn persistence
- unit-tested hook runtime paths for no-op, recall, and persistence flows
- project-local workflow skills for feature delivery, review, and git shipping

## Adapter Surface

The Honcho adapter currently exposes:

- `recordTurn()` to persist a user/assistant exchange
- `getAnthropicContext()` to retrieve a token-bounded context window
- `getSessionWorkingMemory()` to inspect a session-scoped representation
- `askUserModel()` to query Honcho's synthesized model of a user
- `waitForDerivedMemory()` to block until derivation work finishes

## Hook Flow

Project hooks live in [.claude/settings.json](./.claude/settings.json).

- `UserPromptSubmit` stores the latest prompt in local state and, when Honcho is configured, injects recalled context back into Claude Code
- `Stop` persists the finished user/assistant turn into Honcho and waits for derivation to settle
- `StopFailure` clears local state so interrupted runs do not poison the next turn

Ephemeral hook state is stored under `.agent-kernel/state/` and is gitignored.
Session state files are hashed before being written so Claude session IDs do not leak into filesystem paths.

## Workflow Skills

The workflow layer lives in `skills/` instead of project-specific slash commands:

- `skills/feature-development` for discovery, design, implementation, and verification
- `skills/pr-review` for bug-focused diff and PR review
- `skills/git-ship` for commit, push, PR, and stale branch cleanup workflows

## Environment

Copy `.env.example` to `.env` and fill:

```bash
HONCHO_API_KEY=...
HONCHO_WORKSPACE_ID=agent-kernel
HONCHO_ENVIRONMENT=production
HONCHO_USER_NAME=quangdang
HONCHO_ASSISTANT_NAME="Agent Kernel"
```

## Setup

```bash
./setup
```

## Verification

```bash
bun run check
bun run build
bun test
bun run verify:honcho
```

## Local Honcho CLI

For direct smoke tests without waiting for Claude Code hooks:

```bash
bun run honcho -- record --session demo-1 --user-message "hello" --assistant-message "hi"
bun run honcho -- context --session demo-1 --tokens 1500
bun run honcho -- working-rep --session demo-1 --peer quangdang
bun run honcho -- ask --user-id quangdang --query "What does this user care about?"
```
