import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 800 },
];

const paths = [
  "index.html",
  "country-profiles.html",
  "indicators.html",
  "references.html",
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(__dirname, safe === "/" ? "index.html" : safe.replace(/^\//, ""));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    res.end(data);
  });
});

await new Promise((resolve, reject) => {
  server.listen(0, "127.0.0.1", (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const { port } = server.address();

let failed = false;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const htmlPath of paths) {
      const url = `http://127.0.0.1:${port}/${htmlPath}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(2200);
        const { scrollW, innerW, hasNav } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          hasNav: !!document.querySelector("nav"),
        }));
        const overflow = scrollW > innerW + 4;
        if (overflow) {
          console.error(`FAIL overflow: ${htmlPath} @ ${vp.name} (${vp.width}px) scrollWidth=${scrollW} innerWidth=${innerW}`);
          failed = true;
        } else {
          console.log(`OK ${htmlPath} @ ${vp.name} (${vp.width}px)`);
        }
        if (!hasNav) {
          console.error(`FAIL missing nav: ${htmlPath}`);
          failed = true;
        }
      } catch (e) {
        console.error(`FAIL load ${htmlPath} @ ${vp.name}:`, e.message);
        failed = true;
      }
    }
  }
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
