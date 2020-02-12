declare type PushSubscriptionEncoding = 'aes128gm' | 'aesgcm';

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
