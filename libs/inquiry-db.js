// Private SQLite database that keeps every contact / quote / sample / technical-team submission,
// so a customer's query is never lost, even when the notification email fails.
//
// Server only (used by app/api/send and app/api/inquiry). Uses the SQLite that is built into
// Node 22.5+ (node:sqlite), so no extra package is needed.
//
// Security:
//  - the file is NEVER inside /public or any folder the web server serves. Default location:
//      production:  <app folder>/../chempol-private-data/inquiries.sqlite   (outside the web root)
//      development: <project>/.data/inquiries.sqlite                        (git-ignored)
//    Set INQUIRY_DB_PATH in .env to choose another place (an absolute path outside the web root).
//  - the folder is created with mode 0700 and the file with 0600 (owner only; Windows ignores modes)
//  - no route or page reads the database; the only code that touches it is this file
//  - all SQL uses bound parameters, so visitor text can never change a query
//
// Flow of a submission: saved first (email_sent = 0), then the email is sent, then the row is
// updated (email_sent = 1, or email_error with the reason). A repeat of the same submission within
// 10 minutes (visitor presses Send again after an error) reuses the same row.

import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

let database = null;

function databasePath() {
    const configured = String(process.env.INQUIRY_DB_PATH || "").trim();
    if (configured) return path.resolve(configured);

    return process.env.NODE_ENV === "production"
        ? path.resolve(process.cwd(), "..", "chempol-private-data", "inquiries.sqlite")
        : path.resolve(process.cwd(), ".data", "inquiries.sqlite");
}

function open() {
    if (database) return database;

    const file = databasePath();
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });

    const db = new DatabaseSync(file);
    db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = FULL;
        PRAGMA busy_timeout = 5000;

        CREATE TABLE IF NOT EXISTS submissions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at      TEXT    NOT NULL,            -- UTC, ISO 8601
            form_type       TEXT    NOT NULL,            -- contact | quote | sample | support
            locale          TEXT,
            full_name       TEXT,
            company         TEXT,
            email           TEXT,
            phone           TEXT,
            country         TEXT,
            address         TEXT,
            city            TEXT,
            postcode        TEXT,
            message         TEXT,                        -- contact message, quote/sample remarks or the technical question
            products        TEXT,                        -- JSON: [{ slug, title, quantity }]
            ip              TEXT,
            dedupe_key      TEXT    NOT NULL,
            email_sent      INTEGER NOT NULL DEFAULT 0,  -- 1 = the team notification email was accepted by Resend
            email_sent_at   TEXT,
            email_attempts  INTEGER NOT NULL DEFAULT 0,
            email_error     TEXT                         -- reason of the last failed attempt
        );
        CREATE INDEX IF NOT EXISTS submissions_created_at ON submissions (created_at);
        CREATE INDEX IF NOT EXISTS submissions_email_sent ON submissions (email_sent);
        CREATE INDEX IF NOT EXISTS submissions_dedupe ON submissions (dedupe_key, created_at);

        -- Copies waiting for / sent to the Atlantic Inquiry Manager (libs/inquiry-forward.js)
        CREATE TABLE IF NOT EXISTS inquiry_outbox (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id     TEXT    NOT NULL UNIQUE,     -- sent as submission_id and Idempotency-Key
            submission_row_id INTEGER UNIQUE,              -- submissions.id (NULL if the submission could not be saved)
            body              TEXT    NOT NULL,            -- the exact JSON sent; resent unchanged on every retry
            status            TEXT    NOT NULL DEFAULT 'pending', -- pending | delivered | failed
            attempts          INTEGER NOT NULL DEFAULT 0,
            created_at        TEXT    NOT NULL,
            next_attempt_at   TEXT    NOT NULL,
            retry_until       TEXT    NOT NULL,            -- retries stop after this (24 hours)
            locked_until      TEXT,                        -- a sender is working on it until then
            last_attempt_at   TEXT,
            last_http_status  INTEGER,
            last_error_code   TEXT,
            last_error_fields TEXT,                        -- field names from a 422 answer, comma-separated
            inquiry_id        TEXT,
            delivered_at      TEXT
        );
        CREATE INDEX IF NOT EXISTS inquiry_outbox_due ON inquiry_outbox (status, next_attempt_at);
    `);

    try {
        fs.chmodSync(file, 0o600);
    } catch {
        // not supported on this system (Windows)
    }

    database = db;
    return db;
}

const text = (value) => (value === undefined || value === null ? null : String(value));

// Saves a submission before its email is sent.
// Returns { id, alreadySent } or null when the database could not be written (logged, never thrown).
export function saveSubmission({ formType, locale, fullName, company, email, phone, country, address, city, postcode, message, products, ip }) {
    try {
        const db = open();
        const productList = JSON.stringify(Array.isArray(products) ? products : []);
        const dedupeKey = createHash("sha256")
            .update([formType, String(email ?? "").toLowerCase(), phone ?? "", message ?? "", productList].join("\u0001"))
            .digest("hex");

        // the same submission sent again a moment later (error shown, visitor pressed Send again): reuse its row
        const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
        const existing = db
            .prepare("SELECT id, email_sent FROM submissions WHERE dedupe_key = ? AND created_at >= ? ORDER BY id DESC LIMIT 1")
            .get(dedupeKey, since);
        if (existing) return { id: Number(existing.id), alreadySent: existing.email_sent === 1 };

        const result = db
            .prepare(
                `INSERT INTO submissions
                 (created_at, form_type, locale, full_name, company, email, phone, country, address, city, postcode, message, products, ip, dedupe_key)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
                new Date().toISOString(),
                formType,
                text(locale),
                text(fullName),
                text(company),
                text(email),
                text(phone),
                text(country),
                text(address),
                text(city),
                text(postcode),
                text(message),
                productList,
                text(ip),
                dedupeKey
            );

        return { id: Number(result.lastInsertRowid), alreadySent: false };
    } catch (error) {
        console.error("Submission database: could not save the submission", error);
        return null;
    }
}

// Records the result of the email: sent = true marks the row as sent, otherwise keeps the reason.
export function markEmailResult(id, sent, errorText = "") {
    try {
        const now = new Date().toISOString();
        if (sent) {
            open()
                .prepare("UPDATE submissions SET email_sent = 1, email_sent_at = ?, email_attempts = email_attempts + 1, email_error = NULL WHERE id = ?")
                .run(now, id);
        } else {
            open()
                .prepare("UPDATE submissions SET email_attempts = email_attempts + 1, email_error = ? WHERE id = ?")
                .run(String(errorText || "unknown error").slice(0, 500), id);
        }
    } catch (error) {
        console.error("Submission database: could not update the email status of", id, error);
    }
}

// ---------------------------------------------------------------------------------------------
// Reading (admin page for SuperAdmin only: app/api/admin/submissions)
// ---------------------------------------------------------------------------------------------

export const FORM_TYPES = ["contact", "quote", "sample", "support"];

// "!" is the LIKE escape character: a visitor's "%" and "_" are searched literally
const escapeLike = (value) => value.replace(/[!%_]/g, (character) => `!${character}`);

// WHERE clause of the admin filters: { formType, status: "sent" | "unsent", search }
function filterClause({ formType = "", status = "", search = "" }) {
    const where = [];
    const values = [];

    if (FORM_TYPES.includes(formType)) {
        where.push("form_type = ?");
        values.push(formType);
    }
    if (status === "sent") where.push("email_sent = 1");
    if (status === "unsent") where.push("email_sent = 0");

    const term = String(search || "").trim().slice(0, 100);
    if (term) {
        const like = `%${escapeLike(term)}%`;
        const columns = ["full_name", "company", "email", "phone", "country", "message", "products"];
        where.push(`(${columns.map((column) => `${column} LIKE ? ESCAPE '!'`).join(" OR ")})`);
        values.push(...columns.map(() => like));
    }

    return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", values };
}

const rowFromDb = (row) => {
    let products = [];
    try {
        products = JSON.parse(row.products || "[]");
    } catch { }
    return { ...row, id: Number(row.id), products, email_sent: row.email_sent === 1 };
};

// One page of submissions, newest first. filters: { formType, status: "sent" | "unsent", search }
export function listSubmissions({ page = 1, pageSize = 20, ...filters } = {}) {
    const db = open();
    const { clause, values } = filterClause(filters);
    const total = Number(db.prepare(`SELECT COUNT(*) AS n FROM submissions ${clause}`).get(...values).n);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);

    const rows = db
        .prepare(`SELECT * FROM submissions ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
        .all(...values, pageSize, (current - 1) * pageSize)
        .map(rowFromDb);

    return { rows, pagination: { page: current, pageSize, total, pageCount } };
}

// One submission by id (same shape as the list rows), or null
export function getSubmission(id) {
    const row = open().prepare("SELECT * FROM submissions WHERE id = ?").get(id);
    return row ? rowFromDb(row) : null;
}

// UAE time (UTC+4, no daylight saving): the report days follow the clock the team works by
const UAE_OFFSET_MS = 4 * 3600000;
const uaeDay = (ms) => new Date(ms + UAE_OFFSET_MS).toISOString().slice(0, 10);

// Figures for the report at the top of the admin page
export function submissionReport() {
    const db = open();
    const one = (sql, ...values) => db.prepare(sql).get(...values);
    const all = (sql, ...values) => db.prepare(sql).all(...values);

    const totals = one("SELECT COUNT(*) AS total, COALESCE(SUM(email_sent = 1), 0) AS sent FROM submissions");
    const total = Number(totals.total);
    const sent = Number(totals.sent);

    const byType = FORM_TYPES.map((type) => {
        const row = one("SELECT COUNT(*) AS total, COALESCE(SUM(email_sent = 1), 0) AS sent FROM submissions WHERE form_type = ?", type);
        return { formType: type, total: Number(row.total), sent: Number(row.sent), notSent: Number(row.total) - Number(row.sent) };
    });

    // last 14 days (UAE time), days without submissions included
    const since = uaeDay(Date.now() - 13 * 86400000);
    const perDay = new Map(
        all(
            "SELECT substr(datetime(created_at, '+4 hours'), 1, 10) AS day, COUNT(*) AS total, COALESCE(SUM(email_sent = 0), 0) AS not_sent FROM submissions WHERE substr(datetime(created_at, '+4 hours'), 1, 10) >= ? GROUP BY day",
            since
        ).map((row) => [row.day, { total: Number(row.total), notSent: Number(row.not_sent) }])
    );
    const days = Array.from({ length: 14 }, (_, index) => {
        const day = uaeDay(Date.now() - (13 - index) * 86400000);
        return { day, ...(perDay.get(day) || { total: 0, notSent: 0 }) };
    });

    const countries = all(
        "SELECT MIN(TRIM(country)) AS country, COUNT(*) AS total FROM submissions WHERE country IS NOT NULL AND TRIM(country) <> '' GROUP BY LOWER(TRIM(country)) ORDER BY total DESC LIMIT 5"
    ).map((row) => ({ country: row.country, total: Number(row.total) }));

    const oldestUnsent = one("SELECT MIN(created_at) AS at FROM submissions WHERE email_sent = 0")?.at || null;

    return { total, sent, notSent: total - sent, byType, days, countries, oldestUnsent };
}

// Every submission that matches the filters (the Excel / CSV export), newest first.
// Capped so one export can never exhaust the server's memory.
const EXPORT_LIMIT = 50000;
export function exportSubmissions(filters = {}) {
    const { clause, values } = filterClause(filters);
    const rows = open()
        .prepare(`SELECT * FROM submissions ${clause} ORDER BY id DESC LIMIT ?`)
        .all(...values, EXPORT_LIMIT + 1)
        .map(rowFromDb);

    return { rows: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}

// ---------------------------------------------------------------------------------------------
// Outbox of the Atlantic Inquiry Manager (used by libs/inquiry-forward.js)
// ---------------------------------------------------------------------------------------------

const OUTBOX_RETRY_WINDOW_MS = 24 * 3600000;

// Stores the body before it is sent. Returns { id, created: true }, { created: false } when this
// submission (same submission_id or same saved row) is already queued, or null when the database failed.
export function enqueueOutbox({ submissionId, submissionRowId = null, body }) {
    try {
        const now = new Date();
        const result = open()
            .prepare(
                `INSERT OR IGNORE INTO inquiry_outbox (submission_id, submission_row_id, body, created_at, next_attempt_at, retry_until)
                 VALUES (?, ?, ?, ?, ?, ?)`
            )
            .run(submissionId, submissionRowId, body, now.toISOString(), now.toISOString(), new Date(now.getTime() + OUTBOX_RETRY_WINDOW_MS).toISOString());

        return result.changes ? { id: Number(result.lastInsertRowid), created: true } : { created: false };
    } catch (error) {
        console.error("Submission database: could not queue the Inquiry Manager copy", error?.code || error?.name || "error");
        return null;
    }
}

// Takes a pending item for `leaseMs` so no other sender works on it at the same time; the row, or null
export function claimOutboxItem(id, leaseMs = 60000) {
    const now = new Date();
    const row = open()
        .prepare(
            `UPDATE inquiry_outbox SET locked_until = ?
             WHERE id = ? AND status = 'pending' AND (locked_until IS NULL OR locked_until < ?)
             RETURNING *`
        )
        .get(new Date(now.getTime() + leaseMs).toISOString(), id, now.toISOString());
    return row ? { ...row, id: Number(row.id), attempts: Number(row.attempts) } : null;
}

// Pending items whose next attempt is due, oldest first
export function dueOutboxIds(limit = 30) {
    const now = new Date().toISOString();
    return open()
        .prepare(
            `SELECT id FROM inquiry_outbox
             WHERE status = 'pending' AND next_attempt_at <= ? AND (locked_until IS NULL OR locked_until < ?)
             ORDER BY next_attempt_at LIMIT ?`
        )
        .all(now, now, limit)
        .map((row) => Number(row.id));
}

// Result of one attempt. status: "delivered" | "pending" (retry at nextAttemptAt) | "failed"
export function recordOutboxResult(id, { status, httpStatus = null, errorCode = null, errorFields = [], inquiryId = null, nextAttemptAt = null }) {
    const now = new Date().toISOString();
    open()
        .prepare(
            `UPDATE inquiry_outbox SET
                status = ?, attempts = attempts + 1, locked_until = NULL, last_attempt_at = ?,
                last_http_status = ?, last_error_code = ?, last_error_fields = ?,
                inquiry_id = COALESCE(?, inquiry_id),
                delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END,
                next_attempt_at = COALESCE(?, next_attempt_at)
             WHERE id = ?`
        )
        .run(status, now, httpStatus, errorCode, errorFields.length ? errorFields.join(",") : null, inquiryId, status, now, nextAttemptAt, id);
}

// Counts and the items that need attention (no inquiry content: only IDs, codes and dates)
export function outboxSummary() {
    const db = open();
    const counts = { pending: 0, delivered: 0, failed: 0 };
    for (const row of db.prepare("SELECT status, COUNT(*) AS n FROM inquiry_outbox GROUP BY status").all()) counts[row.status] = Number(row.n);

    const columns = "submission_id, submission_row_id, attempts, created_at, last_attempt_at, next_attempt_at, last_http_status, last_error_code, last_error_fields";
    return {
        counts,
        oldestPendingAt: db.prepare("SELECT MIN(created_at) AS at FROM inquiry_outbox WHERE status = 'pending'").get()?.at || null,
        pending: db.prepare(`SELECT ${columns} FROM inquiry_outbox WHERE status = 'pending' ORDER BY created_at LIMIT 50`).all(),
        failed: db.prepare(`SELECT ${columns} FROM inquiry_outbox WHERE status = 'failed' ORDER BY id DESC LIMIT 50`).all(),
    };
}

// Puts failed items back in the queue (for example after the API key was fixed), with a new 24-hour window
export function requeueFailedOutbox() {
    const now = new Date();
    return Number(
        open()
            .prepare("UPDATE inquiry_outbox SET status = 'pending', locked_until = NULL, next_attempt_at = ?, retry_until = ? WHERE status = 'failed'")
            .run(now.toISOString(), new Date(now.getTime() + OUTBOX_RETRY_WINDOW_MS).toISOString()).changes
    );
}
