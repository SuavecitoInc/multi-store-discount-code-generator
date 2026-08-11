import fs from 'fs';

import {
  USE_SINGLE_STORE,
  STORE_A_DOMAIN,
  STORE_B_DOMAIN,
  STORE_A_ADMIN_TOKEN,
  STORE_B_ADMIN_TOKEN,
  TOP_UP_COUNT,
  CODE_PREFIX,
} from './lib/const';
import {
  loadLedger,
  saveLedger,
  generateNewCodes,
  addAllCodes,
  validateConfig,
} from './lib/utils';

const STORE_A_DISCOUNT_ID = process.env.STORE_A_DISCOUNT_ID!;
const STORE_B_DISCOUNT_ID = process.env.STORE_B_DISCOUNT_ID!;

async function main() {
  validateConfig();

  const ledger = loadLedger();
  console.log(`Ledger currently has ${ledger.size} previously issued codes.`);

  console.log(`Generating ${TOP_UP_COUNT} new codes...`);
  const newCodes = generateNewCodes(TOP_UP_COUNT, CODE_PREFIX, ledger);

  console.log('Adding new codes to Store A...');
  await addAllCodes(
    STORE_A_DOMAIN,
    STORE_A_ADMIN_TOKEN,
    STORE_A_DISCOUNT_ID,
    newCodes,
  );

  if (!USE_SINGLE_STORE) {
    console.log('Adding new codes to Store B...');
    await addAllCodes(
      STORE_B_DOMAIN,
      STORE_B_ADMIN_TOKEN,
      STORE_B_DISCOUNT_ID,
      newCodes,
    );
  }

  // Update the ledger only after both stores have been attempted -- if you
  // want strict guarantees, verify importedCount matches on both before
  // committing these to the ledger as "safe to reuse as never-issued".
  newCodes.forEach((c) => ledger.add(c));
  saveLedger(ledger);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = `./output/klaviyo-topup-${timestamp}.csv`;
  fs.writeFileSync(csvPath, 'code\n' + newCodes.join('\n'));

  console.log(
    `Done. ${newCodes.length} new codes added ${
      USE_SINGLE_STORE ? 'to Store A' : 'to both stores'
    }.`,
  );
  console.log(
    `Upload this file to Klaviyo's coupon feed (append, don't replace): ${csvPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
