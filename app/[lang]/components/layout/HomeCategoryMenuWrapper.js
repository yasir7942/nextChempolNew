import { getDictionary } from "@/libs/getDictionary";
import { getProductCategoryForHome } from "../../data/loader";
import MenuList from "./menu-list";


export default async function HomneCategoryMenuWrapper({ locale }) {
    const dictionary = await getDictionary(locale);
    let productCategory = [];

    try {
        productCategory = await getProductCategoryForHome(locale);
    } catch (error) {
        console.error("Error fetching product categories:", error);
    }

    return <MenuList locale={locale} dictionary={dictionary} productCategory={productCategory} />;
}
