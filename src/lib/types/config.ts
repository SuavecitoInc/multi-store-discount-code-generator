export type AdminConfig = {
  STORE_A: {
    domain: string;
    accessToken: string;
  };
  STORE_B: {
    domain: string;
    accessToken: string;
  };
};

export type DiscountConfig = {
  storeADiscountId: string;
  storeBDiscountId: string;
};
