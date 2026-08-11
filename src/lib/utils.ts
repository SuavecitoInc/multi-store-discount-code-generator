import crypto from 'crypto';
import fs from 'fs';
import fetch from 'node-fetch';

import { bulkStatusQuery } from './admin/queries';
import { bulkAddDiscountMutation } from './admin/mutations';
import { API_VERSION, LEDGER_PATH, BATCH_SIZE } from './const';
import admin from '../../config/admin.json';
import type { AdminConfig } from './types/config';

export function validateConfig() {
  const requiredVars = ['domain', 'accessToken'];

  const adminConfig: AdminConfig = admin;

  // Check if all required variables are present in the config
  for (const varName of requiredVars) {
    if (
      !adminConfig.STORE_A[varName as keyof typeof adminConfig.STORE_A] &&
      !adminConfig.STORE_B[varName as keyof typeof adminConfig.STORE_B]
    ) {
      throw new Error(`Missing required config variable: ${varName}`);
    }
  }
}

export function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function generateCode(prefix: string): string {
  // e.g. TN-4F8B-91XZ
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${part()}-${part()}`;
}

export function generateUniqueCodes(count: number, prefix: string): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateCode(prefix));
  }
  return Array.from(codes);
}

export function generateNewCodes(
  count: number,
  prefix: string,
  existing: Set<string>,
): string[] {
  const fresh = new Set<string>();
  while (fresh.size < count) {
    const code = generateCode(prefix);
    if (!existing.has(code) && !fresh.has(code)) {
      fresh.add(code);
    }
  }
  return Array.from(fresh);
}

export async function shopifyAdminGraphQL(
  domain: string,
  token: string,
  query: string,
  variables: unknown,
) {
  const res = await fetch(
    `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = (await res.json()) as any;
  if (json.errors)
    throw new Error(
      `GraphQL error on ${domain}: ${JSON.stringify(json.errors)}`,
    );
  return json.data;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadLedger(): Set<string> {
  if (!fs.existsSync(LEDGER_PATH)) return new Set();
  const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
  return new Set(JSON.parse(raw));
}

export function saveLedger(ledger: Set<string>) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(Array.from(ledger), null, 2));
}

export async function waitForBulkCreation(
  domain: string,
  token: string,
  bulkCreationId: string,
) {
  let done = false;
  while (!done) {
    const data = await shopifyAdminGraphQL(domain, token, bulkStatusQuery, {
      id: bulkCreationId,
    });
    const status = data.discountRedeemCodeBulkCreation;
    if (status.done) {
      if (status.failedCount > 0) {
        console.warn(
          `${domain}: ${status.failedCount} codes failed in batch ${bulkCreationId}`,
        );
      }
      done = true;
      return status;
    }
    await sleep(1000);
  }
}

// Returns codes that failed to import (best-effort: since the API only gives
// a failedCount, not which codes, we diff against what's actually on the
// node afterward to find out which ones from this batch didn't land).
async function findMissingCodes(
  domain: string,
  token: string,
  discountId: string,
  attemptedCodes: string[],
): Promise<string[]> {
  const attempted = new Set(attemptedCodes);
  const found = new Set<string>();
  let cursor: string | null = null;
  let hasNextPage = true;

  const QUERY = `#graphql
    query getCodes($id: ID!, $after: String) {
      codeDiscountNode(id: $id) {
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 250, after: $after) {
              nodes { code }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    }
  `;

  while (hasNextPage) {
    const data = await shopifyAdminGraphQL(domain, token, QUERY, {
      id: discountId,
      after: cursor,
    });
    const { nodes, pageInfo } = data.codeDiscountNode.codeDiscount.codes;
    for (const n of nodes) {
      if (attempted.has(n.code)) found.add(n.code);
    }
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  }

  return attemptedCodes.filter((c) => !found.has(c));
}

export async function addAllCodes(
  domain: string,
  token: string,
  discountId: string,
  codes: string[],
) {
  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    const batch = codes.slice(i, i + BATCH_SIZE);
    const variables = {
      discountId,
      codes: batch.map((code) => ({ code })),
    };

    const data = await shopifyAdminGraphQL(
      domain,
      token,
      bulkAddDiscountMutation,
      variables,
    );
    const errors = data.discountRedeemCodeBulkAdd.userErrors;
    if (errors?.length) {
      throw new Error(
        `Bulk add failed on ${domain} at batch ${i}: ${JSON.stringify(errors)}`,
      );
    }

    const bulkCreationId = data.discountRedeemCodeBulkAdd.bulkCreation.id;
    const result = await waitForBulkCreation(domain, token, bulkCreationId);
    console.log(
      `${domain}: batch ${i / BATCH_SIZE + 1}/${Math.ceil(
        codes.length / BATCH_SIZE,
      )} -- imported ${result.importedCount}/${result.codesCount}`,
    );

    if (result.failedCount > 0) {
      const missing = await findMissingCodes(domain, token, discountId, batch);
      console.warn(
        `${domain}: ${
          missing.length
        } codes from this batch did not land: ${missing.join(', ')}`,
      );
    }
  }
}
