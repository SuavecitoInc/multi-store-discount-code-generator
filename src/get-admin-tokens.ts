import dotenv from 'dotenv';
import fetch from 'node-fetch';

import { readEnv } from './lib/utils';

dotenv.config();

interface StoreCredentials {
  label: string;
  domain: string;
  clientId: string;
  clientSecret: string;
}

async function getAccessToken(store: StoreCredentials): Promise<string> {
  const res = await fetch(`https://${store.domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: store.clientId,
      client_secret: store.clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  const data = (await res.json()) as any;

  if (!res.ok) {
    throw new Error(
      `Token exchange failed for ${store.domain} (${
        res.status
      }): ${JSON.stringify(data)}\n` +
        `Common causes: app not installed on this store yet, or wrong client_id/client_secret.`,
    );
  }

  if (!data.access_token) {
    throw new Error(
      `No access_token in response for ${store.domain}: ${JSON.stringify(
        data,
      )}`,
    );
  }

  return data.access_token as string;
}

async function main() {
  const stores: StoreCredentials[] = [
    {
      label: 'STORE_A',
      domain: readEnv('STORE_A_DOMAIN'),
      clientId: readEnv('CLIENT_ID'),
      clientSecret: readEnv('CLIENT_SECRET'),
    },
    {
      label: 'STORE_B',
      domain: readEnv('STORE_B_DOMAIN'),
      clientId: readEnv('CLIENT_ID'),
      clientSecret: readEnv('CLIENT_SECRET'),
    },
  ];

  const results: Record<string, { domain: string; accessToken: string }> = {};

  for (const store of stores) {
    console.log(`Requesting token for ${store.label} (${store.domain})...`);
    const token = await getAccessToken(store);
    results[store.label] = { domain: store.domain, accessToken: token };
    console.log(`${store.label}: ${token}`);
  }

  const fs = await import('fs');
  fs.writeFileSync('./config/admin.json', JSON.stringify(results, null, 2));

  console.log(
    "\nSaved to ./config/admin.json -- add this file to .gitignore now if you haven't.",
  );
  console.log(
    'Copy these into your STORE_A_ADMIN_TOKEN / STORE_B_ADMIN_TOKEN env vars, then delete the file.',
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
