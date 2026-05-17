/**
 * Post-build pre-render script.
 * Runs after `vite build` + `vite build --ssr src/entry-server.jsx`.
 * Generates static HTML for each SEO route so crawlers see real content.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const serverBundle = resolve(root, "dist/server/entry-server.js");
const clientHtml   = resolve(root, "dist/client/index.html");

const { render, SEO_PAGES } = await import(pathToFileURL(serverBundle).href);

const template = readFileSync(clientHtml, "utf-8");

function injectMeta(html, page) {
  let out = html;
  // title
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  // description
  out = out.replace(/(<meta name="description" content=")[^"]*(")/,
    `$1${escapeHtml(page.description)}$2`);
  // canonical
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/,
    `$1${escapeHtml(page.canonical)}$2`);
  // og:title
  out = out.replace(/(<meta property="og:title" content=")[^"]*(")/,
    `$1${escapeHtml(page.ogTitle || page.title)}$2`);
  // og:description
  out = out.replace(/(<meta property="og:description" content=")[^"]*(")/,
    `$1${escapeHtml(page.ogDesc || page.description)}$2`);
  // og:url
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/,
    `$1${escapeHtml(page.canonical)}$2`);
  // twitter:title
  out = out.replace(/(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${escapeHtml(page.ogTitle || page.title)}$2`);
  // twitter:description
  out = out.replace(/(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${escapeHtml(page.ogDesc || page.description)}$2`);
  return out;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const routes = Object.keys(SEO_PAGES);

for (const pathname of routes) {
  const page = SEO_PAGES[pathname];
  const appHtml = render(pathname);
  let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  html = injectMeta(html, page);

  if (pathname === "/") {
    writeFileSync(clientHtml, html);
    console.log(`✓ Pre-rendered / → dist/client/index.html`);
  } else {
    const slug = pathname.replace(/^\//, "");
    const outDir = resolve(root, "dist/client", slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html);
    console.log(`✓ Pre-rendered ${pathname} → dist/client/${slug}/index.html`);
  }
}
