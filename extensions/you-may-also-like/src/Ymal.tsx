import { useEffect, useState } from "react";
import {
  reactExtension,
  Banner,
  InlineStack,
  InlineLayout,
  BlockStack,
  Text,
  Image,
  Button,
  Divider,
  Heading,
  SkeletonImage,
  SkeletonText,
  useApi,
  useInstructions,
  useTranslate,
  useApplyCartLinesChange,
  useLocalizationCountry,
  useSettings,
  useCartLines,
} from "@shopify/ui-extensions-react/checkout";

// 1. Choose an extension target
export default reactExtension(
  "purchase.checkout.cart-line-list.render-after",
  () => <Extension />
);

interface IRecommendedProduct {
  id: string;
  selectedOrFirstAvailableVariant: {
    id: string;
  };
}

interface IVariant {
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

function Extension() {
  const { i18n, query } = useApi();
  const country = useLocalizationCountry();
  const settings = useSettings();
  const instructions = useInstructions();
  const cartLines = useCartLines();

  const translate = useTranslate();
  const applyCartLinesChange = useApplyCartLinesChange();

  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<null | IVariant[]>(null);
  const [showError, setShowError] = useState<boolean>(false);

  const getProductPlaceholderUrl = (index = 1) =>
    `https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-${index}_medium.png`;

  let ids = [
    settings.variantId1 as string,
    settings.variantId2 as string,
    settings.variantId3 as string,
  ].filter((item) => item);

  useEffect(() => {
    if (country) {
      const fetchVariant = () => {
        query<{ nodes: IVariant[] }>(
          `query ($ids: [ID!]!, $country: CountryCode!) @inContext(country: $country)  {
            nodes(ids: $ids) {
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
          }`,
          {
            variables: {
              ids: ids,
              country: country.isoCode as string,
            },
          }
        )
          .then((response) => {
            setVariants(response.data.nodes);
            setLoading(false);
          })
          .catch(console.error);
      };

      if (ids.length == 0) {
        query<{ productRecommendations: IRecommendedProduct[] }>(
          `query ($productId: ID!) {
            productRecommendations(productId: $productId) {
              id
              selectedOrFirstAvailableVariant {
                id
              }
            }
          }`,
          {
            variables: {
              productId: cartLines[0].merchandise.product.id as string,
            },
          }
        )
          .then((response) => {
            ids = response.data.productRecommendations.map(
              (product) => product.selectedOrFirstAvailableVariant.id
            );
            fetchVariant();
          })
          .catch(console.error);
      } else {
        fetchVariant();
      }
    }
  }, [country, settings]);

  const VariantItem = ({ variant, index }) => {
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);

    const image = variant.image || variant.product.featuredImage;

    return (
      <InlineLayout
        spacing="base"
        columns={[64, "fill", "auto"]}
        blockAlignment="center"
      >
        <Image
          border="base"
          borderWidth="base"
          borderRadius="base"
          source={image?.url ?? getProductPlaceholderUrl(index)}
          accessibilityDescription={image?.altText ?? ""}
          aspectRatio={1}
          fit="contain"
        />
        <BlockStack spacing="none">
          <Text size="base">
            {variant.product.title}
            {variant.product.variantsCount.count > 1 && ` - ${variant.title}`}
          </Text>
          <InlineStack spacing="tight">
            <Text appearance="subdued" size="base">
              {i18n.formatCurrency(variant.price.amount)}
            </Text>
            {!settings.hideCompareAtPrice && variant.compareAtPrice?.amount && (
              <Text
                appearance="subdued"
                accessibilityRole="deletion"
                size="small"
              >
                {i18n.formatCurrency(variant.compareAtPrice.amount)}
              </Text>
            )}
          </InlineStack>
        </BlockStack>
        <Button
          kind="secondary"
          loading={buttonLoading}
          accessibilityLabel={translate("button.text")}
          onPress={() => {
            setShowError(false);
            setButtonLoading(true);
            applyCartLinesChange({
              type: "addCartLine",
              merchandiseId: variant.id,
              quantity: 1,
            })
              .then((response) => {
                setButtonLoading(false);

                if (response.type === "error") {
                  setShowError(true);
                  console.error(response.message);
                }
              })
              .catch(console.error);
          }}
        >
          {translate("button.text")}
        </Button>
      </InlineLayout>
    );
  };

  if (!instructions.lines.canAddCartLine) {
    return (
      <Banner status="warning">
        {translate("errors.cartChangesAreNotSupported")}
      </Banner>
    );
  }

  if (loading) {
    return (
      <BlockStack spacing="loose">
        <Divider />
        <Heading level={2}>{translate("heading")}</Heading>
        <BlockStack spacing="base">
          {[...Array(3)].map((_, index) => (
            <InlineLayout
              key={index}
              spacing="base"
              columns={[64, "fill", "auto"]}
              blockAlignment="center"
            >
              <SkeletonImage aspectRatio={1} />
              <BlockStack spacing="extraTight">
                <SkeletonText size="small" inlineSize="base" />
                <SkeletonText size="small" inlineSize="small" />
              </BlockStack>
              <Button kind="secondary" disabled={true}>
                {translate("button.text")}
              </Button>
            </InlineLayout>
          ))}
        </BlockStack>
      </BlockStack>
    );
  }

  if (!loading && variants.length === 0) {
    return null;
  }

  return (
    <BlockStack spacing="loose">
      <Divider />
      <Heading level={2}>{translate("heading")}</Heading>
      <BlockStack spacing="base">
        {variants
          .filter((variant) => variant?.availableForSale)
          .slice(0, 3)
          .map((variant, i) => <VariantItem key={variant.id} variant={variant} index={i} />)}
      </BlockStack>
      {showError && (
        <Banner status="critical">
          {translate("errors.unexpectedIssueWhileAddingProduct")}
        </Banner>
      )}
    </BlockStack>
  );
}
