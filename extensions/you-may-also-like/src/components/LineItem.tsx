import { useState } from "react";
import {
  InlineStack,
  InlineLayout,
  BlockStack,
  Text,
  Image,
  Button,
  useApi,
  useTranslate,
  useApplyCartLinesChange,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

const LineItem = ({ variant, index, setShowError }) => {
  const { i18n } = useApi();
  const settings = useSettings();

  const translate = useTranslate();
  const applyCartLinesChange = useApplyCartLinesChange();

  const [buttonLoading, setButtonLoading] = useState<boolean>(false);

  const getProductPlaceholderUrl = (index = 1) =>
    `https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-${index}_medium.png`;

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

export default LineItem;
