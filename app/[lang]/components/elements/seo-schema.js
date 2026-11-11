import JsonLd from "./json-ld";
import { filterValidNodes } from "@/libs/schema/render";
import { strapiSchemaNodes } from "@/libs/schema/strapi";
import { typesOf } from "@/libs/schema/validate";

/*
    Page structured data.

    - `nodes`: schemas the page builds itself (Product, BlogPosting, FAQPage,
      BreadcrumbList...). These always win.
    - `schemaList`: Strapi seo.schema entries, used only as a fallback for types the
      page does not provide, or provides but invalid.

    The site-wide Organization and WebSite come from <SiteSchema> in the layout;
    Strapi copies of those are always dropped.
*/
const SEOSchema = ({ schemaList, nodes = [] }) => {
    const ownNodes = filterValidNodes(nodes.filter(Boolean), "page schema");
    const ownTypes = ownNodes.flatMap(typesOf);

    const fallbackNodes = strapiSchemaNodes(schemaList, ownTypes);

    return <JsonLd data={[...ownNodes, ...fallbackNodes]} label="Strapi schema" />;
};

export default SEOSchema;
