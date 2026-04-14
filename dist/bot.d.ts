import { WechatMessageContext } from "./types.js";

//#region src/bot.d.ts
interface BotOptions {
  onMessage: (msg: WechatMessageContext) => void | Promise<void>;
  featuresGroups?: boolean;
  featuresImages?: boolean;
  /** Deduplication window in milliseconds. Defaults to 30 minutes. */
  dedupWindowMs?: number;
}
declare class Bot {
  private readonly seen;
  private readonly onMessage;
  private readonly featuresGroups;
  private readonly featuresImages;
  private readonly dedupWindowMs;
  private cleanupTimer;
  constructor(options: BotOptions);
  handleIncoming(message: WechatMessageContext): void;
  private isDuplicate;
  private cleanup;
  stop(): void;
}
//# sourceMappingURL=bot.d.ts.map
//#endregion
export { Bot };
//# sourceMappingURL=bot.d.ts.map