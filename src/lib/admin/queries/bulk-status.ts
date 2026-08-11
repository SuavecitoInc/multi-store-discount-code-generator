export const query = `#graphql
  query DiscountRedeemCodeBulkShow($id: ID!) {
    discountRedeemCodeBulkCreation(id: $id) {
      id
      done
      codesCount
      importedCount
      failedCount
    }
  }
`;