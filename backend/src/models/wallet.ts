import { nowIso } from '../utils/helpers.ts';
import { randomUUID } from 'node:crypto';

export class InMemoryWalletRepository {
  balances: Map<string, number>;
  transactions: Map<string, any[]>;

  constructor() {
    this.balances = new Map();
    this.transactions = new Map();
  }

  private ensureUser(userId: string) {
    if (!this.balances.has(userId)) this.balances.set(userId, 0);
    if (!this.transactions.has(userId)) this.transactions.set(userId, []);
  }

  async getBalance(userId: string) {
    this.ensureUser(userId);
    return {
      balance: this.balances.get(userId)!,
      chain_name: 'sepolia',
      chain_id: 11155111,
    };
  }

  async deposit(userId: string, amount: number, tx_hash: string | null) {
    this.ensureUser(userId);
    this.balances.set(userId, (this.balances.get(userId) ?? 0) + amount);
    const tx = {
      id: `tx_${randomUUID().replaceAll('-', '')}`,
      user_id: userId,
      type: 'deposit',
      amount,
      tx_hash: tx_hash || null,
      created_at: nowIso(),
    };
    this.transactions.get(userId)!.unshift(tx);
    return tx;
  }

  async withdraw(userId: string, amount: number, to_address: string) {
    this.ensureUser(userId);
    const current = this.balances.get(userId) ?? 0;
    if (amount > current) throw new Error('Insufficient balance');
    this.balances.set(userId, current - amount);
    const tx = {
      id: `tx_${randomUUID().replaceAll('-', '')}`,
      user_id: userId,
      type: 'withdrawal',
      amount,
      to_address,
      tx_hash: null,
      created_at: nowIso(),
    };
    this.transactions.get(userId)!.unshift(tx);
    return tx;
  }

  async getTransactions(userId: string, page = 1, page_size = 20) {
    this.ensureUser(userId);
    const all = this.transactions.get(userId) ?? [];
    const start = (page - 1) * page_size;
    return all.slice(start, start + page_size);
  }

  async clear() {
    this.balances.clear();
    this.transactions.clear();
  }
}
