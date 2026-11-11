import { escapeHtml } from "@/libs/team-mail";

// Email to the sales team for a quotation or sample request (app/api/inquiry).
// Returns an HTML string; every visitor value is escaped.
const cell = "padding: 6px 10px; border: 1px solid #ddd; text-align: left; vertical-align: top;";

export const InquiryEmailTemplate = ({ type, products, contact, remarks, siteUrl, locale }) => {
  const isQuote = type === "quote";

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
    .map(([label, value]) => `<p style="margin: 4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "-")}</p>`)
    .join("");

  return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <h2 style="font-size: 20px;">${isQuote ? "Quotation request" : "Product sample request"}</h2>

  <h3 style="font-size: 16px;">Products</h3>
  <table style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr>
        <th style="${cell}">Product</th>
        ${isQuote ? `<th style="${cell}">Estimated quantity</th>` : ""}
      </tr>
    </thead>
    <tbody>${productRows}</tbody>
  </table>

  <h3 style="font-size: 16px;">Contact</h3>
  ${contactLines}

  ${remarks ? `<h3 style="font-size: 16px;">Remarks</h3><p style="white-space: pre-wrap;">${escapeHtml(remarks)}</p>` : ""}

  <p style="font-size: 12px; color: #777; margin-top: 24px;">
    Sent from the ${isQuote ? "Get a Quote" : "Request a Product Sample"} form on a product page (${escapeHtml(locale)}). Reply to this email to answer the customer.
  </p>
</div>`;
};
