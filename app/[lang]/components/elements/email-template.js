import { escapeHtml, phoneHtml } from "@/libs/team-mail";

// Email to the team for the contact form (app/api/send). Returns an HTML string; every visitor value is escaped.
export const EmailTemplate = ({ name, phone, mail, contry, msg }) => `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
  <h2 style="font-size: 20px;">Contact Details</h2>
  <p><strong>Full Name:</strong> ${escapeHtml(name)}</p>
  <p><strong>Phone Number:</strong> ${phoneHtml(phone)}</p>
  <p><strong>Email:</strong> ${escapeHtml(mail)}</p>
  <p><strong>Country:</strong> ${escapeHtml(contry)}</p>
  <p><strong>Message:</strong></p>
  <p style="white-space: pre-wrap;">${escapeHtml(msg)}</p>
  <p style="font-size: 12px; color: #777; margin-top: 24px;">This email is sent from Chempol contact form. Reply to this email to answer the visitor.</p>
</div>`;
