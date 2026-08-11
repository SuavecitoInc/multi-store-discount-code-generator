/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.d.ts';

export type DiscountRedeemCodeBulkAddMutationVariables = AdminTypes.Exact<{
  discountId: AdminTypes.Scalars['ID']['input'];
  codes: Array<AdminTypes.DiscountRedeemCodeInput> | AdminTypes.DiscountRedeemCodeInput;
}>;


export type DiscountRedeemCodeBulkAddMutation = { discountRedeemCodeBulkAdd?: AdminTypes.Maybe<{ bulkCreation?: AdminTypes.Maybe<Pick<AdminTypes.DiscountRedeemCodeBulkCreation, 'id'>>, userErrors: Array<Pick<AdminTypes.DiscountUserError, 'code' | 'field' | 'message'>> }> };

export type DiscountCodeBasicCreateMutationVariables = AdminTypes.Exact<{
  basicCodeDiscount: AdminTypes.DiscountCodeBasicInput;
}>;


export type DiscountCodeBasicCreateMutation = { discountCodeBasicCreate?: AdminTypes.Maybe<{ codeDiscountNode?: AdminTypes.Maybe<Pick<AdminTypes.DiscountCodeNode, 'id'>>, userErrors: Array<Pick<AdminTypes.DiscountUserError, 'field' | 'message'>> }> };

export type DiscountRedeemCodeBulkShowQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type DiscountRedeemCodeBulkShowQuery = { discountRedeemCodeBulkCreation?: AdminTypes.Maybe<Pick<AdminTypes.DiscountRedeemCodeBulkCreation, 'id' | 'done' | 'codesCount' | 'importedCount' | 'failedCount'>> };

interface GeneratedQueryTypes {
  "#graphql\n  query DiscountRedeemCodeBulkShow($id: ID!) {\n    discountRedeemCodeBulkCreation(id: $id) {\n      id\n      done\n      codesCount\n      importedCount\n      failedCount\n    }\n  }\n": {return: DiscountRedeemCodeBulkShowQuery, variables: DiscountRedeemCodeBulkShowQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation discountRedeemCodeBulkAdd($discountId: ID!, $codes: [DiscountRedeemCodeInput!]!) {\n    discountRedeemCodeBulkAdd(discountId: $discountId, codes: $codes) {\n      bulkCreation { id }\n      userErrors { code field message }\n    }\n  }\n": {return: DiscountRedeemCodeBulkAddMutation, variables: DiscountRedeemCodeBulkAddMutationVariables},
  "#graphql\n  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {\n    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {\n      codeDiscountNode { id }\n      userErrors { field message }\n    }\n  }\n": {return: DiscountCodeBasicCreateMutation, variables: DiscountCodeBasicCreateMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
