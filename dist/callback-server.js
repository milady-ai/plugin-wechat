import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
//#region src/callback-server.ts
const WECHAT_TYPE_MAP = {
	60001: {
		type: "text",
		scope: "private"
	},
	60002: {
		type: "image",
		scope: "private"
	},
	60003: {
		type: "voice",
		scope: "private"
	},
	60004: {
		type: "video",
		scope: "private"
	},
	60005: {
		type: "file",
		scope: "private"
	},
	80001: {
		type: "text",
		scope: "group"
	},
	80002: {
		type: "image",
		scope: "group"
	},
	80003: {
		type: "voice",
		scope: "group"
	},
	80004: {
		type: "video",
		scope: "group"
	},
	80005: {
		type: "file",
		scope: "group"
	}
};
const DEFAULT_MAX_REQUEST_BODY_BYTES = 1024 * 1024;
async function startCallbackServer(options) {
	const { port, accounts, onMessage, signal, maxBodyBytes = DEFAULT_MAX_REQUEST_BODY_BYTES } = options;
	const server = createServer((req, res) => {
		const account = resolveWebhookAccount(req.url, accounts);
		if (req.method !== "POST" || !account) {
			res.writeHead(404);
			res.end("Not Found");
			return;
		}
		const incomingKey = readHeaderValue(req.headers["x-api-key"]);
		if (!incomingKey || !safeCompare(incomingKey, account.apiKey)) {
			res.writeHead(401);
			res.end("Unauthorized");
			return;
		}
		let body = "";
		let bodyBytes = 0;
		req.on("data", (chunk) => {
			bodyBytes += chunk.length;
			if (bodyBytes > maxBodyBytes) {
				res.writeHead(413);
				res.end("Payload Too Large");
				req.destroy();
				return;
			}
			body += chunk.toString();
		});
		req.on("end", () => {
			if (res.writableEnded) return;
			try {
				const message = normalizePayload(JSON.parse(body));
				if (message) onMessage(account.accountId, message);
				res.writeHead(200);
				res.end("OK");
			} catch {
				res.writeHead(400);
				res.end("Bad Request");
			}
		});
		req.on("error", () => {
			if (res.writableEnded) return;
			res.writeHead(400);
			res.end("Bad Request");
		});
	});
	await new Promise((resolve, reject) => {
		const handleListening = () => {
			server.off("error", handleError);
			resolve();
		};
		const handleError = (error) => {
			server.off("listening", handleListening);
			reject(error);
		};
		server.once("listening", handleListening);
		server.once("error", handleError);
		server.listen(port);
	});
	const listeningPort = server.address()?.port ?? port;
	console.log(`[wechat] Webhook server listening on port ${listeningPort}`);
	server.on("error", (err) => {
		if (err.code === "EADDRINUSE") console.error(`[wechat] Port ${listeningPort} already in use — webhook server failed to start`);
		else console.error(`[wechat] Webhook server error:`, err);
	});
	if (signal) signal.addEventListener("abort", () => {
		closeServer(server);
	}, { once: true });
	return {
		close: () => closeServer(server),
		port: listeningPort
	};
}
function resolveWebhookAccount(rawUrl, accounts) {
	if (!rawUrl) return null;
	const pathname = new URL(rawUrl, "http://localhost").pathname;
	if (pathname === "/webhook/wechat" && accounts.length === 1) return accounts[0];
	const match = /^\/webhook\/wechat\/([^/]+)$/.exec(pathname);
	if (!match) return null;
	const accountId = decodeURIComponent(match[1]);
	return accounts.find((account) => account.accountId === accountId) ?? null;
}
function readHeaderValue(value) {
	if (Array.isArray(value)) return value[0];
	return value;
}
function safeCompare(a, b) {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) {
		timingSafeEqual(bufA, bufA);
		return false;
	}
	return timingSafeEqual(bufA, bufB);
}
function closeServer(server) {
	if (!server.listening) return Promise.resolve();
	return new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}
function normalizePayload(payload) {
	const data = payload.data ?? (payload.content ? payload : null);
	if (!data) {
		console.warn("[wechat] Unrecognized webhook payload format");
		return null;
	}
	const typeCode = Number(data.type ?? data.msgType ?? 0);
	const mapping = WECHAT_TYPE_MAP[typeCode];
	let msgType = "unknown";
	let scope = "private";
	if (mapping) {
		msgType = mapping.type;
		scope = mapping.scope;
	} else if (typeCode >= 60006 && typeCode <= 60010) {
		msgType = "file";
		scope = "private";
	} else if (typeCode >= 80006 && typeCode <= 80010) {
		msgType = "file";
		scope = "group";
	}
	if (msgType === "unknown") {
		console.warn(`[wechat] Unknown message type code: ${typeCode}`);
		return null;
	}
	const sender = String(data.sender ?? data.from ?? "");
	const recipient = String(data.recipient ?? data.to ?? "");
	const content = String(data.content ?? data.text ?? "");
	const timestamp = Number(data.timestamp ?? Date.now());
	const msgId = String(data.msgId ?? data.id ?? `${sender}-${timestamp}`);
	const isGroup = scope === "group" || sender.includes("@chatroom");
	const threadId = isGroup ? String(data.roomId ?? data.threadId ?? sender) : void 0;
	const groupSubject = isGroup ? String(data.roomName ?? data.groupName ?? threadId ?? "") : void 0;
	const imageUrl = new Set([
		"image",
		"voice",
		"video",
		"file"
	]).has(msgType) ? String(data.imageUrl ?? data.mediaUrl ?? data.url ?? data.fileUrl ?? "") : void 0;
	return {
		id: msgId,
		type: msgType,
		sender,
		recipient,
		content,
		timestamp,
		threadId,
		group: groupSubject ? { subject: groupSubject } : void 0,
		imageUrl: imageUrl || void 0,
		raw: payload
	};
}
//#endregion
export { startCallbackServer };

//# sourceMappingURL=callback-server.js.map