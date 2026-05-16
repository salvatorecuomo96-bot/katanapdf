/**
 * Post-build pre-render script.
 * Runs after `vite build` + `vite build --ssr src/entry-server.jsx`.
 * Injects the server-rendered Homepage HTML into dist/client/index.html
 * so crawlers see real content on the first wave without executing JS.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const serverBundle = resolve(root, "dist/server/entry-server.js");
const clientHtml   = resolve(root, "dist/client/index.html");

const { render } = await import(serverBundle);

const template = readFileSync(clientHtml, "utf-8");
const appHtml  = render();

const html = template.replace(
  '<div id="root"></div>',
  `<div id="root">${appHtml}</div>`
);

writeFileSync(clientHtml, html);
console.log("✓ Pre-rendered index.html — homepage HTML injected for crawlers.");
