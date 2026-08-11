declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      STORE_A_DOMAIN: string;
      STORE_B_DOMAIN: string;
      STORE_A_ADMIN_TOKEN: string;
      STORE_B_ADMIN_TOKEN: string;
      STORE_A_DISCOUNT_ID: string;
      STORE_B_DISCOUNT_ID: string;
      CLIENT_ID: string;
      CLIENT_SECRET: string;
    }
  }
}

export {};
