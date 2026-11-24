// Test stand-in for next/server: after() only collects the callbacks; runAfter() runs them,
// which is what Next.js does once the response has been sent.
const queue = (globalThis.__afterQueue ||= []);

export function after(callback) {
    queue.push(callback);
}

export async function runAfter() {
    while (queue.length) await queue.shift()();
}

export const pendingAfter = () => queue.length;
