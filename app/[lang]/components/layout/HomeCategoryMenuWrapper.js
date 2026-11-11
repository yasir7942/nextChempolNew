import { getDictionary } from "@/libs/getDictionary";
import { getProductCategoryForHome } from "../../data/loader";
import MenuList from "./menu-list";
import JsonLd from "../elements/json-ld";
import { buildSiteNavigation, pageUrl } from "@/libs/schema/entity";


export default async function HomneCategoryMenuWrapper({ locale }) {
    const dictionary = await getDictionary(locale);
    let productCategory = [];

    try {
        productCategory = await getProductCategoryForHome(locale);
    } catch (error) {
        console.error("Error fetching product categories:", error);
    }

    // Main menu structured data, same links and order as <MenuList>.
    const nav = dictionary.navigation || {};
    const menuSchema = buildSiteNavigation({
        lang: locale,
        items: [
            { name: nav.home, url: pageUrl(locale) },
            ...(productCategory?.data || []).map((category) => ({
                name: category.title,
                url: pageUrl(locale, "product-category", category.slug),
            })),
            { name: nav.about, url: pageUrl(locale, "about-us") },
            { name: nav.faq, url: pageUrl(locale, "faq") },
            { name: nav.lubricantAdditives, url: pageUrl(locale, "lubricant-additives-manufacturers-in-uae") },
            { name: nav.blog, url: pageUrl(locale, "blog") },
            { name: nav.contact, url: pageUrl(locale, "contact") },
        ],
    });

    return (
        <>
            <JsonLd data={menuSchema} label="main menu schema" />
            <MenuList locale={locale} dictionary={dictionary} productCategory={productCategory} />
        </>
    );
}
