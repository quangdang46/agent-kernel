# Agent Kernel

## Current Direction

- Clean-room plugin scaffold
- Honcho is the only memory backend in scope
- Claude Code compatibility first
- Bun and TypeScript first
- Project-local workflow skills instead of slash commands
- `agent-browser` is the browse surface for live web automation
- Bounded experiment loops instead of long-running autonomous daemons
- `plugins/` follows the holyclaude-style focused plugin-pack layout

## Memory Rules

- Store new turns through `src/memory/honcho.ts`
- Use `getAnthropicContext()` to reconstruct prompt history
- Use `askUserModel()` or `getSessionWorkingMemory()` for user-specific recall
- Do not add `claude-mem` or `mem0` dependencies
- Claude Code hook entrypoints live in `src/hooks/`
- Project hook config lives in `.claude/settings.json`

## Skill Routing

- Use `$feature-development` for non-trivial features, workflow extensions, and multi-file behavior changes.
- Use `$spec-review` when the user wants a plan or spec tightened before implementation.
- Use `$git-ship` for commit, push, PR, and stale branch cleanup requests.
- Use `$pr-review` when the user asks for review, audit, or a risk pass on a diff.
- Use `$agent-browser` when the user asks to inspect a real page, click through a flow, fill a form, or capture browser evidence.
- Use `$autoloop` when the user wants measured optimization or repeated experiments against a clear metric.
- Prefer extending `skills/` over adding project-specific slash commands.

## Local Agent Profiles

- Use `agents/code-explorer.md` as the discovery lens for unfamiliar flows.
- Use `agents/code-architect.md` before large or multi-file implementation work.
- Use `agents/code-reviewer.md` after a meaningful implementation chunk is done.
- Use `agents/spec-reviewer.md` to tighten a plan before coding starts.
- Use `agents/experiment-runner.md` for a single measured trial inside a broader experiment loop.

## Build

```bash
bun run clean
bun run check
bun run build
bun test
bun run verify:browse
```

## Plugin Packs

- `plugins/feature-dev` mirrors the feature planning and implementation surface.
- `plugins/pr-review-toolkit` mirrors the review surface.
- `plugins/commit-commands` mirrors the shipping surface.
- Keep browse and research in top-level skills instead of plugin packs.
