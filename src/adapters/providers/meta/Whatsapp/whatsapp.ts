import { IAdapter, RateLimitStatus } from '../../../IAdapter';
import { getConfig } from '../../../../config/secrets';
import { WAHAClient, WAHAConfig } from '@1ai/waha-client';

export interface WhatsAppAdapterOptions {
  baseUrl?: string;
  apiKey?: string;
  session?: string;
  /** Hub-routed mode: route WAHA calls through 1ai-hub */
  hubUrl?: string;
  hubApiKey?: string;
  /** 'direct' (default) hits WAHA directly; 'hub' routes through 1ai-hub */
  mode?: 'direct' | 'hub';
  logger?: (msg: string) => void;
}

type SendResult = { success: boolean; error?: string; code?: string };

/** Wraps @1ai/waha-client to implement IAdapter. Supports direct and hub-routed modes. */
export class WhatsAppAdapter implements IAdapter {
  private client: WAHAClient;
  private logger?: (msg: string) => void;

  constructor(opts?: WhatsAppAdapterOptions) {
    const config = getConfig();
    const wahaConfig: WAHAConfig = {
      baseUrl: (opts?.baseUrl || config.WAHA_BASE_URL || '').replace(/\/$/, ''),
      apiKey: opts?.apiKey || config.WAHA_API_KEY || '',
      defaultSession: opts?.session || config.WAHA_SESSION || 'default',
      mode: opts?.mode || 'direct',
      hubUrl: opts?.hubUrl,
      hubApiKey: opts?.hubApiKey,
    };
    this.client = new WAHAClient(wahaConfig);
    this.logger = opts?.logger;
  }

  private log(msg: string) {
    this.logger?.(`[WhatsAppAdapter] ${msg}`);
  }

  async connect(): Promise<void> {
    this.log('Starting/ensuring WAHA session...');
    await this.client.startSession();
    this.log('WAHA session ready.');
  }

  async sendMessage(to: string, message: string): Promise<SendResult> {
    try {
      const result = await this.client.sendText(to, message);
      if (result.success) {
        this.log('Message sent successfully.');
        return { success: true };
      }
      return { success: false, error: result.error, code: result.code };
    } catch (e: any) {
      const msg = e?.message || String(e);
      this.log(`Failed to send message: ${msg}`);
      return { success: false, error: msg, code: e?.status?.toString() };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.stopSession();
      this.log('Session stopped successfully.');
    } catch (e: any) {
      this.log(`Failed to stop session: ${e?.message || e}`);
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    const status = this.client.getRateLimitStatus();
    return {
      limit: status.limit,
      remaining: status.remaining,
      reset: status.reset,
    };
  }

  async checkSession(): Promise<{ status: string; name: string } | null> {
    try {
      const session = await this.client.getSession();
      if (!session) return null;
      return { status: session.status, name: session.name };
    } catch {
      return null;
    }
  }

  async getChats(limit?: number): Promise<any[]> {
    const chats = await this.client.getChats(undefined, limit || 50);
    return chats as any[];
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<SendResult> {
    try {
      const result = await this.client.sendImage(to, imageUrl, caption);
      if (result.success) {
        this.log('Image sent successfully.');
        return { success: true };
      }
      return { success: false, error: result.error, code: result.code };
    } catch (e: any) {
      const msg = e?.message || String(e);
      this.log(`Failed to send image: ${msg}`);
      return { success: false, error: msg, code: e?.status?.toString() };
    }
  }

  async onMessage(callback: (msg: any) => void): Promise<void> {
    this.log('Note: webhook registration requires a callback URL — configure externally via WAHA dashboard or set up a webhook endpoint.');
  }
}