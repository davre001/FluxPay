import './config/loadEnv.ts'; // MUST be first — populates process.env before config is read
import { pathToFileURL } from 'node:url';
import { createApp } from './app.ts';
import { config } from './config/index.ts';
import { connectDatabase } from './database/connection.ts';
import { seedInitialData } from './utils/seedData.ts';

export async function startApp(port = config.port) {
  await connectDatabase();
  const app = createApp();
  
  await seedInitialData((app as any).locals);

  return new Promise((resolve) => {
    app.listen(port, () => {
      const address = app.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`FluxPay backend listening on http://localhost:${actualPort}`);
      resolve(app);
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Trigger restart for new seeded jobs
  startApp();
}

