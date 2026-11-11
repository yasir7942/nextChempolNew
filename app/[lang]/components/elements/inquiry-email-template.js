// Email to the sales team for a quotation or sample request (app/api/inquiry)
const row = { padding: "6px 10px", border: "1px solid #ddd", textAlign: "left", verticalAlign: "top" };

export const InquiryEmailTemplate = ({ type, products, contact, remarks, siteUrl, locale }) => {
  const isQuote = type === "quote";

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 14, color: "#222" }}>
      <h2 style={{ fontSize: 20 }}>{isQuote ? "Quotation request" : "Product sample request"}</h2>

      <h3 style={{ fontSize: 16 }}>Products</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={row}>Product</th>
            {isQuote && <th style={row}>Estimated quantity</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.slug}>
              <td style={row}>
                <a href={`${siteUrl}/${locale}/product/${product.slug}/`}>{product.title}</a>
              </td>
              {isQuote && <td style={row}>{product.quantity || "-"}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontSize: 16 }}>Contact</h3>
      {contact.map(([label, value]) => (
        <p key={label} style={{ margin: "4px 0" }}>
          <strong>{label}:</strong> {value || "-"}
        </p>
      ))}

      {remarks ? (
        <>
          <h3 style={{ fontSize: 16 }}>Remarks</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{remarks}</p>
        </>
      ) : null}

      <p style={{ fontSize: 12, color: "#777", marginTop: 24 }}>
        Sent from the {isQuote ? "Get a Quote" : "Request a Product Sample"} form on a product page ({locale}). Reply to this email to answer the customer.
      </p>
    </div>
  );
};
