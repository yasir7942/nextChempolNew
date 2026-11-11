import { cache } from "react";
import JsonLd from "./json-ld";
import { getContactUsPageData } from "../../data/loader";
import { buildOrganization, buildWebSite } from "@/libs/schema/entity";

const cachedGetContactUsPageData = cache(getContactUsPageData);

/*
    Site-wide Organization + WebSite, rendered once per page from the layout.
    Office addresses and phones come from the Contact page in Strapi, so the schema
    matches what the site shows.
*/
const SiteSchema = async ({ lang = "en" }) => {
    let offices = [];

    try {
        const contactData = await cachedGetContactUsPageData(lang);

        offices = contactData?.addressBook || [];
    } catch (err) {
        console.warn("[json-ld] Could not load offices for Organization schema:", err?.message);
    }

    return (
        <JsonLd
            data={[buildOrganization({ offices }), buildWebSite(lang)]}
            label="site schema"
        />
    );
};

export default SiteSchema;
