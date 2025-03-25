import { useEffect, useState } from "react";
import {
  reactExtension,
  Banner,
  BlockStack,
  Divider,
  Heading,
  InlineLayout,
  Button,
  SkeletonImage,
  SkeletonText,
  useApi,
  useInstructions,
  useTranslate,
  useLocalizationCountry,
  useSettings,
  useCartLines,
} from "@shopify/ui-extensions-react/checkout";

import {
  FETCH_PRODUCT_RECOMMENDATIONS_QUERY,
  FETCH_VARIANTS_QUERY,
} from "./queries";
import { IRecommendedProduct, IProductVariant } from "./interfaces";

import LineItem from "./components/LineItem";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query } = useApi();
  const translate = useTranslate();
  const country = useLocalizationCountry();
  const settings = useSettings();
  const instructions = useInstructions();
  const cartLines = useCartLines();

  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<null | IProductVariant[]>(null);
  const [showError, setShowError] = useState<boolean>(false);

  let variantIds = [
    settings.variantId1 as string,
    settings.variantId2 as string,
    settings.variantId3 as string,
  ].filter((item) => item);

  useEffect(() => {
    if (country) {
      const fetchVariant = () => {
        query<{ nodes: IProductVariant[] }>(FETCH_VARIANTS_QUERY, {
          variables: {
            variantIds: variantIds,
            country: country.isoCode as string,
          },
        })
          .then((response) => {
            setVariants(response.data.nodes);
            setLoading(false);
          })
          .catch(console.error);
      };

      if (variantIds.length == 0) {
        query<{ productRecommendations: IRecommendedProduct[] }>(
          FETCH_PRODUCT_RECOMMENDATIONS_QUERY,
          {
            variables: {
              productId: cartLines[0].merchandise.product.id as string,
            },
          }
        )
          .then((response) => {
            variantIds = response.data.productRecommendations.map(
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
          .slice(0, 3) // limit to 3 products
          .map((variant, i) => (
            <LineItem
              key={variant.id}
              variant={variant}
              index={i}
              setShowError={setShowError}
            />
          ))}
      </BlockStack>
      {showError && (
        <Banner status="critical">
          {translate("errors.unexpectedIssueWhileAddingProduct")}
        </Banner>
      )}
    </BlockStack>
  );
}
