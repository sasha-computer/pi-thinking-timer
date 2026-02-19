# pie-thinking-timer

A minimal [pi](https://github.com/nicepkg/pi) extension that shows a live timer on collapsed thinking blocks.

Instead of:

```
Thinking...
```

You see:

```
Thinking... 4.2s
```

The timer ticks live while the model thinks and locks in the final duration when it finishes.

Inspired by [xRyul/pi-thinking-timer](https://github.com/xRyul/pi-thinking-timer). This is a stripped-back rewrite (~100 lines) with the same core idea.

## Install

```bash
pi install git:github.com/sasha-computer/pie-thinking-timer
```

Or try without installing:

```bash
pi -e git:github.com/sasha-computer/pie-thinking-timer
```

Then restart pi or run `/reload`.

## How it works

The extension patches `AssistantMessageComponent.updateContent()` to replace the hardcoded "Thinking..." label with a timed version. It tracks `thinking_start`/`thinking_end` stream events and ticks a 100ms interval to keep the display live.

If pi changes its internal UI structure, the extension fails safely and shows the default label.

## Development

```bash
git clone https://github.com/sasha-computer/pie-thinking-timer
cd pie-thinking-timer
pi -e ./thinking-timer.ts
```

## License

MIT
