import { config } from '../config/index.ts';

// Client for the 1Shot permissionless relayer (JSON-RPC, no API key). Relays
// ERC-7710 redemptions and pays gas in a stablecoin (USDC). MAINNET ONLY —
// testnet chains return empty capabilities.
//
// Read methods (getCapabilities / getFeeData) need no funds and are safe to call
// anytime. The send path moves real value, so it's only exercised on a mainnet
// chain with a funded delegator.
export class RelayerService {
  private endpoint: string;

  constructor() {
    this.endpoint = config.oneshot.endpoint;
  }

  private async rpc(method: string, params: any): Promise<any> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`relayer_http_${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(`relayer_error: ${JSON.stringify(data.error).slice(0, 200)}`);
    return data.result;
  }

  // Supported chains, accepted tokens, feeCollector, targetAddress for a chain.
  async getCapabilities(chainId: number) {
    return this.rpc('relayer_getCapabilities', [String(chainId)]);
  }

  // Locks a fee quote (returns gasPrice, rate, minFee, expiry, context).
  async getFeeData(chainId: number, token: string) {
    return this.rpc('relayer_getFeeData', { chainId: String(chainId), token });
  }

  // Post-bundle fee estimate for an assembled 7710 transaction.
  async estimate7710Transaction(payload: any) {
    return this.rpc('relayer_estimate7710Transaction', payload);
  }

  // Submits a 7710 transaction for relaying; returns a TaskId to track.
  async send7710Transaction(payload: any) {
    return this.rpc('relayer_send7710Transaction', payload);
  }

  // Status: Confirmed | Rejected | Reverted (terminal) | Pending | Submitted.
  async getStatus(taskId: string) {
    return this.rpc('relayer_getStatus', [taskId]);
  }

  // Returns the chain's capability block, or null if the chain is unsupported
  // (e.g. a testnet → empty result). Lets callers detect mainnet-only support.
  async supportedChain(chainId: number) {
    const caps = await this.getCapabilities(chainId);
    return caps && caps[String(chainId)] ? caps[String(chainId)] : null;
  }

  // Picks the USDC token entry for a chain from live capabilities (never
  // hardcoded, per 1Shot guidance).
  async pickStableToken(chainId: number, symbol = 'USDC') {
    const chain = await this.supportedChain(chainId);
    if (!chain) return null;
    const tokens = chain.tokens || [];
    return tokens.find((t: any) => (t.symbol || '').toUpperCase() === symbol.toUpperCase()) || tokens[0] || null;
  }

  // High-level relay: builds and submits a 7710 redemption that executes
  // `executions` (e.g. a USDC transfer to the creator), paying gas in USDC.
  // Never throws — returns a structured result the caller can record.
  async relayRedemption(opts: {
    chainId?: number;
    permissionsContext: string;
    delegationManager: string;
    executions: { target: string; value?: string; callData: string }[];
    authorization?: any;
    memo?: string;
  }): Promise<{ relayed: boolean; reason?: string; taskId?: string; feeToken?: string; error?: string }> {
    const chainId = opts.chainId || config.oneshot.chainId;
    if (!opts.permissionsContext || !opts.delegationManager) {
      return { relayed: false, reason: 'missing_permission_context' };
    }
    try {
      const token = await this.pickStableToken(chainId);
      if (!token) {
        return { relayed: false, reason: 'chain_unsupported', error: `1Shot has no capabilities for chainId ${chainId} (mainnet only)` };
      }

      // Lock a fee quote, then submit the relay with that price context.
      const feeData = await this.getFeeData(chainId, token.address);

      const payload = {
        chainId: String(chainId),
        delegationContext: opts.permissionsContext,
        delegationManager: opts.delegationManager,
        executions: opts.executions,
        feeToken: token.address,
        context: feeData?.context,
        ...(opts.authorization ? { authorization: opts.authorization } : {}),
        ...(opts.memo ? { memo: opts.memo } : {}),
      };

      const result = await this.send7710Transaction(payload);
      const taskId = result?.taskId || result?.TaskId || result;
      console.log(`[relayer] ✓ submitted 7710 relay — task ${taskId} (fee in ${token.symbol})`);
      return { relayed: true, taskId, feeToken: token.address };
    } catch (error) {
      console.warn('[relayer] ✗ relay failed:', (error as Error).message);
      return { relayed: false, reason: 'relay_failed', error: (error as Error).message };
    }
  }
}
