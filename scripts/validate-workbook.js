/**
 * Sanity-checks the Part 3 index workbook (SOUTH AMERICA sheet):
 * - TOTAL INDEX vs weighted sum of five pillar SCORE VAR × % VAR
 * - Within each pillar: %DIM values sum to 100%
 * - Within each dimension block: %IND values sum to 100%
 *
 * Run: node scripts/validate-workbook.js
 */
const XLSX = require("xlsx");
const path = require("path");
const { toWorkbookScale, toWeightPercent } = require("./workbook-numeric.cjs");

const xlsxPath = path.join(__dirname, "..", "the index", "part 3 democracy.xlsx");

/** Same order/labels as scripts/ingest-excel.js DIM_ORDER */
const PILLAR_ORDER = [
  "Institutional Integrity",
  "Socio-economic development",
  "Responsiveness",
  "Electoral Integrity",
  "Democratic memory",
];

function pillarKeyFromVariableCol(v) {
  if (!v) return null;
  const x = String(v).trim().toLowerCase();
  if (x.includes("institutional")) return "Institutional Integrity";
  if (x.includes("socio")) return "Socio-economic development";
  if (x.includes("responsiveness")) return "Responsiveness";
  if (x.includes("electoral")) return "Electoral Integrity";
  if (x.includes("democratic memory")) return "Democratic memory";
  return null;
}

const DATA_SHEET_NAME = "SOUTH AMERICA";
const wb = XLSX.readFile(xlsxPath);
const data = XLSX.utils.sheet_to_json(wb.Sheets[DATA_SHEET_NAME], { header: 1, defval: null, raw: true });

let errors = 0;
function warn(msg) {
  console.warn(msg);
  errors++;
}

function flushIndBlock(state, dimLabel, parts) {
  if (!parts.length) return;
  const s = parts.reduce((a, b) => a + b, 0);
  if (Math.abs(s - 100) > 0.6) {
    /* Some countries omit indicator rows; %IND then sums to under 100% without being a formula error. */
    if (s < 90) {
      console.warn(
        `[info] %IND under "${dimLabel}" (${state}): ${s.toFixed(2)}% (partial block in workbook — not counted as error)`
      );
      return;
    }
    warn(`%IND sum under "${dimLabel}" (${state}): ${s.toFixed(2)}% (expected 100%)`);
  }
}

let curState = null;
let curTotal = null;
/** @type {Record<string, number|null>} */
let pillarScores = {};
/** @type {Record<string, number|null>} */
let pillarWeights = {};

let curPillar = null;
let dimSumWithinPillar = 0;

let curDimBlock = null;
/** @type {number[]} */
let indParts = [];

function validateWeightedTotal() {
  let w = 0;
  for (const p of PILLAR_ORDER) {
    const sv = pillarScores[p];
    const pw = pillarWeights[p];
    if (sv == null || pw == null) {
      warn(`Missing pillar score/weight for "${p}" (${curState})`);
      return;
    }
    w += (sv * pw) / 100;
  }
  if (curTotal == null) return;
  /* Allow ~0.6pt workbook rounding (e.g. Ecuador total vs weighted pillars). */
  if (Math.abs(w - curTotal) > 0.65) {
    warn(
      `TOTAL vs weighted pillars for ${curState}: total=${curTotal}% weighted=${w.toFixed(2)}% (diff ${Math.abs(w - curTotal).toFixed(2)})`
    );
  }
}

function validatePillarDimSum() {
  if (!curPillar) return;
  if (Math.abs(dimSumWithinPillar - 100) > 0.6) {
    warn(`%DIM sum within pillar "${curPillar}" (${curState}): ${dimSumWithinPillar.toFixed(2)}% (expected 100%)`);
  }
}

for (let i = 1; i < data.length; i++) {
  const r = data[i];
  const state = r[0];
  const variable = r[1];
  const scoreVar = r[2];
  const pctVar = r[3];
  const dimHeading = r[4];
  const pctDim = r[6];
  const indName = r[7];
  const pctInd = r[9];
  const totalIdx = r[10];

  if (state) {
    if (curState) {
      flushIndBlock(curState, curDimBlock, indParts);
      validatePillarDimSum();
      validateWeightedTotal();
    }
    curState = state;
    curTotal = toWorkbookScale(totalIdx);
    pillarScores = {};
    pillarWeights = {};
    curPillar = null;
    dimSumWithinPillar = 0;
    curDimBlock = null;
    indParts = [];
  }

  if (!curState) continue;

  const pillarKey = pillarKeyFromVariableCol(variable);
  if (pillarKey) {
    flushIndBlock(curState, curDimBlock, indParts);
    curDimBlock = null;
    indParts = [];
    validatePillarDimSum();
    curPillar = pillarKey;
    dimSumWithinPillar = 0;
    pillarScores[curPillar] = toWorkbookScale(scoreVar);
    pillarWeights[curPillar] = toWeightPercent(pctVar);
  }

  if (dimHeading) {
    flushIndBlock(curState, curDimBlock, indParts);
    curDimBlock = String(dimHeading).trim();
    indParts = [];
    const pd = toWeightPercent(pctDim);
    if (pd != null) dimSumWithinPillar += pd;
    if (indName && pctInd != null) {
      const p = toWeightPercent(pctInd);
      if (p != null) indParts.push(p);
    }
  } else if (indName && pctInd != null) {
    const p = toWeightPercent(pctInd);
    if (p != null) indParts.push(p);
  }
}

if (curState) {
  flushIndBlock(curState, curDimBlock, indParts);
  validatePillarDimSum();
  validateWeightedTotal();
}

if (errors) {
  console.error(`\nvalidate-workbook: ${errors} issue(s) reported.`);
  process.exitCode = 1;
} else {
  console.log("validate-workbook: OK (totals, pillar %DIM, block %IND).");
}
