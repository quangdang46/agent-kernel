# Agent Kernel

## Current Direction

- Clean-room plugin scaffold
- Honcho is the only memory backend in scope
- Claude Code compatibility first
- Bun and TypeScript first

## Memory Rules

- Store new turns through `src/memory/honcho.ts`
- Use `getAnthropicContext()` to reconstruct prompt history
- Use `askUserModel()` or `getSessionWorkingMemory()` for user-specific recall
- Do not add `claude-mem` or `mem0` dependencies
- Claude Code hook entrypoints live in `src/hooks/`
- Project hook config lives in `.claude/settings.json`

## Build

```bash
bun run check
bun run build
```
