---
name: spec-review
description: Review a plan, spec, or scoped proposal before implementation. Use when the user asks to sanity-check a plan, tighten acceptance criteria, split phases, surface hidden dependencies, or decide whether a change is ready to build.
---

# Spec Review

Use this workflow before coding when ambiguity or scope risk is high enough to make implementation guessy.

## Workflow

### 1. Ground the proposal

- Read the user request, plan, issue, or draft spec first.
- Pull in only the repo files that define the affected surface, usually `CLAUDE.md`, `README.md`, the closest runtime files, and similar skills or agents.
- If the proposal references an unfamiliar flow, trace it briefly before reviewing the plan.

### 2. Review with the right lenses

- Use `agents/spec-reviewer.md` as the primary verdict lens.
- Use `agents/code-explorer.md` when the proposal touches code paths that are not yet well understood.
- Use `agents/code-architect.md` when the plan needs to be turned into concrete file-level work.

### 3. Produce an implementation verdict

- Start with `GO`, `REVISE`, or `RETHINK`.
- Call out the top gaps, not every possible concern.
- Convert vague requests into concrete acceptance criteria, file targets, and validation steps.
- Split oversized plans into phases that can land safely.

### 4. Hand off cleanly

- If the plan is ready, point the next step to `skills/feature-development`.
- If it needs revision, name the smallest missing decisions that unblock execution.
- If it needs a rethink, state which abstraction, dependency, or workflow choice is wrong for this repo.

## Review Rules

- Stay grounded in the current repository shape instead of reviewing against an imagined rewrite.
- Prefer one recommended path over a menu of abstract options.
- Treat missing verification strategy as a real gap.
- Keep the final review short, concrete, and actionable.
