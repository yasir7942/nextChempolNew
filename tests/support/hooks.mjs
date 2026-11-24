// Module resolution for the tests, so server code runs in plain Node like it does in Next.js:
//   "@/..."      -> project root (with .js added when the import has no extension)
//   server-only  -> empty module (Next.js does the same on the server)
//   next/server  -> tests/support/next-server.mjs (after() collects the callbacks for the test to run)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server") return { url: pathToFileURL(path.join(ROOT, "tests", "support", "next-server.mjs")).href, shortCircuit: true };

    if (specifier.startsWith("@/")) {
        const base = path.join(ROOT, specifier.slice(2));
        const file = [base, `${base}.js`, `${base}.mjs`, path.join(base, "index.js")].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
}
