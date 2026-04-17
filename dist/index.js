import { Bot } from "./bot.js";
import { ProxyClient } from "./proxy-client.js";
import { ReplyDispatcher } from "./reply-dispatcher.js";
import { WechatChannel } from "./channel.js";
import { deliverIncomingWechatMessage } from "./runtime-bridge.js";
//#region src/index.ts
const WECHAT_PLUGIN_PACKAGE = "@elizaos/plugin-wechat";
function isWechatConnectorConfigured(config) {
	if (!config || config.enabled === false) return false;
	if (config.apiKey) return true;
	const accounts = config.accounts;
	if (accounts && typeof accounts === "object") return Object.values(accounts).some((account) => {
		if (account.enabled === false) return false;
		return Boolean(account.apiKey);
	});
	return false;
}
let channel = null;
const wechatPlugin = {
	name: "wechat",
	description: "WeChat messaging via proxy API",
	async init(config, runtime) {
		const wechatConfig = config?.connectors?.wechat;
		if (!wechatConfig) {
			console.warn("[wechat] No wechat config found in connectors — skipping");
			return;
		}
		if (wechatConfig.enabled === false) {
			console.log("[wechat] Plugin disabled via config");
			return;
		}
		channel = new WechatChannel({
			config: wechatConfig,
			onMessage: async (accountId, msg) => {
				await deliverIncomingWechatMessage({
					runtime,
					accountId,
					message: msg,
					sendText: async (replyAccountId, to, text) => {
						if (!channel) throw new Error("[wechat] Channel is not available for replies");
						await channel.sendText(replyAccountId, to, text);
					}
				});
			}
		});
		await channel.start();
		console.log("[wechat] Plugin initialized");
		return async () => {
			if (channel) {
				await channel.stop();
				channel = null;
				console.log("[wechat] Plugin stopped");
			}
		};
	}
};
//#endregion
export { Bot, ProxyClient, ReplyDispatcher, WECHAT_PLUGIN_PACKAGE, WechatChannel, wechatPlugin as default, wechatPlugin, deliverIncomingWechatMessage, isWechatConnectorConfigured };
