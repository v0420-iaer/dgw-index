/**
 * Normalise Excel numeric cells for the index workbook.
 * - Use with sheet_to_json(…, { raw: true }) so underlying values keep decimals (0.8498) instead of "85%".
 * - Proportions 0–1 are mapped to 0–100. Values &gt;1 are kept as in the sheet (may exceed 100; no hidden clamp in export).
 * Used by ingest-excel.js and validate-workbook.js.
 */
"use strict";

/** Text that means a cell is empty or explicitly unavailable (same intent as isUnavailable in ingest). */
function isTextUnavailable(s) {
  if (s == null) return true;
  if (typeof s === "string") {
    const t = s.trim();
    if (t === "") return true;
    const low = t.toLowerCase();
    if (
      low === "n/a" ||
      low === "na" ||
      low === "#n/a" ||
      low === "—" ||
      low === "-" ||
      low === "not available" ||
      low === "data not available" ||
      low === "data not available." ||
      low.includes("data not available")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Pillar, variable, and total-index scores: proportions 0–1 become 0–100; pre-scale values stay as in Excel.
 * @param {string|number|null|undefined} v
 * @returns {number|null}
 */
function toWorkbookScale(v) {
  if (v == null || v === "") return null;
  if (isTextUnavailable(v)) return null;
  if (typeof v === "number" && !Number.isNaN(v)) {
    if (v === 0) return 0;
    if (v > 0 && v <= 1) return v * 100;
    return v;
  }
  const t = String(v).trim();
  if (t === "" || t === "—" || t === "-") return null;
  const n = parseFloat(t.replace(/\s/g, "").replace("%", "").replace(/,/g, "."));
  if (Number.isNaN(n)) return null;
  if (n > 0 && n <= 1) return n * 100;
  return n;
}

/**
 * Weights in % (same rules as toWorkbookScale: 0.3 or 30 → 30).
 * @param {string|number|null|undefined} v
 * @returns {number|null}
 */
function toWeightPercent(v) {
  return toWorkbookScale(v);
}

/**
 * Indicator cell value on the public 0–100 display scale. Proportions 0–1 → ×100. Values in (1, 100] kept as
 * (already in index points, including 2% as 2). Values &gt; 100 preserved (Guatemala-style out-of-range, unclamped).
 * @param {string|number|null|undefined} v
 * @returns {number|null}
 */
function toIndicator0to100(v) {
  if (v == null || v === "") return null;
  if (isTextUnavailable(v)) return null;
  if (typeof v === "number" && !Number.isNaN(v)) {
    if (v >= 0 && v <= 1) return v * 100;
    return v;
  }
  const t = String(v).trim().replace(/,/g, ".");
  if (t === "" || t === "—" || t === "-") return null;
  if (isTextUnavailable(t)) return null;
  const n = parseFloat(t);
  if (Number.isNaN(n)) return null;
  if (n >= 0 && n <= 1) return n * 100;
  return n;
}

/**
 * All indicator ids expected on every country (same set as country-profiles INDEX_BLUEPRINT). Missing rows in
 * the sheet are filled in ingest with workbookIndicatorUnavailable = true.
 */
const ALL_BLUEPRINT_INDICATOR_IDS = [
  "equal_protection_index",
  "rule_of_law_index",
  "civil_liberties",
  "access_to_justice",
  "division_of_power_index",
  "high_court_independence",
  "control_of_corruption",
  "corruption_perception_index",
  "diagonal_accountability_index",
  "open_government_index",
  "government_censorship_effort",
  "social_safety_nets",
  "educational_equality",
  "health_equality",
  "access_public_services_social_group",
  "hdi",
  "infant_mortality_rate",
  "freedom_academic_cultural_expression",
  "gini_coefficient",
  "power_distributed_socioeconomic",
  "poverty_headcount_ratio",
  "deliberative_component_index",
  "reasoned_justification",
  "steering_capacity",
  "political_culture",
  "clean_elections_index",
  "election_free_and_fair",
  "opposition_parties_autonomy",
  "share_population_suffrage",
  "election_other_electoral_violence",
  "election_losers_accept_results",
  "election_government_intimidation",
  "truth_commission",
  "reparatory_policies",
  "amnesty_law",
  "domestic_trials",
];

function ensureAllBlueprintIndicatorSlots(country) {
  const c = country;
  for (const id of ALL_BLUEPRINT_INDICATOR_IDS) {
    const hasScore = c.workbookIndicatorScores0100[id] != null;
    const marked = c.workbookIndicatorUnavailable[id] === true;
    if (!hasScore && !marked) c.workbookIndicatorUnavailable[id] = true;
  }
}

module.exports = {
  toWorkbookScale,
  toWeightPercent,
  toIndicator0to100,
  isTextUnavailable,
  ALL_BLUEPRINT_INDICATOR_IDS,
  ensureAllBlueprintIndicatorSlots,
};
