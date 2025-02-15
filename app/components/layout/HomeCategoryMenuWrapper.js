import MenuList from "./menu-list";
import { getProductCategoryForHome } from "@/app/data/loader";

export default async function HomneCategoryMenuWrapper() {
    let productCategory = [];

    try {
        productCategory = await getProductCategoryForHome();
    } catch (error) {
        console.error("Error fetching product categories:", error);
    }

    return <MenuList productCategory={productCategory} />;
}
