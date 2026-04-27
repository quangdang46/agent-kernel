---
name: pr-review
description: Audit a diff, branch, or pull request for real engineering issues with emphasis on bugs, regressions, unsafe behavior changes, and missing tests. Use when the user asks for a review, wants a second pass before merge, or needs a risk-focused assessment of code changes.
---

# PR Review

Review changes like an engineer protecting production behavior, not like a style linter.

## Review Target

- Determine whether the user wants review of the current diff, a commit range, or a pull request.
- Gather the smallest relevant comparison surface first: `git diff`, changed files, and any touched tests or docs.
- Read local guidance files if the changes touch an area with repo-specific rules.

## Review Priorities

### 1. Correctness

- Look for logic errors, broken control flow, missing guards, invalid assumptions, and unhandled failure cases.

### 2. Behavioral regression

- Check whether existing callers, scripts, hooks, or config contracts changed in subtle ways.
- Watch for import-time side effects, path handling bugs, and broken CLI or hook entrypoints.

### 3. Verification gaps

- Check whether the change added or updated tests for the risky paths.
- Call out missing coverage when a bug could slip through without it.

### 4. Maintainability only when it matters

- Report duplication, confusing structure, or weak abstractions only when they create real future risk.
- Skip cosmetic nits unless the repository explicitly requires them.

## Output Format

- Lead with findings, ordered by severity.
- For each finding, include file and line reference plus the concrete failure mode.
- If no findings remain, say that explicitly and mention any residual risk or untested area.
- Keep summaries brief after the findings.

## Review Rules

- Do not invent hypothetical issues without a clear code path.
- Do not report pre-existing problems unless the current change makes them worse.
- Prefer high-confidence findings over long issue lists.
- Treat docs drift as a finding only when it can mislead operators or break usage.
