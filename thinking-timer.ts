/**
 * Thinking Timer -- shows elapsed time on collapsed thinking blocks.
 *
 * Patches AssistantMessageComponent.updateContent() to swap
 * "Thinking..." with "Thinking... 4.2s" using stream event timing.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { AssistantMessageComponent } from "@mariozechner/pi-coding-agent";

const G = globalThis as any;
const PATCHED = Symbol.for("pie-thinking-timer.patched");
const STATE_KEY = "pie-thinking-timer.state";

type State = {
	active: Map<string, number>;   // key -> start timestamp
	done: Map<string, number>;     // key -> final duration ms
	labels: Map<string, any>;      // key -> Text component ref
	theme?: ExtensionContext["ui"]["theme"];
};

const state: State = { active: new Map(), done: new Map(), labels: new Map() };
G[STATE_KEY] = state;

function fmt(ms: number): string {
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(1)}s`;
	const m = Math.floor(s / 60);
	return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
}

function label(ms: number | null): string {
	const t = state.theme;
	if (!t) return ms == null ? "Thinking..." : `Thinking... ${fmt(ms)}`;
	const base = t.fg("thinkingText", "Thinking...");
	if (ms == null) return t.italic(base);
	return t.italic(base + t.fg("dim", ` ${fmt(ms)}`));
}

function k(ts: number, idx: number) { return `${ts}:${idx}`; }

function patchOnce() {
	const proto = AssistantMessageComponent.prototype as any;
	if (proto[PATCHED]) return;
	proto[PATCHED] = true;

	const orig = proto.updateContent;
	proto.updateContent = function (msg: any) {
		orig.call(this, msg);
		try {
			const s: State = G[STATE_KEY];
			if (!s || !this.hideThinkingBlock || !msg?.content) return;

			const thinking: number[] = [];
			for (let i = 0; i < msg.content.length; i++)
				if (msg.content[i]?.type === "thinking" && msg.content[i].thinking?.trim())
					thinking.push(i);
			if (!thinking.length) return;

			const nodes = (this.contentContainer?.children ?? [])
				.filter((c: any) => c?.setText && c.text?.includes?.("Thinking..."));

			for (let i = 0; i < Math.min(thinking.length, nodes.length); i++) {
				const key = k(msg.timestamp, thinking[i]);
				s.labels.set(key, nodes[i]);
				const ms = s.done.get(key) ?? (s.active.has(key) ? Date.now() - s.active.get(key)! : null);
				if (ms != null) nodes[i].setText(label(ms));
			}
		} catch { /* never break rendering */ }
	};
}

export default function (pi: ExtensionAPI) {
	patchOnce();
	let tick: ReturnType<typeof setInterval> | null = null;

	function startTick() {
		if (tick) return;
		tick = setInterval(() => {
			for (const [key, start] of state.active) {
				const lbl = state.labels.get(key);
				if (lbl) lbl.setText(label(Date.now() - start));
			}
			if (!state.active.size && tick) { clearInterval(tick); tick = null; }
		}, 100);
	}

	function finalize(key: string) {
		const start = state.active.get(key);
		if (start == null) return;
		const dur = Date.now() - start;
		state.active.delete(key);
		state.done.set(key, dur);
		state.labels.get(key)?.setText(label(dur));
	}

	function reset() {
		if (tick) { clearInterval(tick); tick = null; }
		state.active.clear();
		state.done.clear();
		state.labels.clear();
	}

	pi.on("session_start", async (_e, ctx) => { state.theme = ctx.ui.theme; });

	pi.on("message_update", async (event, ctx) => {
		state.theme = ctx.ui.theme;
		const e = event.assistantMessageEvent as any;
		if (!e?.type) return;

		if (e.type === "thinking_start" || e.type === "thinking_delta") {
			const key = k(e.partial.timestamp, e.contentIndex);
			if (!state.active.has(key)) state.active.set(key, Date.now());
			startTick();
		} else if (e.type === "thinking_end") {
			finalize(k(e.partial.timestamp, e.contentIndex));
		}
	});

	pi.on("message_end", async (event) => {
		const msg = event.message as any;
		if (msg?.role !== "assistant" || !Array.isArray(msg.content)) return;
		for (let i = 0; i < msg.content.length; i++)
			if (msg.content[i]?.type === "thinking") finalize(k(msg.timestamp, i));
	});

	pi.on("session_shutdown", async () => reset());
	pi.on("session_switch", async () => reset());
}
