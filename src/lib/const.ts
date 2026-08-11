import dotenv from 'dotenv';

dotenv.config();

export const USE_SINGLE_STORE = false; // set to true to only create codes on Store A

export const TOTAL_CODES = 5_000; // 10_000
export const CODE_PREFIX = 'SUAVE15'; // adjust per campaign
export const BATCH_SIZE = 100;
export const API_VERSION = '2026-07';

export const LEDGER_PATH = './output/codes-ledger.json';
export const TOP_UP_COUNT = 5_000; // number of codes to add in top-up script
