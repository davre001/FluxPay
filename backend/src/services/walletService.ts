import { InMemoryWalletRepository } from '../models/wallet.ts';
import { ValidationError } from '../utils/errors.ts';
import { parseWalletDepositInput, parseWalletWithdrawInput } from '../utils/validators.ts';

export class WalletService {
  private wallet: InMemoryWalletRepository;

  constructor(wallet = new InMemoryWalletRepository()) {
    this.wallet = wallet;
  }

  async getBalance(userId: string) {
    return this.wallet.getBalance(userId);
  }

  async deposit(userId: string, data: any) {
    const input = parseWalletDepositInput(data);
    return this.wallet.deposit(userId, input.amount, input.tx_hash);
  }

  async withdraw(userId: string, data: any) {
    const input = parseWalletWithdrawInput(data);
    try {
      return await this.wallet.withdraw(userId, input.amount, input.to_address);
    } catch (e: any) {
      if (e.message === 'Insufficient balance') throw new ValidationError('Insufficient balance');
      throw e;
    }
  }

  async getTransactions(userId: string, params: any = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const page_size = Math.min(100, Math.max(1, Number(params.page_size) || 20));
    return this.wallet.getTransactions(userId, page, page_size);
  }
}
