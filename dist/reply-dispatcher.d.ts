import { ProxyClient } from "./proxy-client.js";

//#region src/reply-dispatcher.d.ts
interface ReplyDispatcherOptions {
  client: ProxyClient;
  chunkSize?: number;
}
declare class ReplyDispatcher {
  private readonly client;
  private readonly chunkSize;
  constructor(options: ReplyDispatcherOptions);
  sendText(to: string, text: string): Promise<void>;
  sendImage(to: string, imagePath: string, caption?: string): Promise<void>;
  private chunk;
}
//# sourceMappingURL=reply-dispatcher.d.ts.map
//#endregion
export { ReplyDispatcher };
//# sourceMappingURL=reply-dispatcher.d.ts.map