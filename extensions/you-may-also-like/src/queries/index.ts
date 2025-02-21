export const FETCH_VARIANTS_QUERY = `
  query ($variantIds: [ID!]!, $country: CountryCode!) @inContext(country: $country)  {
    nodes(ids: $variantIds) {
      ... on ProductVariant {
        id
        title
        availableForSale
        compareAtPrice {
          amount
        }
        price {
          amount
        }
        image {
          url
          altText
        }
        product {
          title
          variantsCount {
            count
          }
          featuredImage {
            url
            altText
          }
        }
      }
    }
  }
`;

export const FETCH_PRODUCT_RECOMMENDATIONS_QUERY = `
  query ($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      selectedOrFirstAvailableVariant {
        id
      }
    }
  }
`;
