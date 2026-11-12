import { escapeHtml, phoneHtml } from "@/libs/team-mail";

// Email to the sales team for a quotation or sample request (app/api/inquiry).
// Returns an HTML string; every visitor value is escaped.
const cell = "padding: 6px 10px; border: 1px solid #ddd; text-align: left; vertical-align: top;";

export const InquiryEmailTemplate = ({ type, products, contact, remarks, siteUrl, locale }) => {
  const isQuote = type === "quote";
  const isSupport = type === "support";
  const heading = isQuote ? "Quotation request" : isSupport ? "Technical support request" : "Product sample request";
  const source = isQuote ? "Get a Quote" : isSupport ? "Ask Our Technical Team" : "Request a Product Sample";

  const productRows = products
    .map(
      (product) => `
      <tr>
        <td style="${cell}"><a href="${escapeHtml(`${siteUrl}/${locale}/product/${product.slug}/`)}">${escapeHtml(product.title)}</a></td>
        ${isQuote ? `<td style="${cell}">${escapeHtml(product.quantity || "-")}</td>` : ""}
      </tr>`
    )
    .join("");

  const contactLines = contact
    .map(([label, value]) => `<p style="margin: 4px 0;"><strong>${escapeHtml(label)}:</strong> ${label === "Phone" && value ? phoneHtml(value) : escapeHtml(value || "-")}</p>`)
    .join("");

  return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <h2 style="font-size: 20px;">${heading}</h2>

  ${products.length ? `<h3 style="font-size: 16px;">${isSupport ? "Product page" : "Products"}</h3>
  <table style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr>
        <th style="${cell}">Product</th>
        ${isQuote ? `<th style="${cell}">Estimated quantity</th>` : ""}
      </tr>
    </thead>
    <tbody>${productRows}</tbody>
  </table>` : ""}

  <h3 style="font-size: 16px;">Contact</h3>
  ${contactLines}

  ${remarks ? `<h3 style="font-size: 16px;">Remarks</h3><p style="white-space: pre-wrap;">${escapeHtml(remarks)}</p>` : ""}

  <p style="font-size: 12px; color: #777; margin-top: 24px;">
    Sent from the ${source} form on a product page (${escapeHtml(locale)}). Reply to this email to answer the customer.
  </p>
</div>`;
};
