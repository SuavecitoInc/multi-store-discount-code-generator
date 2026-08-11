import fs from 'fs';

import {
  shopifyAdminGraphQL,
  generateUniqueCodes,
  loadLedger,
  saveLedger,
  validateConfig,
} from './lib/utils';
import { createParentDiscountMutation } from './lib/admin/mutations';
import { addAllCodes } from './lib/utils';
import admin from '../config/admin.json';
import { TOTAL_CODES, CODE_PREFIX } from './lib/const';

interface DiscountConfig {
  title: string;
  percentageOff?: number; // e.g. 0.15 for 15%
  fixedAmountOff?: number; // e.g. 10 for $10
  usageLimit: number; // per-code usage limit, e.g. 1
  appliesOncePerCustomer: boolean;
  startsAt: string;
  endsAt: string | null;
  combinesWith: {
    productDiscounts: boolean;
    orderDiscounts: boolean;
    shippingDiscounts: boolean;
  };
}

async function createParentDiscount(
  domain: string,
  token: string,
  config: DiscountConfig,
  collectionId?: string,
): Promise<string> {
  const items = collectionId
    ? { collections: { add: [collectionId] } }
    : { all: true };

  console.log(
    `Creating parent discount on ${domain} with items: ${JSON.stringify(
      items,
    )}`,
  );

  const customerGets = config.percentageOff
    ? { value: { percentage: config.percentageOff }, items: items }
    : {
        value: {
          discountAmount: {
            amount: config.fixedAmountOff,
            appliesOnEachItem: false,
          },
        },
        items: items,
      };

  const variables = {
    basicCodeDiscount: {
      title: config.title,
      // Placeholder code required by the mutation even though we add real
      // codes via bulk-add afterward -- pick something clearly non-customer-facing.
      code: `${config.title.replace(/\s+/g, '-').toUpperCase()}-PARENT`,
      startsAt: config.startsAt,
      endsAt: config.endsAt,
      usageLimit: config.usageLimit,
      appliesOncePerCustomer: config.appliesOncePerCustomer,
      customerSelection: { all: true },
      customerGets,
      combinesWith: config.combinesWith,
    },
  };

  const data = await shopifyAdminGraphQL(
    domain,
    token,
    createParentDiscountMutation,
    variables,
  );
  const errors = data.discountCodeBasicCreate.userErrors;
  if (errors?.length) {
    throw new Error(
      `Parent discount create failed on ${domain}: ${JSON.stringify(errors)}`,
    );
  }
  return data.discountCodeBasicCreate.codeDiscountNode.id; // gid://shopify/DiscountCodeNode/...
}

async function main() {
  validateConfig();

  const ledger = loadLedger();
  if (ledger.size > 0) {
    console.log(
      `Ledger already has ${ledger.size} codes -- these will be treated as reserved.`,
    );
  }

  console.log(`Generating ${TOTAL_CODES} unique codes...`);
  const codes = generateUniqueCodes(TOTAL_CODES, CODE_PREFIX);

  // create title in the follwoing format: "Campaign Name - YYYY-MM-DD"
  const config: DiscountConfig = {
    title: `SUAVE15-${new Date().toISOString().split('T')[0]}`,
    percentageOff: 0.15,
    usageLimit: 1,
    appliesOncePerCustomer: true,
    startsAt: new Date().toISOString(),
    endsAt: null,
    combinesWith: {
      productDiscounts: false,
      orderDiscounts: false,
      shippingDiscounts: true,
    },
  };

  const stores = Object.values(admin) as {
    domain: string;
    accessToken: string;
    collectionId: string;
  }[];

  const discountIds: {
    [domain: string]: string;
  } = {};
  for (const store of stores) {
    console.log(`Creating parent discount on ${store.domain}...`);
    const discountId = await createParentDiscount(
      store.domain,
      store.accessToken,
      config,
      store.collectionId,
    );
    console.log(`${store.domain} parent discount: ${discountId}`);
    discountIds[store.domain] = discountId;
    // add all codes
    console.log(`Adding codes to ${store.domain}...`);
    await addAllCodes(store.domain, store.accessToken, discountId, codes);
  }

  // save ids to file
  console.log('Writing discount ids to discount-config.json...');
  fs.writeFileSync(
    './config/discount-config.json',
    JSON.stringify(discountIds, null, 2),
  );

  codes.forEach((c) => ledger.add(c));
  saveLedger(ledger);

  console.log('Writing CSV for Klaviyo upload...');
  const csv = 'Coupon\n' + codes.join('\n');
  fs.writeFileSync('./output/klaviyo-coupon-feed.csv', csv);

  console.log(
    `Done. ${codes.length} codes live in ${stores.length} stores. CSV: ./output/klaviyo-coupon-feed.csv`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
