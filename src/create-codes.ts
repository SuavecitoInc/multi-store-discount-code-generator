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

import {
  USE_SINGLE_STORE,
  STORE_A_DOMAIN,
  STORE_B_DOMAIN,
  STORE_A_ADMIN_TOKEN,
  STORE_B_ADMIN_TOKEN,
  TOTAL_CODES,
  CODE_PREFIX,
} from './lib/const';

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
): Promise<string> {
  const customerGets = config.percentageOff
    ? { value: { percentage: config.percentageOff }, items: { all: true } }
    : {
        value: {
          discountAmount: {
            amount: config.fixedAmountOff,
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
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
    title: `SUAVE15 - ${new Date().toISOString().split('T')[0]}`,
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

  console.log('Creating parent discount on Store A...');
  const discountIdA = await createParentDiscount(
    STORE_A_DOMAIN,
    STORE_A_ADMIN_TOKEN,
    config,
  );
  console.log(`Store A parent discount: ${discountIdA}`);

  let discountIdB: string | null = null;
  if (!USE_SINGLE_STORE) {
    console.log('Creating parent discount on Store B...');
    discountIdB = await createParentDiscount(
      STORE_B_DOMAIN,
      STORE_B_ADMIN_TOKEN,
      config,
    );
    console.log(`Store B parent discount: ${discountIdB}`);
  }

  // save ids to file
  fs.writeFileSync(
    './config/discount-config.json',
    JSON.stringify(
      {
        storeADiscountId: discountIdA,
        storeBDiscountId: USE_SINGLE_STORE ? null : discountIdB,
      },
      null,
      2,
    ),
  );

  console.log('Adding codes to Store A...');
  await addAllCodes(STORE_A_DOMAIN, STORE_A_ADMIN_TOKEN, discountIdA, codes);

  if (!USE_SINGLE_STORE) {
    console.log('Adding codes to Store B...');
    await addAllCodes(STORE_B_DOMAIN, STORE_B_ADMIN_TOKEN, discountIdB, codes);
  }

  codes.forEach((c) => ledger.add(c));
  saveLedger(ledger);

  console.log('Writing CSV for Klaviyo upload...');
  const csv = 'code\n' + codes.join('\n');
  fs.writeFileSync('./output/klaviyo-coupon-feed.csv', csv);

  console.log(
    `Done. ${codes.length} codes live ${
      USE_SINGLE_STORE ? 'on Store A' : 'on both stores'
    }. CSV: ./output/klaviyo-coupon-feed.csv`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
