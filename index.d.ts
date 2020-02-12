declare type PushSubscriptionEncoding = 'aes128gm' | 'aesgcm';
declare type PushSubscriptionHttpMethod = 'POST' | 'PATCH' | 'DELETE';

declare interface PushSubscriptionPayload {
  readonly user_agent: string;
  readonly utc_offset: number;
  readonly encoding: PushSubscriptionEncoding;
  readonly endpoint: string;
  readonly p256dh: string | null;
  readonly auth: string | null;
}

declare interface PushSubscriptionLogger {
  debug(...args: any[]): void;
  error(...args: any[]): void;
}

declare interface PushSubscriptionFlow {
  getPermission(): Promise<NotificationPermission>;
  /**
   * @throws Error
   *   When no appropriate permission given or subscription retrieval failed.
   */
  getSubscription(): Promise<PushSubscription | null>;
  /**
   * @param {string} applicationServerKey
   *
   * @throws Error
   */
  subscribe(applicationServerKey: string): Promise<PushSubscription>;
  /**
   * @throws Error
   */
  unsubscribe(): Promise<null>;
}

export const isSupported: boolean;

export function encodeKey(buffer: ArrayBuffer): string;

export function decodeKey(encodedString: string): Uint8Array;

export function getPushSubscriptionPayload(pushSubscription: PushSubscription): PushSubscriptionPayload;

export function getPushSubscriptionFlow(sync: (method: PushSubscriptionHttpMethod, subscription: PushSubscription) => void): PushSubscriptionFlow;
