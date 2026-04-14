//#region src/proxy-client.ts
const SUCCESS = 1e3;
const LOGIN_NEEDED = 1001;
const REQUEST_TIMEOUT_MS = 3e4;
var ProxyClient = class {
	apiKey;
	baseUrl;
	accountId;
	deviceType;
	constructor(account) {
		this.apiKey = account.apiKey;
		this.baseUrl = normalizeProxyUrl(account.proxyUrl);
		this.accountId = account.id;
		this.deviceType = account.deviceType ?? "ipad";
	}
	async request(path, body) {
		const url = `${this.baseUrl}${path}`;
		const headers = {
			"Content-Type": "application/json",
			"X-API-Key": this.apiKey,
			"X-Account-ID": this.accountId,
			"X-Device-Type": this.deviceType
		};
		let lastError;
		for (let attempt = 0; attempt < 3; attempt++) try {
			const res = await fetch(url, {
				method: "POST",
				headers,
				body: body ? JSON.stringify(body) : void 0,
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
			});
			if (res.status === 429) {
				const retryAfter = res.headers.get("Retry-After");
				const delay = retryAfter ? Number.parseInt(retryAfter, 10) * 1e3 : Math.min(1e3 * 2 ** attempt, 8e3);
				await res.text().catch(() => {});
				await sleep(delay);
				continue;
			}
			return await res.json();
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
			await sleep(Math.min(1e3 * 2 ** attempt, 8e3));
		}
		throw lastError ?? /* @__PURE__ */ new Error(`Request failed after 3 attempts: ${path}`);
	}
	async getStatus() {
		const res = await this.request("/api/status");
		if (res.code === LOGIN_NEEDED) return {
			valid: true,
			loginState: "waiting"
		};
		if (res.code !== SUCCESS && res.code !== 1002) throw new Error(`getStatus failed: ${res.message ?? res.code}`);
		return requireData(res, "getStatus");
	}
	async getQRCode() {
		const res = await this.request("/api/qrcode");
		if (res.code !== SUCCESS) throw new Error(`getQRCode failed: ${res.message ?? res.code}`);
		return requireData(res, "getQRCode").qrCodeUrl;
	}
	async checkLogin() {
		const res = await this.request("/api/check-login");
		if (res.code !== SUCCESS && res.code !== 1002) throw new Error(`checkLogin failed: ${res.message ?? res.code}`);
		return requireData(res, "checkLogin");
	}
	async sendText(to, text) {
		const res = await this.request("/api/send-text", {
			to,
			text
		});
		if (res.code === LOGIN_NEEDED) throw new LoginExpiredError();
		if (res.code !== SUCCESS && res.code !== 1002) throw new Error(`sendText failed: ${res.message ?? res.code}`);
	}
	async sendImage(to, imagePath, text) {
		const res = await this.request("/api/send-image", {
			to,
			imagePath,
			text
		});
		if (res.code === LOGIN_NEEDED) throw new LoginExpiredError();
		if (res.code !== SUCCESS && res.code !== 1002) throw new Error(`sendImage failed: ${res.message ?? res.code}`);
	}
	async getContacts() {
		const res = await this.request("/api/contacts");
		if (res.code !== SUCCESS) throw new Error(`getContacts failed: ${res.message ?? res.code}`);
		return requireData(res, "getContacts");
	}
	async registerWebhook(url) {
		const res = await this.request("/api/webhook/register", { webhookUrl: url });
		if (res.code !== SUCCESS && res.code !== 1002) throw new Error(`registerWebhook failed: ${res.message ?? res.code}`);
	}
	get needsLogin() {
		return false;
	}
};
var LoginExpiredError = class extends Error {
	constructor() {
		super("WeChat login expired — re-login required");
		this.name = "LoginExpiredError";
	}
};
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalizeProxyUrl(proxyUrl) {
	const parsed = new URL(proxyUrl);
	if (parsed.protocol !== "https:") throw new Error("[wechat] proxyUrl must use https://");
	if (parsed.username || parsed.password) throw new Error("[wechat] proxyUrl must not include credentials");
	parsed.hash = "";
	return parsed.toString().replace(/\/$/, "");
}
function requireData(response, action) {
	if (response.data === void 0) throw new Error(`${action} failed: missing response data`);
	return response.data;
}
//#endregion
export { LoginExpiredError, ProxyClient };

//# sourceMappingURL=proxy-client.js.map