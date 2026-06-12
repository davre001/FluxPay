import { config } from '../config/index.ts';

// Thin client for Venice AI's OpenAI-compatible chat/completions API. Stays a
// safe no-op until VENICE_API_KEY is set. Never used directly by routes — the
// VerificationService builds the prompts and parses the verdicts.
export class VeniceService {
  private enabled: boolean;

  constructor() {
    this.enabled = Boolean(config.venice.apiKey);
  }

  isEnabled() {
    return this.enabled;
  }

  // Sends chat messages to Venice and returns the assistant's text content.
  // `json: true` asks the model to return a strict JSON object.
  async chat(messages: any[], { json = true }: { json?: boolean } = {}): Promise<string> {
    if (!this.enabled) throw new Error('venice_not_configured');

    const res = await fetch(`${config.venice.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.venice.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.venice.model,
        messages,
        temperature: 0.2,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`venice_http_${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}
