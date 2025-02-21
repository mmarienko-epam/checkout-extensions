export interface IRecommendedProduct {
  id: string;
  selectedOrFirstAvailableVariant: {
    id: string;
  };
}

export interface IProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  compareAtPrice?: {
    amount: number;
  };
  price: {
    amount: number;
  };
  image?: {
    url: string;
    altText: string;
  };
  product: {
    title: string;
    variantsCount: {
      count: number;
    };
    featuredImage?: {
      url: string;
      altText: string;
    };
  };
}