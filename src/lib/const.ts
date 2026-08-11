import dotenv from 'dotenv';

import admin from '../../config/admin.json';
import discount from '../../config/discount-config.json';
import type { AdminConfig, DiscountConfig } from './types/config';

dotenv.config();

export const USE_SINGLE_STORE = false; // set to true to only create codes on Store A

const adminConfig: AdminConfig = admin;
export const STORE_A_DOMAIN = adminConfig.STORE_A.domain;
export const STORE_B_DOMAIN = adminConfig.STORE_B.domain;
export const STORE_A_ADMIN_TOKEN = adminConfig.STORE_A.accessToken;
export const STORE_B_ADMIN_TOKEN = adminConfig.STORE_B.accessToken;

// discount code ids
const discountConfig: DiscountConfig = discount;
export const STORE_A_DISCOUNT_ID = discountConfig.storeADiscountId;
export const STORE_B_DISCOUNT_ID = discountConfig.storeBDiscountId;

export const TOTAL_CODES = 10; // 10_000
export const CODE_PREFIX = 'SUAVE15'; // adjust per campaign
export const BATCH_SIZE = 100;
export const API_VERSION = '2026-07';

export const LEDGER_PATH = './output/codes-ledger.json';
export const TOP_UP_COUNT = 500; // number of codes to add in top-up script
