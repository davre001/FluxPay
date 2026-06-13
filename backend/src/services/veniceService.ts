import { config } from '../config/index.ts';

// Thin client for AI chat/completions (OpenAI-compatible). Venice is the
// primary provider; Gemini is a testing-only fallback when VENICE_API_KEY is
// unset. Both expose the same OpenAI-compatible /chat/completions endpoint.
// Never used directly by routes — the VerificationService builds the prompts
// and parses the verdicts.
export class VeniceService {
  private enabled: boolean;
  private _provider: 'venice' | 'gemini' | null;
  private _baseUrl: string;
  private _apiKey: string;
  private _model: string;

  constructor() {
    if (config.venice.apiKey) {
      // Primary: Venice
      this.enabled = true;
      this._provider = 'venice';
      this._baseUrl = config.venice.baseUrl;
      this._apiKey = config.venice.apiKey;
      this._model = config.venice.model;
    } else if (config.gemini.apiKey) {
      // Testing fallback: Gemini (OpenAI-compatible endpoint)
      this.enabled = true;
      this._provider = 'gemini';
      this._baseUrl = config.gemini.baseUrl;
      this._apiKey = config.gemini.apiKey;
      this._model = config.gemini.model;
      console.log(`[ai] Using Gemini (${this._model}) as testing fallback — set VENICE_API_KEY for production.`);
    } else {
      this.enabled = false;
      this._provider = null;
      this._baseUrl = '';
      this._apiKey = '';
      this._model = '';
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /** Which AI backend is active: 'venice', 'gemini', or null if disabled. */
  get provider(): string | null {
    return this._provider;
  }

  /** The model string including provider prefix, e.g. 'venice/claude-opus-4-7'. */
  get providerModel(): string {
    return this._provider ? `${this._provider}/${this._model}` : 'none';
  }

  // Sends chat messages and returns the assistant's text content.
  // `json: true` asks the model to return a strict JSON object.
  async chat(messages: any[], { json = true }: { json?: boolean } = {}): Promise<string> {
    if (!this.enabled) throw new Error('ai_not_configured');

    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this._model,
        messages,
        temperature: 0.2,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${this._provider}_http_${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}
