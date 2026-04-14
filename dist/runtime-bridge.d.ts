import { WechatMessageContext } from "./types.js";

//#region src/runtime-bridge.d.ts
interface IncomingWechatDeliveryOptions {
  runtime: unknown;
  accountId: string;
  message: WechatMessageContext;
  sendText: (accountId: string, to: string, text: string) => Promise<void>;
}
declare function deliverIncomingWechatMessage(options: IncomingWechatDeliveryOptions): Promise<void>;
//# sourceMappingURL=runtime-bridge.d.ts.map

//#endregion
export { deliverIncomingWechatMessage };
//# sourceMappingURL=runtime-bridge.d.ts.map