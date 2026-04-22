/**
 * Reads the index workbook (Part 3) xlsx — sheets SOUTH AMERICA + CENTROAMERICA — and writes data/ingested-excel.json + .js
 * Run: node scripts/ingest-excel.js
 */
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { categoryFromScore, colorFromScore } = require("./democracy-scale.cjs");

const xlsxPath = path.join(__dirname, "..", "the index", "part 3 democracy.xlsx");
/** Regional data sheets (same column layout in each). */
const DATA_SHEET_NAMES = ["SOUTH AMERICA", "CENTROAMERICA"];

function parsePct(s) {
  if (s == null || s === "") return null;
  const m = String(s).replace(/\s/g, "").match(/([0-9]+(?:\.[0-9]+)?)%?/);
  return m ? parseFloat(m[1]) : null;
}

function parseIndTo0100(s) {
  if (s == null || s === "") return null;
  const t = String(s).trim().replace(",", ".").replace(/\s+$/, "");
  const n = parseFloat(t);
  if (Number.isNaN(n)) return null;
  if (n <= 1 && n >= 0) return Math.round(n * 1000) / 10;
  return n;
}

/** Cell text that means the indicator is not reported (weight may be redistributed in the workbook). */
function isUnavailableIndicatorCell(s) {
  if (s == null) return true;
  const t = String(s).trim();
  if (t === "") return true;
  const low = t.toLowerCase();
  return (
    low === "n/a" ||
    low === "na" ||
    low === "#n/a" ||
    low === "—" ||
    low === "-" ||
    low === "not available" ||
    low === "data not available" ||
    low === "data not available." ||
    low.includes("data not available")
  );
}

/** Exact pillar names as in Excel column “Variable” (must match keys in co.dims). */
const DIM_ORDER = [
  "Institutional Integrity",
  "Socio-economic development",
  "Responsiveness",
  "Electoral Integrity",
  "Democratic memory",
];

function normDim(s) {
  if (!s) return null;
  const x = String(s).trim().toLowerCase();
  if (x.includes("institutional")) return "Institutional Integrity";
  if (x.includes("socio")) return "Socio-economic development";
  if (x.includes("responsiveness")) return "Responsiveness";
  if (x.includes("electoral")) return "Electoral Integrity";
  if (x.includes("democratic memory")) return "Democratic memory";
  return null;
}

const BLOCK_HEADING_TO_ID = {
  "rule of law": "rule_of_law",
  "separation of powers": "separation_of_powers",
  accountability: "accountability",
  transparency: "transparency",
  "welfare frameworks": "welfare_frameworks",
  "living standards": "living_standards",
  "distribution of resources": "distribution_of_resources",
  discourse: "discourse",
  "policies and legitimacy": "policies_and_legitimacy",
  "free and fair elections": "free_and_fair_elections",
  "peaceful transition of power": "peaceful_transition_of_power",
  reparations: "reparations",
  legal: "legal",
};

function normHeading(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function indKeyFromName(name) {
  const k = normHeading(name);
  const map = {
    "equal protection index": "equal_protection_index",
    "rule of law index": "rule_of_law_index",
    "civil liberties": "civil_liberties",
    "access to justice": "access_to_justice",
    "division of power index": "division_of_power_index",
    "separations of powers": "division_of_power_index",
    "separations of power": "division_of_power_index",
    "separation of power": "division_of_power_index",
    "high court independence": "high_court_independence",
    "control of corruption": "control_of_corruption",
    "corruption perception index": "corruption_perception_index",
    "corruption perceptions index": "corruption_perception_index",
    "diagonal accountability index": "diagonal_accountability_index",
    "open government index": "open_government_index",
    "government censorship effort": "government_censorship_effort",
    "social safety nets": "social_safety_nets",
    "educational equality": "educational_equality",
    "health equality": "health_equality",
    hdi: "hdi",
    "infant mortality rate": "infant_mortality_rate",
    "infant mortality rate (inverted)": "infant_mortality_rate",
    "freedom of academic & cultural expression": "freedom_academic_cultural_expression",
    "access to public services by social group": "access_public_services_social_group",
    "access to public services by socio-economic position": "access_public_services_social_group",
    "gini coefficient": "gini_coefficient",
    "gini coefficient (inverted)": "gini_coefficient",
    "power distributed by socioeconomic position": "power_distributed_socioeconomic",
    "poverty headcount ratio": "poverty_headcount_ratio",
    "poverty headcount ratio (inverted)": "poverty_headcount_ratio",
    "deliberative component index": "deliberative_component_index",
    "reasoned justification": "reasoned_justification",
    "steering capacity": "steering_capacity",
    "steering capability": "steering_capacity",
    "political culture": "political_culture",
    "approval of democracy": "political_culture",
    "clean elections index": "clean_elections_index",
    "election free and fair": "election_free_and_fair",
    "opposition parties autonomy": "opposition_parties_autonomy",
    "share of population with suffrage": "share_population_suffrage",
    "election other electoral violence": "election_other_electoral_violence",
    "election losers accept results": "election_losers_accept_results",
    "election government intimidation": "election_government_intimidation",
    "truth commission": "truth_commission",
    "reparatory policies": "reparatory_policies",
    "amnesty law": "amnesty_law",
    "domestic trials": "domestic_trials",
  };
  return map[k] || null;
}

function mapStateName(state) {
  if (state === "Brasil") return "Brazil";
  if (state === "Perú") return "Peru";
  return state;
}

function clamp0100(v) {
  if (v == null) return null;
  return Math.max(0, Math.min(100, v));
}

function ensureCountry(countries, curState) {
  if (!countries[curState]) {
    countries[curState] = {
      total: null,
      dims: {},
      workbookIndicatorScores0100: {},
      workbookVariableScores0100: {},
      workbookVariableUnavailable: {},
      workbookIndicatorUnavailable: {},
    };
  }
}

function ingestSheetData(data, countries) {
  let curState = null;
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const state = r[0];
    const variableCol = r[1];
    const scoreVar = r[2];
    const dimHeading = r[4];
    const scoreDim = r[5];
    const indName = r[7];
    const scoreInd = r[8];
    const totalIdx = r[10];

    if (state) {
      curState = mapStateName(state);
      ensureCountry(countries, curState);
      const t = parsePct(totalIdx);
      if (t != null) countries[curState].total = t;
    }
    if (!curState) continue;
    ensureCountry(countries, curState);
    const c = countries[curState];

    if (variableCol) {
      const d = normDim(variableCol);
      if (d) {
        const sv = parsePct(scoreVar);
        if (sv != null) c.dims[d] = sv;
      }
    }

    if (dimHeading) {
      const bid = BLOCK_HEADING_TO_ID[normHeading(dimHeading)];
      if (bid) {
        if (isUnavailableIndicatorCell(scoreDim)) {
          c.workbookVariableUnavailable[bid] = true;
        } else {
          const sd = parsePct(scoreDim);
          if (sd != null) {
            c.workbookVariableScores0100[bid] = clamp0100(sd);
          }
        }
      }
    }

    if (indName) {
      const iid = indKeyFromName(indName);
      if (iid) {
        if (isUnavailableIndicatorCell(scoreInd)) {
          c.workbookIndicatorUnavailable[iid] = true;
        } else {
          const si = parseIndTo0100(scoreInd);
          if (si != null) c.workbookIndicatorScores0100[iid] = si;
          else c.workbookIndicatorUnavailable[iid] = true;
        }
      }
    }
  }
}

const wb = XLSX.readFile(xlsxPath);
const countries = {};
for (const sheetName of DATA_SHEET_NAMES) {
  if (!wb.Sheets[sheetName]) {
    throw new Error(
      `Sheet "${sheetName}" not found in ${path.basename(xlsxPath)}. Available: ${wb.SheetNames.join(", ")}`
    );
  }
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
  ingestSheetData(data, countries);
}

const names = Object.keys(countries).sort((a, b) => (countries[b].total ?? 0) - (countries[a].total ?? 0));

const workbookDimensionScores = {};
const workbookIndicatorScores0100 = {};
const workbookVariableScores0100 = {};
const workbookVariableUnavailable = {};
const workbookIndicatorUnavailable = {};

for (const name of names) {
  const co = countries[name];
  workbookDimensionScores[name] = DIM_ORDER.map((d) => {
    const v = co.dims[d];
    return v == null ? null : clamp0100(v);
  });
  workbookIndicatorScores0100[name] = co.workbookIndicatorScores0100;
  workbookVariableScores0100[name] = co.workbookVariableScores0100;
  workbookVariableUnavailable[name] = co.workbookVariableUnavailable || {};
  workbookIndicatorUnavailable[name] = co.workbookIndicatorUnavailable || {};
}

const countryData = {};
let rank = 1;
for (const name of names) {
  const t = countries[name].total;
  const category = categoryFromScore(t);
  const color = colorFromScore(t);
  countryData[name] = { score: t, category, color, regionalRank: rank++ };
}

const out = {
  countryNamesSorted: names,
  countryData,
  workbookDimensionScores,
  workbookIndicatorScores0100,
  workbookVariableScores0100,
  workbookVariableUnavailable,
  workbookIndicatorUnavailable,
};

const outPath = path.join(__dirname, "..", "data", "ingested-excel.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Wrote", outPath);

const countryDataForWeb = {};
for (const [k, v] of Object.entries(countryData)) {
  countryDataForWeb[k] = { score: v.score, category: v.category, color: v.color, regionalRank: v.regionalRank };
}
const bundle = {
  countryNamesSorted: names,
  countryData: countryDataForWeb,
  workbookDimensionScores,
  workbookIndicatorScores0100,
  workbookVariableScores0100,
  workbookVariableUnavailable,
  workbookIndicatorUnavailable,
};
const jsPath = path.join(__dirname, "..", "data", "ingested-excel.js");
fs.writeFileSync(
  jsPath,
  "/* Generated by scripts/ingest-excel.js from the index workbook — do not edit by hand. */\nwindow.__DGW__ = " +
    JSON.stringify(bundle, null, 2) +
    ";\n",
  "utf8"
);
console.log("Wrote", jsPath);

const allIds = new Set();
for (const sheetName of DATA_SHEET_NAMES) {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
  for (let i = 1; i < data.length; i++) {
    if (data[i][7]) allIds.add(String(data[i][7]).trim());
  }
}
const unmapped = [...allIds].filter((n) => !indKeyFromName(n));
if (unmapped.length) console.warn("Unmapped indicator labels:", unmapped);
