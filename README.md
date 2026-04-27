# Agent Kernel

`agent-kernel` is a Claude Code plugin scaffold that combines Honcho-backed memory, a skill-first workflow layer, focused plugin packs, live browser automation, and bounded experiment loops into one repository.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Layer 5: Research      skills/autoloop             │
│  Metric-driven experiment loops with hard guardrails │
├──────────────────────────────────────────────────────┤
│  Layer 4: Team          agents/*.md                 │
│  Local role lenses for discovery, design, and review│
├──────────────────────────────────────────────────────┤
│  Layer 3: Workflow      skills/*                    │
│  Spec review, feature delivery, review, and shipping│
├──────────────────────────────────────────────────────┤
│  Layer 2: Plugin Packs  plugins/*                   │
│  Focused installable workflow packs                 │
├──────────────────────────────────────────────────────┤
│  Layer 1: Browser       agent-browser               │
│  Live browser automation and screenshot capture     │
├──────────────────────────────────────────────────────┤
│  Layer 0: Memory        Honcho + Claude hooks       │
│  Prompt recall, turn persistence, working memory    │
└──────────────────────────────────────────────────────┘
```

## What You Get

| Surface | Count | Examples |
|---|---:|---|
| Repo-local skills | 6 | `feature-development`, `spec-review`, `pr-review`, `git-ship`, `agent-browser`, `autoloop` |
| Plugin packs | 3 | `feature-dev`, `pr-review-toolkit`, `commit-commands` |
| Agent profiles | 5 | `code-explorer`, `code-architect`, `code-reviewer`, `spec-reviewer`, `experiment-runner` |
| Hook events | 4 | `Setup`, `UserPromptSubmit`, `Stop`, `StopFailure` |
| Memory adapter exports | 6 | `recordTurn()`, `getAnthropicContext()`, `askUserModel()` |

## The Problem

Most Claude Code setups start as one-off scripts:

- memory is bolted on separately from workflow
- browser automation is a second toolchain with separate conventions
- review and shipping are ad hoc
- plugin packaging drifts away from the repo's real development surface

## The Solution

`agent-kernel` keeps the layers close together:

- Honcho handles recall and persistence
- skills define how work is routed
- local agent profiles define review and design lenses
- plugin packs package only the workflow slices worth installing separately
- `agent-browser` handles live web interaction without a custom browser wrapper

## Why Use It

| Need | What Agent Kernel Does |
|---|---|
| Persistent context | Rehydrates prompt context and persists turns through Claude hook events |
| Deliberate implementation flow | Routes work through `spec-review`, `feature-development`, `pr-review`, and `git-ship` |
| Browser evidence | Uses `agent-browser` for page inspection, interaction, and screenshots |
| Installable subsets | Packages workflow surfaces under `plugins/` without duplicating the whole repo |
| Measured optimization | Runs bounded experiment loops through `autoloop` instead of open-ended daemons |

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/quangdang46/agent-kernel.git
cd agent-kernel
cp .env.example .env
```

Fill in `HONCHO_API_KEY` and the optional Honcho identity fields in `.env`.

### 2. Bootstrap the runtime

```bash
./setup
```

What it does:

1. Ensures Bun is available
2. Installs project dependencies
3. Creates local runtime directories under `.agent-kernel/`
4. Installs the `agent-browser` runtime

The same bootstrap path also runs through `hooks/setup.sh` when Claude Code triggers the `Setup` lifecycle hook.

### 3. Verify the working surface

```bash
bun run clean
bun run build
bun run check
bun test
bun run verify:browse
```

To verify Honcho as well:

```bash
bun run verify:honcho
```

This requires a real `HONCHO_API_KEY`.

### 4. Use the workflow layer

Example prompts inside Claude Code:

```text
$spec-review review this plan before I touch the hook pipeline
$feature-development add a new memory-backed operator workflow
$agent-browser inspect the deployed login flow and capture evidence
$pr-review audit the current diff for regressions
$git-ship commit and push the current work
```

## Layer Guide

### Memory Layer

The memory layer is powered by Honcho through `.mcp.json` and the hook entrypoints in `.claude/settings.json`.

Current adapter surface:

- `recordTurn()` persists a user and assistant exchange
- `getAnthropicContext()` fetches token-bounded recall for prompt hydration
- `getSessionWorkingMemory()` reads a session-scoped representation
- `askUserModel()` queries Honcho's synthesized understanding of a user
- `waitForDerivedMemory()` waits for derivation to settle
- `createHonchoClient()` exposes the underlying SDK client constructor

Relevant files:

- `src/memory/honcho.ts`
- `src/hooks/user-prompt-submit.ts`
- `src/hooks/stop.ts`
- `.mcp.json`

### Workflow Layer

The workflow layer lives in `skills/` instead of project-specific slash commands.

| Skill | Use it for |
|---|---|
| `skills/spec-review` | Tightening plans before implementation |
| `skills/feature-development` | Discovery, design, implementation, and verification |
| `skills/pr-review` | Bug-focused diff and branch review |
| `skills/git-ship` | Commit, push, PR, and stale branch cleanup |
| `skills/agent-browser` | Real browser interaction and screenshots |
| `skills/autoloop` | Bounded experiment loops with explicit metrics |

### Team Layer

The team layer is intentionally lightweight and local.

| Agent | Responsibility |
|---|---|
| `agents/code-explorer.md` | Trace current flows before changes |
| `agents/code-architect.md` | Turn findings into a concrete implementation blueprint |
| `agents/code-reviewer.md` | Catch correctness and regression risk |
| `agents/spec-reviewer.md` | Tighten scope and acceptance criteria before coding |
| `agents/experiment-runner.md` | Execute one experiment trial and report `keep` or `discard` |

### Plugin Layer

`plugins/` contains focused installable packs that mirror the repo-local workflow surface instead of introducing a second command model.

| Plugin pack | Includes |
|---|---|
| `plugins/feature-dev` | Feature delivery plus spec review, with explorer, architect, reviewer, and spec-reviewer agents |
| `plugins/pr-review-toolkit` | Review workflow plus code-reviewer agent |
| `plugins/commit-commands` | Shipping workflow via `git-ship` |

Browse and research stay as top-level skills rather than being repackaged into plugin packs.

### Browser Layer

The browser layer uses `agent-browser` directly.

Common commands:

```bash
bun run browse -- open https://example.com
bun run browse -- snapshot -i
bun run browse -- get text body
bun run browse -- screenshot example.png
bun run browse -- close
```

For the full native usage guide:

```bash
bun run browse -- skills get core --full
```

### Research Layer

`skills/autoloop` defines a bounded experiment loop:

- choose a metric and direction
- define editable files
- run one hypothesis at a time
- keep only verified wins
- log trials under `.agent-kernel/experiments/<tag>/`

## Hook Lifecycle

Project hooks live in [`.claude/settings.json`](./.claude/settings.json).

| Hook | What it does |
|---|---|
| `Setup` | Bootstraps dependencies and local runtime directories |
| `UserPromptSubmit` | Stores prompt state and injects Honcho recall when available |
| `Stop` | Persists the finished turn to Honcho and waits for derivation |
| `StopFailure` | Clears local state after interrupted or failed runs |

Ephemeral hook state lives under `.agent-kernel/state/` and is gitignored. Session IDs are hashed before hitting the filesystem.

## File Structure

```text
agent-kernel/
├── .claude-plugin/plugin.json
├── .claude/settings.json
├── .mcp.json
├── agents/
├── hooks/
│   └── setup.sh
├── plugins/
│   ├── commit-commands/
│   ├── feature-dev/
│   └── pr-review-toolkit/
├── scripts/
│   └── setup-runtime.sh
├── skills/
│   ├── agent-browser/
│   ├── autoloop/
│   ├── feature-development/
│   ├── git-ship/
│   ├── pr-review/
│   └── spec-review/
├── src/
│   ├── hooks/
│   ├── memory/
│   └── scripts/
├── test/
├── setup
└── README.md
```

## Verification and Troubleshooting

### `bun run verify:browse` reports a warning

The wrapper in `src/scripts/verify-browse.ts` only fails on real doctor failures. Warnings are printed but do not break the check by themselves.

### `bun run verify:honcho` fails

This usually means `HONCHO_API_KEY` is missing or invalid.

### `./setup` says Bun is required

If automatic install fails, install Bun manually from `https://bun.sh`, then rerun `./setup`.

### The browser runtime is missing

Run:

```bash
bun run browse -- install
```

### Old build artifacts show up in `dist/`

Run:

```bash
bun run clean
bun run build
```

## Comparison

| Approach | Strength | Weakness |
|---|---|---|
| Raw Claude Code plugin skeleton | Minimal moving parts | No integrated memory, workflow, browser, or review surface |
| Single-purpose memory setup | Strong recall | Workflow, browser, and shipping still need to be assembled separately |
| One monolithic agent bundle | Broad surface area | Harder to reason about, harder to trim, easier to drift |
| `agent-kernel` | Small layered stack with skill-first routing and installable workflow packs | Intentionally narrower than a kitchen-sink environment |

## Limitations

- This is a scaffold and working stack, not a giant all-in-one distribution.
- Honcho verification requires real credentials.
- Plugin packs currently package workflow slices only; they do not replace the repo-local browse or research layers.
- The public TypeScript surface is memory-focused; browser automation is exposed as a CLI workflow rather than a local SDK wrapper.

## FAQ

### Is this a library or a plugin?

Both, but mostly a plugin scaffold. The repo contains a Claude plugin manifest plus a small exported TypeScript memory surface.

### Do I need Honcho to use the whole repo?

You need Honcho for memory recall and turn persistence. The workflow, browser, plugin-pack, and experiment surfaces can still be explored without it.

### Why is browser automation not exported from `src/index.ts`?

The browser layer is intentionally CLI-first through `agent-browser`. That keeps it closer to the real operator flow and avoids maintaining a second browser abstraction.

### Why are plugin packs duplicated under `plugins/` instead of referenced indirectly?

Because each pack is meant to stand on its own when installed as a focused workflow slice.

### Should I use the plugin packs or the repo-local `skills/` directly?

Use the repo-local skills when working inside this repository. Use the plugin packs when you want to install only one slice elsewhere.

## License

MIT
