---
name: agent-browser
description: Use agent-browser for real browser automation in this repository. Use when the user asks to open a site, inspect a rendered page, click or fill elements, extract content, log into a web app, gather screenshots, or automate a browser workflow against a live page.
---

# Agent Browser

Use the `agent-browser` CLI as the browse layer for this repository.

## Start With The Native Workflow

- For anything beyond a trivial read or screenshot, load the built-in guide with:
  `bun run browse -- skills get core --full`
- Use the standard loop:
  `open` -> `snapshot -i` -> act on `@eN` refs -> re-snapshot after the page changes
- Prefer `@eN` refs from `snapshot -i` over raw CSS selectors when possible.

## Common Commands

- `bun run browse -- open <url>`
- `bun run browse -- snapshot -i`
- `bun run browse -- click @eN`
- `bun run browse -- fill @eN "value"`
- `bun run browse -- wait --load networkidle`
- `bun run browse -- get text <selector-or-ref>`
- `bun run browse -- screenshot <path>`
- `bun run browse -- close`

## Working Rules

- Re-snapshot after clicks, submits, dialog opens, route changes, or any DOM-changing step because refs go stale immediately.
- Prefer explicit waits like `wait @eN`, `wait --url`, or `wait --load networkidle` instead of blind sleeps.
- Use `--session <name>` only when you intentionally want parallel isolated browser state.
- Close the browser session when the task is done so stale tabs do not bleed into later work.

## Repo Notes

- Screenshots should default under `.agent-kernel/artifacts/`.
- Run `bun run verify:browse` if the browse layer might be broken.
- If `verify:browse` reports a missing browser, run `bun run browse -- install`.
