#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-cli}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  if [[ "$MODE" != "hook" ]]; then
    echo "$@"
  fi
}

emit_hook_result() {
  if [[ "$MODE" == "hook" ]]; then
    printf '{"continue":true,"suppressOutput":true}\n'
  fi
}

find_bun() {
  if command -v bun >/dev/null 2>&1; then
    command -v bun
    return
  fi

  if [[ -x "$HOME/.bun/bin/bun" ]]; then
    printf '%s\n' "$HOME/.bun/bin/bun"
  fi
}

install_bun_if_missing() {
  if [[ -n "$(find_bun)" ]]; then
    return
  fi

  if ! command -v curl >/dev/null 2>&1; then
    return
  fi

  log "Installing bun..."
  curl -fsSL https://bun.sh/install | bash >/dev/null 2>&1 || true
}

install_bun_if_missing
BUN_CMD="$(find_bun)"

if [[ -z "$BUN_CMD" ]]; then
  if [[ "$MODE" == "hook" ]]; then
    emit_hook_result
    exit 0
  fi

  echo "bun is required: https://bun.sh" >&2
  exit 1
fi

mkdir -p \
  "$ROOT/.agent-kernel/artifacts" \
  "$ROOT/.agent-kernel/experiments" \
  "$ROOT/.agent-kernel/state" \
  "$ROOT/dist"

if [[ ! -d "$ROOT/node_modules" ]]; then
  log "Installing dependencies..."
  if ! (
    cd "$ROOT"
    "$BUN_CMD" install
  ); then
    if [[ "$MODE" == "hook" ]]; then
      emit_hook_result
      exit 0
    fi

    exit 1
  fi
fi

log "Installing browser runtime..."
(
  cd "$ROOT"
  "$BUN_CMD" run browse -- install >/dev/null 2>&1 || true
)

if [[ "$MODE" == "hook" ]]; then
  emit_hook_result
  exit 0
fi

log "Runtime setup complete."
