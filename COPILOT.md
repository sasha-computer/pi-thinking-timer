# pie-thinking-timer

Pi extension. Single file: `thinking-timer.ts`.

Shows elapsed time on collapsed thinking blocks in the pi terminal agent.

## Key details

- Patches `AssistantMessageComponent.updateContent()` once (Symbol guard)
- Tracks `thinking_start`/`thinking_end` stream events via `message_update` hook
- 100ms ticker updates labels live during thinking
- State on `globalThis` for `/reload` compatibility
- All patch code wrapped in try/catch to never break rendering
