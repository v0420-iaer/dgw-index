/**
 * Shared blueprint, per-country metadata, and score-rendering helpers used by
 * country-profiles.html and comparison.html. Exposed on window.DGWBlueprint.
 */
(function (global) {
  "use strict";

  /** Pillar names exactly as in the workbook (Excel column "Variable"). */
  const DIMENSION_LABELS = [
    "Institutional Integrity",
    "Socio-economic development",
    "Responsiveness",
    "Electoral Integrity",
    "Democratic memory",
  ];
  const DIMENSION_WEIGHTS_PCT = [30, 20, 20, 20, 10];

  /**
   * Hierarchy: dimension (pillar) → variable (Excel "Dimension" column) → indicator.
   * Labels and % weights match the index workbook (Part 3).
   */
  const INDEX_BLUEPRINT = [
    {
      label: "Dimension 1",
      title: "Institutional Integrity",
      weightPct: 30,
      blocks: [
        {
          id: "rule_of_law",
          heading: "Rule of Law",
          dimWeightPct: 30,
          indicators: [
            { id: "equal_protection_index", name: "Equal protection index", weightInDimPct: 15 },
            { id: "rule_of_law_index", name: "Rule of law index", weightInDimPct: 50 },
            { id: "civil_liberties", name: "Civil liberties", weightInDimPct: 15 },
            { id: "access_to_justice", name: "Access to justice", weightInDimPct: 20 },
          ],
        },
        {
          id: "separation_of_powers",
          heading: "Separation of powers",
          dimWeightPct: 25,
          indicators: [
            { id: "division_of_power_index", name: "Separations of power", weightInDimPct: 70 },
            { id: "high_court_independence", name: "High court independence", weightInDimPct: 30 },
          ],
        },
        {
          id: "accountability",
          heading: "Accountability",
          dimWeightPct: 30,
          indicators: [
            { id: "control_of_corruption", name: "Control of corruption", weightInDimPct: 35 },
            { id: "corruption_perception_index", name: "Corruption perceptions index", weightInDimPct: 30 },
            { id: "diagonal_accountability_index", name: "Diagonal accountability index", weightInDimPct: 35 },
          ],
        },
        {
          id: "transparency",
          heading: "Transparency",
          dimWeightPct: 15,
          indicators: [
            { id: "open_government_index", name: "Open government index", weightInDimPct: 60 },
            { id: "government_censorship_effort", name: "Government censorship effort", weightInDimPct: 40 },
          ],
        },
      ],
    },
    {
      label: "Dimension 2",
      title: "Socio-economic development",
      weightPct: 20,
      blocks: [
        {
          id: "welfare_frameworks",
          heading: "Welfare Frameworks",
          dimWeightPct: 35,
          indicators: [
            { id: "social_safety_nets", name: "Social safety nets", weightInDimPct: 30 },
            { id: "educational_equality", name: "Educational equality", weightInDimPct: 20 },
            { id: "health_equality", name: "Health equality", weightInDimPct: 20 },
            { id: "access_public_services_social_group", name: "Access to public services by socio-economic position", weightInDimPct: 30 },
          ],
        },
        {
          id: "living_standards",
          heading: "Living Standards",
          dimWeightPct: 40,
          indicators: [
            { id: "hdi", name: "HDI", weightInDimPct: 50 },
            { id: "infant_mortality_rate", name: "Infant mortality rate (inverted)", weightInDimPct: 30 },
            { id: "freedom_academic_cultural_expression", name: "Freedom of academic & cultural expression", weightInDimPct: 20 },
          ],
        },
        {
          id: "distribution_of_resources",
          heading: "Distribution of Resources",
          dimWeightPct: 25,
          indicators: [
            { id: "gini_coefficient", name: "Gini Coefficient (inverted)", weightInDimPct: 25 },
            { id: "power_distributed_socioeconomic", name: "Power distributed by socioeconomic position", weightInDimPct: 50 },
            { id: "poverty_headcount_ratio", name: "Poverty headcount ratio (inverted)", weightInDimPct: 25 },
          ],
        },
      ],
    },
    {
      label: "Dimension 3",
      title: "Responsiveness",
      weightPct: 20,
      blocks: [
        {
          id: "discourse",
          heading: "Discourse",
          dimWeightPct: 45,
          indicators: [
            { id: "deliberative_component_index", name: "Deliberative component index", weightInDimPct: 60 },
            { id: "reasoned_justification", name: "Reasoned justification", weightInDimPct: 40 },
          ],
        },
        {
          id: "policies_and_legitimacy",
          heading: "Policies and legitimacy",
          dimWeightPct: 55,
          indicators: [
            { id: "steering_capacity", name: "Steering Capability", weightInDimPct: 60 },
            { id: "political_culture", name: "Approval of democracy", weightInDimPct: 40 },
          ],
        },
      ],
    },
    {
      label: "Dimension 4",
      title: "Electoral Integrity",
      weightPct: 20,
      blocks: [
        {
          id: "free_and_fair_elections",
          heading: "Free and fair elections",
          dimWeightPct: 55,
          indicators: [
            { id: "clean_elections_index", name: "Clean elections index", weightInDimPct: 35 },
            { id: "election_free_and_fair", name: "Election free and fair", weightInDimPct: 35 },
            { id: "opposition_parties_autonomy", name: "Opposition parties autonomy", weightInDimPct: 15 },
            { id: "share_population_suffrage", name: "Share of population with suffrage", weightInDimPct: 15 },
          ],
        },
        {
          id: "peaceful_transition_of_power",
          heading: "Peaceful transition of power",
          dimWeightPct: 45,
          indicators: [
            { id: "election_other_electoral_violence", name: "Election other electoral violence", weightInDimPct: 30 },
            { id: "election_losers_accept_results", name: "Election losers accept results", weightInDimPct: 30 },
            { id: "election_government_intimidation", name: "Election government intimidation", weightInDimPct: 40 },
          ],
        },
      ],
    },
    {
      label: "Dimension 5",
      title: "Democratic memory",
      weightPct: 10,
      blocks: [
        {
          id: "reparations",
          heading: "Reparations",
          dimWeightPct: 60,
          indicators: [
            { id: "truth_commission", name: "Truth commission", weightInDimPct: 50 },
            { id: "reparatory_policies", name: "Reparatory policies", weightInDimPct: 50 },
          ],
        },
        {
          id: "legal",
          heading: "Legal",
          dimWeightPct: 40,
          indicators: [
            { id: "amnesty_law", name: "Amnesty law", weightInDimPct: 60 },
            { id: "domestic_trials", name: "Domestic trials", weightInDimPct: 40 },
          ],
        },
      ],
    },
  ];

  /** World Development Indicators SP.POP.TOTL — latest year returned by the World Bank API (retrieved 2026-04-18). */
  const WORLD_BANK_POP_YEAR = 2024;

  /**
   * Per-country profile metadata. Set reparationsExcluded: true when the Reparations
   * sub-component (Democratic memory) is not used. West African entries currently leave
   * president/wbPop empty; the country profile hero hides those rows when missing.
   */
  const profileMeta = {
    "Uruguay": { region: "Latin America", wbPop: 3386588, capital: "Montevideo", iso2: "UY", president: "Yamandú Orsi", capitalLon: -56.1645, capitalLat: -34.9011 },
    "Chile": { region: "Latin America", wbPop: 19764771, capital: "Santiago de Chile", iso2: "CL", president: "José Antonio Kast", capitalLon: -70.6483, capitalLat: -33.4489 },
    "Brasil": { region: "Latin America", wbPop: 211998573, capital: "Brasília, Distrito Federal", iso2: "BR", president: "Luiz Inácio Lula da Silva", capitalLon: -47.8828, capitalLat: -15.7939 },
    "Argentina": { region: "Latin America", wbPop: 45696159, capital: "Ciudad Autónoma de Buenos Aires", iso2: "AR", president: "Javier Milei", capitalLon: -58.3816, capitalLat: -34.6037 },
    "Colombia": { region: "Latin America", wbPop: 52886363, capital: "Bogotá, Distrito Capital", iso2: "CO", president: "Gustavo Petro", capitalLon: -74.0721, capitalLat: 4.7110 },
    "Costa Rica": { region: "Latin America", wbPop: 5129910, capital: "San José", iso2: "CR", president: "Rodrigo Chaves Robles", capitalLon: -84.0907, capitalLat: 9.9281 },
    "Dominican Republic": { region: "Latin America", wbPop: 11427557, capital: "Santo Domingo de Guzmán", iso2: "DO", president: "Luis Abinader", capitalLon: -69.9312, capitalLat: 18.4861 },
    "Panama": { region: "Latin America", wbPop: 4515577, capital: "Ciudad de Panamá", iso2: "PA", president: "José Raúl Mulino", capitalLon: -79.5197, capitalLat: 8.9943 },
    "Ecuador": { region: "Latin America", wbPop: 18135478, capital: "San Francisco de Quito", iso2: "EC", president: "Daniel Noboa", capitalLon: -78.4678, capitalLat: -0.1807 },
    "Perú": { region: "Latin America", wbPop: 34217848, capital: "Lima, Ciudad de los Reyes", iso2: "PE", president: "Dina Boluarte", capitalLon: -77.0428, capitalLat: -12.0464 },
    "Paraguay": { region: "Latin America", wbPop: 6929153, capital: "Nuestra Señora Santa María de la Asunción", iso2: "PY", president: "Santiago Peña", capitalLon: -57.5759, capitalLat: -25.2637 },
    "Guatemala": { region: "Latin America", wbPop: 18406359, capital: "Nueva Guatemala de la Asunción", iso2: "GT", president: "Bernardo Arévalo", capitalLon: -90.5133, capitalLat: 14.6349 },
    "Bolivia": { region: "Latin America", wbPop: 12413315, capital: "Nuestra Señora de La Paz (sede de gobierno); Sucre (capital constitucional)", iso2: "BO", president: "Luis Arce", capitalLon: -68.1193, capitalLat: -16.4897 },
    "Suriname": { region: "Latin America", wbPop: 634431, capital: "Paramaribo", iso2: "SR", president: "Chan Santokhi", capitalLon: -55.2038, capitalLat: 5.8520 },
    "Mexico": { region: "Latin America", wbPop: 130861007, capital: "Ciudad de México", iso2: "MX", president: "Claudia Sheinbaum Pardo", capitalLon: -99.1332, capitalLat: 19.4326 },
    "Honduras": { region: "Latin America", wbPop: 10825703, capital: "Tegucigalpa, Distrito Central", iso2: "HN", president: "Nasry Asfura", capitalLon: -87.2068, capitalLat: 14.0723 },
    "Guyana": { region: "Latin America", wbPop: 831087, capital: "Georgetown", iso2: "GY", president: "Mohamed Irfaan Ali", capitalLon: -58.1551, capitalLat: 6.8013, reparationsExcluded: true },
    "El Salvador": { region: "Latin America", wbPop: 6338193, capital: "San Salvador", iso2: "SV", president: "Nayib Bukele", capitalLon: -89.2182, capitalLat: 13.6929 },
    "Cuba": { region: "Latin America", wbPop: 10979783, capital: "Ciudad de La Habana", iso2: "CU", president: "Miguel Díaz-Canel", capitalLon: -82.3666, capitalLat: 23.1136 },
    "Haiti": { region: "Latin America", wbPop: 11772557, capital: "Port-au-Prince", iso2: "HT", president: "Alix Didier Fils-Aimé (primer ministro, transición)", capitalLon: -72.3074, capitalLat: 18.5944 },
    "Nicaragua": { region: "Latin America", wbPop: 6916140, capital: "Leal Villa de Santiago de Managua", iso2: "NI", president: "Daniel Ortega y Rosario Murillo (copresidencia)", capitalLon: -86.2514, capitalLat: 12.1364 },
    "Venezuela": { region: "Latin America", wbPop: 28405543, capital: "Santiago de León de Caracas", iso2: "VE", president: "Delcy Rodríguez (presidenta encargada)", capitalLon: -66.9036, capitalLat: 10.4806 },

    "Benin": { region: "West Africa", wbPop: null, capital: "Porto-Novo (capital constitucional); Cotonou (sede de gobierno)", iso2: "BJ", president: "", capitalLon: 2.6253, capitalLat: 6.4991 },
    "Burkina Faso": { region: "West Africa", wbPop: null, capital: "Ouagadougou", iso2: "BF", president: "", capitalLon: -1.5271, capitalLat: 12.3682 },
    "Cape Verde": { region: "West Africa", wbPop: null, capital: "Praia", iso2: "CV", president: "", capitalLon: -23.5095, capitalLat: 14.9163 },
    "Côte d'Ivoire": { region: "West Africa", wbPop: null, capital: "Yamoussoukro (capital constitucional); Abidjan (capital económica)", iso2: "CI", president: "", capitalLon: -5.2776, capitalLat: 6.8200 },
    "The Gambia": { region: "West Africa", wbPop: null, capital: "Banjul", iso2: "GM", president: "", capitalLon: -16.5628, capitalLat: 13.4410 },
    "Ghana": { region: "West Africa", wbPop: null, capital: "Accra", iso2: "GH", president: "", capitalLon: -0.2012, capitalLat: 5.5571 },
    "Guinea": { region: "West Africa", wbPop: null, capital: "Conakry", iso2: "GN", president: "", capitalLon: -13.6998, capitalLat: 9.5171 },
    "Guinea-Bissau": { region: "West Africa", wbPop: null, capital: "Bissau", iso2: "GW", president: "", capitalLon: -15.5831, capitalLat: 11.8613 },
    "Liberia": { region: "West Africa", wbPop: null, capital: "Monrovia", iso2: "LR", president: "", capitalLon: -10.8060, capitalLat: 6.3204 },
    "Mali": { region: "West Africa", wbPop: null, capital: "Bamako", iso2: "ML", president: "", capitalLon: -8.0003, capitalLat: 12.6493 },
    "Mauritania": { region: "West Africa", wbPop: null, capital: "Nouakchott", iso2: "MR", president: "", capitalLon: -15.9780, capitalLat: 18.0792 },
    "Niger": { region: "West Africa", wbPop: null, capital: "Niamey", iso2: "NE", president: "", capitalLon: 2.1098, capitalLat: 13.5248 },
    "Nigeria": { region: "West Africa", wbPop: null, capital: "Abuja", iso2: "NG", president: "", capitalLon: 7.4893, capitalLat: 9.0643 },
    "Senegal": { region: "West Africa", wbPop: null, capital: "Dakar", iso2: "SN", president: "", capitalLon: -17.4479, capitalLat: 14.6934 },
    "Sierra Leone": { region: "West Africa", wbPop: null, capital: "Freetown", iso2: "SL", president: "", capitalLon: -13.2680, capitalLat: 8.4790 },
    "Togo": { region: "West Africa", wbPop: null, capital: "Lomé", iso2: "TG", president: "", capitalLon: 1.2158, capitalLat: 6.1304 },
  };

  /** Standard geojson/world-feature names that don't match the workbook keys. */
  const GEO_NAME_TO_DGW_KEY = {
    Brazil: "Brasil",
    Peru: "Perú",
    "Ivory Coast": "Côte d'Ivoire",
    "Guinea Bissau": "Guinea-Bissau",
    Gambia: "The Gambia",
  };

  const REPARATIONS_NA_DISPLAY = "DOES NOT APPLY";
  const DATA_NOT_AVAILABLE_DISPLAY = "DATA NOT AVAILABLE";

  function reparationsExcludedForCountry(name) {
    const m = profileMeta[name];
    return !!(m && m.reparationsExcluded);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function flagSvgUrl(iso2) {
    const cc = String(iso2 || "").toLowerCase().replace(/[^a-z]/g, "");
    if (cc.length !== 2) return "";
    return "https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/" + cc + ".svg";
  }

  function formatWbPopulation(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const m = n / 1e6;
    if (m >= 100) return Math.round(m) + "M";
    if (m >= 10) {
      const v = Math.round(m * 10) / 10;
      return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + "M";
    }
    const v = Math.round(m * 100) / 100;
    return String(v) + "M";
  }

  function dimensionWorkbookValue0100(dgw, country, dimensionIdx) {
    const row = (dgw.workbookDimensionScores || {})[country];
    if (!row || row[dimensionIdx] == null) return null;
    return row[dimensionIdx];
  }

  function variableWorkbookValue0100(dgw, country, blockId) {
    const vu = (dgw.workbookVariableUnavailable || {})[country];
    if (vu && vu[blockId]) return null;
    const byVar = (dgw.workbookVariableScores0100 || {})[country];
    if (byVar && byVar[blockId] != null) return byVar[blockId];
    return null;
  }

  function indicatorWorkbookValue0100(dgw, country, indicatorId) {
    const un = (dgw.workbookIndicatorUnavailable || {})[country];
    if (un && un[indicatorId]) return null;
    const byInd = (dgw.workbookIndicatorScores0100 || {})[country];
    if (byInd && byInd[indicatorId] != null) return byInd[indicatorId];
    return null;
  }

  /**
   * `XX.XX/100` with the fraction in smaller, muted type (for /100 only).
   * variant ∈ "hero" | "summary" | "table" | "dimHeader" | "varBlock" | "indicator" | "compare"
   */
  function formatScoreSlash100Html(value, variant) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
    const m = Number(value).toFixed(2);
    const den = "text-on-surface-variant/60 font-body font-normal not-italic leading-none";
    const byVar = {
      hero: {
        main: "text-5xl sm:text-6xl md:text-7xl font-headline text-primary tracking-tighter leading-none",
        den: den + " text-2xl sm:text-3xl md:text-4xl tracking-tight ml-0.5",
      },
      summary: {
        main: "font-headline text-lg sm:text-xl text-primary",
        den: den + " text-xs sm:text-sm tracking-tight ml-0.5",
      },
      table: {
        main: "text-on-surface tabular-nums",
        den: den + " text-[0.72em] sm:text-[0.78em] ml-0.5 align-baseline",
      },
      dimHeader: {
        main: "font-headline font-medium tracking-tight text-3xl sm:text-4xl md:text-[2.75rem] text-primary",
        den: den + " text-base sm:text-lg md:text-xl ml-0.5 align-baseline",
      },
      varBlock: {
        main: "font-headline font-medium tracking-tight text-xl sm:text-2xl text-primary",
        den: den + " text-sm sm:text-base ml-0.5",
      },
      indicator: {
        main: "font-body text-sm sm:text-base font-medium text-primary",
        den: den + " text-xs sm:text-sm ml-0.5",
      },
      compare: {
        main: "font-headline text-2xl sm:text-3xl text-primary tabular-nums",
        den: den + " text-xs sm:text-sm tracking-tight ml-0.5",
      },
    };
    const p = byVar[variant] || byVar.table;
    return (
      '<span class="' + p.main + ' tabular-nums">' + m + '</span><span class="' + p.den + '">/100</span>'
    );
  }

  function scoreOrEscapedLabel(s) {
    if (typeof s === "string" && s.indexOf("<span") === 0) return s;
    return escHtml(s);
  }

  function formatWorkbook0100Display(workbook0100, variant) {
    if (workbook0100 === null || workbook0100 === undefined || Number.isNaN(Number(workbook0100))) {
      return DATA_NOT_AVAILABLE_DISPLAY;
    }
    return formatScoreSlash100Html(workbook0100, variant || "table");
  }

  /**
   * @param {{country:string, dgw:object, dimensionIdx:number, blockId:string, workbook0100:number|null, indicatorId?:string, variantBlock?:string, variantIndicator?:string}} args
   */
  function formatVariableOrIndicatorScore(args) {
    const country = args.country;
    const dgw = args.dgw;
    const dimensionIdx = args.dimensionIdx;
    const blockId = args.blockId;
    const workbook0100 = args.workbook0100;
    const indicatorId = args.indicatorId;
    if (dimensionIdx === 4 && blockId === "reparations" && reparationsExcludedForCountry(country)) {
      return REPARATIONS_NA_DISPLAY;
    }
    if (!indicatorId) {
      const vu = (dgw.workbookVariableUnavailable || {})[country];
      if (vu && vu[blockId]) return DATA_NOT_AVAILABLE_DISPLAY;
    }
    if (
      indicatorId &&
      (dgw.workbookIndicatorUnavailable || {})[country] &&
      (dgw.workbookIndicatorUnavailable || {})[country][indicatorId]
    ) {
      return DATA_NOT_AVAILABLE_DISPLAY;
    }
    if (workbook0100 === null || workbook0100 === undefined || Number.isNaN(Number(workbook0100))) {
      return DATA_NOT_AVAILABLE_DISPLAY;
    }
    if (indicatorId) {
      return formatScoreSlash100Html(workbook0100, args.variantIndicator || "indicator");
    }
    return formatScoreSlash100Html(workbook0100, args.variantBlock || "varBlock");
  }

  /** Iterate every node in the blueprint, yielding indicators, blocks, and dimensions for picker UIs. */
  function walkBlueprint() {
    const out = [];
    for (let i = 0; i < INDEX_BLUEPRINT.length; i++) {
      const dim = INDEX_BLUEPRINT[i];
      out.push({ kind: "dimension", dimensionIdx: i, id: "__dim_" + i, label: dim.title, group: dim.title });
      for (let j = 0; j < dim.blocks.length; j++) {
        const blk = dim.blocks[j];
        out.push({
          kind: "variable",
          dimensionIdx: i,
          blockId: blk.id,
          id: "__var_" + blk.id,
          label: blk.heading,
          group: dim.title,
        });
        for (let k = 0; k < blk.indicators.length; k++) {
          const ind = blk.indicators[k];
          out.push({
            kind: "indicator",
            dimensionIdx: i,
            blockId: blk.id,
            indicatorId: ind.id,
            id: ind.id,
            label: ind.name,
            group: dim.title + " · " + blk.heading,
          });
        }
      }
    }
    return out;
  }

  global.DGWBlueprint = {
    DIMENSION_LABELS: DIMENSION_LABELS,
    DIMENSION_WEIGHTS_PCT: DIMENSION_WEIGHTS_PCT,
    INDEX_BLUEPRINT: INDEX_BLUEPRINT,
    WORLD_BANK_POP_YEAR: WORLD_BANK_POP_YEAR,
    profileMeta: profileMeta,
    GEO_NAME_TO_DGW_KEY: GEO_NAME_TO_DGW_KEY,
    REPARATIONS_NA_DISPLAY: REPARATIONS_NA_DISPLAY,
    DATA_NOT_AVAILABLE_DISPLAY: DATA_NOT_AVAILABLE_DISPLAY,
    reparationsExcludedForCountry: reparationsExcludedForCountry,
    escHtml: escHtml,
    ordinal: ordinal,
    flagSvgUrl: flagSvgUrl,
    formatWbPopulation: formatWbPopulation,
    dimensionWorkbookValue0100: dimensionWorkbookValue0100,
    variableWorkbookValue0100: variableWorkbookValue0100,
    indicatorWorkbookValue0100: indicatorWorkbookValue0100,
    formatScoreSlash100Html: formatScoreSlash100Html,
    scoreOrEscapedLabel: scoreOrEscapedLabel,
    formatWorkbook0100Display: formatWorkbook0100Display,
    formatVariableOrIndicatorScore: formatVariableOrIndicatorScore,
    walkBlueprint: walkBlueprint,
  };
})(typeof window !== "undefined" ? window : globalThis);
