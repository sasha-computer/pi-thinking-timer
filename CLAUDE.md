# pi-thinking-timer

Pi extension that shows a live elapsed timer on collapsed thinking blocks.

## Structure

- `thinking-timer.ts` -- the entire extension, single file
- `package.json` -- pi package manifest

## How it works

1. Monkey-patches `AssistantMessageComponent.updateContent()` (once, guarded by a Symbol)
2. Listens to `message_update` for `thinking_start`/`thinking_delta`/`thinking_end` stream events
3. Records start times in a Map, finalizes durations on end
4. A 100ms `setInterval` ticker updates label Text nodes while thinking is active
5. State is stored on `globalThis` so the patch (which survives `/reload`) can find fresh state

## Key constraints

- The patch must never throw -- all patched code is wrapped in try/catch
- State uses a globalThis key so `/reload` replaces the state object cleanly
- The Symbol-guarded patch persists across reloads (prototype mutation is permanent)
- Labels map stores references to rendered Text components for the ticker to update between re-renders

## Testing

```bash
pi -e ./thinking-timer.ts
```

Use a model with thinking enabled and collapse the thinking block with Ctrl+T.
