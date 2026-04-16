import { WechatConfig, WechatMessageContext } from "./types.js";
import { Bot } from "./bot.js";
import { WechatChannel } from "./channel.js";
import { ProxyClient } from "./proxy-client.js";
import { ReplyDispatcher } from "./reply-dispatcher.js";
import { deliverIncomingWechatMessage } from "./runtime-bridge.js";

//#region src/index.d.ts
declare const WECHAT_PLUGIN_PACKAGE: "@miladyai/plugin-wechat";
declare function isWechatConnectorConfigured(config: WechatConfig | Record<string, unknown> | null | undefined): boolean;
interface Plugin {
  name: string;
  description: string;
  init?: (config: Record<string, unknown>, runtime: unknown) => Promise<void | (() => Promise<void>)>;
}
declare const wechatPlugin: Plugin;
//#endregion
export { Bot, Plugin, ProxyClient, ReplyDispatcher, WECHAT_PLUGIN_PACKAGE, WechatChannel, type WechatConfig, type WechatMessageContext, wechatPlugin as default, wechatPlugin, deliverIncomingWechatMessage, isWechatConnectorConfigured };