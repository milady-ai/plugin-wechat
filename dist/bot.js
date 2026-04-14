//#region src/bot.ts
const DEFAULT_DEDUP_WINDOW_MS = 1800 * 1e3;
const DEDUP_MAX_ENTRIES = 1e3;
const DEDUP_CLEANUP_INTERVAL_MS = 300 * 1e3;
var Bot = class {
	seen = /* @__PURE__ */ new Map();
	onMessage;
	featuresGroups;
	featuresImages;
	dedupWindowMs;
	cleanupTimer = null;
	constructor(options) {
		this.onMessage = options.onMessage;
		this.featuresGroups = options.featuresGroups ?? true;
		this.featuresImages = options.featuresImages ?? true;
		this.dedupWindowMs = options.dedupWindowMs ?? DEFAULT_DEDUP_WINDOW_MS;
		this.cleanupTimer = setInterval(() => this.cleanup(), DEDUP_CLEANUP_INTERVAL_MS);
	}
	handleIncoming(message) {
		if (this.isDuplicate(message.id)) return;
		if (message.group && !this.featuresGroups) return;
		if (message.type === "image" && !this.featuresImages) return;
		if (message.type === "unknown") return;
		Promise.resolve(this.onMessage(message)).catch((error) => {
			console.error("[wechat] Failed to process inbound message:", error);
		});
	}
	isDuplicate(messageId) {
		const now = Date.now();
		if (this.seen.has(messageId)) return true;
		if (this.seen.size >= DEDUP_MAX_ENTRIES) this.cleanup();
		this.seen.set(messageId, now);
		return false;
	}
	cleanup() {
		const cutoff = Date.now() - this.dedupWindowMs;
		for (const [id, ts] of this.seen) if (ts < cutoff) this.seen.delete(id);
	}
	stop() {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		this.seen.clear();
	}
};
//#endregion
export { Bot };

//# sourceMappingURL=bot.js.map