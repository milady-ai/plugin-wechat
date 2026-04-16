//#region src/reply-dispatcher.ts
const DEFAULT_CHUNK_SIZE = 2e3;
var ReplyDispatcher = class {
	client;
	chunkSize;
	constructor(options) {
		this.client = options.client;
		this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
	}
	async sendText(to, text) {
		const chunks = this.chunk(text);
		for (const chunk of chunks) try {
			await this.client.sendText(to, chunk);
		} catch (err) {
			console.error(`[wechat] Failed to send text to ${to}:`, err);
			throw err;
		}
	}
	async sendImage(to, imagePath, caption) {
		try {
			await this.client.sendImage(to, imagePath, caption);
		} catch (err) {
			console.error(`[wechat] Failed to send image to ${to}:`, err);
			throw err;
		}
	}
	chunk(text) {
		if (text.length <= this.chunkSize) return [text];
		const chunks = [];
		let remaining = text;
		while (remaining.length > 0) {
			if (remaining.length <= this.chunkSize) {
				chunks.push(remaining);
				break;
			}
			let breakAt = remaining.lastIndexOf("\n", this.chunkSize);
			if (breakAt <= 0) breakAt = remaining.lastIndexOf(" ", this.chunkSize);
			if (breakAt <= 0) breakAt = this.chunkSize;
			chunks.push(remaining.slice(0, breakAt));
			remaining = remaining.slice(breakAt).trimStart();
		}
		return chunks;
	}
};

//#endregion
export { ReplyDispatcher };