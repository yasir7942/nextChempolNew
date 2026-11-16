// Builds the team notification email of a submission (subject, HTML, reply-to).
// Used by the form routes (app/api/send, app/api/inquiry) when a visitor submits, and by the admin
// "Resend email" button (app/api/admin/submissions/[id]/resend) from the saved row, so a resent
// email is identical to the original one.
//
// `submission`: { formType, locale, fullName, company, email, phone, country, address, city,
//                 postcode, message, products: [{ slug, title, quantity }] }

import { EmailTemplate } from "@/app/[lang]/components/elements/email-template";
import { InquiryEmailTemplate } from "@/app/[lang]/components/elements/inquiry-email-template";

export function buildSubmissionMail(submission) {
    const { formType, locale, fullName, company, email, phone, country, address, city, postcode, message } = submission;
    const products = Array.isArray(submission.products) ? submission.products : [];

    if (formType === "contact") {
        return {
            label: "Contact form",
            replyTo: email,
            subject: `Chempol Contact Form - ${fullName}`,
            html: EmailTemplate({ name: fullName, phone, mail: email, contry: country, msg: message }),
        };
    }

    const contact = [
        ["Name", fullName],
        ["Company", company],
        ...(formType === "sample"
            ? [["Address", address], ["City", city], ["Postcode", postcode]]
            : formType === "support"
                ? [["Address", address], ["City", city]]
                : []),
        ["Country", country],
        ["Phone", phone],
        ["Email", email],
    ];

    const subjectProduct = !products.length ? "" : products.length > 1 ? `${products[0].title} +${products.length - 1} more` : products[0].title;
    const subjectLabel = formType === "quote" ? "Quotation request" : formType === "support" ? "Technical support request" : "Sample request";

    return {
        label: "Inquiry form",
        replyTo: email,
        subject: [subjectLabel, company, subjectProduct].filter(Boolean).join(" - ").slice(0, 200),
        html: InquiryEmailTemplate({
            type: formType,
            products,
            contact,
            remarks: message,
            locale,
            siteUrl: (process.env.NEXT_PUBLIC_BASE_URL || "https://chempol.co.uk").replace(/\/$/, ""),
        }),
    };
}
