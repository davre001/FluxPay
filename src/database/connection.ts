import { config } from '../config/index.ts';

export async function connectDatabase() {
  if (!config.databaseUrl) {
    console.log('DATABASE_URL not set; using in-memory payment repository');
    return { connected: false, driver: 'memory' };
  }

  console.log('DATABASE_URL is configured, but no database driver is installed yet');
  return { connected: false, driver: 'pending' };
}

export async function disconnectDatabase() {
  return { connected: false };
}
