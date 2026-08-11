export type Stores = {
  stores: {
    handle: string;
    collectionId: string;
  }[];
};

export type AdminConfig = {
  [key: string]: {
    domain: string;
    accessToken: string;
    collectionId: string;
  };
};

export type DiscountConfig = {
  [key: string]: string;
};
