import { stringToUuid } from "@elizaos/core";

//#region src/runtime-bridge.ts
async function deliverIncomingWechatMessage(options) {
	const runtime = options.runtime;
	const agentId = typeof runtime.agentId === "string" && runtime.agentId.length > 0 ? runtime.agentId : stringToUuid("wechat-agent");
	const incomingMemory = buildIncomingMemory(agentId, options.accountId, options.message);
	const replyTarget = resolveReplyTarget(options.message);
	let replyIndex = 0;
	let replyDelivered = false;
	const onResponse = async (content) => {
		const replyText = extractReplyText(content);
		if (!replyText) return [];
		replyDelivered = true;
		await options.sendText(options.accountId, replyTarget, replyText);
		const replyMemory = buildReplyMemory(agentId, options.accountId, options.message, replyText, replyIndex);
		replyIndex += 1;
		await runtime.createMemory?.(replyMemory, "messages");
		return [replyMemory];
	};
	await runtime.ensureConnection?.({
		userName: options.message.sender,
		source: "wechat",
		channelId: resolveChannelId(options.message),
		worldName: "WeChat"
	});
	if (typeof runtime.elizaOS?.sendMessage === "function") {
		await maybeHandleResponseContent(await runtime.elizaOS.sendMessage(options.runtime, incomingMemory, { onResponse }), replyDelivered, onResponse);
		return;
	}
	if (typeof runtime.messageService?.handleMessage === "function") {
		await maybeHandleResponseContent(await runtime.messageService.handleMessage(options.runtime, incomingMemory, onResponse), replyDelivered, onResponse);
		return;
	}
	if (typeof runtime.emitEvent === "function") {
		await runtime.emitEvent(["MESSAGE_RECEIVED"], {
			runtime: options.runtime,
			message: incomingMemory,
			callback: onResponse,
			source: "wechat"
		});
		return;
	}
	runtime.logger?.warn?.("[wechat] No inbound runtime message pipeline is available");
}
function buildIncomingMemory(agentId, accountId, message) {
	return {
		id: stringToUuid(`wechat:incoming:${accountId}:${message.id}`),
		agentId,
		entityId: stringToUuid(`wechat:entity:${accountId}:${message.sender}`),
		roomId: stringToUuid(`wechat:room:${accountId}:${resolveChannelId(message)}`),
		createdAt: message.timestamp,
		content: {
			text: message.content,
			source: "wechat",
			channelType: getChannelType(message),
			metadata: {
				accountId,
				sender: message.sender,
				recipient: message.recipient,
				messageType: message.type,
				threadId: message.threadId,
				groupSubject: message.group?.subject,
				imageUrl: message.imageUrl
			}
		}
	};
}
function buildReplyMemory(agentId, accountId, message, text, replyIndex) {
	return {
		id: stringToUuid(`wechat:reply:${accountId}:${message.id}:${replyIndex}`),
		agentId,
		entityId: agentId,
		roomId: stringToUuid(`wechat:room:${accountId}:${resolveChannelId(message)}`),
		createdAt: Date.now(),
		content: {
			text,
			source: "wechat",
			channelType: getChannelType(message),
			inReplyTo: message.id,
			metadata: {
				accountId,
				recipient: resolveReplyTarget(message)
			}
		}
	};
}
function getChannelType(message) {
	return message.group ? "GROUP" : "DM";
}
function resolveChannelId(message) {
	return message.threadId ?? message.sender;
}
function resolveReplyTarget(message) {
	return message.threadId ?? message.sender;
}
function extractReplyText(content) {
	if (typeof content.text !== "string") return null;
	const trimmed = content.text.trim();
	return trimmed.length > 0 ? trimmed : null;
}
async function maybeHandleResponseContent(result, replyDelivered, onResponse) {
	if (replyDelivered || !result?.responseContent) return;
	await onResponse(result.responseContent);
}

//#endregion
export { deliverIncomingWechatMessage };