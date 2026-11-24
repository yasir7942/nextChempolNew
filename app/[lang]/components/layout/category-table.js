import Link from "next/link";
import CategoryQuoteCta from "../elements/category-quote-cta";

// Product table of a product category (Strapi: product-category → CategoryTabel).
// Wide screens: a normal table. Below md: every row becomes a card, each value with its column label.
// Rows without a linked product are skipped; with no rows nothing is shown.
// Column headings. The four Strapi fields (Chemistry, Form, SSI, MainUse) keep their names, but some
// categories show other data in them: those categories get their own headings here, by category slug.
// In Strapi, fill the fields in the same order as the headings.
const FIELDS = ["Chemistry", "Form", "SSI", "MainUse"];
const HEADINGS = {
  default: [
    ["chemistry", "Chemistry"],
    ["form", "Form"],
    ["ssi", "SSI (typical)"],
    ["mainUse", "Main use"],
  ],
  // PCMO / gasoline engine oil additive packages
  "pcmo-gasoline": [
    ["performanceLevels", "Performance levels"],
    ["saps", "SAPS"],
    ["dosage", "Dosage, wt%"],
    ["viscosityGrades", "Viscosity grades"],
  ],
};

const CategoryTable = ({ rows = [], locale = "en", dictionary = {}, categorySlug = "" }) => {
  const labels = dictionary?.categoryTable || {};
  const list = (Array.isArray(rows) ? rows : []).filter((row) => row?.product?.slug && row?.product?.title);

  if (!list.length) return null;

  const columns = (HEADINGS[categorySlug] || HEADINGS.default).map(([labelKey, fallback], index) => ({
    key: FIELDS[index],
    label: labels[labelKey] ?? fallback,
  }));

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
