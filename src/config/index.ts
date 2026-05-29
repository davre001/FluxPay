export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',
  databaseUrl: process.env.DATABASE_URL || '',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
};

export function isProduction() {
  return config.nodeEnv === 'production';
}

