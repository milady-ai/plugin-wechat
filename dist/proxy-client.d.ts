import { AccountStatus, ResolvedWechatAccount } from "./types.js";

//#region src/proxy-client.d.ts
declare class ProxyClient {
  private readonly apiKey;
  private readonly baseUrl;
  private readonly accountId;
  private readonly deviceType;
  constructor(account: ResolvedWechatAccount);
  private request;
  getStatus(): Promise<AccountStatus>;
  getQRCode(): Promise<string>;
  checkLogin(): Promise<{
    status: "waiting" | "need_verify" | "logged_in";
    verifyUrl?: string;
    wcId?: string;
    nickName?: string;
  }>;
  sendText(to: string, text: string): Promise<void>;
  sendImage(to: string, imagePath: string, text?: string): Promise<void>;
  getContacts(): Promise<{
    friends: Array<{
      wxid: string;
      name: string;
    }>;
    chatrooms: Array<{
      wxid: string;
      name: string;
    }>;
  }>;
  registerWebhook(url: string): Promise<void>;
  get needsLogin(): boolean;
}
//#endregion
export { ProxyClient };