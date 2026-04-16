import { WechatConfig, WechatMessageContext } from "./types.js";

//#region src/channel.d.ts
interface ChannelOptions {
  config: WechatConfig;
  onMessage: (accountId: string, msg: WechatMessageContext) => void | Promise<void>;
}
declare class WechatChannel {
  private readonly config;
  private readonly onMessage;
  private readonly accounts;
  private readonly callbackServers;
  private readonly loginPromises;
  private healthTimer;
  private abortController;
  constructor(options: ChannelOptions);
  start(): Promise<void>;
  stop(): Promise<void>;
  sendText(accountId: string, to: string, text: string): Promise<void>;
  sendImage(accountId: string, to: string, imagePath: string, caption?: string): Promise<void>;
  private routeIncoming;
  private ensureLoggedIn;
  private doLogin;
  private healthCheck;
  private resolveAccounts;
}
//#endregion
export { WechatChannel };