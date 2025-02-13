// app/components/ProductCategoryMenuWrapper.js
import ProductCategoryMenu from "./product-category-menu";
import { geProductCategoryLeftMenu } from "@/app/data/loader";

const ProductCategoryMenuWrapper = async () => {
    const response = await geProductCategoryLeftMenu();
    return <ProductCategoryMenu menuData={response.data} />;
};

export default ProductCategoryMenuWrapper;
