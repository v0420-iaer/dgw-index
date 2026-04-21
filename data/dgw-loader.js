/**
 * Ensures window.__DGW__ is populated for index and country-profiles.
 * - Uses embedded script data when present.
 * - If missing or empty, fetches data/ingested-excel.json (works when served over http/https).
 */
(function () {
  function stripCountryDataForWeb(full) {
    const countryDataForWeb = {};
    const raw = full.countryData || {};
    for (const k of Object.keys(raw)) {
      const v = raw[k];
      countryDataForWeb[k] = {
        score: v.score,
        category: v.category,
        color: v.color,
        regionalRank: v.regionalRank,
      };
    }
    return countryDataForWeb;
  }

  function hasUsefulDgw(d) {
    return !!(d && d.countryData && Object.keys(d.countryData).length);
  }

  function assignBundleFromFullJson(full) {
    window.__DGW__ = {
      countryNamesSorted: full.countryNamesSorted || [],
      countryData: stripCountryDataForWeb(full),
      workbookDimensionScores: full.workbookDimensionScores || {},
      workbookIndicatorScores0100: full.workbookIndicatorScores0100 || {},
      workbookVariableScores0100: full.workbookVariableScores0100 || {},
      workbookVariableUnavailable: full.workbookVariableUnavailable || {},
      workbookIndicatorUnavailable: full.workbookIndicatorUnavailable || {},
    };
  }

  /**
   * @param {(err: Error | null, dgw: object | null) => void} callback
   */
  window.__ensureDGW = function (callback) {
    if (hasUsefulDgw(window.__DGW__)) {
      callback(null, window.__DGW__);
      return;
    }
    var isFile = window.location.protocol === "file:";
    if (isFile) {
      callback(
        new Error(
          "Index data did not load. Ensure data/ingested-excel.js exists next to this page, run `npm run ingest:excel`, or open the site via a local server (e.g. `npx serve .`) so data can load."
        ),
        null
      );
      return;
    }
    var jsonUrl = new URL("data/ingested-excel.json", window.location.href).href;
    fetch(jsonUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("Could not load " + jsonUrl + " (" + r.status + ")");
        return r.json();
      })
      .then(function (full) {
        if (!full.countryData || !Object.keys(full.countryData).length) {
          throw new Error("ingested-excel.json has no country data. Run npm run ingest:excel.");
        }
        assignBundleFromFullJson(full);
        callback(null, window.__DGW__);
      })
      .catch(function (e) {
        callback(e instanceof Error ? e : new Error(String(e)), null);
      });
  };
})();
