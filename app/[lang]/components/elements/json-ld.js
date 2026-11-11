import { prepareJsonLd, serializeJsonLd } from "@/libs/schema/render";

/*
    Renders structured data as one <script type="application/ld+json">.
    `data` can be a node, an array of nodes or a @graph document. Invalid nodes are
    dropped; if nothing valid is left, nothing is rendered.
*/
const JsonLd = ({ data, label = "schema" }) => {
    const document = prepareJsonLd(data, label);

    if (!document) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(document) }}
        />
    );
};

export default JsonLd;
