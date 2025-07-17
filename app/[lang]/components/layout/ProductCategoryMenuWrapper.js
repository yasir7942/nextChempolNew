// app/components/ProductCategoryMenuWrapper.js
import ProductCategoryMenu from "./product-category-menu";
import { geProductCategoryLeftMenu } from "../../data/loader";

const ProductCategoryMenuWrapper = async ({ locale, dictionary }) => {

    const response = await geProductCategoryLeftMenu(locale);

    return <ProductCategoryMenu locale={locale} dictionary={dictionary} menuData={response.data} />;
};

export default ProductCategoryMenuWrapper;
