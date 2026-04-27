---
name: browser-dogfood
description: Verify real web pages with the local browser layer in this repository by reading rendered text or HTML, collecting links, and capturing screenshots. Use when the user asks to open a page, dogfood a UI flow, inspect rendered output, gather visual evidence, or smoke-test a deployment in a real browser.
---

# Browser Dogfood

Use the project-local Playwright layer for direct page inspection when web tool output is not enough or when you need artifacts from the repository runtime itself.

## Commands

- `bun run browse -- text --url <url> [--selector <css>]`
- `bun run browse -- html --url <url> [--selector <css>]`
- `bun run browse -- links --url <url>`
- `bun run browse -- screenshot --url <url> [--selector <css>] [--path <file>]`
- `bun run verify:browse`

## Workflow

### 1. Pick the smallest browser action

- Use `text` when the user needs rendered copy or smoke output.
- Use `html` when CSS selectors or DOM structure matter.
- Use `links` when navigation targets or CTA inventory matter.
- Use `screenshot` when you need evidence, visual QA, or before/after artifacts.

### 2. Verify the runtime if needed

- Run `bun run verify:browse` if the browser layer may be uninitialized.
- If it reports a missing executable, install Playwright browsers before continuing.

### 3. Capture only relevant evidence

- Pass `--selector` to scope to the exact region you care about instead of dumping the whole page.
- When taking screenshots, prefer an explicit `--path` if the artifact needs a stable location.

### 4. Report findings concretely

- Summarize what the page rendered, not just that the command succeeded.
- Include the screenshot path when one was created.
- If the browser runtime is blocked by missing binaries or environment issues, report the exact error.

## Repo Notes

- The browse runtime is intentionally stateless. Each command opens a page, gathers output, and exits.
- Artifacts default under `.agent-kernel/artifacts/`.
- This layer is for targeted inspection, not long-lived browser orchestration.
