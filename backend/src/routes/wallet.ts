import { WalletService } from '../services/walletService.ts';

export function createWalletRoutes(service = new WalletService()) {
  return {
    async getBalance(user: any) {
      return { statusCode: 200, body: await service.getBalance(user.id) };
    },

    async deposit(user: any, body: any) {
      return { statusCode: 200, body: await service.deposit(user.id, body) };
    },

    async withdraw(user: any, body: any) {
      return { statusCode: 200, body: await service.withdraw(user.id, body) };
    },

    async getTransactions(user: any, query: any) {
      return {
        statusCode: 200,
        body: await service.getTransactions(user.id, {
          page: query.get('page') || undefined,
          page_size: query.get('page_size') || undefined,
        }),
      };
    },
  };
}
