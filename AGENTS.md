# pi-thinking-timer

Pi extension. Single TypeScript file (`thinking-timer.ts`).

Shows a live timer on collapsed thinking blocks: `Thinking... 4.2s`

## Files

| File | Purpose |
|------|---------|
| `thinking-timer.ts` | The extension (all logic) |
| `package.json` | Pi package manifest |

## Architecture

Patches `AssistantMessageComponent.updateContent()` to inject timing into the "Thinking..." label. Tracks thinking block durations via stream events (`thinking_start`, `thinking_end`). A 100ms interval ticker keeps the display live during active thinking.

State lives on `globalThis` so the monkey-patch (permanent) can access fresh state after `/reload`.

## Development

```bash
pi -e ./thinking-timer.ts
```
