import fs from 'fs';

import admin from '../config/admin.json';
import discountIds from '../config/discounts.json';
import { TOP_UP_COUNT, CODE_PREFIX } from './lib/const';
import {
  loadLedger,
  saveLedger,
  generateNewCodes,
  addAllCodes,
  validateConfig,
} from './lib/utils';

async function main() {
  validateConfig();

  const ledger = loadLedger();
  console.log(`Ledger currently has ${ledger.size} previously issued codes.`);

  console.log(`Generating ${TOP_UP_COUNT} new codes...`);
  const newCodes = generateNewCodes(TOP_UP_COUNT, CODE_PREFIX, ledger);

  const stores = Object.values(admin) as {
    domain: string;
    accessToken: string;
    collectionId: string;
  }[];

  for (const store of stores) {
    console.log(`Adding new codes to ${store.domain}...`);
    // get discountId from discount-config.json
    const discountid = discountIds[store.domain as keyof typeof discountIds];

    if (!discountid) {
      console.error(
        `No discount ID found for ${store.domain} in discount-config.json. Skipping.`,
      );
      continue;
    }

    await addAllCodes(store.domain, store.accessToken, discountid, newCodes);
  }

  // Update the ledger only after both stores have been attempted -- if you
  // want strict guarantees, verify importedCount matches on both before
  // committing these to the ledger as "safe to reuse as never-issued".
  newCodes.forEach((c) => ledger.add(c));
  saveLedger(ledger);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = `./output/klaviyo-topup-${timestamp}.csv`;
  fs.writeFileSync(csvPath, 'Coupon\n' + newCodes.join('\n'));

  console.log(
    `Done. ${newCodes.length} new codes added to ${stores.length} stores.`,
  );
  console.log(
    `Upload this file to Klaviyo's coupon feed (append, don't replace): ${csvPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
