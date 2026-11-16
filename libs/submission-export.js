// Turns saved submissions into the rows of the export file (CSV or Excel).
// Dates are shown in UAE time (Asia/Dubai) with AM / PM, like the admin page.

import { createXlsx } from "@/libs/xlsx-writer";

const TYPE_LABELS = { contact: "Contact", quote: "Get a Quote", sample: "Sample request", support: "Technical team" };

const uaeFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});
const uaeDate = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? String(iso) : uaeFormat.format(date);
};

const COLUMNS = [
    ["ID", 8, (row) => row.id],
    ["DATE (UAE time)", 22, (row) => uaeDate(row.created_at)],
    ["Form", 16, (row) => TYPE_LABELS[row.form_type] || row.form_type],
    ["Language", 10, (row) => row.locale || ""],
    ["Name", 22, (row) => row.full_name || ""],
    ["Company", 24, (row) => row.company || ""],
    ["Email", 28, (row) => row.email || ""],
    ["Phone", 18, (row) => row.phone || ""],
    ["Country", 16, (row) => row.country || ""],
    ["Address", 30, (row) => row.address || ""],
    ["City", 16, (row) => row.city || ""],
    ["Postcode", 12, (row) => row.postcode || ""],
    ["Message", 50, (row) => row.message || ""],
    ["Products", 40, (row) => row.products.map((product) => `${product.title}${product.quantity ? ` (${product.quantity})` : ""}`).join("; ")],
    ["IP", 16, (row) => row.ip || ""],
    ["Email sent", 11, (row) => (row.email_sent ? "Yes" : "No")],
    ["Email sent at (UAE time)", 22, (row) => uaeDate(row.email_sent_at)],
    ["Email attempts", 10, (row) => row.email_attempts],
    ["Email error", 40, (row) => row.email_error || ""],
];

const headers = COLUMNS.map(([heading]) => heading);
const tableRows = (rows) => rows.map((row) => COLUMNS.map(([, , value]) => value(row)));

// A cell that starts with = + - @ is run as a formula by Excel and LibreOffice when a CSV is opened:
// customer text must never do that, so such cells get a leading apostrophe (phone numbers like +971... are kept).
const FORMULA_START = /^[=+\-@\t\r]/;
const PHONE_LIKE = /^\+[\d\s().-]+$/;
const csvCell = (value) => {
    let text = String(value ?? "");
    if (FORMULA_START.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// UTF-8 with a byte order mark so Excel shows Arabic and accents correctly
export function submissionsCsv(rows) {
    const lines = [headers, ...tableRows(rows)].map((line) => line.map(csvCell).join(","));
    return Buffer.from("﻿" + lines.join("\r\n") + "\r\n", "utf8");
}

export function submissionsXlsx(rows) {
    return createXlsx({
        sheetName: "Submissions",
        headers,
        rows: tableRows(rows),
        widths: COLUMNS.map(([, width]) => width),
    });
}
