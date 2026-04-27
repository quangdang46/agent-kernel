# Plugin Packs

This directory packages the installable workflow layer in the same broad shape as `holyclaude`: small focused plugin packs that can be enabled independently.

Included packs:

- `feature-dev` for guided feature delivery and spec review
- `pr-review-toolkit` for bug-focused change review
- `commit-commands` for commit, push, and PR workflows

Browse and research stay in their own top-level layers as repo-local skills; they are not repackaged into `plugins/`.

These packs intentionally reuse the repo-local `skills/` and `agents/` surface instead of reintroducing slash-command drift.
*** Add File: /home/quangdang/agent-kernel/plugins/commit-commands/.claude-plugin/plugin.json
{
  "name": "commit-commands",
  "version": "0.1.0",
  "description": "Focused git delivery plugin for commit, push, pull request, and cleanup workflows",
  "author": {
    "name": "Trần Quang Đãng",
    "email": "tranquangdang21@gmail.com"
  }
}
*** Add File: /home/quangdang/agent-kernel/plugins/commit-commands/README.md
# Commit Commands Plugin

Install this pack when you want the shipping workflow separated from the broader development flow.

It includes:

- `skills/git-ship`

This repo stays skill-first, so the pack exposes `git-ship` instead of rebuilding slash commands.
*** Add File: /home/quangdang/agent-kernel/plugins/commit-commands/skills/git-ship/SKILL.md
---
name: git-ship
description: Prepare changes for git delivery with safe commit, push, pull request, and stale-branch cleanup workflows. Use when the user asks to commit changes, push a branch, open a PR, ship completed work, or clean local branches that were deleted upstream.
---

# Git Ship

Handle git delivery work with explicit safety checks so repository state stays clean.

## Choose The Path

- If the user asked to `commit`, create a local commit only.
- If the user asked to `push`, `ship`, or `open a PR`, commit first, then push, then create the PR when `gh` is available.
- If the user asked to clean stale branches, run the cleanup path without touching the current work.

## Commit Path

### 1. Inspect state

- Read `git status --short`.
- Check whether unrelated user changes are present.
- Review the diff you intend to stage.

### 2. Verify before commit

- Run the relevant project checks when the user expects production-ready output.
- Do not block forever on unrelated failures, but do report them.

### 3. Stage precisely

- Stage only the files that belong to the requested work.
- Never stage secrets, `.env`, generated junk, or unrelated edits.

### 4. Write the commit

- Match the repo's recent commit style.
- Keep the subject specific and grounded in the actual change.
- Do not amend or rewrite history unless the user asked.

## Ship Path

### 1. Check branch strategy

- If already on a feature branch, use it.
- If on `main` and the user wants a PR, create a feature branch before pushing.

### 2. Push cleanly

- Push only after the local commit is in place.
- If push fails because the branch diverged or auth is missing, stop and report the exact blocker.

### 3. Create the PR

- Use `gh pr create` when available.
- Summarize user-visible changes and verification clearly.
- Base the PR body on the actual branch diff, not only the latest commit.

## Cleanup Path

- Use `git fetch --prune` before deciding which branches are gone.
- Remove only branches already deleted upstream and not currently checked out.
- If a gone branch has an attached worktree, remove the worktree before deleting the branch.

## Safety Rules

- Prefer non-interactive git commands.
- Never use destructive resets or checkout rollback commands unless explicitly requested.
- If the worktree is dirty with unrelated edits, call that out and scope your staging carefully instead of reverting anything.
- If verification was skipped, say so in the final handoff.
