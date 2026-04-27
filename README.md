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
- pre-implementation spec review workflow for plan tightening
- agent-browser-backed browse workflow for live page automation
- project-local agent profiles for exploration, design, review, and spec checks
- bounded autoloop workflow for measured experiment runs
- holyclaude-style plugin layer with focused installable workflow packs

## Adapter Surface

The Honcho adapter currently exposes:

- `recordTurn()` to persist a user/assistant exchange
- `getAnthropicContext()` to retrieve a token-bounded context window
- `getSessionWorkingMemory()` to inspect a session-scoped representation
- `askUserModel()` to query Honcho's synthesized model of a user
- `waitForDerivedMemory()` to block until derivation work finishes

## Hook Flow

Project hooks live in [.claude/settings.json](./.claude/settings.json).

- `Setup` bootstraps dependencies and local runtime directories when the plugin is installed into a project
- `UserPromptSubmit` stores the latest prompt in local state and, when Honcho is configured, injects recalled context back into Claude Code
- `Stop` persists the finished user/assistant turn into Honcho and waits for derivation to settle
- `StopFailure` clears local state so interrupted runs do not poison the next turn

Ephemeral hook state is stored under `.agent-kernel/state/` and is gitignored.
Session state files are hashed before being written so Claude session IDs do not leak into filesystem paths.

## Workflow Skills

The workflow layer lives in `skills/` instead of project-specific slash commands:

- `skills/feature-development` for discovery, design, implementation, and verification
- `skills/spec-review` for implementation-readiness review before code is written
- `skills/pr-review` for bug-focused diff and PR review
- `skills/git-ship` for commit, push, PR, and stale branch cleanup workflows
- `skills/agent-browser` for live page inspection, interaction, and screenshots
- `skills/autoloop` for metric-driven experiment loops with explicit guardrails

## Plugin Layer

The plugin layer follows the same broad organization as `holyclaude`: focused packs under `plugins/` that can be installed independently.

- `plugins/feature-dev` packages feature delivery plus spec review
- `plugins/pr-review-toolkit` packages the review surface
- `plugins/commit-commands` packages git shipping workflows

Browse and research remain separate top-level layers in this repo instead of being repackaged as plugins.

## Team Layer

The team layer is documented in `agents/` as reusable role lenses:

- `agents/code-explorer.md` for tracing existing flows before changes
- `agents/code-architect.md` for implementation blueprints
- `agents/code-reviewer.md` for post-change risk review
- `agents/spec-reviewer.md` for plan and scope review before coding
- `agents/experiment-runner.md` for single-hypothesis experiment execution

## Research Layer

The research layer is intentionally bounded:

- `skills/autoloop` defines how to run measured improvement loops without turning the repo into a long-lived automation daemon
- experiment logs live under `.agent-kernel/experiments/<tag>/`
- winning experiments should still pass the normal repo gate before they are committed

## Browse Layer

The browse layer uses `agent-browser`, which provides:

- page navigation through a persistent browser session
- `snapshot -i` refs for low-token interaction with live pages
- direct `click`, `fill`, `wait`, `get`, and `screenshot` commands
- project-local screenshot defaults under `.agent-kernel/artifacts/`

Commands:

```bash
bun run browse -- open https://example.com
bun run browse -- snapshot -i
bun run browse -- get text body
bun run browse -- screenshot example.png
bun run browse -- close
bun run verify:browse
```

For deeper usage patterns:

```bash
bun run browse -- skills get core --full
```

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

The same bootstrap path also runs through `hooks/setup.sh` when Claude Code triggers the `Setup` lifecycle hook.

## Verification

```bash
bun run clean
bun run check
bun run build
bun test
bun run verify:browse
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
