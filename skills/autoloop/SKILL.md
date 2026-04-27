---
name: autoloop
description: Run a bounded experiment loop against an explicit metric in this repository. Use when the user asks to optimize a path, tune a workflow, compare measured alternatives, or iteratively improve code while keeping only verified wins.
---

# Autoloop

Use a measured change/evaluate/keep-or-discard loop when one-shot coding is too guessy.

## Required Inputs

- target metric and direction
- files or directories that may change
- evaluation command
- metric extraction rule when the command does not print a plain result
- stop condition such as max experiments or wall-clock budget
- guardrails such as tests, typecheck, import safety, or "no new dependencies"

## Repo Defaults

- Store logs under `.agent-kernel/experiments/<tag>/`.
- Redirect noisy command output to log files instead of flooding the chat.
- Prefer the smallest relevant checks first, then the broader repo gate for winning changes.
- For hook, script, or workflow experiments, keep `bun run check` as a hard guardrail.

## Workflow

### 1. Frame the loop

- If a required input is missing, ask one short question or derive the narrowest safe default.
- If the goal or metric is fuzzy, tighten it with `agents/spec-reviewer.md` before touching code.
- Pick a run tag such as `browse-latency-2026-04-27`.
- Create a branch named `autoloop/<tag>` from the current commit.
- Create `.agent-kernel/experiments/<tag>/`.
- Run the evaluation once and save the baseline output plus the baseline metric.

### 2. Run one experiment at a time

- Form one hypothesis only.
- If the change is non-trivial, use `agents/code-architect.md` to define the edit boundary first.
- Create a disposable trial branch from the current best commit, for example `autoloop/<tag>-trial-01`.
- Edit only the approved files.
- Save the evaluation output to a trial log file and record the parsed metric in `experiments.tsv`.

### 3. Keep or discard safely

- Keep the trial only when the metric improves and every guardrail still holds.
- If a trial ties the metric, keep it only when the code is materially simpler or more robust.
- Cherry-pick winning commits onto `autoloop/<tag>`.
- When a trial regresses or crashes, switch back to `autoloop/<tag>` and delete the disposable branch.
- Do not use destructive resets to unwind losing experiments.

### 4. Close the run

- Stop when the agreed experiment count or time budget is exhausted.
- Summarize baseline, best result, kept trials, and notable failures.
- Run the relevant final gate on the winning branch.
- Apply `agents/code-reviewer.md` before asking to commit or ship the best result.

## Rules

- Do not modify files outside the approved experiment scope.
- Do not install new packages unless the user explicitly allows it.
- Keep each trial small enough that the metric movement is attributable.
- Prefer reproducible command lines and stable log paths.
