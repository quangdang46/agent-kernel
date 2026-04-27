---
name: feature-development
description: Plan and deliver non-trivial features in this repository from discovery through implementation and review. Use when the user asks to build a new capability, extend a workflow, add an integration, introduce a multi-file refactor, or change behavior that needs design work before coding.
---

# Feature Development

Drive feature work in ordered phases so implementation follows the repo's actual patterns instead of improvisation.

## Workflow

### 1. Frame the request

- Restate the feature in concrete terms.
- Identify the user-visible outcome, the affected runtime path, and the likely files or subsystems.
- If a critical product decision is ambiguous, ask a short direct question before editing. Otherwise make the smallest reasonable assumption and continue.

### 2. Read the codebase first

- Read `CLAUDE.md`, `README.md`, and the files closest to the requested change.
- Search for similar flows, naming patterns, config loading, script entrypoints, and tests before writing code.
- Prefer local conventions over generic best practices when they conflict.
- When the task is large, use the role lenses in `agents/code-explorer.md`, `agents/code-architect.md`, and `agents/code-reviewer.md` to structure discovery, design, and review.

### 3. Design the change

- Pick one implementation approach and state the tradeoff in one or two sentences.
- Favor minimal surface area, explicit data flow, and testable seams.
- When the change is large, break it into small phases that can land cleanly.

### 4. Implement

- Edit the smallest coherent set of files.
- Preserve existing interfaces unless the feature truly needs a contract change.
- Keep runtime entrypoints import-safe when the code may be imported by tests.
- Add comments only where the code would otherwise be hard to parse.

### 5. Verify

- Run the tightest relevant checks first, then the broader repo gate.
- Add or extend tests for the paths you changed, especially error handling and no-op behavior.
- If you cannot verify something locally, say exactly what remains unverified.

### 6. Close the loop

- Summarize what changed, what was verified, and any follow-up work.
- Point to the most important files, not every touched file.

## Defaults For This Repo

- Treat `src/` as the runtime layer and keep hooks, scripts, and adapters composable.
- Prefer adding project-local skills under `skills/` for reusable workflows instead of adding slash commands.
- Keep `README.md` and `CLAUDE.md` in sync when a new workflow becomes part of the supported surface.
- If a feature adds a new operator workflow, add or update a local skill for it.

## Apply It Here

- For memory or hook changes, inspect `src/config.ts`, `src/memory/`, `src/hooks/`, and `test/` together.
- For plugin capability changes, inspect `.claude-plugin/plugin.json`, `.claude/settings.json`, and `README.md`.
- For workflow changes, inspect existing skills in `skills/` before adding a new one.
- For plan quality checks before coding, apply the lens in `agents/spec-reviewer.md`.
