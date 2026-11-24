// ID made in the browser when a form opens, sent with the form as clientSubmissionId.
// The server builds the Inquiry Manager submission_id from it, so a double click or a re-post of the
// same form is stored once. Make a new one after each successful submit.
// crypto.randomUUID needs HTTPS or localhost; elsewhere (http on a LAN address) a random fallback is used.
export function newSubmissionKey() {
    try {
        if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
    } catch {
        // not available here
    }
    const part = () => Math.random().toString(36).slice(2, 12);
    return `${Date.now().toString(36)}-${part()}${part()}`;
}
