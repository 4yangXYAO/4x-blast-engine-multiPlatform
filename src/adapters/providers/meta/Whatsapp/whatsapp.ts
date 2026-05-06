import { IAdapter, RateLimitStatus } from '../../../IAdapter';
import { getConfig } from '../../../../config/secrets';

export interface WhatsAppAdapterOptions {
  baseUrl?: string;
  apiKey?: string;
  session?: string;
  logger?: (msg: string) => void;
}

type SendResult = { success: boolean; error?: string; code?: string };

export class WhatsAppAdapter implements IAdapter {
  private baseUrl: string;
  private apiKey: string;
  private session: string;
  private logger?: (msg: string) => void;
  private rateRemaining: number;
  private rateLimit: number;
  private rateReset: number;

  constructor(opts?: WhatsAppAdapterOptions) {
    const config = getConfig();
    this.baseUrl = ((opts?.baseUrl || config.WAHA_BASE_URL || '').replace(/\/$/, ''));
    this.apiKey = opts?.apiKey ?? (config.WAHA_API_KEY ?? '');
    this.session = opts?.session ?? (config.WAHA_SESSION ?? 'default');
    this.logger = opts?.logger;

    this.rateLimit = 100;
    this.rateRemaining = this.rateLimit;
    this.rateReset = Date.now() + 60_000;
  }

  private log(msg: string) {
    this.logger?.(`[WhatsAppAdapter] ${msg}`);
  }

  async connect(): Promise<void> {
    const url = `${this.baseUrl}/api/sessions/${this.session}`;
    const headers = { 'X-WAHA-API-KEY': this.apiKey };

    let sessionActive = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = (await res.json()) as { status?: string };
        if (data.status === 'WORKING') {
          sessionActive = true;
          this.log('Connected to WAHA session.');
          break;
        }
      }
      this.log('Waiting for session to become active...');
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!sessionActive) {
      this.log('Starting a new WAHA session...');
      const startRes = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: this.session, startNew: true })
      });
      if (!startRes.ok) {
        throw new Error(`Failed to start session: ${startRes.statusText}`);
      }
      this.log('Session started.');
    }
  }

  async sendMessage(to: string, message: string): Promise<SendResult> {
    const url = `${this.baseUrl}/api/sendText`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WAHA-API-KEY': this.apiKey
      },
      body: JSON.stringify({ session: this.session, chatId: to, text: message })
    });

    if (!res.ok) {
      const error = await res.text();
      this.log(`Failed to send message: ${error}`);
      return { success: false, error, code: res.status.toString() };
    }

    this.log('Message sent successfully.');
    return { success: true };
  }

  async disconnect(): Promise<void> {
    const url = `${this.baseUrl}/api/sessions/${this.session}/logout`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-WAHA-API-KEY': this.apiKey }
    });
    if (res.ok) {
      this.log('Session logged out successfully.');
    } else {
      this.log(`Failed to disconnect session: ${res.statusText}`);
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    const now = Date.now()
    if (now > this.rateReset) {
      this.rateRemaining = this.rateLimit
      this.rateReset = now + 60_000
    }
    return {
      limit: this.rateLimit,
      remaining: this.rateRemaining,
      reset: this.rateReset,
    }
  }

  async checkSession(): Promise<{ status: string; name: string } | null> {
    const url = `${this.baseUrl}/api/sessions/${this.session}`;
    const res = await fetch(url, {
      headers: { 'X-WAHA-API-KEY': this.apiKey }
    });
    if (res.ok) {
      const data = await res.json() as { status: string; name: string };
      return data;
    }
    return null;
  }

  async getChats(limit?: number): Promise<any[]> {
    const url = `${this.baseUrl}/api/chats?session=${this.session}&limit=${limit || 50}`;
    const res = await fetch(url, {
      headers: { 'X-WAHA-API-KEY': this.apiKey }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch chats: ${res.statusText}`);
    }
    const data = await res.json() as any[];
    return data;
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<SendResult> {
    const url = `${this.baseUrl}/api/sendImage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WAHA-API-KEY': this.apiKey
      },
      body: JSON.stringify({ session: this.session, chatId: to, file: { url: imageUrl }, caption })
    });

    if (!res.ok) {
      const error = await res.text();
      this.log(`Failed to send image: ${error}`);
      return { success: false, error, code: res.status.toString() };
    }

    this.log('Image sent successfully.');
    return { success: true };
  }

  async onMessage(callback: (msg: any) => void): Promise<void> {
    const callbackUrl = 'YOUR_WEBHOOK_URL';
    const url = `${this.baseUrl}/api/sessions/${this.session}/webhook`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WAHA-API-KEY': this.apiKey
      },
      body: JSON.stringify({ url: callbackUrl })
    });

    if (res.ok) {
      this.log('Webhook registered successfully.');
    } else {
      this.log(`Failed to register webhook: ${res.statusText}`);
    }
  }
}