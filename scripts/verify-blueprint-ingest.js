/**
 * Ensures country-profiles INDEX_BLUEPRINT indicator ids are the same set the
 * ingest step can fill (every id appears with a score or unavailable flag for
 * at least one country in data/ingested-excel.json).
 *
 * Run: node scripts/verify-blueprint-ingest.js
 */
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "country-profiles.html");
const jsonPath = path.join(__dirname, "..", "data", "ingested-excel.json");

const html = fs.readFileSync(htmlPath, "utf8");
const slice = html.split("const INDEX_BLUEPRINT")[1].split("];")[0];
const blueprintIds = [...new Set([...slice.matchAll(/\{ id: "([^"]+)"/g)].map((x) => x[1]))];

const j = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const names = j.countryNamesSorted || Object.keys(j.workbookIndicatorScores0100 || {});

/** Every country must have each blueprint indicator with either a score or an explicit unavailable flag. */
const gaps = [];
for (const c of names) {
  const s = j.workbookIndicatorScores0100[c] || {};
  const u = j.workbookIndicatorUnavailable[c] || {};
  for (const id of blueprintIds) {
    if (s[id] == null && !u[id]) gaps.push(`${c}: ${id}`);
  }
}
if (gaps.length) {
  console.error("verify-blueprint-ingest: missing score/unavailable for:\n" + gaps.slice(0, 50).join("\n"));
  if (gaps.length > 50) console.error("… and", gaps.length - 50, "more");
  process.exit(1);
}

const extraByCountry = [];
for (const c of names) {
  const keys = Object.keys(j.workbookIndicatorScores0100[c] || {});
  for (const k of keys) {
    if (!blueprintIds.includes(k)) extraByCountry.push(`${c}: ${k}`);
  }
}
if (extraByCountry.length) {
  console.error("verify-blueprint-ingest: ingest has indicator keys not in blueprint:\n" + extraByCountry.slice(0, 40).join("\n"));
  process.exit(1);
}

console.log(`verify-blueprint-ingest: OK (${blueprintIds.length} indicators, ${names.length} countries).`);
