import { config } from '../config/index.ts';

type Provider = { name: 'venice' | 'gemini'; baseUrl: string; apiKey: string; model: string };

// Thin client for AI chat/completions (OpenAI-compatible). Venice is the
// primary provider; Gemini is a fallback. Both expose the same OpenAI-compatible
// /chat/completions endpoint. Never used directly by routes — the
// VerificationService builds the prompts and parses the verdicts.
//
// Fallback is RUNTIME, not config-time: when both keys are set Venice is tried
// first, and if a Venice call FAILS (e.g. the API is up in config but erroring),
// the same request is retried against Gemini so verification still returns a
// verdict. The provider that actually answered is reported via `providerModel`.
export class VeniceService {
  private providers: Provider[];
  private _lastUsed: Provider | null = null;

  constructor() {
    const providers: Provider[] = [];
    if (config.venice.apiKey) {
      providers.push({
        name: 'venice',
        baseUrl: config.venice.baseUrl,
        apiKey: config.venice.apiKey,
        model: config.venice.model,
      });
    }
    if (config.gemini.apiKey) {
      providers.push({
        name: 'gemini',
        baseUrl: config.gemini.baseUrl,
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
      });
    }
    this.providers = providers;

    const names = providers.map((p) => p.name).join(' → ');
    if (providers.length) {
      console.log(`[ai] Providers (priority order): ${names}.`);
    }
  }

  isEnabled() {
    return this.providers.length > 0;
  }

  /** The primary (first-choice) AI backend: 'venice', 'gemini', or null. */
  get provider(): string | null {
    return this.providers[0]?.name ?? null;
  }

  /**
   * Model string of the provider that last answered (so recorded metadata is
   * accurate after a runtime fallback), e.g. 'gemini/gemini-2.5-flash'. Falls
   * back to the primary provider before any call has run.
   */
  get providerModel(): string {
    const p = this._lastUsed ?? this.providers[0];
    return p ? `${p.name}/${p.model}` : 'none';
  }

  // Sends chat messages and returns the assistant's text content. Tries each
  // configured provider in priority order; on failure falls through to the next.
  // `json: true` asks the model to return a strict JSON object.
  async chat(messages: any[], { json = true }: { json?: boolean } = {}): Promise<string> {
    if (!this.providers.length) throw new Error('ai_not_configured');

    const errors: string[] = [];
    for (const p of this.providers) {
      try {
        const content = await this.callProvider(p, messages, json);
        this._lastUsed = p;
        if (p !== this.providers[0]) {
          console.log(`[ai] ${this.providers[0].name} failed; answered via fallback ${p.name}.`);
        }
        return content;
      } catch (error) {
        errors.push(`${p.name}: ${(error as Error).message}`);
      }
    }
    throw new Error(`ai_all_providers_failed (${errors.join(' | ')})`);
  }

  private async callProvider(p: Provider, messages: any[], json: boolean): Promise<string> {
    const res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${p.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: p.model,
        messages,
        temperature: 0.2,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${p.name}_http_${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}
