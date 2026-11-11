import Link from "next/link";
import CategoryQuoteCta from "../elements/category-quote-cta";

// Product table of a product category (Strapi: product-category → CategoryTabel).
// Wide screens: a normal table. Below md: every row becomes a card, each value with its column label.
// Rows without a linked product are skipped; with no rows nothing is shown.
const CategoryTable = ({ rows = [], locale = "en", dictionary = {} }) => {
  const labels = dictionary?.categoryTable || {};
  const list = (Array.isArray(rows) ? rows : []).filter((row) => row?.product?.slug && row?.product?.title);

  if (!list.length) return null;

  const columns = [
    { key: "Chemistry", label: labels.chemistry ?? "Chemistry" },
    { key: "Form", label: labels.form ?? "Form" },
    { key: "SSI", label: labels.ssi ?? "SSI (typical)" },
    { key: "MainUse", label: labels.mainUse ?? "Main use" },
  ];

  const head = "border border-textLightBlue bg-textLightBlue px-3 py-3 text-start font-semibold text-white align-top";
  const cell =
    "block md:table-cell md:border border-gray-300 px-3 py-2 md:py-3 text-start font-light text-gray-800 md:align-top before:content-[attr(data-label)] before:block before:text-xs before:font-semibold before:text-textBlue md:before:hidden";

  return (
    <div className="w-full my-10">
      <table className="block md:table w-full border-collapse md:border border-gray-300 text-sm bg-white">
        <thead className="hidden md:table-header-group">
          <tr>
            <th scope="col" className={head}>{labels.product ?? "Product"}</th>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={head}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {list.map((row, idx) => (
            <tr key={row.id ?? idx} className="block md:table-row mb-4 md:mb-0 border md:border-0 border-gray-300 rounded-sm shadow-sm md:shadow-none">
              <td className={`${cell} uppercase bg-gray-50 md:bg-transparent`} data-label={labels.product ?? "Product"}>
                <Link href={`/${locale}/product/${row.product.slug}/`} className="text-textLightBlue underline hover:text-textBlue">
                  {row.product.title}
                </Link>
              </td>
              {columns.map((col) => (
                <td key={col.key} className={cell} data-label={col.label}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <CategoryQuoteCta locale={locale} dictionary={dictionary.inquiry} text={labels.ctaText} />
    </div>
  );
};

export default CategoryTable;
