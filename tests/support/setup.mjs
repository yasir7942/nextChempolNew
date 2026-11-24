// Loaded with `node --import` before every test file (npm test):
// a private temporary database and module resolution for Next.js-style imports.
import { register } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chempol-tests-"));
process.env.INQUIRY_DB_PATH = path.join(dir, "inquiries.sqlite");

register("./hooks.mjs", import.meta.url);
