import dotenv from 'dotenv';
import fetch from 'node-fetch';

import { readEnv, loadStores } from './lib/utils';

dotenv.config();

interface StoreCredentials {
  label: string;
  domain: string;
  collectionId: string;
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
  const clientId = readEnv('CLIENT_ID');
  const clientSecret = readEnv('CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing CLIENT_ID or CLIENT_SECRET in environment variables.',
    );
  }

  const stores: StoreCredentials[] = loadStores().stores.map((store) => ({
    label: store.handle,
    domain: `${store.handle}.myshopify.com`,
    collectionId: store.collectionId,
    clientId,
    clientSecret,
  }));

  const results: Record<
    string,
    { domain: string; accessToken: string; collectionId: string }
  > = {};

  for (const store of stores) {
    console.log(`Requesting token for ${store.label} (${store.domain})...`);
    const token = await getAccessToken(store);
    results[store.label] = {
      domain: store.domain,
      accessToken: token,
      collectionId: store.collectionId,
    };
    console.log(`${store.label}: ${token}`);
  }

  const fs = await import('fs');
  fs.writeFileSync('./config/admin.json', JSON.stringify(results, null, 2));

  console.log(
    '\nSaved to ./config/admin.json -- this config will be used to create discounts.',
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
